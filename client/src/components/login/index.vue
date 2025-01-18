<template>
  <div class="login-container">
    <div class="login-box">
      <el-row justify="center" align="middle">
        <el-col>
          <div class="logo">
            <el-icon><i class="el-icon-s-shop"></i></el-icon>
            <span class="title">Chelsy Burgers IMS</span>
          </div>
          <el-form :model="form" class="login-form">
            <el-form-item v-if="error">
              <el-alert
                :title="error"
                type="error"
                show-icon
              ></el-alert>
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="Email"
                @keydown.enter="login"
              ></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                placeholder="Password"
                show-password
                @keydown.enter="login"
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                class="login-button"
                @click="login"
              >
                Login
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss">
@import "./style.scss";
</style>