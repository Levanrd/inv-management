<template>
  <div class="ims-page" v-loading="loading">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">Live snapshot</p>
        <h3>Production-ready visibility for inventory, orders, suppliers, and team activity.</h3>
        <p class="hero-copy">
          This route-based dashboard gives each area of the system room to grow while keeping the most important signals visible first.
        </p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="$router.push('/ims/products')">Manage inventory</el-button>
        <el-button @click="$router.push('/ims/orders')">Review orders</el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card" v-for="stat in summaryCards" :key="stat.label">
        <p>{{ stat.label }}</p>
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.caption }}</span>
      </article>
    </section>

    <section class="overview-grid">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Attention needed</p>
            <h3>Low stock products</h3>
          </div>
          <el-tag size="small" type="warning">{{ report.lowStockProducts.length }} items</el-tag>
        </div>
        <div v-if="report.lowStockProducts.length" class="stack-list">
          <div class="stack-row" v-for="product in report.lowStockProducts" :key="product._id">
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
            <p class="eyebrow">Recent activity</p>
            <h3>Latest orders</h3>
          </div>
        </div>
        <div v-if="report.recentOrders.length" class="stack-list">
          <div class="stack-row" v-for="order in report.recentOrders" :key="order._id">
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
            <p class="eyebrow">Order mix</p>
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
  </div>
</template>

<script>
import ApiConnector from '../../../api/ApiConnector'

export default {
  name: 'OverviewPage',
  data() {
    return {
      loading: false,
      report: {
        stats: {},
        lowStockProducts: [],
        recentOrders: [],
        orderStatusSummary: [],
      },
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.getRole === 'admin'
    },
    summaryCards() {
      return [
        { label: 'Products', value: this.report.stats.products || 0, caption: `${this.report.lowStockProducts.length} low stock` },
        { label: 'Orders', value: this.report.stats.orders || 0, caption: 'Current visible orders' },
        { label: 'Categories', value: this.report.stats.categories || 0, caption: 'Catalog structure' },
        { label: 'Suppliers', value: this.report.stats.suppliers || 0, caption: 'Active vendor records' },
      ].concat(this.isAdmin ? [{ label: 'Users', value: this.report.stats.users || 0, caption: 'Team access records' }] : [])
    },
    orderStatusCards() {
      const labels = { pending: 'Pending', completed: 'Completed', cancelled: 'Cancelled' }
      return (this.report.orderStatusSummary || []).map((item) => ({
        label: labels[item._id] || item._id,
        count: item.count,
        revenue: item.revenue,
      }))
    },
  },
  methods: {
    async refreshPage() {
      this.loading = true
      try {
        const response = await ApiConnector.get('/reports')
        this.report = response.data
      } catch (error) {
        this.$message.error(error.message || 'Failed to load overview data')
      } finally {
        this.loading = false
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
