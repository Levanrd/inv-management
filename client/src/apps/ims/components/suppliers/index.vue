<template>
  <div>
    <el-button type="primary" @click="showSupplierModal = true">Add Supplier</el-button>
    
    <el-table :data="suppliers" style="width: 100%" empty-text="No data available">
      <el-table-column prop="supplier_name" label="Supplier Name"></el-table-column>
      <el-table-column prop="contact_info.address" label="Address"></el-table-column>
      <el-table-column prop="contact_info.phone" label="Phone"></el-table-column>
      <el-table-column prop="contact_info.email" label="Email"></el-table-column>
      <el-table-column label="Actions">
        <template slot-scope="scope">
          <el-button type="danger" @click="confirmDeleteSupplier(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Supplier Modal -->
    <el-dialog :visible.sync="showSupplierModal" title="Add Supplier" width="50%">
      <el-form :model="supplierForm" label-width="120px">
        <el-form-item label="Supplier Name*">
          <el-input v-model="supplierForm.supplier_name" placeholder="Enter supplier name"></el-input>
        </el-form-item>
        <el-form-item label="Address*">
          <el-input v-model="supplierForm.contact_info.address" placeholder="Enter address"></el-input>
        </el-form-item>
        <el-form-item label="Phone*">
          <el-input v-model="supplierForm.contact_info.phone" placeholder="Enter phone"></el-input>
        </el-form-item>
        <el-form-item label="Email*">
          <el-input v-model="supplierForm.contact_info.email" placeholder="Enter email"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSupplier">Save</el-button>
          <el-button @click="resetSupplierForm">Clear</el-button>
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
      suppliers: [],
      showSupplierModal: false,
      supplierForm: {
        supplier_name: "",
        contact_info: {
          address: "",
          phone: "",
          email: "",
        },
      },
      error: ""
    };
  },
  methods: {
    // Fetch suppliers from the API
    async fetchSuppliers() {
      try {
        const response = await ApiConnector.get("/suppliers");
        this.suppliers = response.data;
      } catch (e) {
        console.error("Error fetching suppliers:", e);
        this.$message.error("Failed to load suppliers");
      }
    },
    // Save a new supplier to the API
    async saveSupplier() {
      if (!this.supplierForm.supplier_name || !this.supplierForm.contact_info.address || !this.supplierForm.contact_info.phone || !this.supplierForm.contact_info.email) {
        this.$message.error("Please fill out all required fields");
        return;
      }
      try {
        const payload = { ...this.supplierForm };
        await ApiConnector.post("/suppliers", payload);
        this.showSupplierModal = false;
        this.resetSupplierForm();
        this.fetchSuppliers(); // Refresh supplier list
        this.$message.success("Supplier added successfully");
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          this.error = e.response.data.error;
        } else {
          this.error = "An error occurred while adding the supplier";
        }
        this.$message.error(this.error);
      }
    },
    // Confirm supplier deletion with a dialog prompt
    confirmDeleteSupplier(supplier) {
      this.$confirm(`Are you sure you want to delete ${supplier.supplier_name}?`, "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.deleteSupplier(supplier._id);
        })
        .catch(() => {
          this.$message.info("Deletion canceled");
        });
    },
    // Delete supplier by ID
    async deleteSupplier(supplierId) {
      try {
        await ApiConnector.delete(`/suppliers/${supplierId}`);
        this.fetchSuppliers(); // Refresh supplier list
        this.$message.success("Supplier deleted successfully");
      } catch (e) {
        console.error("Error deleting supplier:", e);
        this.$message.error("Failed to delete supplier");
      }
    },
    // Reset the supplier form
    resetSupplierForm() {
      this.supplierForm = {
        supplier_name: "",
        contact_info: {
          address: "",
          phone: "",
          email: "",
        },
      };
    },
  },
  created() {
    this.fetchSuppliers();
  },
};
</script>
