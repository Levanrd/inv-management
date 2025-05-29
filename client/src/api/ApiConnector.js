import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 1000,
  headers: { 'Content-Type': 'application/json' }
})

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

const requestMap = {}

export const request = async (options, requestId) => {
  const user = JSON.parse(localStorage.getItem('user')) // Assuming user info is stored in localStorage

  if (!options.headers) {
    options.headers = {
      'Authorization': 'type_here'
    }
  }

  if (user && user.token) {
    if (!options.headers.Authorization) {
      const csrf = localStorage.getItem('csrfToken') // Assuming CSRF token is stored in localStorage
      options.headers.Authorization = `Bearer ${user.token}`
      if (csrf) {
        options.headers['X-CSRFToken'] = csrf
      }
    }
  }

  if (options.url.includes('/mscouch')) {
    options.headers.Authorization = process.env.VUE_APP_MSCOUCH_TOKEN
  }

  if (requestId) {
    if (requestMap[requestId]) {
      requestMap[requestId].cancel('Request aborted')
    }
    const source = axios.CancelToken.source()
    options.cancelToken = source.token
    requestMap[requestId] = source
  }

  try {
    const response = await instance(options)
    return response
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message)
    } else {
      throw error
    }
  }
}

export default instance