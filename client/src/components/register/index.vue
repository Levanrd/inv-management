<template>
  <div class="auth-container">
    <div class="auth-box register-box">
      <div class="logo-section">
        <div class="logo">
          <i class="el-icon-s-shop logo-icon"></i>
          <h1 class="title">Create account</h1>
          <p class="subtitle">Register for Inventory Management</p>
        </div>
      </div>

      <el-form
        ref="registerForm"
        :model="form"
        :rules="rules"
        class="auth-form"
        label-position="top"
      >
        <el-form-item v-if="error" class="error-alert">
          <el-alert
            :title="error"
            type="error"
            show-icon
            closable
            @close="error = ''"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="First name" prop="first_name">
              <el-input v-model="form.first_name" placeholder="First name" :disabled="loading" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Last name" prop="last_name">
              <el-input v-model="form.last_name" placeholder="Last name" :disabled="loading" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Username" prop="user_name">
          <el-input
            v-model="form.user_name"
            placeholder="Choose a username"
            prefix-icon="el-icon-user"
            :disabled="loading"
            clearable
          />
        </el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input
            v-model="form.email"
            placeholder="Email address"
            prefix-icon="el-icon-message"
            :disabled="loading"
            clearable
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            placeholder="At least 8 characters, with uppercase, lowercase & number"
            prefix-icon="el-icon-lock"
            :type="showPassword ? 'text' : 'password'"
            :disabled="loading"
            show-password
            @keyup.enter.native="register"
          />
        </el-form-item>

        <el-form-item label="Confirm password" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            placeholder="Confirm password"
            prefix-icon="el-icon-lock"
            :type="showConfirmPassword ? 'text' : 'password'"
            :disabled="loading"
            show-password
            @keyup.enter.native="register"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="auth-button"
            size="large"
            :loading="loading"
            :disabled="loading"
            @click="register"
          >
            <span v-if="!loading">Create account</span>
            <span v-else>Creating account...</span>
          </el-button>
        </el-form-item>

        <div class="auth-switch">
          <span class="auth-switch-text">Already have an account?</span>
          <router-link to="/login" class="auth-link">Sign in</router-link>
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
