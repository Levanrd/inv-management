<template>
  <div>
    <!-- Navigation Bar -->
    <navbar />

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

export default {
  name: 'Ims',
  components: {
    Navbar: () => import('./components/navbar/navbar.vue'),
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
}
</script>