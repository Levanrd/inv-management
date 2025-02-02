<template>
  <div>
    <!-- Toolbar -->
    <div class="toolbar" width="100%">
      <div style="display: flex; gap: 10px;">
        <el-form @submit.native.prevent="applyFilters" inline>
            <el-input 
            v-model="keyword" 
            placeholder="Search..." 
            class="input-with-select" 
            clearable 
            style="width: 200px;"
            @change="applyFilters"
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
          @change="applyFilters"
        >
        </el-date-picker>
        <el-select v-model="rowsPerPage" placeholder="Rows per page" style="width: 150px;">
          <el-option :value="5" label="5"></el-option>
          <el-option :value="10" label="10"></el-option>
          <el-option :value="20" label="20"></el-option>
          <el-option :value="50" label="50"></el-option>
          <el-option :value="100" label="100"></el-option>
        </el-select>
        <el-button 
          type="success" 
          icon="el-icon-refresh" 
          size="medium" 
          title="Refresh" 
          @click="init" 
          :loading="loading"
        ></el-button>
        <el-button 
          type="primary" 
          size="medium"
          @click="showProductModal = true"
          style="margin: 0;"
        >Add Product</el-button>
      </div>

      <div style="display: flex; gap: 10px;">
        <!-- Category Filter with Checkboxes -->
        <el-popover 
          placement="bottom" 
          trigger="click"
          width="200"
        >
          <el-checkbox-group v-model="filteredCategories" @change="applyFilters">
            <el-checkbox 
              v-for="category in categories" 
              :key="category._id" 
              :label="category._id"
            >
              {{ category.category_name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-button slot="reference" icon="el-icon-menu">Categories</el-button>
        </el-popover>

        <!-- Supplier Filter with Checkboxes -->
        <el-popover 
          placement="bottom" 
          trigger="click"
          width="200"
        >
          <el-checkbox-group v-model="filteredSuppliers" @change="applyFilters">
            <el-checkbox 
              v-for="supplier in suppliers" 
              :key="supplier._id" 
              :label="supplier._id"
            >
              {{ supplier.supplier_name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-button slot="reference" icon="el-icon-s-grid">Suppliers</el-button>
        </el-popover>

        <input
          type="file"
          ref="fileInput"
          style="display: none;"
          @change="handleProductsFileUpload"
        />
        <el-button 
          size="medium" 
          @click="triggerFileInput" 
          :loading="loading" 
          :disabled="loading"
          icon="el-icon-upload"
        >Upload</el-button>
        <el-button 
          size="medium" 
          @click="downloadProducts" 
          :loading="loading"
          :disabled="loading"
          icon="el-icon-download"
          style="margin: 0"
        >Download</el-button>
      </div>
    </div>
    
    <!-- Product Table -->
    <el-table 
      :data="paginatedData" 
      style="width: 100%"
      v-loading="loading"
      :disabled="loading"
      empty-text="No data available"
      @sort-change="handleSortChange"
    >
      <el-table-column 
        prop="product_name" 
        label="Product Name">
      </el-table-column>
      <el-table-column 
        prop="description" 
        label="Description">  
      </el-table-column>
      <el-table-column
        prop="price"
        label="Price"
        sortable="custom"
      >
        <template slot-scope="scope">
          <span style="color: #67C23A;">₱{{ scope.row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column 
        prop="stock_qty" 
        label="Stock Quantity" 
        sortable="custom"
      >
        <template slot-scope="scope">
          <span style="color: #E6A23C;">{{ scope.row.stock_qty }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="category.category_name"
        label="Category"
        sortable="custom"
      >
        <template slot-scope="scope">
          {{ scope.row.category.category_name }}
        </template>
      </el-table-column>
      <el-table-column 
        prop="supplier.supplier_name" 
        label="Supplier" 
        sortable="custom"
      >
        <template slot-scope="scope">
          {{ scope.row.supplier.supplier_name }}
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="300">
        <template slot-scope="scope">
          <el-button
            type="info" 
            icon="el-icon-view" 
            size="medium" 
            @click="viewProduct(scope.row._id)" 
            title="View">
          </el-button>
          <el-button 
            v-if="role === 'admin'"
            type="primary" 
            icon="el-icon-edit" 
            size="medium" 
            @click="editProduct(scope.row)" 
            title="Edit">
          </el-button>
          <el-button 
            type="warning" 
            icon="el-icon-share" 
            size="medium" 
            title="Share"
            @click="shareProduct(scope.row)">
          </el-button>
          <el-button 
            v-if="role === 'admin'"
            type="danger" 
            icon="el-icon-delete" 
            size="medium" 
            @click="confirmDeleteProduct(scope.row)" 
            title="Delete">
          </el-button>
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

    <!-- Edit Product Modal -->
    <el-dialog :visible.sync="editProductModal" @close="cancelEditProduct" title="Edit Product" width="50%">
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
            <el-option 
              v-for="category in categories" 
              :key="category._id" 
              :label="category.category_name" 
              :value="category._id">
            </el-option>
          </el-select>
          <p>{{ productForm.category.category_name }}</p>
        </el-form-item>
        <el-form-item label="Supplier*">
          <el-select v-model="productForm.supplier" placeholder="Select supplier">
            <el-option 
              v-for="supplier in suppliers" 
              :key="supplier._id" 
              :label="supplier.supplier_name" 
              :value="supplier._id">
            </el-option>
          </el-select>
          <p>{{ productForm.supplier.supplier_name }}</p>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveEditedProduct">Save</el-button>
          <el-button @click="editProductModal = false">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Share Link Modal -->
    <el-dialog :visible.sync="shareProductModal" title="Share with People on your team" width="40%">
      <el-input v-model="shareableLink" readonly></el-input>
      <el-button 
        style="margin: 5px 0;" 
        round
        size="mini"
        type="info"
        @click="copyShareableLink">Copy Link <i class="el-icon-link">
      </i></el-button>
    </el-dialog>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss">
@import "./style.scss";
</style>