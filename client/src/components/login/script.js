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
        const response = await ApiConnector.post('/auth/login', this.form)
        const { token, user_name, role } = response.data

        this.$store.dispatch('login', { token, user_name, role })

        this.$router.push('/ims')
      } catch (e) {
        if (e) {
          this.error = e.response.data.error
        }
      }
    }
  }
}