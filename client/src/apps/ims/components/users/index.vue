<template>
  <div>
    <el-button type="primary" @click="showUserModal = true">Add User</el-button>
    
    <el-table :data="users" style="width: 100%">
      <el-table-column prop="user_name" label="Username"></el-table-column>
      <el-table-column prop="first_name" label="First Name"></el-table-column>
      <el-table-column prop="last_name" label="Last Name"></el-table-column>
      <el-table-column prop="email" label="Email"></el-table-column>
      <el-table-column prop="role" label="Role"></el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <el-button type="danger" @click="confirmDeleteUser(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add User Modal -->
    <el-dialog :visible.sync="showUserModal" title="Add User" width="50%">
      <el-form :model="userForm" label-width="120px">
        <el-form-item label="Username*">
          <el-input v-model="userForm.user_name" placeholder="Enter username"></el-input>
        </el-form-item>
        <el-form-item label="First Name*">
          <el-input v-model="userForm.first_name" placeholder="Enter first name"></el-input>
        </el-form-item>
        <el-form-item label="Last Name*">
          <el-input v-model="userForm.last_name" placeholder="Enter last name"></el-input>
        </el-form-item>
        <el-form-item label="Email*">
          <el-input v-model="userForm.email" placeholder="Enter email"></el-input>
        </el-form-item>
        <el-form-item label="Password*">
          <el-input v-model="userForm.password" placeholder="Enter password" type="password"></el-input>
        </el-form-item>
        <el-form-item label="Role*">
          <el-select v-model="userForm.role" placeholder="Select role">
            <el-option label="Admin" value="admin"></el-option>
            <el-option label="User" value="user"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveUser">Save</el-button>
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
      users: [],
      showUserModal: false,
      userForm: {
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "user", // default role
      },
      error: ''
    }
  },
  methods: {
    // Fetch users from the API
    async fetchUsers() {
      try {
        const response = await ApiConnector.get("/users")
        this.users = response.data
      } catch (e) {
        console.error("Error fetching users:", e)
      }
    },
    // Save a new user to the API
    async saveUser() {
      try {
        const payload = {
          user_name: this.userForm.user_name,
          first_name: this.userForm.first_name,
          last_name: this.userForm.last_name,
          email: this.userForm.email,
          password: this.userForm.password,
          role: this.userForm.role,
        }
        await ApiConnector.post("/users", payload)
        this.showUserModal = false
        this.userForm = { user_name: "", first_name: "", last_name: "", email: "", password: "", role: "user" }
        this.fetchUsers() // Refresh user list
        this.$message.success("User added successfully")
      } catch (e) {
        if (e) {
          this.error = e.response.data.error
          this.$message.error(this.error)
        }
      }
    },
    // Confirm user deletion with a dialog prompt
    confirmDeleteUser(user) {
      this.$confirm(`Are you sure you want to delete ${user.user_name}?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteUser(user._id)
        })
        .catch(() => {
          this.$message.info("Deletion canceled")
        })
    },
    // Delete user by ID
    async deleteUser(userId) {
      try {
        await ApiConnector.delete(`/users/${userId}`)
        this.fetchUsers() // Refresh user list
        this.$message.success("User deleted successfully")
      } catch (e) {
        console.error("Error deleting user:", e)
        this.$message.error("Failed to delete user")
      }
    },
  },
  created() {
    this.fetchUsers()
  },
}
</script>
