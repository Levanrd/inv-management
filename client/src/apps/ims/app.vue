<template>
  <div class="ims-shell">
    <aside class="ims-sidebar">
      <div>
        <p class="eyebrow">Operations Console</p>
        <h1>IMS</h1>
        <p class="sidebar-copy">A cleaner single-page workspace for inventory operations.</p>
      </div>

      <nav class="ims-nav">
        <router-link to="/ims/overview" class="ims-nav-link">
          <span>Overview</span>
          <small>Dashboard</small>
        </router-link>
        <router-link to="/ims/products" class="ims-nav-link">
          <span>Products</span>
          <small>Inventory</small>
        </router-link>
        <router-link to="/ims/orders" class="ims-nav-link">
          <span>Orders</span>
          <small>Fulfillment</small>
        </router-link>
        <router-link v-if="isAdmin" to="/ims/admin" class="ims-nav-link">
          <span>Admin Setup</span>
          <small>People & data</small>
        </router-link>
      </nav>
    </aside>

    <div class="ims-stage">
      <header class="ims-topbar">
        <div>
          <p class="eyebrow">{{ currentSection }}</p>
          <h2>{{ currentTitle }}</h2>
          <p class="header-copy">{{ currentSubtitle }}</p>
        </div>

        <div class="header-actions">
          <div class="identity-card">
            <span class="identity-avatar">{{ userInitials }}</span>
            <div>
              <strong>{{ currentUserLabel }}</strong>
              <p>{{ roleLabel }}</p>
            </div>
          </div>
          <el-button plain @click="refreshRoute">Refresh</el-button>
          <el-button type="danger" @click="logout">Logout</el-button>
        </div>
      </header>

      <main class="ims-view">
        <router-view ref="routeView" />
      </main>
    </div>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss" src="./style.scss"></style>
