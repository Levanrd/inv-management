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

<script>
import ApiConnector from "../../../../api/ApiConnector";

export default {
  components: {
    Navbar: () => import('../navbar/navbar.vue')
  },
  data() {
    return {
      product: {},
      currentImage: "",
      stockPhoto: "https://placehold.co/600x400",
    };
  },
  computed: {
    productImages() {
      return this.product.images && this.product.images.length > 0
        ? this.product.images
        : [this.stockPhoto]
    },
    productDetails() {
      return [
        { attribute: 'Image', description: this.product.images ? this.product.images[0] : 'No image available' },
        { attribute: 'Category', description: this.product.category?.category_name || 'N/A' },
        { attribute: 'Supplier', description: this.product.supplier?.supplier_name || 'N/A' },
        { attribute: 'Description', description: this.product.description || 'No description available' },
        { attribute: 'Tags', description: this.product.tags ? this.product.tags.join(', ') : 'N/A' }
      ];
    }
  },
  async created() {
    const productId = this.$route.params.id;
    try {
      const response = await ApiConnector.get(`/products/${productId}`);
      this.product = response.data;
    } catch (error) {
      console.error("Error fetching product details:", error);
      this.$message.error("Product not found.");
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1);  // Navigates back to the previous page
      // Alternatively, to route to a specific path:
      // this.$router.push('/ims'); 
    },
    copyShareableLink() {
      const link = `${window.location.origin}/ims/products/${this.product._id}`
      navigator.clipboard.writeText(link)
        .then(() => this.$message.success("Link copied to clipboard"))
        .catch(() => this.$message.error("Failed to copy link"));
    },
  },
};
</script>

<style scoped>
/* Back Button Style */
.back-button-container {
  width: 77%;
  margin: 20px auto 0;
  text-align: left;
}

.product-container {
  width: 80%;
  margin: auto;
  padding: 20px;
  background: #fff;
}

.product-details {
  display: flex;
  gap: 20px;
}

.product-images {
  flex: 1;
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.thumbnails {
  display: flex;
  margin-top: 10px;
}

.thumbnail {
  width: 60px;
  height: 60px;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 5px;
  transition: 0.3s;
}

.thumbnail:hover {
  transform: scale(1.1);
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 28px;
  font-weight: bold;
}

.product-price {
  font-size: 24px;
  color: #67C23A;
  font-weight: bold;
  margin-bottom: 10px;
}

.product-description {
  font-size: 16px;
  margin-bottom: 10px;
}

.product-meta p {
  margin: 5px 0;
}

.share-product {
  margin-top: 10px;
}
</style>
