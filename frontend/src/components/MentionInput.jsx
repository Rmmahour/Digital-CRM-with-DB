"use client"

import { useState, useRef, useEffect } from "react"
import { usersAPI } from "../services/api"

export default function MentionInput({ value, onChange, placeholder, className }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [mentionSearch, setMentionSearch] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    loadAllUsers()
  }, [])

  useEffect(() => {
    if (mentionSearch) {
      const filtered = suggestions.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        return fullName.includes(mentionSearch.toLowerCase())
      })
      setFilteredSuggestions(filtered.slice(0, 5))
      setShowSuggestions(filtered.length > 0)
    } else if (showSuggestions) {
      setFilteredSuggestions(suggestions.slice(0, 5))
    }
  }, [mentionSearch, suggestions, showSuggestions])

  const loadAllUsers = async () => {
    try {
      const response = await usersAPI.getAll()
      const users = Array.isArray(response) ? response : response.users || response.data || []

      console.log("[v0] Loaded users for mentions:", users)
      setSuggestions(users)
    } catch (error) {
      console.error("[v0] Failed to load users for mentions:", error)
      setSuggestions([])
    }
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    const position = e.target.selectionStart
    setCursorPosition(position)
    onChange(text)

    // Detect @ mention
    const textBeforeCursor = text.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.substring(lastAtIndex + 1)
      // Check if there's no space after @
      if (!searchText.includes(" ")) {
        setMentionSearch(searchText)
        setShowSuggestions(true)
      } else {
        setMentionSearch("")
        setShowSuggestions(false)
      }
    } else {
      setMentionSearch("")
      setShowSuggestions(false)
    }
  }

  const handleSelectUser = (user) => {
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    const mentionText = `@${user.firstName} ${user.lastName} [${user.role.replace("_", " ")}]`
    const newText = textBeforeCursor.substring(0, lastAtIndex) + mentionText + " " + textAfterCursor

    onChange(newText)
    setShowSuggestions(false)
    setMentionSearch("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full ${className}`}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 border-b border-gray-100 last:border-0"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.role.replace("_", " ")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
