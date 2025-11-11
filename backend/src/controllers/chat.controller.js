import prisma from "../config/prisma.js"

// Get or create one-to-one chat room
export const getOrCreateChatRoom = async (req, res) => {
  try {
    const { userId } = req.body
    const currentUserId = req.user.id

    console.log("[Chat Controller] Get/create chat room")
    console.log("[Chat Controller] Current user ID:", currentUserId)
    console.log("[Chat Controller] Target user ID:", userId)
    console.log("[Chat Controller] Request body:", req.body)

    // Validation
    if (!userId) {
      return res.status(400).json({ message: "userId is required" })
    }

    if (userId === currentUserId) {
      return res.status(400).json({ message: "Cannot chat with yourself" })
    }

    // IMPORTANT: Don't parse as integer - keep as string for CUID
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" })
    }

    console.log("[Chat Controller] Target user found:", targetUser.firstName, targetUser.lastName)

    // Check if chat room already exists between these two users
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          {
            members: {
              some: {
                userId: currentUserId
              }
            }
          },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            readReceipts: true,
          },
        },
      },
    })

    if (existingRoom) {
      console.log("[Chat Controller] Found existing room:", existingRoom.id)
      
      // Calculate unread count
      const unreadCount = await prisma.chatMessage.count({
        where: {
          chatRoomId: existingRoom.id,
          senderId: { not: currentUserId },
          readReceipts: {
            none: {
              userId: currentUserId,
            },
          },
        },
      })

      return res.json({
        ...existingRoom,
        unreadCount
      })
    }

    console.log("[Chat Controller] Creating new chat room")

    // Create new chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: currentUserId },
            { userId: userId }
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        messages: true,
      },
    })

    console.log("[Chat Controller] Chat room created:", chatRoom.id)

    res.status(201).json({
      ...chatRoom,
      unreadCount: 0
    })
  } catch (error) {
    console.error("[Chat Controller] Get/create chat room error:", error)
    console.error("[Chat Controller] Error message:", error.message)
    console.error("[Chat Controller] Error stack:", error.stack)
    
    res.status(500).json({ 
      message: "Failed to get or create chat room",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Create group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name, memberIds } = req.body
    const currentUserId = req.user.id

    console.log("[Chat Controller] Create group chat")
    console.log("[Chat Controller] Current user:", currentUserId)
    console.log("[Chat Controller] Member IDs:", memberIds)

    if (!memberIds || memberIds.length < 2) {
      return res.status(400).json({ message: "Group chat requires at least 2 other members" })
    }

    // Verify all members exist
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } }
    })

    if (users.length !== memberIds.length) {
      return res.status(404).json({ message: "Some users not found" })
    }

    // Add current user to members
    const allMemberIds = [currentUserId, ...memberIds]

    const chatRoom = await prisma.chatRoom.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        messages: true,
      },
    })

    console.log("[Chat Controller] Group chat created:", chatRoom.id)

    res.status(201).json({
      ...chatRoom,
      unreadCount: 0
    })
  } catch (error) {
    console.error("[Chat Controller] Create group chat error:", error)
    res.status(500).json({ 
      message: "Failed to create group chat",
      error: error.message 
    })
  }
}

// Get all chat rooms for current user
export const getMyChatRooms = async (req, res) => {
  try {
    const currentUserId = req.user.id

    console.log("[Chat Controller] Get my chat rooms for user:", currentUserId)

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        members: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    console.log("[Chat Controller] Found chat rooms:", chatRooms.length)

    const roomsWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadMessages = await prisma.chatMessage.count({
          where: {
            chatRoomId: room.id,
            senderId: { not: currentUserId },
            readReceipts: {
              none: {
                userId: currentUserId,
              },
            },
          },
        })

        return {
          ...room,
          unreadCount: unreadMessages,
        }
      }),
    )

    res.json(roomsWithUnread)
  } catch (error) {
    console.error("[Chat Controller] Get chat rooms error:", error)
    res.status(500).json({ 
      message: "Failed to fetch chat rooms",
      error: error.message 
    })
  }
}

// Get messages for a chat room
export const getChatMessages = async (req, res) => {
  try {
    const { roomId, conversationId } = req.params
    const chatRoomId = roomId || conversationId
    const { limit = 50, before } = req.query
    const currentUserId = req.user.id

    console.log("[Chat Controller] Get messages for room:", chatRoomId)

    // Verify user is member of the room
    const member = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: currentUserId,
        },
      },
    })

    if (!member) {
      return res.status(403).json({ message: "Not a member of this chat room" })
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoomId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      take: Number.parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    console.log("[Chat Controller] Found messages:", messages.length)

    res.json(messages.reverse())
  } catch (error) {
    console.error("[Chat Controller] Get messages error:", error)
    res.status(500).json({ 
      message: "Failed to fetch messages",
      error: error.message 
    })
  }
}

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { roomId, conversationId } = req.params
    const chatRoomId = roomId || conversationId
    const { content } = req.body
    const currentUserId = req.user.id

    console.log("[Chat Controller] Send message to room:", chatRoomId)
    console.log("[Chat Controller] Content:", content)

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" })
    }

    // Verify user is member of chat room
    const member = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: currentUserId,
        },
      },
    })

    if (!member) {
      return res.status(403).json({ message: "Not a member of this chat room" })
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatRoomId,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        readReceipts: true,
      },
    })

    // Update chat room's updatedAt
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    })

    console.log("[Chat Controller] Message created:", message.id)

    // Emit socket event
    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${chatRoomId}`).emit("new-message", message)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error("[Chat Controller] Send message error:", error)
    res.status(500).json({ 
      message: "Failed to send message",
      error: error.message 
    })
  }
}

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params
    const currentUserId = req.user.id

    console.log("[Chat Controller] Mark as read - Message:", messageId, "User:", currentUserId)

    // Check if already read
    const existing = await prisma.readReceipt.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: currentUserId,
        },
      },
    })

    if (existing) {
      return res.json({ message: "Already read" })
    }

    await prisma.readReceipt.create({
      data: {
        messageId,
        userId: currentUserId,
      },
    })

    // Emit socket event
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { chatRoomId: true },
    })

    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${message.chatRoomId}`).emit("message-read", {
        messageId,
        userId: currentUserId,
      })
    }

    res.json({ message: "Marked as read" })
  } catch (error) {
    console.error("[Chat Controller] Mark as read error:", error)
    res.status(500).json({ 
      message: "Failed to mark as read",
      error: error.message 
    })
  }
}

// Update typing status
export const updateTypingStatus = async (req, res) => {
  try {
    const { roomId } = req.params
    const { isTyping } = req.body
    const currentUserId = req.user.id

    await prisma.chatRoomMember.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: currentUserId,
        },
      },
      data: {
        isTyping,
        lastSeen: new Date(),
      },
    })

    // Emit socket event
    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${roomId}`).emit("typing-status", {
        userId: currentUserId,
        isTyping,
      })
    }

    res.json({ message: "Typing status updated" })
  } catch (error) {
    console.error("[Chat Controller] Update typing status error:", error)
    res.status(500).json({ 
      message: "Failed to update typing status",
      error: error.message 
    })
  }
}

export const uploadChatMedia = async (req, res) => {
  try {
    const { roomId, messageId } = req.params
    const currentUserId = req.user.id

    // Verify user is member of chat room
    const member = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: currentUserId,
        },
      },
    })

    if (!member) {
      return res.status(403).json({ message: "Not a member of this chat room" })
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    const file = req.file
    const fileType = file.mimetype.split("/")[0].toUpperCase()

    const mediaType =
      {
        image: "IMAGE",
        video: "VIDEO",
        audio: "AUDIO",
      }[fileType.toLowerCase()] || "FILE"

    const media = await prisma.chatMedia.create({
      data: {
        messageId,
        type: mediaType,
        url: `/uploads/chat/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    })

    // Emit socket event
    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${roomId}`).emit("media-uploaded", media)
    }

    res.status(201).json(media)
  } catch (error) {
    console.error("[Chat Controller] Upload media error:", error)
    res.status(500).json({ 
      message: "Failed to upload media",
      error: error.message 
    })
  }
}

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    const currentUserId = req.user.id

    const reaction = await prisma.messageReaction.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: currentUserId,
        },
      },
      update: {
        emoji,
      },
      create: {
        messageId,
        userId: currentUserId,
        emoji,
      },
    })

    // Get the message to find room ID
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { chatRoomId: true },
    })

    // Emit socket event
    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${message.chatRoomId}`).emit("reaction-added", {
        messageId,
        userId: currentUserId,
        emoji,
      })
    }

    res.status(201).json(reaction)
  } catch (error) {
    console.error("[Chat Controller] Add reaction error:", error)
    res.status(500).json({ 
      message: "Failed to add reaction",
      error: error.message 
    })
  }
}

export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params
    const currentUserId = req.user.id

    await prisma.messageReaction.delete({
      where: {
        messageId_userId: {
          messageId,
          userId: currentUserId,
        },
      },
    })

    // Get the message to find room ID
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { chatRoomId: true },
    })

    // Emit socket event
    const io = req.app.get("io")
    if (io) {
      io.to(`chat-${message.chatRoomId}`).emit("reaction-removed", {
        messageId,
        userId: currentUserId,
      })
    }

    res.json({ message: "Reaction removed" })
  } catch (error) {
    console.error("[Chat Controller] Remove reaction error:", error)
    res.status(500).json({ 
      message: "Failed to remove reaction",
      error: error.message 
    })
  }
}