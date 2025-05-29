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
        <!-- <el-date-picker
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
        </el-select> -->
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
          @click="showOrderModal = true"
          style="margin: 0;"
        >Add Order</el-button>
      </div>

      <div style="display: flex; gap: 10px;">
        <!-- <input
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
        >Download</el-button> -->
      </div>
    </div>

    <!-- Order Table -->
    <el-table
      :data="tableData"
      style="width: 100%"
      v-loading="loading"
      :disabled="loading"
      empty-text="No data available"
    >
      <el-table-column type="expand">
        <template slot-scope="scope">
          <span>
            <h3 style="margin: 20px;">{{ scope.row.order_items.length > 1 ? 'Order Items' : 'Order Item' }}</h3>
          </span>
          <el-table 
            :data="scope.row.order_items" 
            style="width: 80%; margin: 20px; align-self: center;" 
            border
          >
            <el-table-column 
              prop="product" 
              label="Product ID"
            >
              <template slot-scope="item">
                <span style="color: #409EFF;">{{ item.row.product }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="product_name"
              label="Product Name"
            >
              <template slot-scope="item">
                <span>{{ productMap[item.row.product] || 'Unknown Product'}}</span>
              </template>
            </el-table-column>
            
            <el-table-column 
              prop="price" 
              label="Price"
            >
              <template slot-scope="item">
                <span style="color: #67C23A;">₱{{ item.row.price }}</span>
              </template>
            </el-table-column>
            
            <el-table-column 
              prop="quantity" 
              label="Quantity"
            >
              <template slot-scope="item">
                <span style="color: #E6A23C;">{{ item.row.quantity }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>

      <el-table-column prop="user" label="User">
        <template slot-scope="scope">
          {{ scope.row.user.first_name }} {{ scope.row.user.last_name }}
        </template>
      </el-table-column>
      <el-table-column prop="_id" label="Order ID" ></el-table-column>
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

    <!-- Pagination -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :page-size="rowsPerPage"
        :total="searchOrder.length"
        @current-change="currentPage = $event"
      ></el-pagination>
    </div>

    <!-- Add Order Modal -->
    <el-dialog :visible.sync="showOrderModal" title="Add Order" width="50%">
      <el-form :model="orderForm" label-width="120px">
        <el-form-item label="User" required>
          <el-select v-model="orderForm.user" placeholder="Select a user">
            <el-option style="text-transform: capitalize;" v-for="user in users" :key="user._id" :label="user.user_name" :value="user._id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Select Products" required>
          <el-table 
            :data="paginatedProducts" 
            border 
            max-height="300px"
            style="width: 100%"
          >
            <!-- Checkbox Column -->
            <el-table-column label="Select">
              <template slot-scope="{ row }">
                <el-checkbox 
                  :value="selectedProducts[row._id] ? selectedProducts[row._id].checked : false"
                  @change="toggleProduct(row._id, row.price)">
                  {{ row.product_name }} - ₱{{ row.price }}
                </el-checkbox>
              </template>
            </el-table-column>

            <!-- Quantity Input Column -->
            <el-table-column label="Quantity">
              <template slot-scope="{ row }">
                <el-input
                  v-if="selectedProducts[row._id] && selectedProducts[row._id].checked"
                  type="number"
                  v-model.number="selectedProducts[row._id].quantity"
                  min="1"
                  @input="updateTotal()"
                />
              </template>
            </el-table-column>
          </el-table>

          <!-- Pagination -->
          <el-pagination
            background
            layout="prev, pager, next"
            :page-size="productRowsPerPage"
            :total="products.length"
            @current-change="productTablePage = $event"
          />
        </el-form-item>

        <el-form-item>
          <div v-if="selectedProductList.length">
            <div v-for="(product, index) in selectedProductList" :key="index">
              <span>
                {{ product.name }} - ₱{{ product.price }} x {{ product.quantity }}
              </span>
            </div>
            <hr />
          </div>
        </el-form-item>
        <el-form-item label="Total Amount">
          <span style="font-weight: bold; color: #409EFF;">₱{{ orderForm.total_amount }}</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveOrder">Save Order</el-button>
          <el-button @click="resetOrderForm">Clear</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss">
@import "./style.scss";
</style>