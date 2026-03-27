import ApiConnector from '../../api/ApiConnector'

const emptyProduct = () => ({
  _id: null,
  sku: '',
  product_name: '',
  description: '',
  price: 0,
  stock_qty: 0,
  category: '',
  supplier: '',
})

const emptyCategory = () => ({
  _id: null,
  category_name: '',
  description: '',
})

const emptySupplier = () => ({
  _id: null,
  supplier_name: '',
  contact_info: {
    address: '',
    phone: '',
    email: '',
  },
})

const emptyUser = () => ({
  _id: null,
  user_name: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'user',
})

const emptyOrder = () => ({
  user: '',
  order_items: [{ product: '', quantity: 1 }],
})

const extractItems = (response) => response.data.items || response.data

export default {
  name: 'ImsDashboard',
  data() {
    return {
      activeTab: 'overview',
      currentUser: null,
      report: {
        stats: {},
        lowStockProducts: [],
        recentOrders: [],
        orderStatusSummary: [],
      },
      products: [],
      categories: [],
      suppliers: [],
      orders: [],
      users: [],
      filters: {
        productSearch: '',
        category: '',
        supplier: '',
        orderStatus: '',
      },
      loading: {
        page: false,
        productAction: false,
        orderAction: false,
        categoryAction: false,
        supplierAction: false,
        userAction: false,
      },
      productDialog: {
        visible: false,
        mode: 'create',
        form: emptyProduct(),
      },
      orderDialog: {
        visible: false,
        form: emptyOrder(),
      },
      categoryDialog: {
        visible: false,
        mode: 'create',
        form: emptyCategory(),
      },
      supplierDialog: {
        visible: false,
        mode: 'create',
        form: emptySupplier(),
      },
      userDialog: {
        visible: false,
        mode: 'create',
        form: emptyUser(),
      },
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.getRole === 'admin'
    },
    currentUserLabel() {
      return this.currentUser?.user_name || this.$store.getters.getUserName || 'Operator'
    },
    roleLabel() {
      return this.isAdmin ? 'Administrator' : 'Standard user'
    },
    userInitials() {
      const label = this.currentUserLabel || 'OP'
      return label.slice(0, 2).toUpperCase()
    },
    summaryCards() {
      return [
        {
          label: 'Products',
          value: this.report.stats.products || 0,
          caption: `${this.lowStockProducts.length} low stock`,
        },
        {
          label: 'Orders',
          value: this.report.stats.orders || 0,
          caption: `${this.filteredOrders.length} visible`,
        },
        {
          label: 'Categories',
          value: this.report.stats.categories || 0,
          caption: 'Catalog structure',
        },
        {
          label: 'Suppliers',
          value: this.report.stats.suppliers || 0,
          caption: 'Active vendor records',
        },
      ].concat(
        this.isAdmin
          ? [{
              label: 'Users',
              value: this.report.stats.users || 0,
              caption: 'Team access records',
            }]
          : []
      )
    },
    lowStockProducts() {
      return this.report.lowStockProducts || []
    },
    recentOrders() {
      return this.report.recentOrders || []
    },
    orderStatusCards() {
      const labels = {
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
      }
      return (this.report.orderStatusSummary || []).map((item) => ({
        label: labels[item._id] || item._id,
        count: item.count,
        revenue: item.revenue,
      }))
    },
    filteredProducts() {
      return this.products.filter((product) => {
        const keyword = this.filters.productSearch.trim().toLowerCase()
        const matchesKeyword = !keyword || [product.product_name, product.sku, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword))
        const matchesCategory = !this.filters.category || product.category?._id === this.filters.category
        const matchesSupplier = !this.filters.supplier || product.supplier?._id === this.filters.supplier
        return matchesKeyword && matchesCategory && matchesSupplier
      })
    },
    filteredOrders() {
      return this.orders.filter((order) => !this.filters.orderStatus || order.status === this.filters.orderStatus)
    },
    usersForOrders() {
      if (this.isAdmin) {
        return this.users
      }
      return this.currentUser ? [this.currentUser] : []
    },
    orderDraftTotal() {
      return this.orderDialog.form.order_items.reduce((sum, item) => {
        const product = this.products.find((entry) => entry._id === item.product)
        if (!product) {
          return sum
        }
        return sum + Number(product.price) * Number(item.quantity || 0)
      }, 0)
    },
  },
  methods: {
    async refreshAll() {
      this.loading.page = true
      try {
        const requests = [
          ApiConnector.get('/auth/me'),
          ApiConnector.get('/reports'),
          ApiConnector.get('/products', { params: { limit: 100 } }),
          ApiConnector.get('/categories', { params: { limit: 100 } }),
          ApiConnector.get('/suppliers', { params: { limit: 100 } }),
          ApiConnector.get('/orders', { params: { limit: 100 } }),
        ]

        if (this.isAdmin) {
          requests.push(ApiConnector.get('/users', { params: { limit: 100 } }))
        }

        const responses = await Promise.all(requests)
        const [me, report, products, categories, suppliers, orders, users] = responses

        this.currentUser = me.data
        this.report = report.data
        this.products = extractItems(products)
        this.categories = extractItems(categories)
        this.suppliers = extractItems(suppliers)
        this.orders = extractItems(orders)
        this.users = this.isAdmin ? extractItems(users) : [me.data]

        if (!this.orderDialog.form.user) {
          this.orderDialog.form.user = this.isAdmin ? (this.users[0]?._id || '') : me.data._id
        }
      } catch (error) {
        this.notifyError(error, 'Failed to load dashboard data')
      } finally {
        this.loading.page = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(Number(value || 0))
    },
    formatDate(value) {
      if (!value) {
        return 'N/A'
      }
      return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    },
    orderStatusType(status) {
      if (status === 'completed') return 'success'
      if (status === 'cancelled') return 'danger'
      return 'warning'
    },
    notifyError(error, fallback) {
      const message = error?.message || error?.response?.data?.error || fallback
      this.$message.error(message)
    },
    async logout() {
      try {
        await ApiConnector.post('/auth/logout')
      } catch (error) {
        console.error(error)
      } finally {
        this.$store.dispatch('logout')
        this.$router.push('/login')
      }
    },
    openProductDialog(product = null) {
      this.productDialog.mode = product ? 'edit' : 'create'
      this.productDialog.form = product
        ? {
            _id: product._id,
            sku: product.sku || '',
            product_name: product.product_name,
            description: product.description || '',
            price: product.price,
            stock_qty: product.stock_qty,
            category: product.category?._id || '',
            supplier: product.supplier?._id || '',
          }
        : emptyProduct()
      this.productDialog.visible = true
    },
    async submitProduct() {
      const form = this.productDialog.form
      if (!form.product_name || !form.category || !form.supplier) {
        this.$message.error('Product name, category, and supplier are required')
        return
      }

      this.loading.productAction = true
      try {
        const payload = {
          sku: form.sku || undefined,
          product_name: form.product_name.trim(),
          description: form.description?.trim() || '',
          price: Number(form.price),
          stock_qty: Number(form.stock_qty),
          category: form.category,
          supplier: form.supplier,
        }

        if (this.productDialog.mode === 'create') {
          await ApiConnector.post('/products', payload)
        } else {
          await ApiConnector.put(`/products/${form._id}`, payload)
        }

        this.productDialog.visible = false
        await this.refreshAll()
        this.$message.success(`Product ${this.productDialog.mode === 'create' ? 'created' : 'updated'} successfully`)
      } catch (error) {
        this.notifyError(error, 'Unable to save product')
      } finally {
        this.loading.productAction = false
      }
    },
    async removeProduct(product) {
      try {
        await this.$confirm(`Delete ${product.product_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/products/${product._id}`)
        await this.refreshAll()
        this.$message.success('Product deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.notifyError(error, 'Unable to delete product')
        }
      }
    },
    openOrderDialog() {
      this.orderDialog.visible = true
      this.orderDialog.form = emptyOrder()
      this.orderDialog.form.user = this.isAdmin ? (this.users[0]?._id || '') : (this.currentUser?._id || '')
    },
    addOrderItem() {
      this.orderDialog.form.order_items.push({ product: '', quantity: 1 })
    },
    removeOrderItem(index) {
      this.orderDialog.form.order_items.splice(index, 1)
    },
    async submitOrder() {
      if (!this.orderDialog.form.user) {
        this.$message.error('Please select a user for this order')
        return
      }

      const hasInvalidItem = this.orderDialog.form.order_items.some((item) => !item.product || !item.quantity)
      if (hasInvalidItem) {
        this.$message.error('Each order item needs a product and quantity')
        return
      }

      this.loading.orderAction = true
      try {
        await ApiConnector.post('/orders', {
          user: this.orderDialog.form.user,
          order_items: this.orderDialog.form.order_items.map((item) => ({
            product: item.product,
            quantity: Number(item.quantity),
          })),
        })

        this.orderDialog.visible = false
        await this.refreshAll()
        this.$message.success('Order created successfully')
      } catch (error) {
        this.notifyError(error, 'Unable to create order')
      } finally {
        this.loading.orderAction = false
      }
    },
    async updateOrderStatus(order, status) {
      try {
        await ApiConnector.put(`/orders/${order._id}`, { status })
        await this.refreshAll()
        this.$message.success('Order updated successfully')
      } catch (error) {
        this.notifyError(error, 'Unable to update order')
      }
    },
    async removeOrder(order) {
      try {
        await this.$confirm(`Delete order ${order._id}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/orders/${order._id}`)
        await this.refreshAll()
        this.$message.success('Order deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.notifyError(error, 'Unable to delete order')
        }
      }
    },
    openCategoryDialog(category = null) {
      this.categoryDialog.mode = category ? 'edit' : 'create'
      this.categoryDialog.form = category ? { ...category } : emptyCategory()
      this.categoryDialog.visible = true
    },
    async submitCategory() {
      this.loading.categoryAction = true
      try {
        const payload = {
          category_name: this.categoryDialog.form.category_name.trim(),
          description: this.categoryDialog.form.description?.trim() || '',
        }
        if (this.categoryDialog.mode === 'create') {
          await ApiConnector.post('/categories', payload)
        } else {
          await ApiConnector.put(`/categories/${this.categoryDialog.form._id}`, payload)
        }
        this.categoryDialog.visible = false
        await this.refreshAll()
        this.$message.success('Category saved successfully')
      } catch (error) {
        this.notifyError(error, 'Unable to save category')
      } finally {
        this.loading.categoryAction = false
      }
    },
    async removeCategory(category) {
      try {
        await this.$confirm(`Delete ${category.category_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/categories/${category._id}`)
        await this.refreshAll()
        this.$message.success('Category deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.notifyError(error, 'Unable to delete category')
        }
      }
    },
    openSupplierDialog(supplier = null) {
      this.supplierDialog.mode = supplier ? 'edit' : 'create'
      this.supplierDialog.form = supplier
        ? {
            _id: supplier._id,
            supplier_name: supplier.supplier_name,
            contact_info: { ...supplier.contact_info },
          }
        : emptySupplier()
      this.supplierDialog.visible = true
    },
    async submitSupplier() {
      this.loading.supplierAction = true
      try {
        const payload = {
          supplier_name: this.supplierDialog.form.supplier_name.trim(),
          contact_info: {
            address: this.supplierDialog.form.contact_info.address.trim(),
            phone: this.supplierDialog.form.contact_info.phone.trim(),
            email: this.supplierDialog.form.contact_info.email.trim(),
          },
        }
        if (this.supplierDialog.mode === 'create') {
          await ApiConnector.post('/suppliers', payload)
        } else {
          await ApiConnector.put(`/suppliers/${this.supplierDialog.form._id}`, payload)
        }
        this.supplierDialog.visible = false
        await this.refreshAll()
        this.$message.success('Supplier saved successfully')
      } catch (error) {
        this.notifyError(error, 'Unable to save supplier')
      } finally {
        this.loading.supplierAction = false
      }
    },
    async removeSupplier(supplier) {
      try {
        await this.$confirm(`Delete ${supplier.supplier_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/suppliers/${supplier._id}`)
        await this.refreshAll()
        this.$message.success('Supplier deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.notifyError(error, 'Unable to delete supplier')
        }
      }
    },
    openUserDialog(user = null) {
      this.userDialog.mode = user ? 'edit' : 'create'
      this.userDialog.form = user
        ? {
            _id: user._id,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            password: '',
            role: user.role,
          }
        : emptyUser()
      this.userDialog.visible = true
    },
    async submitUser() {
      this.loading.userAction = true
      try {
        const payload = {
          user_name: this.userDialog.form.user_name.trim(),
          first_name: this.userDialog.form.first_name.trim(),
          last_name: this.userDialog.form.last_name.trim(),
          email: this.userDialog.form.email.trim(),
          role: this.userDialog.form.role,
        }

        if (this.userDialog.form.password) {
          payload.password = this.userDialog.form.password
        }

        if (this.userDialog.mode === 'create') {
          if (!payload.password) {
            this.$message.error('Password is required for new users')
            this.loading.userAction = false
            return
          }
          await ApiConnector.post('/users', payload)
        } else {
          await ApiConnector.put(`/users/${this.userDialog.form._id}`, payload)
        }

        this.userDialog.visible = false
        await this.refreshAll()
        this.$message.success('User saved successfully')
      } catch (error) {
        this.notifyError(error, 'Unable to save user')
      } finally {
        this.loading.userAction = false
      }
    },
    async removeUser(user) {
      try {
        await this.$confirm(`Delete ${user.user_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/users/${user._id}`)
        await this.refreshAll()
        this.$message.success('User deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.notifyError(error, 'Unable to delete user')
        }
      }
    },
  },
  mounted() {
    this.refreshAll()
  },
}
