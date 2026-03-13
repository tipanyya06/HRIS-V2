import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Clock, LogOut } from 'lucide-react'

const PendingApproval = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (err) {
      localStorage.removeItem('hris_token')
      localStorage.removeItem('hris_user')
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md w-full p-10 text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Account Pending Approval
        </h1>

        {/* Message */}
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Your account has been created successfully. An administrator will review and activate your account shortly.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          You'll be able to log in once your account has been approved.
        </p>

        {/* Email Display */}
        {user ? (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-8 text-sm text-gray-600">
            Logged in as:{' '}
            <span className="font-medium text-gray-800">
              {user.email}
            </span>
          </div>
        ) : null}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>

        {/* Footer Email */}
        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact HR at{' '}
          <a href="mailto:hr@madison88.com" className="text-blue-500 hover:underline">
            hr@madison88.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default PendingApproval
