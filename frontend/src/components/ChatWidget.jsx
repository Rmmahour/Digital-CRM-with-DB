"use client"

import api from "../services/api"
import { useState, useEffect, useRef } from "react"
import {
  MessageCircle,
  X,
  Send,
  Plus,
  Search,
  Check,
  CheckCheck,
  Image,
  Video,
  Music,
  FileText,
  Paperclip,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { chatsAPI, usersAPI } from "../services/api"
import {
  BACKEND_URL,
  getMediaUrl,
  normalizeMedia,
  getMessageStatus,
  applyReadReceiptToMessages,
} from "../utils/chatHelpers"

import EmojiPicker from "./EmojiPicker"


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
            className={`max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${loaded ? "block" : "hidden"
              }`}
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState(false)
  const roomMenuRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
    loadUsers()
  }, [])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    console.log("[ChatWidget] Setting up Socket.IO listeners")

    const handleNewMessage = (message) => {
      console.log("[ChatWidget] New message received:", message)

      const isActiveConversation =
        selectedConversation && selectedConversation.id === message.chatRoomId

      // Update conversations list
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== message.chatRoomId) return conv

          const isOwn = message.senderId === user.id
          const shouldIncrementUnread = !isOwn && !isActiveConversation

          return {
            ...conv,
            messages: [message, ...(conv.messages || [])],
            unreadCount: shouldIncrementUnread
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount || 0,
          }
        })

        return updated.sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt || a.createdAt
          const bTime = b.messages?.[0]?.createdAt || b.createdAt
          return new Date(bTime) - new Date(aTime)
        })
      })

      if (isActiveConversation) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })

        if (message.senderId !== user.id) {
          setTimeout(() => {
            chatsAPI.markAsRead(message.id).catch(console.error)
          }, 500)
        }
      } else if (message.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    const handleMessageRead = ({ messageId, userId }) => {
      console.log("[ChatWidget] Message read:", messageId, "by user:", userId)
      setMessages((prev) => applyReadReceiptToMessages(prev, messageId, userId))
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

    const handleMediaUploaded = (media) => {
      console.log("[ChatWidget] Media uploaded:", media)

      const normalized = normalizeMedia([media])[0]
      normalized.url = getMediaUrl(normalized.url)

      // If this message is currently loaded in the widget view
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === media.messageId
            ? { ...msg, media: [...(msg.media || []), normalized] }
            : msg,
        ),
      )

      // Also update the preview in conversation list if needed
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === media.chatRoomId
            ? {
              ...conv,
              messages: conv.messages
                ? conv.messages.map((m) =>
                  m.id === media.messageId
                    ? { ...m, media: [...(m.media || []), normalized] }
                    : m,
                )
                : conv.messages,
            }
            : conv,
        ),
      )
    }

    socket.on("media-uploaded", handleMediaUploaded)
    socket.on("new-message", handleNewMessage)
    socket.on("message-read", handleMessageRead)
    socket.on("typing-status", handleTypingStatus)
    socket.on("conversation-created", handleConversationUpdate)
    socket.on("conversation-updated", handleConversationUpdate)
    socket.on("message-deleted", ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });


    return () => {
      socket.off("new-message", handleNewMessage)
      socket.off("message-read", handleMessageRead)
      socket.off("typing-status", handleTypingStatus)
      socket.off("conversation-created", handleConversationUpdate)
      socket.off("conversation-updated", handleConversationUpdate)
      socket.off("media-uploaded", handleMediaUploaded)
      socket.off("message-deleted")
    }
  }, [socket, user.id, selectedConversation])

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

      setAllUsers(filteredUsers)
    } catch (error) {
      console.error("[ChatWidget] Failed to load users:", error)
      setAllUsers([])
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/chat/rooms/${selectedConversation.id}/messages`, {
        data: { messageId } // important
      });
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };


  const loadConversations = async () => {
    try {
      const data = await chatsAPI.getConversations()
      setConversations(Array.isArray(data) ? data : [])

      const unread = (Array.isArray(data) ? data : []).reduce(
        (count, conv) => count + (conv.unreadCount || 0),
        0
      )
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
      const msgs = Array.isArray(data) ? data : []
      const processedMsgs = msgs.map((msg) => ({
        ...msg,
        media: normalizeMedia(msg.media || []).map((m) => ({
          ...m,
          url: getMediaUrl(m.url),
        })),
      }))
      setMessages(processedMsgs)
      return processedMsgs
    } catch (error) {
      console.error("[ChatWidget] Failed to load messages:", error)
      setMessages([])
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation)
    setShowNewChat(false)

    const msgs = await loadMessages(conversation.id)

    try {
      const unreadMessages =
        msgs.filter(
          (msg) =>
            msg.senderId !== user.id &&
            !(msg.readReceipts || []).some((r) => r.userId === user.id)
        ) || []

      for (const msg of unreadMessages) {
        await chatsAPI.markAsRead(msg.id)
      }

      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )

        const totalUnread = updated.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        )
        setUnreadCount(totalUnread)

        return updated
      })
    } catch (error) {
      console.error("[ChatWidget] Failed to mark as read:", error)
    }
  }

  const handleStartConversation = async (selectedUser) => {
    try {
      const existingConv = conversations.find((conv) => {
        if (conv.isGroup) return false
        const otherMember = conv.members?.find((m) => m.userId !== user.id)
        return otherMember?.userId === selectedUser.id
      })

      if (existingConv) {
        setShowNewChat(false)
        setUserSearch("")
        await handleConversationSelect(existingConv)
        return
      }

      const conversation = await chatsAPI.createConversation(selectedUser.id)

      setShowNewChat(false)
      setUserSearch("")
      setConversations((prev) => [conversation, ...prev])
      await handleConversationSelect(conversation)
    } catch (error) {
      console.error("[ChatWidget] Failed to create conversation:", error)
      console.error("[ChatWidget] Error details:", error.response?.data)

      if (error.response?.status === 500) {
        alert(
          `Failed to start conversation\n\nServer error: ${error.response?.data?.message || "Unknown error"
          }`
        )
      } else if (error.response?.status === 400) {
        alert(`Invalid request: ${error.response?.data?.message || "Bad request"}`)
      } else {
        alert("Failed to start conversation. Please try again.")
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const content = newMessage.trim()
    setNewMessage("")

    try {
      await chatsAPI.sendMessage(selectedConversation.id, content)
    } catch (error) {
      console.error("[ChatWidget] Failed to send message:", error)
      setNewMessage(content)
      alert("Failed to send message")
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
      await api.delete(`/chat/rooms/${selectedConversation.id}/messages/${deleteConfirm.messageId}`)
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

  const getChatName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.name || "Group Chat"
    }
    const otherMember = conversation.members?.find((m) => m.userId !== user.id)
    return otherMember?.user
      ? `${otherMember.user.firstName} ${otherMember.user.lastName}`
      : "Chat"
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

  const getLastMessage = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMsg = conversation.messages[0]

      // Check if message has media
      if (lastMsg.media && lastMsg.media.length > 0) {
        const mediaType = lastMsg.media[0].type
        if (mediaType === "IMAGE") return "📷 Photo"
        if (mediaType === "VIDEO") return "🎥 Video"
        if (mediaType === "AUDIO") return "🎵 Audio"
        return "📎 File"
      }

      // Skip [MEDIA] placeholder
      if (lastMsg.content === "[MEDIA]") {
        return "📎 Attachment"
      }

      return lastMsg.content
    }
    return "No messages yet"
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
    if (!selectedConversation) return

    const roomId = selectedConversation.id

    try {
      await api.delete(`/chat/rooms/${roomId}`)

      setConversations(prev => prev.filter(conv => conv.id !== roomId))
      setSelectedConversation(null)
      setMessages([])
      setDeleteRoomConfirm(false)
    } catch (error) {
      console.error("[Widget] Failed to delete room:", error)
      alert(error.response?.data?.message || "Failed to delete conversation")
    }
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
          className={`fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-900 z-50 transition-all ${isMinimized ? "h-14" : "h-[600px]"
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg dark:bg-gray-900">
            <h3 className="font-semibold">Messages</h3>
            <div className="flex items-center gap-2">
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
                // Conversation List
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
                          className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 text-left"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {(() => {
                              const avatar = getChatAvatar(conversation, user.id)
                              return avatar ? (
                                <img
                                  src={avatar}
                                  alt={getChatName(conversation)}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <MessageCircle className="w-4 h-4 text-blue-600" />
                              )
                            })()}
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
                // New Chat
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
                    <h4 className="font-medium flex-1 dark:text-gray-800">
                      Select User to Chat
                    </h4>
                  </div>

                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                            <p className="text-xs text-gray-500">
                              {u.role?.replace(/_/g, " ") || ""}
                            </p>
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
                // Chat Messages
                <div className="flex flex-col h-[calc(100%-57px)]">
                  <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50 dark:bg-gray-700">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-white font-medium"
                    >
                      ← Back
                    </button>
                    <h4 className="font-medium flex-1 truncate text-gray-900 dark:text-white">
                      {getChatName(selectedConversation)}
                    </h4>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                    {loading ? (
                      <div className="text-center text-gray-500 py-4">
                        Loading messages...
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => {
                        const isOwn = message.senderId === user.id
                        const status = getMessageStatus(message, user.id, selectedConversation?.members)

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
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn
                                ? "bg-blue-600 text-white dark:bg-gray-900 dark:border dark:border-gray-200"
                                : "bg-white text-gray-900 border border-gray-200 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                }`}
                            >
                              {!isOwn && message.sender && (
                                <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-white">
                                  {message.sender.firstName} {message.sender.lastName}
                                </p>
                              )}

                              {/* 🔹 Content vs deleted placeholder */}
                              {isDeleted ? (
                                <p className="text-xs italic opacity-80">{deletedLabel}</p>
                              ) : (
                                <>
                                  <p className="text-sm break-words">{message.content}</p>

                                  {/* Attachments / media (only if not deleted) */}
                                  {message.media && message.media.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {normalizeMedia(message.media).map((m, idx) => (
                                        <AttachmentRenderer
                                          key={`${message.id}-attachment-${idx}`}
                                          attachment={{
                                            ...m,
                                            url: getMediaUrl(m.url),
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}




                              {/* {message.media && message.media.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {normalizeMedia(message.media).map((m, idx) => (
                                    <AttachmentRenderer
                                      key={`${message.id}-attachment-${idx}`}
                                      attachment={{
                                        ...m,
                                        url: getMediaUrl(m.url),
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="text-sm break-words">{message.content}</p> */}

                              <div className="flex items-center gap-2 mt-1">
                                <p
                                  className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"
                                    }`}
                                >
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

                                {/* 🗑 Delete button */}
                                {isOwn && !message.isDeleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClick(message)}
                                    className="ml-1 text-[11px] text-red-500 hover:text-red-700 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}

                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">
                          Send a message to start the conversation
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-gray-200 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-2 relative">
                      {/* Emoji button */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600"
                      >
                        <span className="text-xl">😊</span>
                      </button>

                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}

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
                  <span className="font-semibold">
                    {selectedConversation ? getChatName(selectedConversation) : ""}
                  </span>?
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
      )}
    </>
  )
}
