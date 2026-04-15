<template>
  <div class="ims-page">
    <section class="panel" v-loading="loading.page">
      <div class="panel-heading panel-heading--split">
        <div>
          <p class="eyebrow">Fulfillment</p>
          <h3>Orders</h3>
        </div>
        <div class="toolbar-cluster">
          <el-select v-model="filters.status" clearable placeholder="Status">
            <el-option label="Pending" value="pending" />
            <el-option label="Completed" value="completed" />
            <el-option label="Cancelled" value="cancelled" />
          </el-select>
          <el-button type="primary" @click="openDialog">New order</el-button>
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
                {{ item.productSnapshot.product_name }} x {{ item.quantity }}
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
        <el-table-column v-if="isAdmin" label="Actions" width="220">
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

    <el-dialog title="Create order" :visible.sync="dialog.visible" width="760px">
      <el-form :model="dialog.form" label-position="top">
        <el-form-item label="User">
          <el-select v-model="dialog.form.user" :disabled="!isAdmin" filterable>
            <el-option v-for="user in usersForOrders" :key="user._id" :label="`${user.user_name} (${user.email})`" :value="user._id" />
          </el-select>
        </el-form-item>

        <div class="order-builder">
          <div class="order-builder-row" v-for="(item, index) in dialog.form.order_items" :key="`${item.product}-${index}`">
            <el-select v-model="item.product" filterable placeholder="Product">
              <el-option v-for="product in products" :key="product._id" :label="`${product.product_name} (${product.stock_qty} in stock)`" :value="product._id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" />
            <el-button icon="el-icon-delete" circle @click="removeOrderItem(index)" :disabled="dialog.form.order_items.length === 1" />
          </div>
        </div>

        <div class="dialog-inline-actions">
          <el-button plain @click="addOrderItem">Add line item</el-button>
          <el-tag type="success">Estimated total: {{ formatCurrency(orderDraftTotal) }}</el-tag>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="dialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.action" @click="submitOrder">Create order</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ApiConnector from '../../../api/ApiConnector'

const extractItems = (response) => response.data.items || response.data
const emptyOrder = () => ({ user: '', order_items: [{ product: '', quantity: 1 }] })

export default {
  name: 'OrdersPage',
  data() {
    return {
      loading: { page: false, action: false },
      orders: [],
      products: [],
      users: [],
      filters: { status: '' },
      dialog: { visible: false, form: emptyOrder() },
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.getRole === 'admin'
    },
    filteredOrders() {
      return this.orders.filter((order) => !this.filters.status || order.status === this.filters.status)
    },
    usersForOrders() {
      return this.isAdmin ? this.users : this.users.slice(0, 1)
    },
    orderDraftTotal() {
      return this.dialog.form.order_items.reduce((sum, item) => {
        const product = this.products.find((entry) => entry._id === item.product)
        return product ? sum + Number(product.price) * Number(item.quantity || 0) : sum
      }, 0)
    },
  },
  methods: {
    async refreshPage() {
      this.loading.page = true
      try {
        const requests = [
          ApiConnector.get('/auth/me'),
          ApiConnector.get('/orders', { params: { limit: 100 } }),
          ApiConnector.get('/products', { params: { limit: 100 } }),
        ]
        if (this.isAdmin) {
          requests.push(ApiConnector.get('/users', { params: { limit: 100 } }))
        }
        const responses = await Promise.all(requests)
        const [me, orders, products, users] = responses
        this.orders = extractItems(orders)
        this.products = extractItems(products)
        this.users = this.isAdmin ? extractItems(users) : [me.data]
      } catch (error) {
        this.$message.error(error.message || 'Failed to load order data')
      } finally {
        this.loading.page = false
      }
    },
    openDialog() {
      this.dialog.visible = true
      this.dialog.form = emptyOrder()
      this.dialog.form.user = this.usersForOrders[0]?._id || ''
    },
    addOrderItem() {
      this.dialog.form.order_items.push({ product: '', quantity: 1 })
    },
    removeOrderItem(index) {
      this.dialog.form.order_items.splice(index, 1)
    },
    async submitOrder() {
      if (!this.dialog.form.user) {
        this.$message.error('Please select a user for this order')
        return
      }
      if (this.dialog.form.order_items.some((item) => !item.product || !item.quantity)) {
        this.$message.error('Each order item needs a product and quantity')
        return
      }
      this.loading.action = true
      try {
        await ApiConnector.post('/orders', {
          user: this.dialog.form.user,
          order_items: this.dialog.form.order_items.map((item) => ({
            product: item.product,
            quantity: Number(item.quantity),
          })),
        })
        this.dialog.visible = false
        await this.refreshPage()
        this.$message.success('Order created successfully')
      } catch (error) {
        this.$message.error(error.message || 'Unable to create order')
      } finally {
        this.loading.action = false
      }
    },
    async updateOrderStatus(order, status) {
      try {
        await ApiConnector.put(`/orders/${order._id}`, { status })
        await this.refreshPage()
        this.$message.success('Order updated successfully')
      } catch (error) {
        this.$message.error(error.message || 'Unable to update order')
      }
    },
    async removeOrder(order) {
      try {
        await this.$confirm(`Delete order ${order._id}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/orders/${order._id}`)
        await this.refreshPage()
        this.$message.success('Order deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message || 'Unable to delete order')
        }
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
    },
    formatDate(value) {
      return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    },
    orderStatusType(status) {
      if (status === 'completed') return 'success'
      if (status === 'cancelled') return 'danger'
      return 'warning'
    },
  },
  mounted() {
    this.refreshPage()
  },
}
</script>
