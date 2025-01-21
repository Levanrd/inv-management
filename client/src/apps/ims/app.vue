<template>
  <div>
    <!-- <h1>Inventory Management System</h1> -->

    <!-- Toolbar -->
    <el-header style="background-color: #3c8dbc; display: flex; justify-content: space-between; align-items: center; color: #fff; padding: 0 20px;">
      <!-- Left Side: Logo and System Name -->
      <div style="display: flex; align-items: center;">
        <img src="../../public/imgs/chelsylogo.jpg" alt="Company Logo" style="height: 40px; margin-right: 10px;" />
        <h2 style="margin: 0;">Inventory Management System</h2>
      </div>

      <!-- Right Side: User Profile Dropdown -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link" style="display: flex; align-items: center; cursor: pointer;">
          <img src="../../public/imgs/default.png" alt="User" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 5px;" />
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

    <el-tabs v-model="activeTab" style="margin: 5px;">
      <!-- <el-tab-pane label="Users" name="users">
        <UserManagement />
      </el-tab-pane> -->
      <el-tab-pane label="Products" name="products">
        <ProductManagement />
      </el-tab-pane>
      <!-- <el-tab-pane label="Categories" name="categories">
        <CategoryManagement />
      </el-tab-pane>
      <el-tab-pane label="Suppliers" name="suppliers">
        <SupplierManagement />
      </el-tab-pane> -->
      <el-tab-pane label="Orders" name="orders">
        <OrderManagement />
      </el-tab-pane>
      <!-- <el-tab-pane label="Order Items" name="orderitems">
        <OrderItemsManagement />
      </el-tab-pane> -->
    </el-tabs>
  </div>
</template>

<script>
import ApiConnector from '../../api/ApiConnector'

export default {
  name: 'Ims',
  components: {
    // UserManagement: () => import('./components/users/index.vue'),
    ProductManagement: () => import('./components/products/index.vue'),
    OrderManagement: () => import('./components/orders/index.vue'),
    // OrderItemsManagement: () => import('./components/order-items/index.vue'),
    // CategoryManagement: () => import('./components/categories/index.vue'),
    // SupplierManagement: () => import('./components/suppliers/index.vue'),
  },
  data() {
    return {
      activeTab: 'products'
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
    logout() {
      try {
        ApiConnector.post('/auth/logout')
        localStorage.removeItem('token')
        this.$router.push('/login')
      } catch (e) {
        console.error('Error logging out:', e)
      }
    }
  }
}
</script>