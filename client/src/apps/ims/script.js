import ApiConnector from '../../api/ApiConnector'

export default {
  name: 'ImsLayout',
  computed: {
    isAdmin() {
      return this.$store.getters.getRole === 'admin'
    },
    currentUserLabel() {
      return this.$store.getters.getUserName || 'Operator'
    },
    roleLabel() {
      return this.isAdmin ? 'Administrator' : 'Standard user'
    },
    userInitials() {
      return this.currentUserLabel.slice(0, 2).toUpperCase()
    },
    currentTitle() {
      return this.$route.meta.title || 'Inventory Management System'
    },
    currentSection() {
      return this.$route.meta.section || 'Workspace'
    },
    currentSubtitle() {
      return this.$route.meta.subtitle || 'Manage inventory, orders, and operational data.'
    },
  },
  methods: {
    async logout() {
      try {
        await ApiConnector.post('/auth/logout')
      } catch (error) {
        console.error(error)
      } finally {
        this.$store.dispatch('logout')
        this.$router.push('/login')
      }
    },
    refreshRoute() {
      const currentView = this.$refs.routeView
      if (currentView && typeof currentView.refreshPage === 'function') {
        currentView.refreshPage()
      }
    },
  },
}
