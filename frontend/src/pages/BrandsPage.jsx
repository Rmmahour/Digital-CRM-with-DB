"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { brandsAPI, calendarsAPI } from "../services/api"
import { useNavigate } from "react-router-dom"
import CreateBrandModal from "../components/CreateBrandModal"
import EditBrandModal from "../components/EditBrandModal"

export default function BrandsPage() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const data = await brandsAPI.getAll()
      setBrands(data)
    } catch (error) {
      console.error("[v0] Failed to load brands:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (brandId) => {
    if (!confirm("Are you sure you want to delete this brand?")) return

    try {
      await brandsAPI.delete(brandId)
      loadBrands()
    } catch (error) {
      console.error("[v0] Failed to delete brand:", error)
      alert("Failed to delete brand")
    }
  }

  const handleEdit = (brand) => {
    setSelectedBrand(brand)
    setShowEditModal(true)
  }

  const handleBrandClick = async (brand) => {
    try {
      console.log("[v0] Opening calendar for brand:", brand.name)

      // Get or create calendar for current month
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      console.log("[v0] Fetching calendar for:", { brandId: brand.id, month, year })

      const calendars = await calendarsAPI.getAll({ brandId: brand.id, month, year })

      console.log("[v0] Calendars found:", calendars)

      if (calendars.length > 0) {
        console.log("[v0] Navigating to existing calendar:", calendars[0].id)
        navigate(`/dashboard/calendars/${calendars[0].id}`)
      } else {
        console.log("[v0] Creating new calendar for brand:", brand.id)
        // Create calendar for current month
        const calendar = await calendarsAPI.create({
          brandId: brand.id,
          month,
          year,
        })
        console.log("[v0] Calendar created:", calendar)
        navigate(`/dashboard/calendars/${calendar.id}`)
      }
    } catch (error) {
      console.error("[v0] Failed to open calendar - Full error:", error)
      console.error("[v0] Error response:", error.response?.data)
      console.error("[v0] Error status:", error.response?.status)

      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      alert(`Failed to open calendar: ${errorMessage}\n\nPlease check the console for details.`)
    }
  }

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return <div className="text-center py-12">Loading brands...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Brands</h1>
          <p className="text-text-secondary">Manage client brands and accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Brand
        </button>
      </div>

      <div className="bg-background rounded-lg border border-border p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand) => (
            <div key={brand.id} className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3
                  onClick={() => handleBrandClick(brand)}
                  className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                >
                  {brand.name}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Edit brand"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete brand"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4 line-clamp-2">{brand.description || "No description"}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{brand._count?.tasks || 0} tasks</span>
                <span
                  className={`px-2 py-1 rounded ${
                    brand.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}
                >
                  {brand.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateBrandModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={loadBrands} />
      <EditBrandModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadBrands}
        brand={selectedBrand}
      />
    </div>
  )
}
