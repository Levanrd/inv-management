<template>
  <div>
    <h2>Category Management</h2>
    <el-button type="primary" @click="showCategoryModal = true">Add Category</el-button>
    
    <el-table :data="categories" style="width: 100%" empty-text="No data available">
      <el-table-column prop="category_name" label="Category Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <el-button type="danger" @click="confirmDeleteCategory(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Category Modal -->
    <el-dialog :visible.sync="showCategoryModal" title="Add Category" width="50%">
      <el-form :model="categoryForm" label-width="120px">
        <el-form-item label="Category Name*">
          <el-input v-model="categoryForm.category_name" placeholder="Enter category name"></el-input>
        </el-form-item>
        <el-form-item label="Description">
          <el-input type="textarea" v-model="categoryForm.description" placeholder="Enter description"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveCategory">Save</el-button>
          <el-button @click="resetCategoryForm">Clear</el-button>
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
      categories: [],
      showCategoryModal: false,
      categoryForm: {
        category_name: "",
        description: "",
      },
      error: ""
    };
  },
  methods: {
    // Fetch categories from the API
    async fetchCategories() {
      try {
        const response = await ApiConnector.get("/categories");
        this.categories = response.data;
      } catch (e) {
        console.error("Error fetching categories:", e);
        this.$message.error("Failed to load categories");
      }
    },
    // Save a new category to the API
    async saveCategory() {
      if (!this.categoryForm.category_name) {
        this.$message.error("Category name is required");
        return;
      }
      try {
        const payload = { ...this.categoryForm };
        await ApiConnector.post("/categories", payload);
        this.showCategoryModal = false;
        this.resetCategoryForm();
        this.fetchCategories(); // Refresh category list
        this.$message.success("Category added successfully");
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          this.error = e.response.data.error;
        } else {
          this.error = "An error occurred while adding the category";
        }
        this.$message.error(this.error);
      }
    },
    // Confirm category deletion with a dialog prompt
    confirmDeleteCategory(category) {
      this.$confirm(`Are you sure you want to delete ${category.category_name}?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteCategory(category._id);
        })
        .catch(() => {
          this.$message.info("Deletion canceled");
        });
    },
    // Delete category by ID
    async deleteCategory(categoryId) {
      try {
        await ApiConnector.delete(`/categories/${categoryId}`);
        this.fetchCategories(); // Refresh category list
        this.$message.success("Category deleted successfully");
      } catch (e) {
        console.error("Error deleting category:", e);
        this.$message.error("Failed to delete category");
      }
    },
    // Reset the category form
    resetCategoryForm() {
      this.categoryForm = {
        category_name: "",
        description: "",
      };
    },
  },
  created() {
    this.fetchCategories();
  },
};
</script>
