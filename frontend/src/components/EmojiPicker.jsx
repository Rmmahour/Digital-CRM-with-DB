"use client"

import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { useEffect, useRef } from "react"

export default function EmojiPicker({ onSelect, onClose }) {
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose()
      }
    }

    // Add a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 z-50"
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200">
        <Picker
          data={data}
          onEmojiSelect={(emoji) => {
            onSelect(emoji.native + " ")
          }}
          theme="light"
          locale="en"
          previewPosition="none"
          emojiSize={20}
          emojiButtonSize={28}
          maxFrequentRows={2}
        />
      </div>
    </div>
  )
}