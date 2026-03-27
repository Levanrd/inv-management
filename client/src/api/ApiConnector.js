import axios from 'axios'
import router from '../router'
import store from '../store'

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:4000/api',
  timeout: 30000, // 30 seconds - increased from 1 second
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor for better error handling
instance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection and try again.'
      } else {
        error.message = 'Network error. Please check your connection and try again.'
      }
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // Handle authentication errors
    if (status === 401) {
      // Clear token and redirect to login
      store.dispatch('logout')
      
      // Only redirect if not already on login page
      if (router.currentRoute.path !== '/login') {
        router.push('/login')
      }
      
      error.message = data.error || 'Session expired. Please login again.'
    }

    // Handle forbidden errors
    if (status === 403) {
      error.message = data.error || 'You do not have permission to perform this action.'
    }

    // Handle not found errors
    if (status === 404) {
      error.message = data.error || 'Resource not found.'
    }

    // Handle validation errors
    if (status === 400 && data.details) {
      error.message = Array.isArray(data.details) 
        ? data.details.join(', ') 
        : data.error || 'Validation failed'
    }

    // Handle server errors
    if (status >= 500) {
      error.message = data.error || 'Server error. Please try again later.'
    }

    return Promise.reject(error)
  }
)

export default instance
