"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Minimize2, Plus, Search, Check, CheckCheck, Image, Video, Music, FileText, Paperclip } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { chatsAPI, usersAPI } from "../services/api"

// Media/Attachment Renderer Component
const AttachmentRenderer = ({ attachment, isCompact = false }) => {
  const [loaded, setLoaded] = useState(false)

  if (!attachment) return null

  const getAttachmentType = () => {
    if (attachment.type) {
      return attachment.type.toUpperCase()
    }

    const fileName = attachment.fileName || attachment.url || ""
    const ext = fileName.split(".").pop()?.toLowerCase()

    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"]
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi"]
    const audioExts = ["mp3", "wav", "ogg", "m4a", "aac"]

    if (imageExts.includes(ext)) return "IMAGE"
    if (videoExts.includes(ext)) return "VIDEO"
    if (audioExts.includes(ext)) return "AUDIO"
    return "FILE"
  }

  const attachmentType = getAttachmentType()

  if (isCompact) {
    switch (attachmentType) {
      case "IMAGE":
        return (
          <span className="flex items-center gap-1 text-sm">
            <Image className="w-3 h-3" /> Photo
          </span>
        )
      case "VIDEO":
        return (
          <span className="flex items-center gap-1 text-sm">
            <Video className="w-3 h-3" /> Video
          </span>
        )
      case "AUDIO":
        return (
          <span className="flex items-center gap-1 text-sm">
            <Music className="w-3 h-3" /> Audio
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-sm">
            <Paperclip className="w-3 h-3" /> {attachment.fileName || "File"}
          </span>
        )
    }
  }

  switch (attachmentType) {
    case "IMAGE":
      return (
        <div className="relative max-w-xs rounded-lg overflow-hidden mb-2">
          {!loaded && (
            <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <img
            src={attachment.url}
            alt={attachment.fileName || "Image"}
            className={`max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${loaded ? "block" : "hidden"}`}
            onLoad={() => setLoaded(true)}
            onClick={() => window.open(attachment.url, "_blank")}
            loading="lazy"
          />
        </div>
      )

    case "VIDEO":
      return (
        <div className="relative max-w-xs rounded-lg overflow-hidden mb-2">
          {!loaded && (
            <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <video
            src={attachment.url}
            controls
            className={`max-w-full rounded-lg ${loaded ? "block" : "hidden"}`}
            onLoadedData={() => setLoaded(true)}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )

    case "AUDIO":
      return (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 max-w-xs">
          <Music className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <audio src={attachment.url} controls className="flex-1 max-w-full">
            Your browser does not support the audio tag.
          </audio>
        </div>
      )

    default:
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 mb-2 max-w-xs transition-colors"
        >
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
          <span className="text-sm truncate">{attachment.fileName || "Download File"}</span>
        </a>
      )
  }
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { socket } = useSocket()
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
  const pollInterval = useRef(null)

  useEffect(() => {
    loadConversations();
    loadUsers()
  }, []);

  // ✅ Socket.IO real-time listeners with deduplication
  useEffect(() => {
    if (!socket) return

    console.log("[ChatWidget] Setting up Socket.IO listeners")

    const handleNewMessage = (message) => {
      console.log("[ChatWidget] New message received:", message)

      // Update conversations list
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === message.chatRoomId) {
            return {
              ...conv,
              messages: [message, ...(conv.messages || [])],
              unreadCount: message.senderId === user.id ? conv.unreadCount : (conv.unreadCount || 0) + 1
            }
          }
          return conv
        }).sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt || a.createdAt
          const bTime = b.messages?.[0]?.createdAt || b.createdAt
          return new Date(bTime) - new Date(aTime)
        })
      })

      // 🔥 FIX: Only add to messages if it's not already there (prevents duplicates)
      if (selectedConversation && message.chatRoomId === selectedConversation.id) {
        setMessages(prev => {
          // Check if message already exists by ID
          const exists = prev.some(m => m.id === message.id)
          if (exists) {
            console.log("[ChatWidget] Message already exists, skipping:", message.id)
            return prev
          }

          // Also check for temp messages and replace them
          const hasTempMessage = prev.some(m => m.id.startsWith('temp-'))
          if (hasTempMessage) {
            // Replace the last temp message with the real one
            return prev.map(m =>
              m.id.startsWith('temp-') && !prev.some(pm => pm.id === message.id)
                ? message
                : m
            )
          }

          return [...prev, message]
        })

        // Auto-mark as read if not from current user
        if (message.senderId !== user.id) {
          setTimeout(() => {
            chatsAPI.markAsRead(message.id).catch(console.error)
          }, 500)
        }
      }

      // Update unread count
      if (message.senderId !== user.id) {
        setUnreadCount(prev => prev + 1)
      }
    }

    const handleMessageRead = ({ messageId, userId }) => {
      console.log("[ChatWidget] Message read:", messageId, "by user:", userId)

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? {
              ...msg,
              readReceipts: [...(msg.readReceipts || []), { userId, readAt: new Date() }],
            }
            : msg
        )
      )
    }

    const handleTypingStatus = ({ chatRoomId, userId, isTyping }) => {
      if (selectedConversation?.id === chatRoomId && userId !== user.id) {
        console.log("[ChatWidget] User typing:", userId, isTyping)
      }
    }

    const handleConversationUpdate = () => {
      console.log("[ChatWidget] Conversation update received")
      loadConversations()
    }

    socket.on("new-message", handleNewMessage)
    socket.on("message-read", handleMessageRead)
    socket.on("typing-status", handleTypingStatus)
    socket.on("conversation-created", handleConversationUpdate)
    socket.on("conversation-updated", handleConversationUpdate)

    return () => {
      socket.off("new-message", handleNewMessage)
      socket.off("message-read", handleMessageRead)
      socket.off("typing-status", handleTypingStatus)
      socket.off("conversation-created", handleConversationUpdate)
      socket.off("conversation-updated", handleConversationUpdate)
    }
  }, [socket, user.id, selectedConversation])

  // ✅ Join/leave chat room
  useEffect(() => {
    if (!socket || !selectedConversation) return

    console.log("[ChatWidget] Joining chat room:", selectedConversation.id)
    socket.emit("join-chat", selectedConversation.id)

    return () => {
      console.log("[ChatWidget] Leaving chat room:", selectedConversation.id)
      socket.emit("leave-chat", selectedConversation.id)
    }
  }, [socket, selectedConversation])

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

      // Update local unread count immediately
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversation.id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )

      setUnreadCount(prev => Math.max(0, prev - (conversation.unreadCount || 0)))
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
      setConversations(prev => [conversation, ...prev])
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

  // 🔥 FIXED: Simplified send message - let socket handle adding the message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const content = newMessage.trim()
    setNewMessage("") // Clear input immediately for better UX

    try {
      console.log("[ChatWidget] Sending message to room:", selectedConversation.id)

      // Send to backend - the socket listener will add it to the UI
      await chatsAPI.sendMessage(selectedConversation.id, content)

      console.log("[ChatWidget] Message sent successfully")
    } catch (error) {
      console.error("[ChatWidget] Failed to send message:", error)

      // Restore text back to input on error
      setNewMessage(content)
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
          className={`fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-900 z-50 transition-all ${isMinimized ? "h-14" : "h-[600px] "
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg dark:bg-gray-900">
            <h3 className="font-semibold">Messages</h3>
            <div className="flex items-center gap-2">
              {/* <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button> */}
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
                          className="w-full p-3 flex items-start gap-3 
             hover:bg-gray-50 dark:hover:bg-gray-900
             transition-colors border-b border-gray-100 
             text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-gray-900 dark:text-white">
                              {getChatName(conversation)}
                            </h4>
                            <p className="text-sm text-gray-600 truncate dark:text-gray-300">
                              {getLastMessage(conversation)}
                            </p>
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                  <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50 dark:bg-gray-700">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-white font-medium"
                    >
                      ← Back
                    </button>
                    <h4 className="font-medium flex-1 truncate text-gray-900 dark:text-white">
                      {/* <div className="flex items-center gap-2">

                        {selectedConversation?.isGroup ? (
                          <img
                            src="/group-icon.png"
                            alt="Group Icon"
                            className="w-6 h-6"
                          />
                        ) : user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.firstName || "User"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-blue-600 bg-gray-300 rounded-full p-1" />
                        )}

                        <span className="font-medium">
                          {selectedConversation?.name || "Chat"}
                        </span>

                      </div> */}

                      {getChatName(selectedConversation)}
                    </h4>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                    {loading ? (
                      <div className="text-center text-gray-500 py-4">Loading messages...</div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => {
                        const isOwn = message.senderId === user.id
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn ? "bg-blue-600 text-white dark:bg-gray-900 dark:border dark:border-gray-200" : "bg-white text-gray-900 border border-gray-200 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                }`}
                            >
                              {!isOwn && message.sender && (
                                <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-white">
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
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white dark:bg-gray-900 ">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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