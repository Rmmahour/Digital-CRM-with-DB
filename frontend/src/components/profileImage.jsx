import React, { useState, useRef } from "react";
import { User } from "lucide-react";
import { usersAPI } from "../services/api";  // 🔴 use same api layer

const ProfileImageUploader = ({ className = "", defaultImage }) => {
  const [avatar, setAvatar] = useState(defaultImage);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const uploadToServer = async (file) => {
    console.log("🔥 UPDATED VERSION - Uploading file:", file);

  const formData = new FormData();
    // 🔥 CRITICAL: Use "avatar" to match upload.single("avatar") in router
    formData.append("avatar", file);

    setLoading(true);
  try {
    const data = await usersAPI.uploadProfile(formData);
    console.log("Upload response:", data);
    if (data.avatar) {
        setAvatar(data.avatar);
      }
  } catch (err) {
    console.error("Profile upload failed:", err.response?.data || err);
    alert(err.response?.data?.message || "Profile upload failed");
  } finally {
    setLoading(false);
  }
};

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // local preview
    const previewURL = URL.createObjectURL(file);
    setAvatar(previewURL);

    uploadToServer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50 transition relative ${className}`}
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs">
            Uploading...
          </div>
        )}

        {avatar ? (
          <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-blue-600" />
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
};

export default ProfileImageUploader;
