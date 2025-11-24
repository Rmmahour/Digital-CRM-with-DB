// src/utils/chatHelpers.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// Strip trailing `/api` to get plain backend URL for static files
export const BACKEND_URL = API_BASE.replace(/\/api\/?$/, "") || "http://localhost:5000"

export const getMediaUrl = (url) => {
  // FIX: Change return "" to return null
  if (!url) return null 
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export const getChatAvatar = (roomOrConversation, currentUserId) => {
  if (!roomOrConversation) return null

  // Group chat → use room avatar if present
  if (roomOrConversation.isGroup) {
    if (roomOrConversation.avatar) {
      return getMediaUrl(roomOrConversation.avatar)
    }
    return null
  }

  // 1-to-1 chat → find the "other" member
  const members = roomOrConversation.members || []
  const otherMember = members.find((m) => m.userId !== currentUserId)
  if (!otherMember) return null

  // Try several possible places where backend might put avatar
  const raw =
    otherMember.user?.avatar ||
    otherMember.avatar ||
    otherMember.userAvatar ||
    null

  return raw ? getMediaUrl(raw) : null
}

export const normalizeMedia = (media) => {
  if (!media) return []

  const guessType = (nameOrUrl = "") => {
    const lower = nameOrUrl.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(lower)) return "IMAGE"
    if (/\.(mp4|mov|avi|webm|ogg)$/.test(lower)) return "VIDEO"
    if (/\.(mp3|wav|m4a|aac|ogg)$/.test(lower)) return "AUDIO"
    return "FILE"
  }

  return media.map((m) => {
    const rawUrl = m.url || m.filePath || m.path || ""
    const type = m.type || m.fileType || m.mimeType || guessType(rawUrl || m.fileName)

    return {
      url: rawUrl,
      type: String(type || "FILE").toUpperCase(),
      fileName: m.fileName || rawUrl.split("/").pop() || "file",
    }
  })
}

export const getMessageStatus = (message, currentUserId, roomMembers = []) => {
  // Only show ticks for my own messages
  if (message.senderId !== currentUserId) return null

  const readReceipts = message.readReceipts || []
  const otherMembers = (roomMembers || []).filter((m) => m.userId !== currentUserId)

  const readByAnyOther = readReceipts.some((r) =>
    otherMembers.some((m) => m.userId === r.userId),
  )

  if (readByAnyOther) return "read"
  if (message.id && !String(message.id).startsWith("temp-")) return "delivered"
  return "sent"
}

// 🔹 NEW: shared helper for message-read socket handling
export const applyReadReceiptToMessages = (messages, { messageId, userId, readAt }) => {
  const ts = readAt ? new Date(readAt) : new Date()

  return messages.map((msg) =>
    msg.id === messageId
      ? {
          ...msg,
          readReceipts: [
            ...(msg.readReceipts || []).filter((r) => r.userId !== userId),
            { userId, readAt: ts },
          ],
        }
      : msg,
  )
}
