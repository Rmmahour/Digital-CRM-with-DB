"use client"

import { CheckSquare, Clock, AlertCircle, CircleDot, Eye, CheckCircle2, XCircle, FileCheck } from "lucide-react"
import { format } from "date-fns"

const statusColors = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-purple-100 text-purple-800",
}

const statusIcons = {
  TODO: CircleDot,
  IN_PROGRESS: Clock,
  IN_REVIEW: Eye,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  COMPLETED: FileCheck,
}

const priorityIcons = {
  LOW: Clock,
  MEDIUM: CheckSquare,
  HIGH: AlertCircle,
  URGENT: AlertCircle,
}

export default function TaskList({ tasks, title = "Recent Tasks", onTaskClick }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-text-secondary text-center py-8">No tasks found</p>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => {
          const PriorityIcon = priorityIcons[task.priority]
          const StatusIcon = statusIcons[task.status]

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className="p-4 border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <StatusIcon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      task.status === "COMPLETED"
                        ? "text-purple-600"
                        : task.status === "IN_PROGRESS"
                          ? "text-blue-600"
                          : task.status === "APPROVED"
                            ? "text-green-600"
                            : task.status === "REJECTED"
                              ? "text-red-600"
                              : task.status === "IN_REVIEW"
                                ? "text-yellow-600"
                                : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">{task.title}</h4>
                    <p className="text-sm text-text-secondary line-clamp-2">{task.description}</p>
                  </div>
                </div>
                <PriorityIcon
                  className={`w-5 h-5 ml-2 flex-shrink-0 ${task.priority === "URGENT" ? "text-danger" : "text-text-secondary"}`}
                />
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap ml-8">
                <span className={`px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                  {task.status.replace("_", " ")}
                </span>
                {task.brand && <span className="text-text-secondary">{task.brand.name}</span>}
                {task.dueDate && (
                  <span className="text-text-secondary">Due: {format(new Date(task.dueDate), "MMM d")}</span>
                )}
                {task._count?.comments > 0 && (
                  <span className="text-text-secondary">
                    {task._count.comments} {task._count.comments === 1 ? "comment" : "comments"}
                  </span>
                )}
                {task.assignedToId && (
                  <span className="text-text-secondary">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
