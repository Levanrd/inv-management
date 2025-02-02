import ApiConnector from '../../../../api/ApiConnector'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      allProducts: [],
      searchProduct: [],
      categories: [],
      suppliers: [],
      filteredCategories: [],
      filteredSuppliers: [],
      showProductModal: false,
      editProductModal: false,
      shareProductModal: false,
      productForm: {
        product_name: "",
        description: "",
        price: 0,
        stock_qty: 0,
        category: "",
        supplier: "",
      },
      error: "",
      keyword: "",
      dateFilter: "",
      currentPage: 1,
      rowsPerPage: 5,
      loading: false,
      shareableLink: ''
    }
  },
  computed: {
    ...mapGetters(["getRole"]),
    role() {
      return this.getRole
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.rowsPerPage
      const end = start + this.rowsPerPage
      return this.searchProduct.slice(start, end)
    }
  },
  watch: {
    keyword(newVal) {
      if(!newVal) {
        // Fetch all products if keyword is empty
        this.searchProduct = [...this.allProducts]
        this.currentPage = 1
      }
    },
  },
  methods: {
    // Fetch products from the API
    async init() {
      try {
        this.loading = true;
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          ApiConnector.get("/products"),
          ApiConnector.get("/categories"),
          ApiConnector.get("/suppliers")
        ]);
    
        this.allProducts = productsRes.data;
        this.categories = categoriesRes.data;
        this.suppliers = suppliersRes.data;
    
        // By default, select all categories and suppliers
        this.filteredCategories = this.categories.map(cat => cat._id);
        this.filteredSuppliers = this.suppliers.map(supp => supp._id);
    
        // Apply filters to initialize the view
        this.applyFilters();
    
        this.loading = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        this.$message.error("Failed to load data");
        this.loading = false;
      }
    },

    applyFilters() {
      let filteredProducts = [...this.allProducts];

      // Filter by selected categories
      if (this.filteredCategories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          this.filteredCategories.includes(product.category._id)
        );
      } else {
        filteredProducts = []; // No categories selected, show no products
      }

      // Filter by selected suppliers
      if (this.filteredSuppliers.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          this.filteredSuppliers.includes(product.supplier._id)
        );
      } else {
        filteredProducts = []; // No suppliers selected, show no products
      }

      // Filter by date range
      if (this.dateFilter && this.dateFilter.length === 2) {
        const [startDate, endDate] = this.dateFilter.map(date => new Date(date));
        filteredProducts = filteredProducts.filter(product => {
          const productDate = new Date(product.createdAt);
          return productDate >= startDate && productDate <= endDate;
        });
      }

      // Filter by keyword
      if (this.keyword) {
        const keywordLower = this.keyword.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.product_name.toLowerCase().includes(keywordLower)
        );
      }

      this.searchProduct = filteredProducts;
      this.currentPage = 1; // Reset to the first page after filtering
    },

    // Fetch categories and suppliers for dropdowns
    async fetchCategoriesAndSuppliers() {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          ApiConnector.get("/categories"),
          ApiConnector.get("/suppliers"),
        ])
        this.categories = categoriesResponse.data
        this.suppliers = suppliersResponse.data
      } catch (e) {
        console.error("Error fetching categories or suppliers:", e)
        this.$message.error("Failed to load categories or suppliers")
      }
    },
    // Save a new product
    async saveProduct() {
      if (!this.productForm.product_name || !this.productForm.price || !this.productForm.stock_qty || !this.productForm.category || !this.productForm.supplier) {
        this.$message.error("Please fill out all required fields")
        return
      }
      try {
        const payload = { ...this.productForm }
        await ApiConnector.post("/products", payload)
        this.showProductModal = false
        this.resetProductForm()
        this.init() // Refresh product list
        this.$message.success("Product added successfully")
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          this.error = e.response.data.error
        } else {
          this.error = "An error occurred while adding the product"
        }
        this.$message.error(this.error)
      }
    },
    // Confirm product deletion with a dialog prompt
    confirmDeleteProduct(product) {
      this.$confirm(`Are you sure you want to delete ${product.product_name}?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteProduct(product._id)
        })
        .catch(() => {
          this.$message.info("Deletion canceled")
        })
    },
    // Delete product by ID
    async deleteProduct(productId) {
      try {
        await ApiConnector.delete(`/products/${productId}`)
        this.init() // Refresh product list
        this.$message.success("Product deleted successfully")
      } catch (e) {
        console.error("Error deleting product:", e)
        this.$message.error("Failed to delete product")
      }
    },
    // Reset the product form
    resetProductForm() {
      this.productForm = {
        product_name: "",
        description: "",
        price: 0,
        stock_qty: 0,
        category: "",
        supplier: "",
      }
    },
    // Filter products by keyword and date picked
    search() {
      const keyword = this.keyword.toLowerCase()

      // Filter products by keyword
      this.searchProduct = this.allProducts.filter((product) => {
        return product.product_name.toLowerCase().includes(keyword)
      })

      // Filter products by date range if dateFilter is selected
      if (this.dateFilter) {
        const [startDate, endDate] = this.dateFilter.map(date => new Date(date)) // Convert to Date objects
        this.searchProduct = this.searchProduct.filter(product => {
          const productDate = new Date(product.createdAt)
          return productDate >= startDate && productDate <= endDate
        })
      }
      
      this.currentPage = 1
    },

    viewProduct(id) {
      this.$router.push(`/ims/products/${id}`)
    },

    downloadProducts() {
      this.loading = true
      if(!this.allProducts.length) {
        this.$message.warning("No products available to download")
        this.loading = false
        return
      }

      try {
        // Transform data in excel format
        let data = this.allProducts.map((product) => ({
          product_name: product.product_name,
          description: product.description,
          price: product.price,
          stock_qty: product.stock_qty,
          category: product.category.category_name || 'N/A',
          supplier: product.supplier.supplier_name || 'N/A'
        }))

        // Create new workbook and worksheet
        let worksheet = XLSX.utils.json_to_sheet(data)
        let workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

        // Workbook to binary to create blob file
        let excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        let blob = new Blob([excelBuffer], { type: "application/octet-stream" })

        // File save to download the file
        saveAs(blob, "Products.xlsx")

        this.$message.success("Downloaded Successfully")
        this.loading = false
      } catch (e) {
        console.error("Error downloading products: ", error)
        this.$message.error("Failed to download products")
        this.loading = false
      }
    },

    triggerFileInput() {
      this.loading = true
      this.$refs.fileInput.click()

      setTimeout(() => {
        if (!this.$refs.fileInput.files.length) {
          this.loading = false
        }
      }, 500)
    },

    async handleProductsFileUpload(event) {
      if (!event.target.files || !event.target.files.length) {
        this.$message.warning("No file selected")
        this.loading = false
        return
      }

      try {
        let file = event.target.files[0]
        if(!file) {
          this.$message.warning("No file selected")
          this.loading = false
          return
        }

        let reader = new FileReader()

        reader.onload = async (e) => {
          let data = new Uint8Array(e.target.result)
          let workbook = XLSX.read(data, { type: "array"} )

          let firstSheetName = workbook.SheetNames[0]
          let worksheet = workbook.Sheets[firstSheetName]
          let products = XLSX.utils.sheet_to_json(worksheet)

          if (products) {
            let transformedProd = products.map(product => {
              let category = this.categories.find(cat => cat.category_name === product.category)
              let categoryId = category ? category._id : null

              let supplier = this.suppliers.find(supp => supp.supplier_name === product.supplier)
              let supplierId = supplier ? supplier._id : null

              if (!categoryId || !supplierId) {
                this.$message({
                  message: `Invalid Category or Supplier for product: ${product.product_name}`,
                  type: 'warning',
                  duration: 5000
                })
                return null
              }

              return {
                ...product,
                category: categoryId,
                supplier: supplierId
              }
            }).filter(product => product !== null)

            await this.productsUpload(transformedProd)
          }

        }

        reader.readAsArrayBuffer(file)
      } catch (e) {
        console.error("Error uploading file: ", e)
        this.$message.error("Failed to upload file")
      } finally {
        this.loading = false
        this.$refs.fileInput.value = null
      }
    },

    async productsUpload(products) {
      this.loading = true
      try {
        let response = await ApiConnector.post("/products/bulk-upload", products)
        this.$message.success(response.data.message)
        this.loading = false
        this.init()
      } catch (e) {
        console.error("Error uploading products: ", e)
        this.$message.error("Failed to upload products")
      }
    },

    async editProduct(product)  {
      this.productForm  =  { ...product,
        category: product.category._id || product.category,
        supplier: product.supplier._id || product.supplier
      }
      this.editProductModal = true
    },

    async saveEditedProduct() {
      try {
        this.loading = true
        let prodId = this.productForm._id

        let payload = {
          ...this.productForm,
          category: this.productForm.category,
          supplier: this.productForm.supplier
        }

        await ApiConnector.put(`/products/${prodId}`, payload)
        this.$message.success("Product updated successfully")
        this.editProductModal = false
        this.init()
      } catch (e) {
        console.error("Error updating product: ", e)
        this.$message.error("Failed to update product")
      } finally {
        this.loading = false
      }
    },

    async cancelEditProduct() {
      this.productForm = {
        product_name: "",
        description: "",
        price: 0,
        stock_qty: 0,
        category: "",
        supplier: "",
      }
      this.editProductModal = false
    },

    async shareProduct(product) {
      this.shareableLink = `${window.location.origin}/ims/products/${product._id}`
      this.shareProductModal = true
    },

    copyShareableLink() {
      navigator.clipboard.writeText(this.shareableLink).then(() => {
        this.$message.success("Link copied to clipboard")
      }).catch(() => {
        this.$message.error("Failed to copy link")
      })
    },

    // Handle sorting changes
    handleSortChange({ prop, order }) {
      if (!order) {
        // Reset to original data if no sort order
        this.searchProduct = [...this.allProducts]
        return
      }

      const sortOrder = order === 'ascending' ? 1 : -1

      // Custom sort logic for nested properties like category and supplier
      this.searchProduct.sort((a, b) => {
        let valA = prop.includes('.') ? this.getNestedValue(a, prop) : a[prop]
        let valB = prop.includes('.') ? this.getNestedValue(b, prop) : b[prop]

        if (typeof valA === 'string') valA = valA.toLowerCase()
        if (typeof valB === 'string') valB = valB.toLowerCase()

        if (valA < valB) return -1 * sortOrder
        if (valA > valB) return 1 * sortOrder
        return 0
      })
    },

    // Helper to get nested properties like category.category_name
    getNestedValue(obj, path) {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    },
  },

  mounted() {
    this.init()
    this.fetchCategoriesAndSuppliers()
  }
}