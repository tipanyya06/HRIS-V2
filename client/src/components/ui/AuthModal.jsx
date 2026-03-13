import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from './LoadingSpinner'

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string')   return error.response.data.error
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  if (typeof error?.message === 'string')                 return error.message
  return 'Something went wrong. Please try again.'
}

const AuthModal = ({ isOpen, onClose, onSuccess, redirectJobId }) => {
  const navigate = useNavigate()
  const [activeTab,    setActiveTab]    = useState('login')
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState('')

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setError('')
  }

  const handleLoginChange = (e) => {
    setError('')
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegisterChange = (e) => {
    setError('')
    setRegisterForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClose = () => {
    setLoginForm({ email: '', password: '' })
    setRegisterForm({ firstName: '', lastName: '', email: '', password: '' })
    setError('')
    setActiveTab('login')
    onClose()
  }

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError('Email and password are required')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      const response = await api.post('/auth/login', loginForm)
      const { user, token } = response.data.data || response.data
      localStorage.setItem('hris_token', token)
      localStorage.setItem('hris_user', JSON.stringify(user))
      useAuthStore.getState().setUser(user, token)
      
      if (onSuccess) {
        onSuccess(user)
      } else {
        // Fallback navigation based on role
        if (user.role === 'applicant') 
          navigate('/applicant/dashboard')
        else if (user.role === 'employee')
          navigate('/employee/dashboard')
        else if (['admin','super-admin','hr'].includes(user.role))
          navigate('/admin/dashboard')
        else 
          navigate('/pending')
      }
    } catch (err) {
      if (err?.response?.status === 401)
        setError('Invalid email or password')
      else if (err?.response?.status === 403)
        setError('Your account has been deactivated. Contact HR.')
      else if (!err?.response)
        setError('Unable to connect. Check your internet connection.')
      else
        setError(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerForm.firstName.trim())
      return setError('First name is required')
    if (!registerForm.lastName.trim())
      return setError('Last name is required')
    if (!registerForm.email.trim())
      return setError('Email is required')
    if (registerForm.password.length < 8)
      return setError('Password must be at least 8 characters')

    try {
      setIsLoading(true)
      setError('')
      const response = await api.post('/auth/register', registerForm)
      const { user, token } = response.data.data || response.data
      localStorage.setItem('hris_token', token)
      localStorage.setItem('hris_user', JSON.stringify(user))
      useAuthStore.getState().setUser(user, token)
      
      if (onSuccess) {
        onSuccess(user)
      } else {
        // Fallback navigation based on role
        if (user.role === 'applicant') 
          navigate('/applicant/dashboard')
        else if (user.role === 'employee')
          navigate('/employee/dashboard')
        else if (['admin','super-admin','hr'].includes(user.role))
          navigate('/admin/dashboard')
        else 
          navigate('/pending')
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setError('This email is already registered. Try signing in instead.')
        setActiveTab('login')
      } else if (!err?.response) {
        setError('Unable to connect. Check your internet connection.')
      } else {
        setError(extractErrorMessage(err))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >

        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Madison 88</h2>

        <div className="flex border-b mb-4">
          <button
            onClick={() => handleTabSwitch('login')}
            disabled={isLoading}
            className={`pb-2 px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 disabled:text-gray-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabSwitch('register')}
            disabled={isLoading}
            className={`pb-2 px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 disabled:text-gray-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-3">
            {error}
          </div>
        ) : null}

        {activeTab === 'login' ? (
          <div className="space-y-3">
            <input
              name="email" type="email" required
              placeholder="Email address"
              value={loginForm.email}
              onChange={handleLoginChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="password" type="password" required
              placeholder="Password"
              value={loginForm.password}
              onChange={handleLoginChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'Sign In'}
            </button>
            <p className="text-sm text-center text-gray-500">
              Don't have an account?{' '}
              <button onClick={() => handleTabSwitch('register')} className="text-blue-600 hover:underline">
                Create one
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              name="firstName" type="text" required
              placeholder="First name"
              value={registerForm.firstName}
              onChange={handleRegisterChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="lastName" type="text" required
              placeholder="Last name"
              value={registerForm.lastName}
              onChange={handleRegisterChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="email" type="email" required
              placeholder="Email address"
              value={registerForm.email}
              onChange={handleRegisterChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="password" type="password" required
              placeholder="Password (min 8 characters)"
              value={registerForm.password}
              onChange={handleRegisterChange}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'Create Account'}
            </button>
            <p className="text-sm text-center text-gray-500">
              Already have an account?{' '}
              <button onClick={() => handleTabSwitch('login')} className="text-blue-600 hover:underline">
                Sign in
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default AuthModal
