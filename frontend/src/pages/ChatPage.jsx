"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Users, Search, MoreVertical, Check, CheckCheck, Paperclip, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import EmojiPicker from "../components/EmojiPicker"
import api from "../services/api"

import {
  BACKEND_URL,
  getMediaUrl,
  normalizeMedia,
  getMessageStatus,
  applyReadReceiptToMessages,
  getChatAvatar,
} from "../utils/chatHelpers"



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
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState(false)
  const messagesEndRef = useRef(null)
  const roomMenuRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadChatRooms()
  }, [])

  useEffect(() => {
    if (!socket || !selectedRoom) return

    // Join chat room
    socket.emit("join-chat", selectedRoom.id)

    // New messages
    socket.on("new-message", (message) => {
      if (message.chatRoomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message])
        scrollToBottom()

        if (message.senderId !== user.id) {
          markMessageAsRead(message.id)
        }
      }
    })

    // Reactions
    socket.on("reaction-added", ({ messageId, userId, emoji }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const filteredReactions = (msg.reactions || []).filter(
              (r) => !(r.userId === userId && r.messageId === messageId)
            )
            return {
              ...msg,
              reactions: [
                ...filteredReactions,
                {
                  id: `${messageId}-${userId}-${Date.now()}`,
                  messageId,
                  userId,
                  emoji,
                },
              ],
            }
          }
          return msg
        })
      )
    })

        socket.on("reaction-removed", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
              ...msg,
              reactions: (msg.reactions || []).filter(
                (r) => !(r.messageId === messageId && r.userId === userId)
              ),
            }
            : msg
        )
      )
    })

    // Media uploaded
    socket.on("media-uploaded", (media) => {
      console.log("[ChatPage] Media uploaded:", media)

      const normalized = normalizeMedia([media])[0]
      normalized.url = getMediaUrl(normalized.url)

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === media.messageId
            ? { ...msg, media: [...(msg.media || []), normalized] }
            : msg
        )
      )
    })

    // Typing
    socket.on("typing-status", ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setTypingUsers((prev) => {
          const updated = new Set(prev)
          if (isTyping) updated.add(userId)
          else updated.delete(userId)
          return updated
        })
      }
    })

    // Read receipts
    socket.on("message-read", ({ messageId, userId }) => {
      setMessages((prev) => applyReadReceiptToMessages(prev, messageId, userId))
    })

    socket.on("message-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    })

    return () => {
      socket.emit("leave-chat", selectedRoom.id)
      socket.off("new-message")
      socket.off("typing-status")
      socket.off("message-read")
      socket.off("reaction-added")
      socket.off("reaction-removed")
      socket.off("media-uploaded")
      socket.off("message-deleted")
    }
  }, [socket, selectedRoom, user.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roomMenuRef.current && !roomMenuRef.current.contains(event.target)) {
        setShowRoomMenu(false)
      }
    }

    if (showRoomMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showRoomMenu])

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

      const msgs = response.data.map((msg) => ({
        ...msg,
        media: normalizeMedia(msg.media).map((m) => ({
          ...m,
          url: getMediaUrl(m.url),
        })),
      }))

      setMessages(msgs)
    } catch (err) {
      console.error("Failed to load messages:", err)
    }
  }

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room)
    await loadMessages(room.id)
  }

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/chat/rooms/${selectedRoom.id}/messages`, {
        data: { messageId } // important
      });
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };


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

  // File upload
  const handleFileSelect = async (e) => {
    if (!selectedRoom) return

    const files = Array.from(e.target.files || [])

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 50MB.`)
        continue
      }

      try {
        const messageResponse = await api.post(`/chat/rooms/${selectedRoom.id}/messages`, {
          content: `📎 ${file.name}`,
        })

        const messageId = messageResponse.data.id

        setUploadingMedia((prev) => ({
          ...prev,
          [messageId]: { fileName: file.name, progress: 0 },
        }))

        const formData = new FormData()
        formData.append("file", file)

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

  const handleDeleteClick = (message) => {
    setDeleteConfirm({
      messageId: message.id,
      content: message.content,
      hasMedia: message.media && message.media.length > 0,
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await api.delete(`/chat/rooms/${selectedRoom.id}/messages/${deleteConfirm.messageId}`)
      setDeleteConfirm(null)
    } catch (error) {
      console.error("[v0] Failed to delete message:", error)
      alert("Failed to delete message")
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
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

  const getChatAvatar = (room) => {
  if (room.isGroup) {
    return room.avatar ? getMediaUrl(room.avatar) : null
  }
  const otherMember = room.members?.find((m) => m.userId !== user.id)
  return otherMember?.user?.avatar
    ? getMediaUrl(otherMember.user.avatar)
    : null
}



  const getLastMessage = (room) => {
    if (!room.messages || room.messages.length === 0) {
      return "No messages yet"
    }
    const lastMsg = room.messages[0]
    return `${lastMsg.sender.firstName}: ${lastMsg.content.substring(0, 40)}${lastMsg.content.length > 40 ? "..." : ""
      }`
  }

  const renderMediaPreview = (media) => {
    const fullUrl = getMediaUrl(media.url)
    const type = (media.type || "").toUpperCase()

    if (type === "IMAGE") {
      return (
        <img
          src={fullUrl}
          alt={media.fileName}
          className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-80"
          onClick={() => window.open(fullUrl, "_blank")}
        />
      )
    } else if (type === "VIDEO") {
      return <video src={fullUrl} controls className="max-w-xs rounded-lg mb-2" />
    } else if (type === "AUDIO") {
      return <audio src={fullUrl} controls className="mb-2" />
    } else {
      return (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 mb-2 text-sm"
        >
          <Paperclip className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{media.fileName}</span>
        </a>
      )
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

    const handleDeleteRoomClick = () => {
    // close the menu and open the confirmation modal
    setShowRoomMenu(false)
    setDeleteRoomConfirm(true)
  }

  const cancelDeleteRoom = () => {
    setDeleteRoomConfirm(false)
  }

  const confirmDeleteRoom = async () => {
    if (!selectedRoom) return

    const roomId = selectedRoom.id

    try {
      // call your backend to delete the conversation
      await api.delete(`/chat/rooms/${roomId}`)

      // remove it from the sidebar list
      setChatRooms(prev => prev.filter(room => room.id !== roomId))

      // reset current selection & messages
      setSelectedRoom(null)
      setMessages([])

      // close the modal
      setDeleteRoomConfirm(false)
    } catch (error) {
      console.error("[v0] Failed to delete room:", error)
      alert(error.response?.data?.message || "Failed to delete conversation")
    }
  }


  if (loading) {
    return <div className="text-center py-12">Loading chats...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatRooms.map((room) => {

            const chatAvatar = getChatAvatar(room, user.id)

            return (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors border-b border-gray-100 ${selectedRoom?.id === room.id ? "bg-blue-50 dark:bg-gray-900" : ""
                  }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {chatAvatar ? (
          <img
            src={chatAvatar}
            alt={getChatName(room)}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-blue-600" />
        )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate dark:text-gray-300">{getChatName(room)}</h3>
                    {room.isGroup && (
                      <span className="text-xs text-gray-500">{room.members?.length || 0}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate dark:text-gray-400">
                    {getLastMessage(room)}
                  </p>
                </div>
              </button>
            )
          })}

          {chatRooms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No conversations yet</p>
              <p className="text-sm">Start chatting with your team members</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {getChatAvatar(selectedRoom, user.id) ? (
    <img
      src={getChatAvatar(selectedRoom, user.id)}
      alt={getChatName(selectedRoom) || "User"}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <User className="w-8 h-8 text-blue-600 bg-gray-400 rounded-full" />
  )}
                </div>
                <div>
                  <h3 className="font-semibold">{getChatName(selectedRoom)}</h3>
                  {typingUsers.size > 0 && (
                    <p className="text-sm text-blue-600 dark:text-black">typing...</p>
                  )}
                </div>
              </div>
              <div className="relative" ref={roomMenuRef}>
                <button 
                  onClick={() => setShowRoomMenu(!showRoomMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {showRoomMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <button
                      onClick={handleDeleteRoomClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Conversation
                    </button>
                  </div>
                )}
              </div>
              {/* <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button> */}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user.id
                const status = getMessageStatus(message, user.id, selectedRoom?.members)

                const isDeleted = message.isDeleted
                const deletedByMe = isDeleted && message.deletedById === user.id
                const deletedLabel = deletedByMe
                  ? "You deleted this message"
                  : "This message was deleted"

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`${isOwn
                        ? "bg-blue-600 text-white dark:text-white dark:bg-gray-800"
                        : "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                        } rounded-lg px-4 py-2 max-w-[70%] relative`}
                    >

                        {/* 🔹 Content vs deleted placeholder */}
        {isDeleted ? (
          <p className="text-xs italic opacity-80">{deletedLabel}</p>
        ) : (
          <>
                      {message.media && (
                        <div className="mt-2 space-y-2">
                          {message.media?.map((m, idx) => (
                            <div key={`${message.id}-media-${idx}`}>
                              {renderMediaPreview(m)}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="break-words">{message.content}</p>
                      </>
        )}

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className={`flex gap-1 mt-2 flex-wrap absolute -bottom-3 left-0 ${isOwn
                          ? ""
                          : "left-auto -right-2"
                          }`}>
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

                      {/* Add reaction */}
                      <div className={`flex gap-1 mt-2 flex-wrap absolute -left-1 ${isOwn ? "" : "!left-auto !-right-1 -bottom-2"}`}>
                        <button
                          onClick={() =>
                            setShowEmojiPicker(
                              showEmojiPicker === message.id ? null : message.id
                            )
                          }
                          className={`text-md hover:bg-gray-200 px-1 rounded transition-colors  ${message.reactions && message.reactions.length > 0 ? "opacity-0" : "opacity-1"} `}>
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

                      {/* Time + ticks */}
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {isOwn && status === "sent" && (
                          <Check className="w-3 h-3 text-gray-300" />
                        )}

                        {isOwn && status === "delivered" && (
                          <CheckCheck className="w-3 h-3 text-gray-300" />
                        )}

                        {isOwn && status === "read" && (
                          <CheckCheck className="w-3 h-3 text-blue-300" />
                        )}

                        {/* Delete button */}
                        {isOwn && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(message)}
                            className="ml-2 text-[11px] text-red-400 hover:text-red-600 transition-colors"
                            title="Delete message"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Upload progress */}
            {Object.entries(uploadingMedia).length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                {Object.entries(uploadingMedia).map(([messageId, { fileName, progress }]) => (
                  <div key={messageId} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span>{fileName}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
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
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600"
                >
                  <Paperclip className="w-5 h-5 dark:text-gray-300" />
                </button>

                <div className="relative">
                  {/* Emoji button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => prev === 'input' ? null : 'input')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600"
                  >
                    <span className="text-xl">😊</span>
                  </button>

                  {/* Emoji picker */}
                  {showEmojiPicker === 'input' && (
                    <EmojiPicker
                      onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
                      onClose={() => setShowEmojiPicker(null)}
                    />
                  )}
                </div>


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

        {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Message?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            {deleteConfirm.content && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{deleteConfirm.content.substring(0, 100)}
                  {deleteConfirm.content.length > 100 ? "..." : ""}"
                </p>
              </div>
            )}
            {deleteConfirm.hasMedia && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                ⚠️ This will also delete attached media files
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Room Confirmation Modal */}
      {deleteRoomConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Conversation?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this entire conversation with{" "}
              <span className="font-semibold">{getChatName(selectedRoom)}</span>?
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-400">
                ⚠️ <strong>Warning:</strong> This will permanently delete all messages, media, and reactions in this conversation. This action cannot be undone.
              </p>
            </div>
            {messages.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                This conversation contains {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteRoom}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
