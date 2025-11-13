"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  AlertCircle,
  Edit2,
  Trash2,
  Send,
  Upload,
  Download,
  X,
  ChevronDown,
  FileText,
  Image,
  Link as LinkIcon,
  Save,
  Check,
} from "lucide-react"
import { tasksAPI, usersAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { format } from "date-fns"
import EditTaskModal from "../components/EditTaskModal"
import MentionInput from "../components/MentionInput"

const statusColors = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-purple-100 text-purple-800",
}

const socialStatusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  READY_TO_PUBLISH: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
}

const priorityColors = {
  LOW: "text-gray-600",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const [selectedFile, setSelectedFile] = useState(null)
  const [fileDescription, setFileDescription] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)

  const [copyIdea, setCopyIdea] = useState("")
  const [caption, setCaption] = useState("")
  const [creativeRef, setCreativeRef] = useState("")
  const [editingCopyIdea, setEditingCopyIdea] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [editingCreativeRef, setEditingCreativeRef] = useState(false)
  const [savingCopyIdea, setSavingCopyIdea] = useState(false)
  const [savingCaption, setSavingCaption] = useState(false)
  const [savingCreativeRef, setSavingCreativeRef] = useState(false)

  const [finalCreativeFile, setFinalCreativeFile] = useState(null)
  const [finalCreativeDescription, setFinalCreativeDescription] = useState("")
  const [uploadingFinalCreative, setUploadingFinalCreative] = useState(false)
  const [finalCreatives, setFinalCreatives] = useState([])

    const [editingStatus, setEditingStatus] = useState(false)
  const [editingPriority, setEditingPriority] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [editingPublishDate, setEditingPublishDate] = useState(false)
  const [editingSocialStatus, setEditingSocialStatus] = useState(false)
  const [users, setUsers] = useState([])


  const [referenceLink, setReferenceLink] = useState("")
  const [workText, setWorkText] = useState("")
  const [submittingWork, setSubmittingWork] = useState(false)
  const [references, setReferences] = useState("")


  useEffect(() => {
    loadUsers()
    loadTask()

    if (socket) {
      socket.on("new-comment", ({ taskId, comment }) => {
        if (taskId === id) {
          setTask((prev) => ({
            ...prev,
            comments: [...(prev.comments || []), comment],
          }))
        }
      })

      socket.on("new-attachment", ({ taskId, attachment }) => {
        if (taskId === id) {
          setTask((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), attachment],
          }))
        }
      })

      return () => {
        socket.off("new-comment")
        socket.off("new-attachment")
      }
    }
  }, [id, socket])

  const loadTask = async () => {
    try {
      const data = await tasksAPI.getById(id)
      setTask(data)
      setCopyIdea(data.copyIdea || "")
      setCaption(data.caption || "")
      setCreativeRef(data.creativeRef || "")
      setFinalCreatives(data.finalCreatives || [])
      if (data.referenceUpload) setReferenceLink(data.referenceUpload)
      if (data.textContent) setWorkText(data.textContent)
      if (data.references) setReferences(data.references)
    } catch (error) {
      console.error("[v0] Failed to load task:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAll()
      setUsers(usersData)
    } catch (error) {
      console.error("[v0] Failed to load users:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await tasksAPI.delete(id)
      navigate("/dashboard/tasks")
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task")
    }
  }

  const handleTaskUpdated = (updatedTask) => {
    setTask(updatedTask)
    setShowEditModal(false)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const comment = await tasksAPI.addComment(id, newComment)
      setTask((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
      }))
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
      alert("Failed to add comment")
    } finally {
      setSubmittingComment(false)
    }
  }


  // New handlers for content fields
  const handleSaveCopyIdea = async () => {
    setSavingCopyIdea(true)
    try {
      const updated = await tasksAPI.updateCopyIdea(id, copyIdea)
      setTask(updated)
      setEditingCopyIdea(false)
      alert("Copy idea saved successfully!")
    } catch (error) {
      console.error("Failed to save copy idea:", error)
      alert("Failed to save copy idea")
    } finally {
      setSavingCopyIdea(false)
    }
  }

  const handleSaveCaption = async () => {
    setSavingCaption(true)
    try {
      const updated = await tasksAPI.updateCaption(id, caption)
      setTask(updated)
      setEditingCaption(false)
      alert("Caption saved successfully!")
    } catch (error) {
      console.error("Failed to save caption:", error)
      alert("Failed to save caption")
    } finally {
      setSavingCaption(false)
    }
  }

  const handleSaveCreativeRef = async () => {
    setSavingCreativeRef(true)
    try {
      const updated = await tasksAPI.updateCreativeRef(id, creativeRef)
      setTask(updated)
      setEditingCreativeRef(false)
      alert("Creative reference saved successfully!")
    } catch (error) {
      console.error("Failed to save creative reference:", error)
      alert("Failed to save creative reference")
    } finally {
      setSavingCreativeRef(false)
    }
  }

  // Final Creative handlers
  const handleFinalCreativeSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFinalCreativeFile(file)
    }
  }

  const handleUploadFinalCreative = async () => {
    if (!finalCreativeFile) return

    setUploadingFinalCreative(true)
    try {
      const creative = await tasksAPI.uploadFinalCreative(id, finalCreativeFile, finalCreativeDescription)
      setFinalCreatives((prev) => [creative, ...prev])
      setFinalCreativeFile(null)
      setFinalCreativeDescription("")
      document.getElementById("final-creative-input").value = ""
      alert("Final creative uploaded successfully!")
    } catch (error) {
      console.error("Failed to upload final creative:", error)
      alert("Failed to upload final creative")
    } finally {
      setUploadingFinalCreative(false)
    }
  }

  const handleDeleteFinalCreative = async (creativeId) => {
    if (!confirm("Are you sure you want to delete this final creative?")) return

    try {
      await tasksAPI.deleteFinalCreative(creativeId)
      setFinalCreatives((prev) => prev.filter((c) => c.id !== creativeId))
    } catch (error) {
      console.error("Failed to delete final creative:", error)
      alert("Failed to delete final creative")
    }
  }


  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }


  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return

    try {
      await tasksAPI.deleteAttachment(attachmentId)
      setTask((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== attachmentId),
      }))
    } catch (error) {
      console.error("Failed to delete attachment:", error)
      alert("Failed to delete attachment")
    }
  }


  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.startsWith("video/")) return "🎥"
    if (fileType.startsWith("audio/")) return "🎵"
    if (fileType.includes("pdf")) return "📄"
    return "📎"
  }

  const handleSubmitWork = async () => {
    if (!referenceLink && !workText && !selectedFile && !references) {
      alert("Please add references, reference link, text content, or upload a file")
      return
    }

    setSubmittingWork(true)
    try {
      const updateData = {}
      if (referenceLink) updateData.referenceUpload = referenceLink
      if (workText) updateData.textContent = workText
      if (references) updateData.references = references

      const updatedTask = await tasksAPI.update(id, updateData)
      setTask(updatedTask)
      alert("Work submitted successfully!")
    } catch (error) {
      console.error("[v0] Failed to submit work:", error)
      alert("Failed to submit work")
    } finally {
      setSubmittingWork(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === "COMPLETED" && !["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)) {
      alert("Only Super Admin, Admin, and Manager can mark tasks as completed")
      return
    }

    try {
      const updated = await tasksAPI.updateStatus(id, newStatus)
      setTask(updated)
      setEditingStatus(false)
    } catch (error) {
      console.error("[v0] Failed to update status:", error)
      alert("Failed to update status")
    }
  }

  const handleUpdatePriority = async (newPriority) => {
    try {
      const updated = await tasksAPI.updatePriority(id, newPriority)
      setTask(updated)
      setEditingPriority(false)
    } catch (error) {
      console.error("[v0] Failed to update priority:", error)
      alert("Failed to update priority")
    }
  }

  const handleUpdateAssignee = async (newAssigneeId) => {
    try {
      const updated = await tasksAPI.updateAssignee(id, newAssigneeId)
      setTask(updated)
      setEditingAssignee(false)
    } catch (error) {
      console.error("[v0] Failed to update assignee:", error)
      alert("Failed to update assignee")
    }
  }


  const handleUpdateDueDate = async (e) => {
  const newDueDate = e.target.value
  try {
    const updated = await tasksAPI.updateDueDate(id, newDueDate)
    setTask(updated)
    setEditingDueDate(false)
  } catch (error) {
    console.error("[v0] Failed to update due date:", error)
    alert("Failed to update due date")
  }
}

const handleUpdatePublishDate = async (e) => {
  const newPublishDate = e.target.value
  try {
    const updated = await tasksAPI.updatePublishDate(id, newPublishDate)
    setTask(updated)
    setEditingPublishDate(false)
  } catch (error) {
    console.error("[v0] Failed to update publish date:", error)
    alert("Failed to update publish date")
  }
}

const handleUpdateSocialStatus = async (newSocialStatus) => {
  try {
    const updated = await tasksAPI.updateSocialStatus(id, newSocialStatus)
    setTask(updated)
    setEditingSocialStatus(false)
  } catch (error) {
    console.error("[v0] Failed to update social status:", error)
    alert("Failed to update social status")
  }
}


  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleUploadFile = async () => {
    if (!selectedFile) return

    setUploadingFile(true)
    try {
      const attachment = await tasksAPI.uploadAttachment(id, selectedFile, fileDescription)
      setTask((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), attachment],
      }))
      setSelectedFile(null)
      setFileDescription("")
      // Reset file input
      document.getElementById("file-input").value = ""
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("Failed to upload file")
    } finally {
      setUploadingFile(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading task...</div>
  }

  if (!task) {
    return <div className="text-center py-12">Task not found</div>
  }

  const canEdit =
    ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role) ||
    task.createdById === user.id ||
    task.assignedToId === user.id

  const canManage = ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)

  const canEditContent = ["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER", "WRITER"].includes(user.role)
  
  const isAssignedDesigner = task.assignedToId === user.id && user.role === "DESIGNER"

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/tasks")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tasks
        </button>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            {["SUPER_ADMIN", "ADMIN"].includes(user.role) && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Task Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3 dark:text-black">{task.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Task Status */}
              {editingStatus && canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="px-3 py-1 border border-blue-500 rounded-full text-sm dark:text-black"
                    autoFocus
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  <button onClick={() => setEditingStatus(false)} className="text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => canManage && setEditingStatus(true)}
                  className={`px-3 py-1 rounded-full text-sm ${statusColors[task.status]} ${canManage ? "cursor-pointer hover:opacity-80" : ""}`}
                >
                  {task.status.replace("_", " ")}
                  {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                </button>
              )}

              {/* Priority */}
              {editingPriority && canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={task.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    className="px-3 py-1 border border-blue-500 rounded-full text-sm dark:text-black"
                    autoFocus
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                  <button onClick={() => setEditingPriority(false)} className="text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => canManage && setEditingPriority(true)}
                  className={`flex items-center gap-1 text-sm font-medium ${priorityColors[task.priority]} ${canManage ? "cursor-pointer hover:opacity-80" : ""}`}
                >
                  <AlertCircle className="w-4 h-4" />
                  {task.priority}
                  {canManage && <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {/* Social Status */}
              {editingSocialStatus && canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    value={task.socialStatus || "DRAFT"}
                    onChange={(e) => handleUpdateSocialStatus(e.target.value)}
                    className="px-3 py-1 border border-blue-500 rounded-full text-sm dark:text-black"
                    autoFocus
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY_TO_PUBLISH">READY TO PUBLISH</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                  <button onClick={() => setEditingSocialStatus(false)} className="text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => canManage && setEditingSocialStatus(true)}
                  className={`px-3 py-1 rounded-full text-sm ${socialStatusColors[task.socialStatus || "DRAFT"]} ${canManage ? "cursor-pointer hover:opacity-80" : ""}`}
                >
                  📱 {(task.socialStatus || "DRAFT").replace("_", " ")}
                  {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            {/* Brand */}
            <div className="flex items-center gap-3 text-gray-600">
              <Briefcase className="w-5 h-5" />
              <div>
                <p className="text-xs">Brand</p>
                <p className="text-gray-900 font-medium">{task.brand?.name}</p>
              </div>
            </div>

            {/* Assigned To */}
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-xs">Assigned To</p>
                {editingAssignee && canManage ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={task.assignedToId || ""}
                      onChange={(e) => handleUpdateAssignee(e.target.value)}
                      className="px-3 py-1 border border-blue-500 rounded text-sm dark:text-black"
                      autoFocus
                    >
                      <option value="">Not assigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.role})
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setEditingAssignee(false)} className="text-gray-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => canManage && setEditingAssignee(true)}
                    className={`text-left ${canManage ? "hover:text-blue-600" : ""}`}
                  >
                    {task.assignedTo ? (
                      <p className="text-gray-900 font-medium">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                        <span className="ml-2 text-xs text-gray-500">({task.assignedTo.role})</span>
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    ) : (
                      <p className="text-gray-400 font-medium">
                        Not assigned
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Created By */}
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-5 h-5" />
              <div>
                <p className="text-xs">Created By</p>
                <p className="text-gray-900 font-medium">
                  {task.createdBy?.firstName} {task.createdBy?.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Due Date */}
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-xs">Due Date</p>
                {editingDueDate && canManage ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      defaultValue={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                      onChange={handleUpdateDueDate}
                      className="px-3 py-1 border border-blue-500 rounded text-sm"
                      autoFocus
                    />
                    <button onClick={() => setEditingDueDate(false)} className="text-gray-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => canManage && setEditingDueDate(true)}
                    className={`text-left ${canManage ? "hover:text-blue-600" : ""}`}
                  >
                    {task.dueDate ? (
                      <p className="text-gray-900 font-medium">
                        {format(new Date(task.dueDate), "MMMM d, yyyy")}
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    ) : (
                      <p className="text-gray-400 font-medium">
                        No due date
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Publish Date */}
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-xs">Publish Date</p>
                {editingPublishDate && canManage ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      defaultValue={task.publishDate ? format(new Date(task.publishDate), "yyyy-MM-dd") : ""}
                      onChange={handleUpdatePublishDate}
                      className="px-3 py-1 border border-blue-500 rounded text-sm"
                      autoFocus
                    />
                    <button onClick={() => setEditingPublishDate(false)} className="text-gray-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => canManage && setEditingPublishDate(true)}
                    className={`text-left ${canManage ? "hover:text-blue-600" : ""}`}
                  >
                    {task.publishDate ? (
                      <p className="text-gray-900 font-medium">
                        {format(new Date(task.publishDate), "MMMM d, yyyy")}
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    ) : (
                      <p className="text-gray-400 font-medium">
                        No publish date
                        {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
                      </p>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-xs">Created At</p>
                <p className="text-gray-900 font-medium">
                  {format(new Date(task.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-black">Description</h3>
            <p className="text-gray-600 leading-relaxed">{task.description}</p>
          </div>
        )}
      </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Copy Idea Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold dark:text-black">Copy Idea / Post Copy</h3>
          </div>
          {canEditContent && !editingCopyIdea && (
            <button
              onClick={() => setEditingCopyIdea(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {editingCopyIdea ? (
          <div className="space-y-3">
            <textarea
              value={copyIdea}
              onChange={(e) => setCopyIdea(e.target.value)}
              placeholder="Write your copy idea or post copy here..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCopyIdea}
                disabled={savingCopyIdea}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingCopyIdea ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingCopyIdea(false)
                  setCopyIdea(task.copyIdea || "")
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {task.copyIdea ? (
              <p className="text-gray-700 whitespace-pre-wrap">{task.copyIdea}</p>
            ) : (
              <p className="text-gray-400 italic">No copy idea added yet</p>
            )}
          </div>
        )}
      </div>

            {/* Caption Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold dark:text-black">Caption</h3>
          </div>
          {canEditContent && !editingCaption && (
            <button
              onClick={() => setEditingCaption(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {editingCaption ? (
          <div className="space-y-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write the final caption for this post..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCaption}
                disabled={savingCaption}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingCaption ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingCaption(false)
                  setCaption(task.caption || "")
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {task.caption ? (
              <p className="text-gray-700 whitespace-pre-wrap">{task.caption}</p>
            ) : (
              <p className="text-gray-400 italic">No caption added yet</p>
            )}
          </div>
        )}
      </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

      {/* Creative Reference Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold dark:text-black">Creative Reference</h3>
          </div>
          {canEditContent && !editingCreativeRef && (
            <button
              onClick={() => setEditingCreativeRef(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {editingCreativeRef ? (
          <div className="space-y-3">
            <textarea
              value={creativeRef}
              onChange={(e) => setCreativeRef(e.target.value)}
              placeholder="Add reference links (one per line)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCreativeRef}
                disabled={savingCreativeRef}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingCreativeRef ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingCreativeRef(false)
                  setCreativeRef(task.creativeRef || "")
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {task.creativeRef ? (
              <div className="space-y-2">
                {task.creativeRef.split('\n').map((link, index) => (
                  link.trim() && (
                    <a
                      key={index}
                      href={link.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      {link.trim()}
                    </a>
                  )
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No creative reference added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Final Creative Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-black">
          <Image className="w-5 h-5 text-green-600" />
          Final Creative ({finalCreatives.length})
        </h3>

        {(isAssignedDesigner || canManage) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="final-creative-input"
                  type="file"
                  onChange={handleFinalCreativeSelect}
                  accept="image/*,video/*,.pdf,.psd,.ai"
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {finalCreativeFile && (
                  <button
                    onClick={() => {
                      setFinalCreativeFile(null)
                      document.getElementById("final-creative-input").value = ""
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {finalCreativeFile && (
                <>
                  <input
                    type="text"
                    value={finalCreativeDescription}
                    onChange={(e) => setFinalCreativeDescription(e.target.value)}
                    placeholder="Add description (optional)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleUploadFinalCreative}
                    disabled={uploadingFinalCreative}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingFinalCreative ? "Uploading..." : "Upload Final Creative"}
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Upload final designs, images, videos, or files for this post
            </p>
          </div>
        )}

        {finalCreatives && finalCreatives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalCreatives.map((creative) => (
              <div
                key={creative.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(creative.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{creative.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(creative.fileSize)}</p>
                    {creative.description && <p className="text-xs text-gray-600 mt-1">{creative.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      By {creative.uploadedBy?.firstName} {creative.uploadedBy?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:5000${creative.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {(creative.uploadedById === user.id || canManage) && (
                    <button
                      onClick={() => handleDeleteFinalCreative(creative.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No final creatives uploaded yet</p>
        )}
      </div>

      </div>



      {/* Reference Attachments Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-black">Reference Attachments ({task.attachments?.length || 0})</h3>

        {canEditContent && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      document.getElementById("file-input").value = ""
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {selectedFile && (
                <>
                  <input
                    type="text"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Add description (optional)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUploadFile}
                    disabled={uploadingFile}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingFile ? "Uploading..." : "Upload Reference"}
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Upload reference materials, inspirations, or supporting files
            </p>
          </div>
        )}

        {task.attachments && task.attachments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                    {attachment.description && <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:5000${attachment.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {canEditContent && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No reference attachments yet</p>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-black">Comments ({task.comments?.length || 0})</h3>

        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              placeholder="Add a comment... (type @ to mention someone)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Type @ to mention team members and notify them</p>
        </form>

        {task.comments && task.comments.length > 0 ? (
          <div className="space-y-4">
            {task.comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">
                    {comment.user.firstName} {comment.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
                <p className="text-gray-600">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No comments yet</p>
        )}
      </div>

      {showEditModal && (
        <EditTaskModal task={task} onClose={() => setShowEditModal(false)} onTaskUpdated={handleTaskUpdated} />
      )}
    </div>
  )



  // return (
  //   <div className="space-y-6">
  //     <div className="flex items-center justify-between">
  //       <button
  //         onClick={() => navigate("/dashboard/tasks")}
  //         className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
  //       >
  //         <ArrowLeft className="w-5 h-5" />
  //         Back to Tasks
  //       </button>

  //       {canEdit && (
  //         <div className="flex items-center gap-3">
  //           <button
  //             onClick={() => setShowEditModal(true)}
  //             className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
  //           >
  //             <Edit2 className="w-4 h-4" />
  //             Edit
  //           </button>
  //           {["SUPER_ADMIN", "ADMIN", "TASK_MANAGER"].includes(user.role) && (
  //             <button
  //               onClick={handleDelete}
  //               className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
  //             >
  //               <Trash2 className="w-4 h-4" />
  //               Delete
  //             </button>
  //           )}
  //         </div>
  //       )}
  //     </div>

  //     <div className="bg-white rounded-lg border border-gray-200 p-6">
  //       <div className="flex items-start justify-between mb-6">
  //         <div className="flex-1">
  //           <h1 className="text-3xl font-bold mb-3">{task.title}</h1>
  //           <div className="flex items-center gap-3 flex-wrap">
  //             {editingStatus && canManage ? (
  //               <div className="flex items-center gap-2">
  //                 <select
  //                   value={task.status}
  //                   onChange={(e) => handleUpdateStatus(e.target.value)}
  //                   className="px-3 py-1 border border-blue-500 rounded-full text-sm"
  //                   autoFocus
  //                 >
  //                   <option value="TODO">TODO</option>
  //                   <option value="IN_PROGRESS">IN PROGRESS</option>
  //                   <option value="IN_REVIEW">IN REVIEW</option>
  //                   <option value="APPROVED">APPROVED</option>
  //                   <option value="REJECTED">REJECTED</option>
  //                   <option value="COMPLETED">COMPLETED</option>
  //                 </select>
  //                 <button onClick={() => setEditingStatus(false)} className="text-gray-500">
  //                   <X className="w-4 h-4" />
  //                 </button>
  //               </div>
  //             ) : (
  //               <button
  //                 onClick={() => canManage && setEditingStatus(true)}
  //                 className={`px-3 py-1 rounded-full text-sm ${statusColors[task.status]} ${canManage ? "cursor-pointer hover:opacity-80" : ""}`}
  //               >
  //                 {task.status.replace("_", " ")}
  //                 {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
  //               </button>
  //             )}

  //             {editingPriority && canManage ? (
  //               <div className="flex items-center gap-2">
  //                 <select
  //                   value={task.priority}
  //                   onChange={(e) => handleUpdatePriority(e.target.value)}
  //                   className="px-3 py-1 border border-blue-500 rounded-full text-sm"
  //                   autoFocus
  //                 >
  //                   <option value="LOW">LOW</option>
  //                   <option value="MEDIUM">MEDIUM</option>
  //                   <option value="HIGH">HIGH</option>
  //                   <option value="URGENT">URGENT</option>
  //                 </select>
  //                 <button onClick={() => setEditingPriority(false)} className="text-gray-500">
  //                   <X className="w-4 h-4" />
  //                 </button>
  //               </div>
  //             ) : (
  //               <button
  //                 onClick={() => canManage && setEditingPriority(true)}
  //                 className={`flex items-center gap-1 text-sm font-medium ${priorityColors[task.priority]} ${canManage ? "cursor-pointer hover:opacity-80" : ""}`}
  //               >
  //                 <AlertCircle className="w-4 h-4" />
  //                 {task.priority}
  //                 {canManage && <ChevronDown className="w-3 h-3" />}
  //               </button>
  //             )}
  //           </div>
  //         </div>
  //       </div>

  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  //         <div className="space-y-4">
  //           <div className="flex items-center gap-3 text-gray-600">
  //             <Briefcase className="w-5 h-5" />
  //             <div>
  //               <p className="text-xs">Brand</p>
  //               <p className="text-gray-900 font-medium">{task.brand?.name}</p>
  //             </div>
  //           </div>

  //           <div className="flex items-center gap-3 text-gray-600">
  //             <User className="w-5 h-5" />
  //             <div className="flex-1">
  //               <p className="text-xs">Assigned To</p>
  //               {editingAssignee && canManage ? (
  //                 <div className="flex items-center gap-2">
  //                   <select
  //                     value={task.assignedToId || ""}
  //                     onChange={(e) => handleUpdateAssignee(e.target.value)}
  //                     className="px-3 py-1 border border-blue-500 rounded text-sm"
  //                     autoFocus
  //                   >
  //                     <option value="">Not assigned</option>
  //                     {users.map((u) => (
  //                       <option key={u.id} value={u.id}>
  //                         {u.firstName} {u.lastName} ({u.role})
  //                       </option>
  //                     ))}
  //                   </select>
  //                   <button onClick={() => setEditingAssignee(false)} className="text-gray-500">
  //                     <X className="w-4 h-4" />
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <button
  //                   onClick={() => canManage && setEditingAssignee(true)}
  //                   className={`text-left ${canManage ? "hover:text-blue-600" : ""}`}
  //                 >
  //                   {task.assignedTo ? (
  //                     <p className="text-gray-900 font-medium">
  //                       {task.assignedTo.firstName} {task.assignedTo.lastName}
  //                       <span className="ml-2 text-xs text-gray-500">({task.assignedTo.role})</span>
  //                       {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
  //                     </p>
  //                   ) : (
  //                     <p className="text-gray-400 font-medium">
  //                       Not assigned
  //                       {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
  //                     </p>
  //                   )}
  //                 </button>
  //               )}
  //             </div>
  //           </div>
  //         </div>

  //         <div className="space-y-4">
  //           <div className="flex items-center gap-3 text-gray-600">
  //             <Calendar className="w-5 h-5" />
  //             <div className="flex-1">
  //               <p className="text-xs">Due Date</p>
  //               {editingDueDate && canManage ? (
  //                 <div className="flex items-center gap-2">
  //                   <input
  //                     type="date"
  //                     defaultValue={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
  //                     onChange={handleUpdateDueDate}
  //                     className="px-3 py-1 border border-blue-500 rounded text-sm"
  //                     autoFocus
  //                   />
  //                   <button onClick={() => setEditingDueDate(false)} className="text-gray-500">
  //                     <X className="w-4 h-4" />
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <button
  //                   onClick={() => canManage && setEditingDueDate(true)}
  //                   className={`text-left ${canManage ? "hover:text-blue-600" : ""}`}
  //                 >
  //                   {task.dueDate ? (
  //                     <p className="text-gray-900 font-medium">
  //                       {format(new Date(task.dueDate), "MMMM d, yyyy")}
  //                       {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
  //                     </p>
  //                   ) : (
  //                     <p className="text-gray-400 font-medium">
  //                       No due date
  //                       {canManage && <ChevronDown className="w-3 h-3 inline ml-1" />}
  //                     </p>
  //                   )}
  //                 </button>
  //               )}
  //             </div>
  //           </div>

  //           <div className="flex items-center gap-3 text-gray-600">
  //             <User className="w-5 h-5" />
  //             <div>
  //               <p className="text-xs">Created By</p>
  //               <p className="text-gray-900 font-medium">
  //                 {task.createdBy?.firstName} {task.createdBy?.lastName}
  //               </p>
  //             </div>
  //           </div>

  //           {task.references && (
  //             <div className="flex items-center gap-3 text-gray-600">
  //               <Briefcase className="w-5 h-5" />
  //               <div>
  //                 <p className="text-xs">References</p>
  //                 <p className="text-gray-900 font-medium break-words">{task.references}</p>
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //       {task.description && (
  //         <div className="border-t border-gray-200 pt-6">
  //           <h3 className="text-lg font-semibold mb-3">Description</h3>
  //           <p className="text-gray-600 leading-relaxed">{task.description}</p>
  //         </div>
  //       )}
  //     </div>

  //     {(user.role === "DESIGNER" || user.role === "WRITER") && task.assignedToId === user.id && (
  //       <div className="bg-white rounded-lg border border-gray-200 p-6">
  //         <h3 className="text-lg font-semibold mb-4">Submit Your Work</h3>

  //         <div className="space-y-4">
  //           <div>
  //             <label className="block text-sm font-medium mb-2">References/Links</label>
  //             <input
  //               type="text"
  //               value={references}
  //               onChange={(e) => setReferences(e.target.value)}
  //               placeholder="Add any reference links or notes..."
  //               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             />
  //           </div>

  //           {user.role === "DESIGNER" && (
  //             <div>
  //               <label className="block text-sm font-medium mb-2">Design Reference Link/URL</label>
  //               <input
  //                 type="url"
  //                 value={referenceLink}
  //                 onChange={(e) => setReferenceLink(e.target.value)}
  //                 placeholder="https://..."
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //               />
  //             </div>
  //           )}

  //           {user.role === "WRITER" && (
  //             <div>
  //               <label className="block text-sm font-medium mb-2">Content Text</label>
  //               <textarea
  //                 value={workText}
  //                 onChange={(e) => setWorkText(e.target.value)}
  //                 placeholder="Write your content here..."
  //                 rows={6}
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //               />
  //             </div>
  //           )}

  //           <p className="text-sm text-gray-500">You can also attach files in the Attachments section below</p>
  //         </div>

  //         <button
  //           onClick={handleSubmitWork}
  //           disabled={submittingWork}
  //           className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
  //         >
  //           {submittingWork ? "Submitting..." : "Submit Work"}
  //         </button>

  //         {task.referenceUpload && (
  //           <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
  //             <p className="text-sm text-green-800">
  //               Reference Link:{" "}
  //               <a href={task.referenceUpload} target="_blank" rel="noopener noreferrer" className="underline">
  //                 {task.referenceUpload}
  //               </a>
  //             </p>
  //           </div>
  //         )}

  //         {task.textContent && (
  //           <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
  //             <p className="text-sm font-medium text-green-800">Submitted Content:</p>
  //             <p className="text-sm text-green-700 mt-2 whitespace-pre-wrap">{task.textContent}</p>
  //           </div>
  //         )}

  //         {task.references && (
  //           <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
  //             <p className="text-sm font-medium text-green-800">References:</p>
  //             <p className="text-sm text-green-700 mt-2 whitespace-pre-wrap">{task.references}</p>
  //           </div>
  //         )}
  //       </div>
  //     )}

  //     <div className="bg-white rounded-lg border border-gray-200 p-6">
  //       <h3 className="text-lg font-semibold mb-4">Attachments ({task.attachments?.length || 0})</h3>

  //       {canManage && (
  //         <div className="mb-6 p-4 bg-gray-50 rounded-lg">
  //           <div className="flex flex-col gap-3">
  //             <div className="flex items-center gap-3">
  //               <input
  //                 id="file-input"
  //                 type="file"
  //                 onChange={handleFileSelect}
  //                 className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
  //               />
  //               {selectedFile && (
  //                 <button
  //                   onClick={() => {
  //                     setSelectedFile(null)
  //                     document.getElementById("file-input").value = ""
  //                   }}
  //                   className="p-2 text-gray-400 hover:text-gray-600"
  //                 >
  //                   <X className="w-5 h-5" />
  //                 </button>
  //               )}
  //             </div>

  //             {selectedFile && (
  //               <>
  //                 {user.role === "WRITER" && (
  //                   <input
  //                     type="text"
  //                     value={fileDescription}
  //                     onChange={(e) => setFileDescription(e.target.value)}
  //                     placeholder="Add description (optional for writers)"
  //                     className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                   />
  //                 )}
  //                 <button
  //                   onClick={handleUploadFile}
  //                   disabled={uploadingFile}
  //                   className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  //                 >
  //                   <Upload className="w-4 h-4" />
  //                   {uploadingFile ? "Uploading..." : "Upload File"}
  //                 </button>
  //               </>
  //             )}
  //           </div>
  //           <p className="text-xs text-gray-500 mt-2">
  //             {user.role === "DESIGNER"
  //               ? "You can upload images, videos, links, and files"
  //               : user.role === "WRITER"
  //                 ? "You can upload files and add text descriptions"
  //                 : "Supported: Images, Videos, Documents, Audio (Max 10MB)"}
  //           </p>
  //         </div>
  //       )}

  //       {task.attachments && task.attachments.length > 0 ? (
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //           {task.attachments.map((attachment) => (
  //             <div
  //               key={attachment.id}
  //               className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
  //             >
  //               <div className="flex items-center gap-3 flex-1 min-w-0">
  //                 <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
  //                 <div className="flex-1 min-w-0">
  //                   <p className="font-medium text-sm truncate">{attachment.fileName}</p>
  //                   <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
  //                   {attachment.description && <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>}
  //                 </div>
  //               </div>
  //               <div className="flex items-center gap-2">
  //                 <a
  //                   href={`http://localhost:5000${attachment.fileUrl}`}
  //                   target="_blank"
  //                   rel="noopener noreferrer"
  //                   className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  //                 >
  //                   <Download className="w-4 h-4" />
  //                 </a>
  //                 {canManage && (
  //                   <button
  //                     onClick={() => handleDeleteAttachment(attachment.id)}
  //                     className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  //                   >
  //                     <Trash2 className="w-4 h-4" />
  //                   </button>
  //                 )}
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       ) : (
  //         <p className="text-gray-500 text-center py-8">No attachments yet</p>
  //       )}
  //     </div>

  //     <div className="bg-white rounded-lg border border-gray-200 p-6">
  //       <h3 className="text-lg font-semibold mb-4">Comments ({task.comments?.length || 0})</h3>

  //       <form onSubmit={handleSubmitComment} className="mb-6">
  //         <div className="flex gap-3">
  //           <MentionInput
  //             value={newComment}
  //             onChange={setNewComment}
  //             placeholder="Add a comment... (type @ to mention someone)"
  //             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
  //           />
  //           <button
  //             type="submit"
  //             disabled={submittingComment || !newComment.trim()}
  //             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  //           >
  //             <Send className="w-4 h-4" />
  //             Send
  //           </button>
  //         </div>
  //         <p className="text-xs text-gray-500 mt-2">Type @ to mention team members and notify them</p>
  //       </form>

  //       {task.comments && task.comments.length > 0 ? (
  //         <div className="space-y-4">
  //           {task.comments.map((comment) => (
  //             <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
  //               <div className="flex items-center justify-between mb-2">
  //                 <p className="font-medium">
  //                   {comment.user.firstName} {comment.user.lastName}
  //                 </p>
  //                 <p className="text-xs text-gray-500">{format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}</p>
  //               </div>
  //               <p className="text-gray-600">{comment.content}</p>
  //             </div>
  //           ))}
  //         </div>
  //       ) : (
  //         <p className="text-gray-500 text-center py-8">No comments yet</p>
  //       )}
  //     </div>

  //     {showEditModal && (
  //       <EditTaskModal task={task} onClose={() => setShowEditModal(false)} onTaskUpdated={handleTaskUpdated} />
  //     )}
  //   </div>
  // )
}
