<template>
  <div>    
    <el-button type="primary" @click="showAddItemModal = true">Add Item</el-button>

    <el-table :data="orderItems" style="width: 100%" empty-text="No items available">
      <el-table-column prop="product.product_name" label="Product Name"></el-table-column>
      <el-table-column prop="quantity" label="Quantity"></el-table-column>
      <el-table-column prop="price" label="Price"></el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <el-button @click="showEditItemModal(scope.row)">Edit</el-button>
          <el-button type="danger" @click="confirmDeleteItem(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Item Modal -->
    <el-dialog :visible.sync="showAddItemModal" title="Add Item to Order" width="50%">
      <el-form :model="newItemForm" label-width="120px">
        <el-form-item label="Product" required>
          <el-select v-model="newItemForm.product" placeholder="Select a product">
            <el-option v-for="product in products" :key="product._id" :label="product.product_name" :value="product._id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Quantity" required>
          <el-input-number v-model="newItemForm.quantity" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item label="Price" required>
          <el-input v-model="newItemForm.price" placeholder="Enter price per item" type="number" min="0"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addItem">Add Item</el-button>
          <el-button @click="resetNewItemForm">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Edit Item Modal -->
    <el-dialog :visible.sync="showEditItemModal" title="Edit Order Item" width="50%">
      <el-form :model="editItemForm" label-width="120px">
        <el-form-item label="Quantity">
          <el-input-number v-model="editItemForm.quantity" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item label="Price">
          <el-input v-model="editItemForm.price" placeholder="Enter price per item" type="number" min="0"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="updateItem">Save Changes</el-button>
          <el-button @click="resetEditItemForm">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import ApiConnector from '../../../../api/ApiConnector'

export default {
  props: {
    orderId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      orderItems: [],
      products: [],
      showAddItemModal: false,
      showEditItemModal: false,
      newItemForm: {
        product: "",
        quantity: 1,
        price: 0,
      },
      editItemForm: {
        _id: "",
        quantity: 1,
        price: 0,
      },
      error: ""
    };
  },
  methods: {
    // Fetch items for the order
    async fetchOrderItems() {
      try {
        const response = await ApiConnector.get(`/orders/${this.orderId}`);
        this.orderItems = response.data.items;
      } catch (e) {
        console.error("Error fetching order items:", e);
        this.$message.error("Failed to load order items");
      }
    },
    // Fetch products for selection
    async fetchProducts() {
      try {
        const response = await ApiConnector.get("/products");
        this.products = response.data;
      } catch (e) {
        console.error("Error fetching products:", e);
        this.$message.error("Failed to load products");
      }
    },
    // Add new item to the order
    async addItem() {
      if (!this.newItemForm.product || this.newItemForm.price <= 0) {
        this.$message.error("Please select a product and enter a valid price");
        return;
      }
      try {
        const payload = { 
          product: this.newItemForm.product,
          quantity: this.newItemForm.quantity,
          price: this.newItemForm.price,
        };
        await ApiConnector.post(`/orders/${this.orderId}/items`, payload);
        this.showAddItemModal = false;
        this.resetNewItemForm();
        this.fetchOrderItems(); // Refresh item list
        this.$message.success("Item added successfully");
      } catch (e) {
        console.error("Error adding item:", e);
        this.$message.error("Failed to add item");
      }
    },
    // Prepare to edit an item
    showEditItemModal(item) {
      this.editItemForm = { ...item };
      this.showEditItemModal = true;
    },
    // Update an existing item in the order
    async updateItem() {
      try {
        const payload = {
          quantity: this.editItemForm.quantity,
          price: this.editItemForm.price,
        };
        await ApiConnector.put(`/orders/${this.orderId}/items/${this.editItemForm._id}`, payload);
        this.showEditItemModal = false;
        this.resetEditItemForm();
        this.fetchOrderItems(); // Refresh item list
        this.$message.success("Item updated successfully");
      } catch (e) {
        console.error("Error updating item:", e);
        this.$message.error("Failed to update item");
      }
    },
    // Confirm deletion of an item
    confirmDeleteItem(item) {
      this.$confirm(`Are you sure you want to delete this item?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteItem(item._id);
        })
        .catch(() => {
          this.$message.info("Deletion canceled");
        });
    },
    // Delete an item from the order
    async deleteItem(itemId) {
      try {
        await ApiConnector.delete(`/orders/${this.orderId}/items/${itemId}`);
        this.fetchOrderItems(); // Refresh item list
        this.$message.success("Item deleted successfully");
      } catch (e) {
        console.error("Error deleting item:", e);
        this.$message.error("Failed to delete item");
      }
    },
    // Reset new item form
    resetNewItemForm() {
      this.newItemForm = {
        product: "",
        quantity: 1,
        price: 0,
      };
    },
    // Reset edit item form
    resetEditItemForm() {
      this.editItemForm = {
        _id: "",
        quantity: 1,
        price: 0,
      };
    },
  },
  created() {
    this.fetchOrderItems();
    this.fetchProducts();
  },
};
</script>
