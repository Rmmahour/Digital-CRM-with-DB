import prisma from "../config/prisma.js"
import { uploadToCloudinary } from "../config/upload.js"
import { notifyTaskAssigned, notifyTaskCompleted } from "../services/notificationService.js"

export const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority, brandId, assignedToId, page = 1, limit = 10 } = req.query

    const where = { deletedAt: null }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (brandId) where.brandId = brandId
    if (assignedToId) where.assignedToId = assignedToId

    if (req.user.role === "ACCOUNT_MANAGER") {
      const userTeam = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { teamId: true },
      })

      if (userTeam.teamId) {
        where.OR = [
          { createdById: req.user.id },
          { assignedToId: req.user.id },
          {
            assignedTo: {
              teamId: userTeam.teamId,
            },
          },
        ]
      } else {
        where.OR = [{ createdById: req.user.id }, { assignedToId: req.user.id }]
      }
    } else if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      where.OR = [
        { assignedToId: req.user.id },
        { createdById: req.user.id },
        {
          brand: {
            users: {
              some: {
                userId: req.user.id,
              },
            },
          },
        },
      ]
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: Number.parseInt(limit),
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ])

    res.json({
      tasks,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        brand: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
    })

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    res.json(task)
  } catch (error) {
    next(error)
  }
}

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      brandId,
      assignedToId,
      contentType,
      postingDate,
      referenceUpload,
      notes,
    } = req.body

    if (!title || !brandId) {
      return res.status(400).json({ message: "Title and brand are required" })
    }

    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
      })

      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user does not exist" })
      }
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    })

    if (!brand) {
      return res.status(400).json({ message: "Brand does not exist" })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        brandId,
        assignedToId: assignedToId || null,
        createdById: req.user.id,
        contentType: contentType || null,
        postingDate: postingDate ? new Date(postingDate) : null,
        referenceUpload: referenceUpload || null,
        notes: notes || null,
      },
      include: {
        brand: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (assignedToId) {
      await notifyTaskAssigned(task, task.assignedTo)

      const io = req.app.get("io")
      io.to(`user-${assignedToId}`).emit("notification", {
        title: "New Task Assigned",
        message: `You have been assigned to task: ${title}`,
      })
    }

    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Task",
        entityId: task.id,
        userId: req.user.id,
        metadata: {
          taskTitle: title,
          brandId,
          assignedToId,
        },
      },
    })

    res.status(201).json(task)
  } catch (error) {
    next(error)
  }
}

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedToId,
      contentType,
      postingDate,
      referenceUpload,
      finalUpload,
      notes,
      textContent,
    } = req.body

    if (status === "COMPLETED") {
      if (!["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only Super Admin, Admin, and Manager can mark tasks as completed" })
      }
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" })
    }

    if (assignedToId !== undefined && assignedToId !== null) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
      })

      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user does not exist" })
      }
    }

    const updateData = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (contentType !== undefined) updateData.contentType = contentType
    if (postingDate !== undefined) updateData.postingDate = postingDate ? new Date(postingDate) : null
    if (referenceUpload !== undefined) updateData.referenceUpload = referenceUpload
    if (finalUpload !== undefined) updateData.finalUpload = finalUpload
    if (notes !== undefined) updateData.notes = notes
    if (textContent !== undefined) updateData.textContent = textContent

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      await notifyTaskCompleted(task, existingTask.createdBy)
    }

    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Task",
        entityId: task.id,
        userId: req.user.id,
        metadata: {
          changes: updateData,
        },
      },
    })

    const io = req.app.get("io")
    io.emit("task:update", task)

    res.json(task)
  } catch (error) {
    next(error)
  }
}

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id },
      select: { title: true },
    })

    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Task",
        entityId: id,
        userId: req.user.id,
        metadata: {
          taskTitle: task?.title,
        },
      },
    })

    res.json({ message: "Task deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" })
    }

    const mentionRegex = /@([A-Za-z\s]+)\s+\[([^\]]+)\]$$([^)]+)$$/g
    const mentions = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      const userId = match[3].trim()
      if (userId && !mentions.includes(userId)) {
        mentions.push(userId)
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user.id,
        mentions,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
      },
    })

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        assignedToId: true,
        createdById: true,
      },
    })

    for (const userId of mentions) {
      if (userId !== req.user.id) {
        const mentionedUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, whatsAppNumber: true, email: true },
        })

        if (mentionedUser) {
          const io = req.app.get("io")
          await prisma.notification.create({
            data: {
              title: "You were mentioned",
              message: `${req.user.firstName} ${req.user.lastName} mentioned you in: ${task.title}`,
              userId,
              type: "MENTION",
              sentVia: ["IN_APP"],
            },
          })

          io.to(`user-${userId}`).emit("notification", {
            type: "MENTION",
            title: "You were mentioned",
            message: `${req.user.firstName} ${req.user.lastName} mentioned you in task: ${task.title}`,
            taskId,
            commentId: comment.id,
          })
        }
      }
    }

    const notifyUsers = [task.assignedToId, task.createdById].filter(
      (userId) => userId && userId !== req.user.id && !mentions.includes(userId),
    )

    const io = req.app.get("io")
    for (const userId of notifyUsers) {
      await prisma.notification.create({
        data: {
          title: "New Comment",
          message: `${req.user.firstName} commented on: ${task.title}`,
          userId,
          type: "COMMENT",
          sentVia: ["IN_APP"],
        },
      })

      io.to(`user-${userId}`).emit("new-comment", {
        taskId,
        comment,
      })
    }

    res.status(201).json(comment)
  } catch (error) {
    next(error)
  }
}

export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    res.json(comments)
  } catch (error) {
    next(error)
  }
}

export const uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const { description } = req.body

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    let fileUrl = ""
    const fileName = req.file.originalname

    if (process.env.UPLOAD_STORAGE === "cloud" && process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await uploadToCloudinary(req.file)
      fileUrl = result.secure_url
    } else {
      fileUrl = `/uploads/${req.file.filename}`
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        taskId,
        description: description || null,
      },
    })

    await prisma.activityLog.create({
      data: {
        action: "UPLOAD",
        entity: "Attachment",
        entityId: attachment.id,
        userId: req.user.id,
        metadata: {
          taskId,
          fileName,
          fileType: req.file.mimetype,
        },
      },
    })

    const notifyUsers = [task.assignedToId, task.createdById].filter((userId) => userId && userId !== req.user.id)

    const io = req.app.get("io")
    for (const userId of notifyUsers) {
      await prisma.notification.create({
        data: {
          title: "New Attachment",
          message: `${req.user.firstName} uploaded a file to: ${task.title}`,
          userId,
        },
      })

      io.to(`user-${userId}`).emit("new-attachment", {
        taskId,
        attachment,
      })
    }

    res.status(201).json(attachment)
  } catch (error) {
    next(error)
  }
}

export const getTaskAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    })

    res.json(attachments)
  } catch (error) {
    next(error)
  }
}

export const deleteAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" })
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Attachment",
        entityId: attachmentId,
        userId: req.user.id,
        metadata: {
          fileName: attachment.fileName,
          taskId: attachment.taskId,
        },
      },
    })

    res.json({ message: "Attachment deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: req.user.id,
        deletedAt: null,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json(Array.isArray(tasks) ? tasks : [])
  } catch (error) {
    next(error)
  }
}

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (status === "COMPLETED" && !["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only Super Admin, Admin, and Manager can mark tasks as completed" })
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        brand: true,
        assignedTo: true,
      },
    })

    const io = req.app.get("io")
    io.emit("task:update", task)

    res.json(task)
  } catch (error) {
    next(error)
  }
}

export const updateTaskPriority = async (req, res, next) => {
  try {
    const { id } = req.params
    const { priority } = req.body

    const task = await prisma.task.update({
      where: { id },
      data: { priority },
      include: {
        brand: true,
        assignedTo: true,
      },
    })

    const io = req.app.get("io")
    io.emit("task:update", task)

    res.json(task)
  } catch (error) {
    next(error)
  }
}

export const updateTaskDueDate = async (req, res, next) => {
  try {
    const { id } = req.params
    const { dueDate } = req.body

    const task = await prisma.task.update({
      where: { id },
      data: { dueDate: dueDate ? new Date(dueDate) : null },
      include: {
        brand: true,
        assignedTo: true,
      },
    })

    const io = req.app.get("io")
    io.emit("task:update", task)

    res.json(task)
  } catch (error) {
    next(error)
  }
}

export const updateTaskAssignee = async (req, res, next) => {
  try {
    const { id } = req.params
    const { assignedToId } = req.body

    const task = await prisma.task.update({
      where: { id },
      data: { assignedToId },
      include: {
        brand: true,
        assignedTo: true,
      },
    })

    if (assignedToId) {
      await notifyTaskAssigned(task, task.assignedTo)

      const io = req.app.get("io")
      io.to(`user-${assignedToId}`).emit("notification", {
        title: "Task Assigned",
        message: `You have been assigned to: ${task.title}`,
      })
    }

    const io = req.app.get("io")
    io.emit("task:update", task)

    res.json(task)
  } catch (error) {
    next(error)
  }
}
