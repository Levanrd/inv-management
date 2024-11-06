import { computed } from 'vue'
import ApiConnector from '../../api/ApiConnector'

export default {
  name: 'App',
  components: {

  },
  data() {
    return {
      isAuthenticated: false,
      form: {
        email: '',
        password: ''
      },
      error: ''
    }
  },
  methods: {
    async login() {
      try {
        const response = await ApiConnector.post('/auth/login', this.form).then(res => res.data)
        const { token } = response
        localStorage.setItem('token', token)
        this.isAuthenticated = true
        this.$router.push('/ims')
      } catch (e) {
        if (e) {
          this.error = e.response.data.error
        }
      }
    }
  },
  created() {
    const token = localStorage.getItem('token')
    if (token) {
      this.isAuthenticated = true
      this.$router.push('/ims')
    }
  }
}