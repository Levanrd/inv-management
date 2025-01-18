<template>
  <div>
    <el-button type="primary" @click="showOrderModal = true">Add Order</el-button>

    <el-table :data="orders" style="width: 100%" empty-text="No orders available">
      <el-table-column prop="user._id" label="User ID"></el-table-column>
      <el-table-column prop="_id" label="Order ID"></el-table-column>
      <el-table-column label="Order Items">
        <template slot-scope="scope">
          <div style="line-height: 1.5;">
            <span v-for="(item, index) in scope.row.order_items" :key="item._id" style="display: block; margin-bottom: 4px;">
              <strong>Item {{ index + 1 }}:</strong> Product ID: <span style="color: #409EFF;">{{ item.product }}</span>, 
              Price: <span style="color: #67C23A;">{{ item.price }}</span>, 
              Quantity: <span style="color: #E6A23C;">{{ item.quantity }}</span>
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="Total Amount">
        <template slot-scope="scope">
          <span style="font-weight: bold; color: #409EFF;">₱{{ scope.row.total_amount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <div style="display: flex; gap: 8px; align-items: center;">
            <el-select 
              v-model="scope.row.status" 
              placeholder="Update status" 
              size="small" 
              style="min-width: 120px;" 
              @change="updateOrderStatus(scope.row)">
              <el-option label="Pending" value="pending"></el-option>
              <el-option label="Completed" value="completed"></el-option>
              <el-option label="Cancelled" value="cancelled"></el-option>
            </el-select>
            <el-button 
              type="danger" 
              size="small" 
              icon="el-icon-delete" 
              @click="confirmDeleteOrder(scope.row)">
              Delete
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Order Modal -->
    <el-dialog :visible.sync="showOrderModal" title="Add Order" width="50%">
      <el-form :model="orderForm" label-width="120px">
        <el-form-item label="User*" required>
          <el-select v-model="orderForm.user" placeholder="Select a user">
            <el-option v-for="user in users" :key="user._id" :label="user.user_name" :value="user._id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Total Amount*" required>
          <el-input v-model="orderForm.total_amount" placeholder="Enter total amount" type="number" min="0"></el-input>
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="orderForm.status" placeholder="Select status">
            <el-option label="Pending" value="pending"></el-option>
            <el-option label="Completed" value="completed"></el-option>
            <el-option label="Cancelled" value="cancelled"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveOrder">Save Order</el-button>
          <el-button @click="resetOrderForm">Clear</el-button>
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
      orders: [],
      users: [],
      showOrderModal: false,
      orderForm: {
        user: "",
        status: "pending",
        total_amount: 0,
      },
      error: ""
    };
  },
  methods: {
    // Fetch orders from the API
    async fetchOrders() {
      try {
        const response = await ApiConnector.get("/orders");
        this.orders = response.data;
        console.log(this.orders);
      } catch (e) {
        console.error("Error fetching orders:", e);
        this.$message.error("Failed to load orders");
      }
    },
    // Fetch users for selecting user in new orders
    async fetchUsers() {
      try {
        const response = await ApiConnector.get("/users");
        this.users = response.data;
      } catch (e) {
        console.error("Error fetching users:", e);
        this.$message.error("Failed to load users");
      }
    },
    // Save a new order to the API
    async saveOrder() {
      if (!this.orderForm.user || this.orderForm.total_amount <= 0) {
        this.$message.error("Please select a user and enter a valid total amount");
        return;
      }
      try {
        const payload = { ...this.orderForm };
        await ApiConnector.post("/orders", payload);
        this.showOrderModal = false;
        this.resetOrderForm();
        this.fetchOrders(); // Refresh order list
        this.$message.success("Order added successfully");
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          this.error = e.response.data.error;
        } else {
          this.error = "An error occurred while adding the order";
        }
        this.$message.error(this.error);
      }
    },
    // Reset the order form
    resetOrderForm() {
      this.orderForm = {
        user: "",
        status: "pending",
        total_amount: 0,
      };
    },
    // Update the order status
    async updateOrderStatus(order) {
      try {
        await ApiConnector.put(`/orders/${order._id}`, { status: order.status });
        this.$message.success("Order status updated successfully");
      } catch (e) {
        console.error("Error updating order status:", e);
        this.$message.error("Failed to update order status");
      }
    },
    // Confirm order deletion with a dialog prompt
    confirmDeleteOrder(order) {
      this.$confirm(`Are you sure you want to delete this order?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteOrder(order._id);
        })
        .catch(() => {
          this.$message.info("Deletion canceled");
        });
    },
    // Delete order by ID
    async deleteOrder(orderId) {
      try {
        await ApiConnector.delete(`/orders/${orderId}`);
        this.fetchOrders(); // Refresh order list
        this.$message.success("Order deleted successfully");
      } catch (e) {
        console.error("Error deleting order:", e);
        this.$message.error("Failed to delete order");
      }
    },
  },
  created() {
    this.fetchOrders();
    this.fetchUsers();
  },
};
</script>
