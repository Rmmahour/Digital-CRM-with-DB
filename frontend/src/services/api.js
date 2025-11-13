import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password })
    return data
  },
  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData)
    return data
  },
  forgotPassword: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email })
    return data
  },
  resetPassword: async (token, password) => {
    const { data } = await api.post("/auth/reset-password", { token, password })
    return data
  },
  getMe: async () => {
    const { data } = await api.get("/auth/me")
    return data
  },
  updateProfile: async (profileData) => {
    const { data } = await api.put("/auth/profile", profileData)
    return data
  },
  changePassword: async (passwordData) => {
    const { data } = await api.put("/auth/change-password", passwordData)
    return data
  },
}

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/activity/stats')
    return response.data
  }
}

// Users API
export const usersAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/users", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },
  create: async (userData) => {
    const { data } = await api.post("/users", userData)
    return data
  },
  update: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/users/${id}`)
    return data
  },
}

// Brands API
export const brandsAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/brands", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/brands/${id}`)
    return data
  },
  create: async (brandData) => {
    const { data } = await api.post("/brands", brandData)
    return data
  },
  update: async (id, brandData) => {
    const { data } = await api.put(`/brands/${id}`, brandData)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/brands/${id}`)
    return data
  },
  assignUser: async (brandId, userId) => {
    const { data } = await api.post(`/brands/${brandId}/users`, { userId })
    return data
  },
  removeUser: async (brandId, userId) => {
    const { data } = await api.delete(`/brands/${brandId}/users/${userId}`)
    return data
  },
}

// Tasks API
export const tasksAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/tasks", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },
  create: async (taskData) => {
    const { data } = await api.post("/tasks", taskData)
    return data
  },
  update: async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/tasks/${id}`)
    return data
  },
  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/tasks/${id}/status`, { status })
    return data
  },
  updatePriority: async (id, priority) => {
    const { data } = await api.patch(`/tasks/${id}/priority`, { priority })
    return data
  },
  updateDueDate: async (id, dueDate) => {
    const { data } = await api.patch(`/tasks/${id}/due-date`, { dueDate })
    return data
  },
  updateAssignee: async (id, assignedToId) => {
    const { data } = await api.patch(`/tasks/${id}/assignee`, { assignedToId })
    return data
  },
  updateTaskDate: async (taskId, postingDate) => {
    const { data } = await api.put(`/tasks/${taskId}`, { postingDate })
    return data
  },
  getComments: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/comments`)
    return data
  },
  addComment: async (taskId, content) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { content })
    return data
  },
  getAttachments: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/attachments`)
    return data
  },
  uploadAttachment: async (taskId, file, description) => {
    const formData = new FormData()
    formData.append("file", file)
    if (description) {
      formData.append("description", description)
    }
    const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },
  deleteAttachment: async (attachmentId) => {
    const { data } = await api.delete(`/tasks/attachments/${attachmentId}`)
    return data
  },

  updateCopyIdea: async (id, copyIdea) => {
    const response = await api.patch(`/tasks/${id}/copy-idea`, { copyIdea })
    return response.data
  },
  
  updateCaption: async (id, caption) => {
    const response = await api.patch(`/tasks/${id}/caption`, { caption })
    return response.data
  },
  
  updateCreativeRef: async (id, creativeRef) => {
    const response = await api.patch(`/tasks/${id}/creative-ref`, { creativeRef })
    return response.data
  },
  
  updatePublishDate: async (id, publishDate) => {
    const response = await api.patch(`/tasks/${id}/publish-date`, { publishDate })
    return response.data
  },
  
  updateSocialStatus: async (id, socialStatus) => {
    const response = await api.patch(`/tasks/${id}/social-status`, { socialStatus })
    return response.data
  },
  
  uploadFinalCreative: async (taskId, file, description) => {
    const formData = new FormData()
    formData.append("file", file)
    if (description) formData.append("description", description)
    
    const response = await api.post(`/tasks/${taskId}/final-creative`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
  
  getFinalCreatives: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/final-creatives`)
    return response.data
  },
  
  deleteFinalCreative: async (creativeId) => {
    const response = await api.delete(`/tasks/final-creative/${creativeId}`)
    return response.data
  },

}

// Notifications API
export const notificationsAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/notifications", { params })
    return data
  },
  markAsRead: async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`)
    return data
  },
  markAllAsRead: async () => {
    const { data } = await api.put("/notifications/read-all")
    return data
  },
}

// Activity Logs API
export const activityAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/activity", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/activity/${id}`)
    return data
  },
}

// Calendar API
export const calendarsAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/calendars", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/calendars/${id}`)
    return data
  },
  create: async (calendarData) => {
    const { data } = await api.post("/calendars", calendarData)
    return data
  },
  update: async (id, calendarData) => {
    const { data } = await api.put(`/calendars/${id}`, calendarData)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/calendars/${id}`)
    return data
  },
  addScope: async (calendarId, scopeData) => {
    const { data } = await api.post(`/calendars/${calendarId}/scopes`, scopeData)
    return data
  },
  updateScope: async (scopeId, scopeData) => {
    const { data } = await api.put(`/calendars/scopes/${scopeId}`, scopeData)
    return data
  },
  deleteScope: async (scopeId) => {
    const { data } = await api.delete(`/calendars/scopes/${scopeId}`)
    return data
  },
  generateTasks: async (calendarId, scopesData) => {
    const { data } = await api.post(`/calendars/${calendarId}/generate-tasks`, scopesData)
    return data
  },
}

// Chat API

export const chatsAPI = {
  
  getConversations: async () => {
    try {
      const { data } = await api.get("/chat/rooms")
      console.log("[Chats API] Get conversations response:", data)
      return data
    } catch (error) {
      console.error("[Chats API] Get conversations error:", error.response?.data)
      throw error
    }
  },

  // Create new conversation (or get existing one)
  createConversation: async (userId) => {
    try {
      console.log("[Chats API] Creating conversation with userId:", userId)
      const { data } = await api.post("/chat/rooms", { userId })
      console.log("[Chats API] Create conversation response:", data)
      return data
    } catch (error) {
      console.error("[Chats API] Create conversation error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  },

  // Get messages for a room
  getMessages: async (roomId, params = {}) => {
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}/messages`, { params })
      console.log("[Chats API] Get messages response:", data)
      return data
    } catch (error) {
      console.error("[Chats API] Get messages error:", error.response?.data)
      throw error
    }
  },

  // Send a message
  sendMessage: async (roomId, content) => {
    try {
      console.log("[Chats API] Sending message to room:", roomId)
      const { data } = await api.post(`/chat/rooms/${roomId}/messages`, { content })
      console.log("[Chats API] Send message response:", data)
      return data
    } catch (error) {
      console.error("[Chats API] Send message error:", error.response?.data)
      throw error
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const { data } = await api.post(`/chat/messages/${messageId}/read`)
      return data
    } catch (error) {
      console.error("[Chats API] Mark as read error:", error.response?.data)
      throw error
    }
  }
}


// Teams API
export const teamsAPI = {
  getAll: async (params) => {
    const { data } = await api.get("/teams", { params })
    return data
  },
  getById: async (id) => {
    const { data } = await api.get(`/teams/${id}`)
    return data
  },
  create: async (teamData) => {
    const { data } = await api.post("/teams", teamData)
    return data
  },
  update: async (id, teamData) => {
    const { data } = await api.put(`/teams/${id}`, teamData)
    return data
  },
  delete: async (id) => {
    const { data } = await api.delete(`/teams/${id}`)
    return data
  },
  addMember: async (teamId, userId) => {
    const { data } = await api.post(`/teams/${teamId}/members`, { userId })
    return data
  },
  removeMember: async (teamId, userId) => {
    const { data } = await api.delete(`/teams/${teamId}/members/${userId}`)
    return data
  },
}

// Recovery API
export const recoveryAPI = {
  getDeletedUsers: async () => {
    const { data } = await api.get("/recovery/users")
    return data
  },
  getDeletedBrands: async () => {
    const { data } = await api.get("/recovery/brands")
    return data
  },
  getDeletedTasks: async () => {
    const { data } = await api.get("/recovery/tasks")
    return data
  },
  restoreUser: async (id) => {
    const { data } = await api.post(`/recovery/users/${id}/restore`)
    return data
  },
  restoreBrand: async (id) => {
    const { data } = await api.post(`/recovery/brands/${id}/restore`)
    return data
  },
  restoreTask: async (id) => {
    const { data } = await api.post(`/recovery/tasks/${id}/restore`)
    return data
  },
  permanentDeleteUser: async (id) => {
    const { data } = await api.delete(`/recovery/users/${id}/permanent`)
    return data
  },
  permanentDeleteBrand: async (id) => {
    const { data } = await api.delete(`/recovery/brands/${id}/permanent`)
    return data
  },
  permanentDeleteTask: async (id) => {
    const { data } = await api.delete(`/recovery/tasks/${id}/permanent`)
    return data
  },
}


export const trashAPI = {
  getAll: async (type) => {
    const response = await api.get(`/trash${type ? `?type=${type}` : ''}`)
    return response.data
  },
  
  restore: async (type, id) => {
    const response = await api.post(`/trash/restore/${type}/${id}`)
    return response.data
  },
  
  permanentlyDelete: async (type, id) => {
    const response = await api.delete(`/trash/${type}/${id}`)
    return response.data
  },
  
  emptyTrash: async () => {
    const response = await api.post('/trash/empty')
    return response.data
  }
}



export default api
