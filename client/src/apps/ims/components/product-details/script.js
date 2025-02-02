import ApiConnector from "../../../../api/ApiConnector"

export default {
  components: {
    Navbar: () => import('../navbar/navbar.vue')
  },
  data() {
    return {
      product: {},
      currentImage: "",
      stockPhoto: "https://placehold.co/600x400",
    }
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
      ]
    }
  },
  async created() {
    const productId = this.$route.params.id
    try {
      const response = await ApiConnector.get(`/products/${productId}`)
      this.product = response.data
    } catch (error) {
      console.error("Error fetching product details:", error)
      this.$message.error("Product not found.")
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)  // Navigates back to the previous page
      // Alternatively, to route to a specific path:
      // this.$router.push('/ims') 
    },
    copyShareableLink() {
      const link = `${window.location.origin}/ims/products/${this.product._id}`
      navigator.clipboard.writeText(link)
        .then(() => this.$message.success("Link copied to clipboard"))
        .catch(() => this.$message.error("Failed to copy link"))
    },
  },
}