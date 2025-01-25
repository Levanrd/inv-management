<template>
  <div>
    <!-- Toolbar -->
    <div class="toolbar" width="100%">
      <div style="display: flex; gap: 10px;">
        <el-form @submit.native.prevent="search" inline>
            <el-input 
            v-model="keyword" 
            placeholder="Search..." 
            class="input-with-select" 
            clearable 
            style="width: 200px;"
            @change="search"
            >
          </el-input>
        </el-form>
        <el-date-picker
          v-model="dateFilter"
          type="daterange"
          start-placeholder="Start Date"
          end-placeholder="End Date"
          align="right"
          unlink-panels
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          @change="search"
        >
        </el-date-picker>
        <el-select v-model="rowsPerPage" placeholder="Rows per page" style="width: 150px;">
          <el-option :value="5" label="5"></el-option>
          <el-option :value="10" label="10"></el-option>
          <el-option :value="20" label="20"></el-option>
          <el-option :value="50" label="50"></el-option>
          <el-option :value="100" label="100"></el-option>
        </el-select>
        <el-button type="success" icon="el-icon-refresh" size="medium" title="Refresh" @click="init" :loading="loading"> </el-button>
        <el-button type="primary" size="medium" @click="showProductModal = true"> Add Product</el-button>
      </div>
      <div>
        <el-button type="primary" size="medium">Upload <i class="el-icon-upload el-icon-right"></i></el-button>
        <el-button type="primary" size="medium">Download <i class="el-icon-download el-icon-right"></i></el-button>
      </div>
    </div>
    
    <!-- Product Table -->
    <el-table 
      :data="paginatedData" 
      style="width: 100%"
      v-loading="loading"
      empty-text="No data available"
    >
      <el-table-column prop="product_name" label="Product Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column label="Price">
        <template slot-scope="scope">
          <span style="color: #67C23A;">₱{{ scope.row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Stock Quantity">
        <template slot-scope="scope">
          <span style="color: #E6A23C;">{{ scope.row.stock_qty }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Category">
        <template slot-scope="scope">
          {{ scope.row.category.category_name }}
        </template>
      </el-table-column>
      <el-table-column label="Supplier">
        <template slot-scope="scope">
          {{ scope.row.supplier.supplier_name }}
        </template>
      </el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <!-- <el-button type="danger" @click="confirmDeleteProduct(scope.row)">Delete</el-button> -->
          <el-button type="primary" icon="el-icon-edit" size="medium"></el-button>
          <el-button type="primary" icon="el-icon-share" size="medium"></el-button>
          <el-button type="primary" icon="el-icon-delete" size="medium" @click="confirmDeleteProduct(scope.row)"></el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :page-size="rowsPerPage"
        :total="searchProduct.length"
        @current-change="currentPage = $event"
      ></el-pagination>
    </div>

    <!-- Add Product Modal -->
    <el-dialog :visible.sync="showProductModal" title="Add Product" width="50%">
      <el-form :model="productForm" label-width="120px">
        <el-form-item label="Product Name*">
          <el-input v-model="productForm.product_name" placeholder="Enter product name"></el-input>
        </el-form-item>
        <el-form-item label="Description">
          <el-input type="textarea" v-model="productForm.description" placeholder="Enter description"></el-input>
        </el-form-item>
        <el-form-item label="Price*">
          <el-input v-model="productForm.price" placeholder="Enter price" type="number"></el-input>
        </el-form-item>
        <el-form-item label="Stock Quantity*">
          <el-input v-model="productForm.stock_qty" placeholder="Enter stock quantity" type="number"></el-input>
        </el-form-item>
        <el-form-item label="Category*">
          <el-select v-model="productForm.category" placeholder="Select category">
            <el-option v-for="category in categories" :key="category._id" :label="category.category_name" :value="category._id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Supplier*">
          <el-select v-model="productForm.supplier" placeholder="Select supplier">
            <el-option v-for="supplier in suppliers" :key="supplier._id" :label="supplier.supplier_name" :value="supplier._id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProduct">Save</el-button>
          <el-button @click="resetProductForm">Clear</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import ApiConnector from '../../../../api/ApiConnector'

export default {
  data() {
    return {
      allProducts: [],
      searchProduct: [],
      categories: [],
      suppliers: [],
      showProductModal: false,
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
      loading: false
    };
  },
  computed: {
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
        this.loading = true
        this.keyword = ""
        this.dateFilter = ""
        const response = await ApiConnector.get("/products")
        this.allProducts = response.data
        this.searchProduct = [...this.allProducts]
        this.loading = false
      } catch (e) {
        console.error("Error fetching products:", e)
        this.$message.error("Failed to load products")
      }
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
        const [startDate, endDate] = this.dateFilter.map(date => new Date(date)); // Convert to Date objects
        this.searchProduct = this.searchProduct.filter(product => {
          const productDate = new Date(product.createdAt);
          return productDate >= startDate && productDate <= endDate;
        });
      }
      
      this.currentPage = 1
    },
  },

  mounted() {
    this.init()
    this.fetchCategoriesAndSuppliers()
  },
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  /* /* margin-bottom:12px;  */
  padding:12px;
  background-color: #f7f7f7;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding:12px;
  margin-bottom:12px; 
}

</style>