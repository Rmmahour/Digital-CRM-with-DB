"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Minimize2, Plus, Search } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { chatsAPI, usersAPI } from "../services/api"

export default function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNewChat, setShowNewChat] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [userSearch, setUserSearch] = useState("")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadConversations()
      loadUsers()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll()
      const filteredUsers = Array.isArray(response)
        ? response.filter((u) => u.id !== user.id)
        : Array.isArray(response.users)
          ? response.users.filter((u) => u.id !== user.id)
          : []

      console.log("[ChatWidget] Loaded users for chat:", filteredUsers.length)
      setAllUsers(filteredUsers)
    } catch (error) {
      console.error("[ChatWidget] Failed to load users:", error)
      setAllUsers([])
    }
  }

  const loadConversations = async () => {
    try {
      const data = await chatsAPI.getConversations()
      console.log("[ChatWidget] Loaded conversations:", data)
      setConversations(Array.isArray(data) ? data : [])

      // Calculate unread count
      const unread = (Array.isArray(data) ? data : []).reduce((count, conv) => {
        return count + (conv.unreadCount || 0)
      }, 0)
      setUnreadCount(unread)
    } catch (error) {
      console.error("[ChatWidget] Failed to load conversations:", error)
      setConversations([])
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true)
      const data = await chatsAPI.getMessages(conversationId)
      console.log("[ChatWidget] Loaded messages:", data)
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[ChatWidget] Failed to load messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation)
    setShowNewChat(false)
    await loadMessages(conversation.id)

    // Mark messages as read
    try {
      const unreadMessages = conversation.messages?.filter(
        msg => msg.senderId !== user.id && !msg.readReceipts?.some(r => r.userId === user.id)
      ) || []
      
      for (const msg of unreadMessages) {
        await chatsAPI.markAsRead(msg.id)
      }
      
      await loadConversations() // Refresh to update unread counts
    } catch (error) {
      console.error("[ChatWidget] Failed to mark as read:", error)
    }
  }

  const handleStartConversation = async (selectedUser) => {
    try {
      console.log("[ChatWidget] Starting conversation with user:", selectedUser.id)
      
      // Check if conversation already exists
      const existingConv = conversations.find((conv) => {
        if (conv.isGroup) return false
        // Check if this is a 1-on-1 chat with the selected user
        const otherMember = conv.members?.find((m) => m.userId !== user.id)
        return otherMember?.userId === selectedUser.id
      })

      if (existingConv) {
        console.log("[ChatWidget] Found existing conversation:", existingConv.id)
        setShowNewChat(false)
        setUserSearch("")
        await handleConversationSelect(existingConv)
        return
      }

      // Create new conversation - FIXED: Send userId instead of participantIds
      console.log("[ChatWidget] Creating new conversation with userId:", selectedUser.id)
      
      const conversation = await chatsAPI.createConversation(selectedUser.id)
      
      console.log("[ChatWidget] Conversation created:", conversation)
      
      setShowNewChat(false)
      setUserSearch("")
      await loadConversations()
      await handleConversationSelect(conversation)
    } catch (error) {
      console.error("[ChatWidget] Failed to create conversation:", error)
      console.error("[ChatWidget] Error details:", error.response?.data)
      
      if (error.response?.status === 500) {
        alert(`Failed to start conversation\n\nServer error: ${error.response?.data?.message || 'Unknown error'}`)
      } else if (error.response?.status === 400) {
        alert(`Invalid request: ${error.response?.data?.message || 'Bad request'}`)
      } else {
        alert("Failed to start conversation. Please try again.")
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      console.log("[ChatWidget] Sending message to room:", selectedConversation.id)
      
      await chatsAPI.sendMessage(selectedConversation.id, newMessage.trim())
      setNewMessage("")
      await loadMessages(selectedConversation.id)
    } catch (error) {
      console.error("[ChatWidget] Failed to send message:", error)
      alert("Failed to send message")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getChatName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.name || "Group Chat"
    }
    const otherMember = conversation.members?.find((m) => m.userId !== user.id)
    return otherMember?.user 
      ? `${otherMember.user.firstName} ${otherMember.user.lastName}` 
      : "Chat"
  }

  const getLastMessage = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[0].content
    }
    return "No messages yet"
  }

  const filteredUsers = allUsers.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
    return fullName.includes(userSearch.toLowerCase())
  })

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-50 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all ${
            isMinimized ? "h-14" : "h-[600px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold">Messages</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {!selectedConversation && !showNewChat ? (
                /* Conversation List */
                <div className="h-[calc(100%-57px)] flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Start New Chat
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversations.length > 0 ? (
                      conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => handleConversationSelect(conversation)}
                          className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-gray-900">{getChatName(conversation)}</h4>
                            <p className="text-sm text-gray-600 truncate">{getLastMessage(conversation)}</p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center p-6">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">No conversations yet</p>
                          <p className="text-xs mt-2">Click "Start New Chat" to begin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : showNewChat ? (
                /* New Chat - User Selection */
                <div className="h-[calc(100%-57px)] flex flex-col">
                  <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowNewChat(false)
                        setUserSearch("")
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ← Back
                    </button>
                    <h4 className="font-medium flex-1 dark:text-gray-800">Select User to Chat</h4>
                  </div>

                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleStartConversation(u)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-semibold text-sm">
                            {u.firstName?.[0] || ""}
                            {u.lastName?.[0] || ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-gray-900">
                              {u.firstName} {u.lastName}
                            </h4>
                            <p className="text-xs text-gray-500">{u.role?.replace(/_/g, " ") || ""}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <div className="flex flex-col h-[calc(100%-57px)]">
                  {/* Chat Header */}
                  <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ← Back
                    </button>
                    <h4 className="font-medium flex-1 truncate text-gray-900">{getChatName(selectedConversation)}</h4>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                    {loading ? (
                      <div className="text-center text-gray-500 py-4">Loading messages...</div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => {
                        const isOwn = message.senderId === user.id
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                isOwn ? "bg-blue-600 text-white" : "bg-white text-gray-900 border border-gray-200"
                              }`}
                            >
                              {!isOwn && message.sender && (
                                <p className="text-xs font-semibold mb-1 text-gray-700">
                                  {message.sender.firstName} {message.sender.lastName}
                                </p>
                              )}
                              <p className="text-sm break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Send a message to start the conversation</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}