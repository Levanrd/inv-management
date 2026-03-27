<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-section">
        <div class="logo">
          <i class="el-icon-s-shop logo-icon"></i>
          <h1 class="title">Inventory Management</h1>
          <p class="subtitle">Sign in to your account</p>
        </div>
      </div>

      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter.native="login"
      >
        <el-form-item v-if="error" class="error-alert">
          <el-alert
            :title="error"
            type="error"
            show-icon
            :closable="true"
            @close="error = ''"
          ></el-alert>
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="Email address"
            prefix-icon="el-icon-message"
            size="large"
            :disabled="loading"
            clearable
            @keyup.enter.native="login"
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            placeholder="Password"
            prefix-icon="el-icon-lock"
            size="large"
            :type="showPassword ? 'text' : 'password'"
            :disabled="loading"
            @keyup.enter.native="login"
          >
            <template slot="suffix">
              <i
                :class="showPassword ? 'el-icon-view' : 'el-icon-hide'"
                class="password-toggle"
                @click="showPassword = !showPassword"
              ></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            size="large"
            :loading="loading"
            :disabled="loading"
            @click="login"
          >
            <span v-if="!loading">Sign In</span>
            <span v-else>Signing in...</span>
          </el-button>
        </el-form-item>

        <div class="auth-switch">
          <span class="auth-switch-text">Don't have an account?</span>
          <router-link to="/register" class="auth-link">Sign up</router-link>
        </div>
      </el-form>

      <div class="footer">
        <p class="footer-text">© 2026 Inventory Management System</p>
      </div>
    </div>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss" src="./style.scss"></style>
