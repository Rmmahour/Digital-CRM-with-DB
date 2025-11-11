import prisma from "../config/prisma.js"

export const getAllActivityLogs = async (req, res, next) => {
  try {
    const { entity, userId, limit = 100 } = req.query

    const where = {}
    if (entity) where.entity = entity
    if (userId) where.userId = userId

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit),
    })

    res.json(logs)
  } catch (error) {
    next(error)
  }
}

export const getActivityLogById = async (req, res, next) => {
  try {
    const { id } = req.params

    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!log) {
      return res.status(404).json({ message: "Activity log not found" })
    }

    res.json(log)
  } catch (error) {
    next(error)
  }
}
