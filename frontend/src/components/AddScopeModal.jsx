"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { calendarsAPI } from "../services/api"

const contentTypes = [
  { value: "STATIC", label: "Static Post" },
  { value: "VIDEO", label: "Video" },
  { value: "STORY", label: "Story" },
  { value: "REEL", label: "Reel" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "BLOG_POST", label: "Blog Post" },
]

export default function AddScopeModal({ isOpen, onClose, onSuccess, calendarId }) {
  const [formData, setFormData] = useState({
    contentType: "STATIC",
    quantity: 1,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await calendarsAPI.addScope(calendarId, formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Failed to add scope:", error)
      alert(error.response?.data?.message || "Failed to add scope")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Scope Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Content Type</label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Scope"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
