<template>
  <div>
    <el-button type="primary" @click="showProductModal = true">Add Product</el-button>
    
    <el-table :data="products" style="width: 100%" empty-text="No data available">
      <el-table-column prop="product_name" label="Product Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column prop="price" label="Price"></el-table-column>
      <el-table-column prop="stock_qty" label="Stock Quantity"></el-table-column>
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
          <el-button type="danger" @click="confirmDeleteProduct(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

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
      products: [],
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
      error: ""
    };
  },
  methods: {
    // Fetch products from the API
    async fetchProducts() {
      try {
        const response = await ApiConnector.get("/products");
        this.products = response.data;
      } catch (e) {
        console.error("Error fetching products:", e);
        this.$message.error("Failed to load products");
      }
    },
    // Fetch categories and suppliers for dropdowns
    async fetchCategoriesAndSuppliers() {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          ApiConnector.get("/categories"),
          ApiConnector.get("/suppliers"),
        ]);
        this.categories = categoriesResponse.data;
        this.suppliers = suppliersResponse.data;
      } catch (e) {
        console.error("Error fetching categories or suppliers:", e);
        this.$message.error("Failed to load categories or suppliers");
      }
    },
    // Save a new product to the API
    async saveProduct() {
      if (!this.productForm.product_name || !this.productForm.price || !this.productForm.stock_qty || !this.productForm.category || !this.productForm.supplier) {
        this.$message.error("Please fill out all required fields");
        return;
      }
      try {
        const payload = { ...this.productForm };
        await ApiConnector.post("/products", payload);
        this.showProductModal = false;
        this.resetProductForm();
        this.fetchProducts(); // Refresh product list
        this.$message.success("Product added successfully");
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          this.error = e.response.data.error;
        } else {
          this.error = "An error occurred while adding the product";
        }
        this.$message.error(this.error);
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
          this.deleteProduct(product._id);
        })
        .catch(() => {
          this.$message.info("Deletion canceled");
        });
    },
    // Delete product by ID
    async deleteProduct(productId) {
      try {
        await ApiConnector.delete(`/products/${productId}`);
        this.fetchProducts(); // Refresh product list
        this.$message.success("Product deleted successfully");
      } catch (e) {
        console.error("Error deleting product:", e);
        this.$message.error("Failed to delete product");
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
      };
    },
  },
  created() {
    this.fetchProducts();
    this.fetchCategoriesAndSuppliers();
  },
};
</script>
