import ApiConnector from '../../api/ApiConnector'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      rules: {
        email: [
          { required: true, message: 'Please enter your email', trigger: 'blur' },
          { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Please enter your password', trigger: 'blur' },
          { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
        ]
      },
      error: '',
      loading: false,
      showPassword: false
    }
  },
  mounted() {
    // Clear any existing errors when component mounts
    this.error = ''
  },
  methods: {
    async login() {
      // Validate form
      try {
        await this.$refs.loginForm.validate()
      } catch (e) {
        return false
      }

      this.loading = true
      this.error = ''

      try {
        const response = await ApiConnector.post('/auth/login', this.form)
        const { token, user_name, role } = response.data

        this.$store.dispatch('login', { token, user_name, role })

        // Show success message
        this.$message({
          message: 'Login successful!',
          type: 'success',
          duration: 2000
        })

        // Navigate after a short delay for better UX
        setTimeout(() => {
          this.loading = false
          this.$router.push('/ims').catch(() => {
            // Ignore navigation duplicate errors
          })
        }, 500)
      } catch (e) {
        this.loading = false
        // Prefer message set by API interceptor, then response body
        if (e.message && e.message !== 'Request failed with status code') {
          this.error = e.message
        } else if (e.response && e.response.data) {
          const errorData = e.response.data
          if (errorData.details && Array.isArray(errorData.details)) {
            this.error = errorData.details.join(', ')
          } else {
            this.error = errorData.error || 'Login failed. Please try again.'
          }
        } else {
          this.error = 'Network error. Please check your connection and try again.'
        }
        setTimeout(() => { this.error = '' }, 5000)
      }
    },
    handleKeyPress(event) {
      if (event.key === 'Enter') {
        this.login()
      }
    }
  }
}
