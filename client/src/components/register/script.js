import ApiConnector from '../../api/ApiConnector'

const passwordRule = (rule, value, callback) => {
  if (!value) {
    callback(new Error('Please enter a password'))
    return
  }
  if (value.length < 8) {
    callback(new Error('Password must be at least 8 characters'))
    return
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    callback(new Error('Password must contain uppercase, lowercase, and a number'))
    return
  }
  callback()
}

export default {
  name: 'Register',
  data() {
    return {
      form: {
        user_name: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        user_name: [
          { required: true, message: 'Please enter a username', trigger: 'blur' },
          { min: 3, max: 50, message: 'Username must be 3-50 characters', trigger: 'blur' }
        ],
        first_name: [
          { required: true, message: 'Please enter your first name', trigger: 'blur' },
          { max: 50, message: 'Max 50 characters', trigger: 'blur' }
        ],
        last_name: [
          { required: true, message: 'Please enter your last name', trigger: 'blur' },
          { max: 50, message: 'Max 50 characters', trigger: 'blur' }
        ],
        email: [
          { required: true, message: 'Please enter your email', trigger: 'blur' },
          { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
        ],
        password: [
          { required: true, validator: passwordRule, trigger: 'blur' }
        ],
        confirmPassword: []
      },
      error: '',
      loading: false,
      showPassword: false,
      showConfirmPassword: false
    }
  },
  created() {
    this.rules.confirmPassword = [
      { required: true, message: 'Please confirm your password', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (!value) return callback()
          if (value !== this.form.password) {
            callback(new Error('Passwords do not match'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  },
  mounted() {
    this.error = ''
  },
  methods: {
    async register() {
      try {
        await this.$refs.registerForm.validate()
      } catch (e) {
        return
      }

      this.loading = true
      this.error = ''

      const payload = {
        user_name: this.form.user_name.trim(),
        first_name: this.form.first_name.trim(),
        last_name: this.form.last_name.trim(),
        email: this.form.email.trim().toLowerCase(),
        password: this.form.password,
        role: 'user'
      }

      try {
        await ApiConnector.post('/auth/register', payload)
        this.$message({
          message: 'Account created successfully. Please sign in.',
          type: 'success',
          duration: 4000
        })
        this.loading = false
        this.$router.push('/login')
      } catch (e) {
        this.loading = false
        if (e.message && e.message !== 'Request failed with status code') {
          this.error = e.message
        } else if (e.response && e.response.data) {
          const d = e.response.data
          this.error = Array.isArray(d.details) ? d.details.join(', ') : (d.error || 'Registration failed.')
        } else {
          this.error = 'Network error. Please try again.'
        }
        setTimeout(() => { this.error = '' }, 5000)
      }
    }
  }
}
