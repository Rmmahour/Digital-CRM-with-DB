"use client"

import { useState, useEffect } from "react"
import { Plus, Users, Trash2, Edit2, Shield, UserPlus, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  useEffect(() => {
    loadTeams()
    if (["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)) {
      loadUsers()
    }
  }, [user.role])

  const loadTeams = async () => {
    try {
      const response = await api.get("/teams")
      console.log("[TeamsPage] Loaded teams:", response.data)
      setTeams(response.data)
    } catch (error) {
      console.error("[TeamsPage] Failed to load teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data)
    } catch (error) {
      console.error("[TeamsPage] Failed to load users:", error)
    }
  }

  const handleCreateTeam = () => {
    setSelectedTeam(null)
    setShowCreateModal(true)
  }

  const handleEditTeam = (team) => {
    setSelectedTeam(team)
    setShowEditModal(true)
  }

  const handleManageMembers = (team) => {
    setSelectedTeam(team)
    setShowMembersModal(true)
  }

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team? All members will be unassigned.")) {
      return
    }

    try {
      await api.delete(`/teams/${teamId}`)
      setTeams(teams.filter((t) => t.id !== teamId))
    } catch (error) {
      console.error("[TeamsPage] Failed to delete team:", error)
      alert("Failed to delete team")
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading teams...</div>
  }

  if (!["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teams</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage teams and team members</p>
        </div>
        {["SUPER_ADMIN", "ADMIN"].includes(user.role) && (
          <button
            onClick={handleCreateTeam}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg dark:text-black">{team.name}</h3>
                  <p className="text-sm text-gray-500">
                    {team._count?.members || team.members?.length || 0} members
                  </p>
                </div>
              </div>
              {["SUPER_ADMIN", "ADMIN"].includes(user.role) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTeam(team)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit team"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {user.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {team.description && <p className="text-sm text-gray-600 mb-4">{team.description}</p>}

            {team.leader && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3">
                <Shield className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-black">Team Leader</p>
                  <p className="text-xs text-gray-600">
                    {team.leader.firstName} {team.leader.lastName}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>
                    {team.members?.length || 0} {team.members?.length === 1 ? "member" : "members"}
                  </span>
                </div>
                {["SUPER_ADMIN", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role) && (
                  <button
                    onClick={() => handleManageMembers(team)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Manage
                  </button>
                )}
              </div>

              {/* Show first 3 members */}
              {team.members && team.members.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {team.members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 text-xs font-semibold"
                      title={`${member.firstName} ${member.lastName}`}
                    >
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-semibold">
                      +{team.members.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-2">No teams yet</p>
          <p className="text-sm text-gray-500">Create your first team to get started</p>
        </div>
      )}

      {showCreateModal && (
        <CreateTeamModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onTeamCreated={() => {
            loadTeams()
            setShowCreateModal(false)
          }}
        />
      )}

      {showEditModal && selectedTeam && (
        <EditTeamModal
          team={selectedTeam}
          users={users}
          onClose={() => setShowEditModal(false)}
          onTeamUpdated={() => {
            loadTeams()
            setShowEditModal(false)
          }}
        />
      )}

      {showMembersModal && selectedTeam && (
        <ManageMembersModal
          team={selectedTeam}
          users={users}
          onClose={() => {
            setShowMembersModal(false)
            loadTeams()
          }}
        />
      )}
    </div>
  )
}

function ManageMembersModal({ team, users, onClose }) {
  const [members, setMembers] = useState(team.members || [])
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Filter out users who are already members (check by user ID)
    const memberIds = members.map(m => m.id)
    const available = users.filter(u => !memberIds.includes(u.id) && u.isActive)
    setAvailableUsers(available)
  }, [members, users])

  const handleAddMember = async (userId) => {
    setLoading(true)
    try {
      await api.post(`/teams/${team.id}/members`, { userId })
      
      // Add user to local state
      const userToAdd = users.find(u => u.id === userId)
      if (userToAdd) {
        setMembers([...members, userToAdd])
      }
    } catch (error) {
      console.error("[ManageMembersModal] Failed to add member:", error)
      alert(error.response?.data?.message || "Failed to add member")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member from the team?")) return

    setLoading(true)
    try {
      await api.delete(`/teams/${team.id}/members/${userId}`)
      setMembers(members.filter(m => m.id !== userId))
    } catch (error) {
      console.error("[ManageMembersModal] Failed to remove member:", error)
      alert(error.response?.data?.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const filteredAvailable = availableUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col dark:bg-gray-800">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Manage Team Members</h2>
              <p className="text-sm text-gray-600 mt-1">{team.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Members */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Current Members ({members.length})</h3>
            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium dark:text-black">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {member.role?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No members in this team yet</p>
            )}
          </div>

          {/* Add Members */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Add Members</h3>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
            />
            {filteredAvailable.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredAvailable.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:text-black"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {user.role?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {searchTerm ? "No users found" : "All active users are already members"}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateTeamModal({ users, onClose, onTeamCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leaderId: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/teams", formData)
      onTeamCreated()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team")
      setLoading(false)
    }
  }

  const eligibleLeaders = users.filter((u) => ["ADMIN", "ACCOUNT_MANAGER"].includes(u.role))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Create Team</h2>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Team Leader</label>
            <select
              value={formData.leaderId}
              onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
            >
              <option value="">Select a leader (optional)</option>
              {eligibleLeaders.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:text-white dark:hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTeamModal({ team, users, onClose, onTeamUpdated }) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
    leaderId: team.leaderId || "",
    isActive: team.isActive !== false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.put(`/teams/${team.id}`, formData)
      onTeamUpdated()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update team")
      setLoading(false)
    }
  }

  const eligibleLeaders = users.filter((u) => ["ADMIN", "ACCOUNT_MANAGER"].includes(u.role))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Edit Team</h2>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Team Leader</label>
            <select
              value={formData.leaderId}
              onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-black"
            >
              <option value="">Select a leader (optional)</option>
              {eligibleLeaders.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Team is Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}