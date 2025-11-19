"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Users, Search, MoreVertical, Circle, Paperclip } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import api from "../services/api"

// Emoji picker component
const EmojiPicker = ({ onSelect, onClose }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "✨", "🙏"]

  return (
    <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 flex-wrap w-60">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
          className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [chatRooms, setChatRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState({})
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadChatRooms()
  }, [])

  useEffect(() => {
    if (!socket || !selectedRoom) return

    // Join chat room
    socket.emit("join-chat", selectedRoom.id)

    // Listen for new messages
    socket.on("new-message", (message) => {
      if (message.chatRoomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message])
        scrollToBottom()

        // Mark as read if not from current user
        if (message.senderId !== user.id) {
          markMessageAsRead(message.id)
        }
      }
    })

    // FIXED: Reaction added - use unique composite key
    socket.on("reaction-added", ({ messageId, userId, emoji }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            // Remove existing reaction from this user for this message
            const filteredReactions = (msg.reactions || []).filter(
              r => !(r.userId === userId && r.messageId === messageId)
            )
            // Add new reaction with unique ID
            return {
              ...msg,
              reactions: [
                ...filteredReactions,
                { 
                  id: `${messageId}-${userId}-${Date.now()}`, // ✅ Unique ID
                  messageId, 
                  userId, 
                  emoji 
                }
              ],
            }
          }
          return msg
        }),
      )
    })

    // FIXED: Reaction removed - proper filtering
    socket.on("reaction-removed", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  r => !(r.messageId === messageId && r.userId === userId)
                ),
              }
            : msg,
        ),
      )
    })

    socket.on("media-uploaded", (media) => {
      const messageId = media.messageId
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                media: [...(msg.media || []), media],
              }
            : msg,
        ),
      )
    })

    // Listen for typing status
    socket.on("typing-status", ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setTypingUsers((prev) => {
          const updated = new Set(prev)
          if (isTyping) {
            updated.add(userId)
          } else {
            updated.delete(userId)
          }
          return updated
        })
      }
    })

    // Listen for read receipts
    socket.on("message-read", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                readReceipts: [...(msg.readReceipts || []), { userId, readAt: new Date() }],
              }
            : msg,
        ),
      )
    })

    return () => {
      socket.emit("leave-chat", selectedRoom.id)
      socket.off("new-message")
      socket.off("typing-status")
      socket.off("message-read")
      socket.off("reaction-added")
      socket.off("reaction-removed")
      socket.off("media-uploaded")
    }
  }, [socket, selectedRoom, user.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatRooms = async () => {
    try {
      const response = await api.get("/chat/rooms")
      setChatRooms(response.data)
    } catch (error) {
      console.error("[v0] Failed to load chat rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (roomId) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages`)
      setMessages(response.data)
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room)
    await loadMessages(room.id)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom || sending) return

    setSending(true)
    try {
      await api.post(`/chat/rooms/${selectedRoom.id}/messages`, {
        content: newMessage.trim(),
      })
      setNewMessage("")
      updateTypingStatus(false)
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  // FIXED: File upload with better error handling
  const handleFileSelect = async (e) => {
    if (!selectedRoom) return

    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 50MB.`)
        continue
      }

      try {
        // First create a placeholder message
        const messageResponse = await api.post(`/chat/rooms/${selectedRoom.id}/messages`, {
          content: `📎 ${file.name}`,
        })

        const messageId = messageResponse.data.id
        
        setUploadingMedia((prev) => ({
          ...prev,
          [messageId]: { fileName: file.name, progress: 0 },
        }))

        // Upload media
        const formData = new FormData()
        formData.append("file", file)

        console.log("[ChatPage] Uploading file to:", `/chat/rooms/${selectedRoom.id}/messages/${messageId}/media`)

        await api.post(
          `/chat/rooms/${selectedRoom.id}/messages/${messageId}/media`, 
          formData, 
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
              setUploadingMedia((prev) => ({
                ...prev,
                [messageId]: { ...prev[messageId], progress },
              }))
            },
          }
        )

        // Remove from uploading state
        setUploadingMedia((prev) => {
          const updated = { ...prev }
          delete updated[messageId]
          return updated
        })

      } catch (error) {
        console.error("[v0] Failed to upload file:", error)
        console.error("[v0] Upload error details:", error.response?.data)
        alert(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await api.post(`/chat/messages/${messageId}/reactions`, { emoji })
    } catch (error) {
      console.error("[v0] Failed to add reaction:", error)
    }
  }

  const handleRemoveReaction = async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}/reactions`)
    } catch (error) {
      console.error("[v0] Failed to remove reaction:", error)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!selectedRoom) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    updateTypingStatus(true)

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false)
    }, 2000)
  }

  const updateTypingStatus = async (isTyping) => {
    if (!selectedRoom) return

    try {
      await api.put(`/chat/rooms/${selectedRoom.id}/typing`, { isTyping })
    } catch (error) {
      console.error("[v0] Failed to update typing status:", error)
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      await api.post(`/chat/messages/${messageId}/read`)
    } catch (error) {
      console.error("[v0] Failed to mark as read:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getChatName = (room) => {
    if (room.isGroup) {
      return room.name || "Group Chat"
    }
    const otherMember = room.members?.find((m) => m.userId !== user.id)
    return otherMember?.user 
      ? `${otherMember.user.firstName} ${otherMember.user.lastName}` 
      : "Unknown"
  }

  const getLastMessage = (room) => {
    if (!room.messages || room.messages.length === 0) {
      return "No messages yet"
    }
    const lastMsg = room.messages[0]
    return `${lastMsg.sender.firstName}: ${lastMsg.content.substring(0, 40)}${lastMsg.content.length > 40 ? "..." : ""}`
  }

  const renderMediaPreview = (media) => {
    if (media.type === "IMAGE") {
      return (
        <img
          src={media.url}
          alt={media.fileName}
          className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-80"
          onClick={() => window.open(media.url, "_blank")}
        />
      )
    } else if (media.type === "VIDEO") {
      return <video src={media.url} controls className="max-w-xs rounded-lg mb-2" />
    } else if (media.type === "AUDIO") {
      return <audio src={media.url} controls className="mb-2" />
    } else {
      return (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg hover:bg-gray-200 mb-2"
        >
          <Paperclip className="w-4 h-4" />
          <span className="text-sm">{media.fileName}</span>
        </a>
      )
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading chats...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:text-gray-900 transition-colors border-b border-gray-100 ${
                selectedRoom?.id === room.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 dark:hover:text-gray-300">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate dark:text-black">{getChatName(room)}</h3>
                  {room.isGroup && <span className="text-xs text-gray-500">{room.members?.length || 0}</span>}
                </div>
                <p className="text-sm text-gray-600 truncate dark:border-gray-600 dark:text-gray-400">{getLastMessage(room)}</p>
              </div>
            </button>
          ))}

          {chatRooms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No conversations yet</p>
              <p className="text-sm">Start chatting with your team members</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{getChatName(selectedRoom)}</h3>
                  {typingUsers.size > 0 && <p className="text-sm text-blue-600 dark:text-black">typing...</p>}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user.id
                return (
                  <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`${isOwn ? "" : "max-w-[70%]"}`}>
                      <div
                        className={`${
                          isOwn ? "bg-blue-600 text-white dark:text-black" : "bg-gray-100 text-gray-900"
                        } rounded-lg px-4 py-2`}
                      >
                        {!isOwn && message.sender && (
                          <p className="text-xs font-semibold mb-1 dark:text-black">
                            {message.sender.firstName} {message.sender.lastName}
                          </p>
                        )}

                        {/* Render media if present */}
                        {message.media && message.media.length > 0 && (
                          <div className="mb-2">
                            {message.media.map((media) => (
                              <div key={media.id}>{renderMediaPreview(media)}</div>
                            ))}
                          </div>
                        )}

                        <p className="break-words">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {isOwn && message.readReceipts && message.readReceipts.length > 0 && (
                            <Circle className="w-3 h-3 fill-blue-100 text-blue-100" />
                          )}
                        </div>
                      </div>

                      {/* Emoji reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.id}
                              onClick={() => {
                                if (reaction.userId === user.id) {
                                  handleRemoveReaction(message.id)
                                }
                              }}
                              className="text-lg hover:scale-125 transition-transform cursor-pointer"
                              title={reaction.userId === user.id ? "Click to remove" : ""}
                            >
                              {reaction.emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Add reaction button */}
                      <div className="relative mt-1">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                          className="text-lg hover:bg-gray-200 p-1 rounded transition-colors"
                        >
                          +
                        </button>
                        {showEmojiPicker === message.id && (
                          <EmojiPicker
                            onSelect={(emoji) => {
                              handleAddReaction(message.id, emoji)
                              setShowEmojiPicker(null)
                            }}
                            onClose={() => setShowEmojiPicker(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Upload progress display */}
            {Object.entries(uploadingMedia).length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                {Object.entries(uploadingMedia).map(([messageId, { fileName, progress }]) => (
                  <div key={messageId} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span>{fileName}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}