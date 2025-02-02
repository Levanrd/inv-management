<template>
  <div>
    <!-- Navigation Bar -->
    <navbar />

    <!-- Back Button -->
    <div class="back-button-container">
      <el-button 
        icon="el-icon-arrow-left" 
        @click="goBack" 
        type="primary" 
        plain
      >Back</el-button>
    </div>

    <div class="product-container">
      <!-- Product Content -->
      <div class="product-details">
        <!-- Left: Product Images -->
        <div class="product-images">
          <el-carousel :interval="5000" arrow="always">
            <el-carousel-item v-for="(image, index) in productImages" :key="index">
              <img :src="image" alt="Product Image" class="main-image" />
            </el-carousel-item>
          </el-carousel>
          <div class="thumbnails">
            <img 
              v-for="(image, index) in productImages" 
              :key="index" 
              :src="image" 
              alt="Thumbnail" 
              class="thumbnail"
              @click="currentImage = image"
            />
          </div>
        </div>

        <!-- Right: Product Information -->
        <div class="product-info">
          <h1 class="product-title">{{ product.product_name }}</h1>
          <p class="product-price">₱{{ product.price }}</p>

          <el-table :data="productDetails" border style="width: 100%">
            <el-table-column prop="attribute" label="Attribute"></el-table-column>
            <el-table-column prop="description" label="Description"></el-table-column>
          </el-table>

          <!-- Social Sharing -->
          <div class="share-product">
            <p><strong>Share this product:</strong></p>
            <el-button icon="el-icon-share" @click="copyShareableLink">Copy Link</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss">
@import "./style.scss"
</style>
