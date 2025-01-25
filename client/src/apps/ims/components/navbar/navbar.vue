<template>
  <!-- Toolbar -->
  <el-header style="background-color: #3c8dbc; display: flex; justify-content: space-between; align-items: center; color: #fff; padding: 0 20px;">
      <!-- Left Side: Logo and System Name -->
      <div style="display: flex; align-items: center;">
        <img src="../../../../public/imgs/chelsylogo.jpg" alt="Company Logo" style="height: 40px; margin-right: 10px;" />
        <h2 style="margin: 0;">Inventory Management System</h2>
      </div>

      <!-- Right Side: User Profile Dropdown -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link" style="display: flex; align-items: center; cursor: pointer;">
          <img src="../../../../public/imgs/default.png" alt="User" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 5px;" />
          <el-icon><i class="el-icon-arrow-down"></i></el-icon>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click="goToProfile">Profile</el-dropdown-item>
          <el-dropdown-item @click="goToAccountSettings">Account Settings</el-dropdown-item>
          <el-dropdown-item divided>
            <el-button type="text" @click="logout">Logout</el-button>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </el-header>
</template>

<script>
import ApiConnector from '../../../../api/ApiConnector'

export default {
  data() {
    return {
      
    }
  },
  computed: {
    userName() {
      return this.$store.getters.getUserName
    },
    userRole() {
      return this.$store.getters.getRole
    }
  },
  methods: {
    goToProfile() {
      // Navigate to the user profile page
      this.$router.push('/profile')
    },
    goToAccountSettings() {
      // Navigate to account settings page
      this.$router.push('/account-settings')
    },
    async logout() {
      try {
        await ApiConnector.post('/auth/logout')
      } catch (e) {
        console.error('Error logging out:', e)
      } finally {
        this.$store.dispatch('logout')
        this.$router.push('/login')
      }
    }
  }
}

</script>