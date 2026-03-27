<template>
  <div class="ims-shell">
    <header class="ims-header">
      <div>
        <p class="eyebrow">Operations Console</p>
        <h1>Inventory Management System</h1>
        <p class="header-copy">Track stock, fulfill orders, and keep your catalog healthy from one place.</p>
      </div>

      <div class="header-actions">
        <div class="identity-card">
          <span class="identity-avatar">{{ userInitials }}</span>
          <div>
            <strong>{{ currentUserLabel }}</strong>
            <p>{{ roleLabel }}</p>
          </div>
        </div>
        <el-button plain @click="refreshAll" :loading="loading.page">Refresh</el-button>
        <el-button type="danger" @click="logout">Logout</el-button>
      </div>
    </header>

    <main class="ims-main" v-loading="loading.page">
      <section class="hero-panel">
        <div>
          <p class="hero-kicker">Live snapshot</p>
          <h2>Production-ready visibility for inventory, orders, suppliers, and team activity.</h2>
          <p class="hero-copy">
            The dashboard highlights stock risk, recent order volume, and the setup records that usually cause operational drift.
          </p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" @click="activeTab = 'products'">Manage inventory</el-button>
          <el-button @click="openOrderDialog">Create order</el-button>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card" v-for="stat in summaryCards" :key="stat.label">
          <p>{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.caption }}</span>
        </article>
      </section>

      <el-tabs v-model="activeTab" stretch class="ims-tabs">
        <el-tab-pane label="Overview" name="overview">
          <section class="overview-grid">
            <article class="panel">
              <div class="panel-heading">
                <div>
                  <p class="panel-kicker">Attention needed</p>
                  <h3>Low stock products</h3>
                </div>
                <el-tag size="small" type="warning">{{ lowStockProducts.length }} items</el-tag>
              </div>

              <div v-if="lowStockProducts.length" class="stack-list">
                <div class="stack-row" v-for="product in lowStockProducts" :key="product._id">
                  <div>
                    <strong>{{ product.product_name }}</strong>
                    <p>{{ product.category && product.category.category_name }} · {{ product.supplier && product.supplier.supplier_name }}</p>
                  </div>
                  <el-tag :type="product.stock_qty <= 5 ? 'danger' : 'warning'">{{ product.stock_qty }} left</el-tag>
                </div>
              </div>
              <el-empty v-else description="No low stock products"></el-empty>
            </article>

            <article class="panel">
              <div class="panel-heading">
                <div>
                  <p class="panel-kicker">Recent activity</p>
                  <h3>Latest orders</h3>
                </div>
              </div>

              <div v-if="recentOrders.length" class="stack-list">
                <div class="stack-row" v-for="order in recentOrders" :key="order._id">
                  <div>
                    <strong>{{ order.user && order.user.user_name }}</strong>
                    <p>{{ formatDate(order.createdAt) }} · {{ order.order_items.length }} items</p>
                  </div>
                  <div class="stack-row-right">
                    <el-tag size="small" :type="orderStatusType(order.status)">{{ order.status }}</el-tag>
                    <strong>{{ formatCurrency(order.total_amount) }}</strong>
                  </div>
                </div>
              </div>
              <el-empty v-else description="No recent orders"></el-empty>
            </article>

            <article class="panel span-two">
              <div class="panel-heading">
                <div>
                  <p class="panel-kicker">Order mix</p>
                  <h3>Status summary</h3>
                </div>
              </div>

              <div class="status-summary" v-if="orderStatusCards.length">
                <div class="status-pill" v-for="item in orderStatusCards" :key="item.label">
                  <div>
                    <strong>{{ item.label }}</strong>
                    <p>{{ item.count }} orders</p>
                  </div>
                  <span>{{ formatCurrency(item.revenue) }}</span>
                </div>
              </div>
              <el-empty v-else description="No order data yet"></el-empty>
            </article>
          </section>
        </el-tab-pane>

        <el-tab-pane label="Products" name="products">
          <section class="panel">
            <div class="panel-heading panel-heading--split">
              <div>
                <p class="panel-kicker">Catalog</p>
                <h3>Inventory records</h3>
              </div>

              <div class="toolbar-cluster">
                <el-input
                  v-model="filters.productSearch"
                  clearable
                  placeholder="Search by name, SKU, or description"
                  class="toolbar-search"
                />
                <el-select v-model="filters.category" clearable placeholder="Category">
                  <el-option
                    v-for="category in categories"
                    :key="category._id"
                    :label="category.category_name"
                    :value="category._id"
                  />
                </el-select>
                <el-select v-model="filters.supplier" clearable placeholder="Supplier">
                  <el-option
                    v-for="supplier in suppliers"
                    :key="supplier._id"
                    :label="supplier.supplier_name"
                    :value="supplier._id"
                  />
                </el-select>
                <el-button type="primary" @click="openProductDialog()" v-if="isAdmin">Add product</el-button>
              </div>
            </div>

            <el-table :data="filteredProducts" stripe>
              <el-table-column prop="sku" label="SKU" width="120">
                <template slot-scope="scope">
                  <span>{{ scope.row.sku || 'Auto' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="product_name" label="Product" min-width="220" />
              <el-table-column prop="category.category_name" label="Category" min-width="150" />
              <el-table-column prop="supplier.supplier_name" label="Supplier" min-width="170" />
              <el-table-column label="Price" width="120">
                <template slot-scope="scope">{{ formatCurrency(scope.row.price) }}</template>
              </el-table-column>
              <el-table-column label="Stock" width="120">
                <template slot-scope="scope">
                  <el-tag size="small" :type="scope.row.stock_qty <= 5 ? 'danger' : (scope.row.stock_qty <= 10 ? 'warning' : 'success')">
                    {{ scope.row.stock_qty }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Updated" width="150">
                <template slot-scope="scope">{{ formatDate(scope.row.updatedAt) }}</template>
              </el-table-column>
              <el-table-column label="Actions" width="220" v-if="isAdmin">
                <template slot-scope="scope">
                  <el-button size="mini" @click="openProductDialog(scope.row)">Edit</el-button>
                  <el-button size="mini" type="danger" @click="removeProduct(scope.row)">Delete</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane label="Orders" name="orders">
          <section class="panel">
            <div class="panel-heading panel-heading--split">
              <div>
                <p class="panel-kicker">Fulfillment</p>
                <h3>Orders</h3>
              </div>
              <div class="toolbar-cluster">
                <el-select v-model="filters.orderStatus" clearable placeholder="Status">
                  <el-option label="Pending" value="pending" />
                  <el-option label="Completed" value="completed" />
                  <el-option label="Cancelled" value="cancelled" />
                </el-select>
                <el-button type="primary" @click="openOrderDialog">New order</el-button>
              </div>
            </div>

            <el-table :data="filteredOrders" stripe>
              <el-table-column label="Placed by" min-width="180">
                <template slot-scope="scope">
                  <div>
                    <strong>{{ scope.row.user && scope.row.user.user_name }}</strong>
                    <p>{{ scope.row.user && scope.row.user.email }}</p>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Items" min-width="260">
                <template slot-scope="scope">
                  <div class="order-item-list">
                    <span v-for="item in scope.row.order_items" :key="item._id || item.product">
                      {{ item.productSnapshot.product_name }} × {{ item.quantity }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Total" width="140">
                <template slot-scope="scope">{{ formatCurrency(scope.row.total_amount) }}</template>
              </el-table-column>
              <el-table-column label="Status" width="130">
                <template slot-scope="scope">
                  <el-tag :type="orderStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Created" width="140">
                <template slot-scope="scope">{{ formatDate(scope.row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="Actions" width="220" v-if="isAdmin">
                <template slot-scope="scope">
                  <el-dropdown trigger="click" @command="(status) => updateOrderStatus(scope.row, status)">
                    <el-button size="mini">
                      Update status<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="pending">Pending</el-dropdown-item>
                      <el-dropdown-item command="completed">Completed</el-dropdown-item>
                      <el-dropdown-item command="cancelled">Cancelled</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <el-button size="mini" type="danger" @click="removeOrder(scope.row)">Delete</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane label="Admin Setup" name="admin" v-if="isAdmin">
          <section class="admin-grid">
            <article class="panel">
              <div class="panel-heading panel-heading--split">
                <div>
                  <p class="panel-kicker">Master data</p>
                  <h3>Categories</h3>
                </div>
                <el-button size="small" type="primary" @click="openCategoryDialog()">Add category</el-button>
              </div>
              <el-table :data="categories" stripe>
                <el-table-column prop="category_name" label="Category" />
                <el-table-column prop="description" label="Description" />
                <el-table-column label="Actions" width="180">
                  <template slot-scope="scope">
                    <el-button size="mini" @click="openCategoryDialog(scope.row)">Edit</el-button>
                    <el-button size="mini" type="danger" @click="removeCategory(scope.row)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </article>

            <article class="panel">
              <div class="panel-heading panel-heading--split">
                <div>
                  <p class="panel-kicker">Master data</p>
                  <h3>Suppliers</h3>
                </div>
                <el-button size="small" type="primary" @click="openSupplierDialog()">Add supplier</el-button>
              </div>
              <el-table :data="suppliers" stripe>
                <el-table-column prop="supplier_name" label="Supplier" />
                <el-table-column prop="contact_info.email" label="Email" />
                <el-table-column prop="contact_info.phone" label="Phone" />
                <el-table-column label="Actions" width="180">
                  <template slot-scope="scope">
                    <el-button size="mini" @click="openSupplierDialog(scope.row)">Edit</el-button>
                    <el-button size="mini" type="danger" @click="removeSupplier(scope.row)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </article>

            <article class="panel span-two">
              <div class="panel-heading panel-heading--split">
                <div>
                  <p class="panel-kicker">Access control</p>
                  <h3>Team members</h3>
                </div>
                <el-button size="small" type="primary" @click="openUserDialog()">Add user</el-button>
              </div>
              <el-table :data="users" stripe>
                <el-table-column prop="user_name" label="Username" />
                <el-table-column prop="first_name" label="First name" />
                <el-table-column prop="last_name" label="Last name" />
                <el-table-column prop="email" label="Email" />
                <el-table-column label="Role" width="120">
                  <template slot-scope="scope">
                    <el-tag size="small" :type="scope.row.role === 'admin' ? 'danger' : 'info'">{{ scope.row.role }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="180">
                  <template slot-scope="scope">
                    <el-button size="mini" @click="openUserDialog(scope.row)">Edit</el-button>
                    <el-button size="mini" type="danger" @click="removeUser(scope.row)">Delete</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </article>
          </section>
        </el-tab-pane>
      </el-tabs>
    </main>

    <el-dialog :title="productDialog.mode === 'create' ? 'Add product' : 'Edit product'" :visible.sync="productDialog.visible" width="640px">
      <el-form :model="productDialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="SKU">
              <el-input v-model="productDialog.form.sku" placeholder="Optional SKU" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="Product name">
              <el-input v-model="productDialog.form.product_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Description">
          <el-input type="textarea" :rows="3" v-model="productDialog.form.description" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Price">
              <el-input-number v-model="productDialog.form.price" :min="0" :step="0.5" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Stock">
              <el-input-number v-model="productDialog.form.stock_qty" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Category">
              <el-select v-model="productDialog.form.category" placeholder="Select category">
                <el-option v-for="category in categories" :key="category._id" :label="category.category_name" :value="category._id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Supplier">
          <el-select v-model="productDialog.form.supplier" placeholder="Select supplier">
            <el-option v-for="supplier in suppliers" :key="supplier._id" :label="supplier.supplier_name" :value="supplier._id" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="productDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.productAction" @click="submitProduct">Save</el-button>
      </span>
    </el-dialog>

    <el-dialog title="Create order" :visible.sync="orderDialog.visible" width="760px">
      <el-form :model="orderDialog.form" label-position="top">
        <el-form-item label="User">
          <el-select v-model="orderDialog.form.user" :disabled="!isAdmin" filterable>
            <el-option v-for="user in usersForOrders" :key="user._id" :label="`${user.user_name} (${user.email})`" :value="user._id" />
          </el-select>
        </el-form-item>

        <div class="order-builder">
          <div class="order-builder-row" v-for="(item, index) in orderDialog.form.order_items" :key="`${item.product}-${index}`">
            <el-select v-model="item.product" filterable placeholder="Product">
              <el-option v-for="product in products" :key="product._id" :label="`${product.product_name} (${product.stock_qty} in stock)`" :value="product._id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" />
            <el-button icon="el-icon-delete" circle @click="removeOrderItem(index)" :disabled="orderDialog.form.order_items.length === 1" />
          </div>
        </div>

        <div class="dialog-inline-actions">
          <el-button plain @click="addOrderItem">Add line item</el-button>
          <el-tag type="success">Estimated total: {{ formatCurrency(orderDraftTotal) }}</el-tag>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="orderDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.orderAction" @click="submitOrder">Create order</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="categoryDialog.mode === 'create' ? 'Add category' : 'Edit category'" :visible.sync="categoryDialog.visible" width="520px">
      <el-form :model="categoryDialog.form" label-position="top">
        <el-form-item label="Category name">
          <el-input v-model="categoryDialog.form.category_name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input type="textarea" :rows="3" v-model="categoryDialog.form.description" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="categoryDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.categoryAction" @click="submitCategory">Save</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="supplierDialog.mode === 'create' ? 'Add supplier' : 'Edit supplier'" :visible.sync="supplierDialog.visible" width="560px">
      <el-form :model="supplierDialog.form" label-position="top">
        <el-form-item label="Supplier name">
          <el-input v-model="supplierDialog.form.supplier_name" />
        </el-form-item>
        <el-form-item label="Address">
          <el-input v-model="supplierDialog.form.contact_info.address" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Phone">
              <el-input v-model="supplierDialog.form.contact_info.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email">
              <el-input v-model="supplierDialog.form.contact_info.email" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer">
        <el-button @click="supplierDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.supplierAction" @click="submitSupplier">Save</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="userDialog.mode === 'create' ? 'Add user' : 'Edit user'" :visible.sync="userDialog.visible" width="620px">
      <el-form :model="userDialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Username">
              <el-input v-model="userDialog.form.user_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email">
              <el-input v-model="userDialog.form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="First name">
              <el-input v-model="userDialog.form.first_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Last name">
              <el-input v-model="userDialog.form.last_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Role">
              <el-select v-model="userDialog.form.role">
                <el-option label="User" value="user" />
                <el-option label="Admin" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="userDialog.mode === 'create' ? 'Password' : 'Password (optional)'">
              <el-input v-model="userDialog.form.password" type="password" show-password />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer">
        <el-button @click="userDialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.userAction" @click="submitUser">Save</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script src="./script.js"></script>

<style lang="scss" src="./style.scss"></style>
