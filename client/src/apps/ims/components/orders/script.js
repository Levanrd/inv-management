import ApiConnector from '../../../../api/ApiConnector'

export default {
  data() {
    return {
      orders: [],
      users: [],
      products: [],
      productMap: {},
      searchOrder: [],
      showOrderModal: false,
      orderForm: {
        user: "",
        status: "pending",
        total_amount: 0,
        order_items: []
      },
      selectedProducts: {},
      error: "",
      keyword: "",
      dateFilter: "",
      currentPage: 1,
      rowsPerPage: 5,
      loading: false,
      productTablePage: 1,
      productRowsPerPage: 10
    };
  },
  computed: {
    tableData() {
      const start = (this.currentPage - 1) * this.rowsPerPage
      const end = start + this.rowsPerPage

      return this.searchOrder.slice(start, end)
    },
    paginatedProducts() {
      const start = (this.productTablePage - 1) * this.productRowsPerPage;
      const end = start + this.productRowsPerPage;
      return this.products.slice(start, end);
    },
    selectedProductList() {
      return Object.keys(this.selectedProducts)
        .filter(id => this.selectedProducts[id].checked)
        .map(id => ({
          name: this.products.find(p => p._id === id)?.product_name || "Unknown Product",
          price: this.selectedProducts[id].price,
          quantity: this.selectedProducts[id].quantity,
        }));
    }
  },
  watch: {
    keyword() {
      this.currentPage = 1
    }
  },
  methods: {
    // Fetch orders and users from the API
    async init() {
      try {
        this.loading = true
        const [orderRes, userRes, productRes] = await Promise.all([
          ApiConnector.get("/orders"),
          ApiConnector.get("/users"),
          ApiConnector.get("/products")
        ])

        this.orders = orderRes.data
        this.users = userRes.data
        this.products = productRes.data

        this.productMap = this.products.reduce((map, prod) => {
          map[prod._id] = prod.product_name
          return map
        }, {})

        this.orders.forEach(order => {
          order.order_items.forEach(item => {
            item.product_name = this.productMap[item.product] || "Unknown Product"
          })
        });

        this.applyFilters()
        this.loading = false

      } catch (e) {
        console.error("Error fetching orders: ", e)
        this.$message.error("Failed to load data")
        this.loading = false
      }
    },

    applyFilters() {
      let filteredOrders = [...this.orders]

      // Filter by keyword search
      if (this.keyword) {
        let keyword = this.keyword.toLowerCase()
        filteredOrders = filteredOrders.filter(order =>
          order.order_items.some(item =>
            (this.productMap[item.product] || "Unknown Product").toLowerCase().includes(keyword)
          )
        )
      }

      this.searchOrder = filteredOrders
      this.currentPage = 1
    },

    toggleProduct(productId, price) {
      if (!this.selectedProducts[productId]) {
        this.$set(this.selectedProducts, productId, { checked: true, quantity: 1, price });
      } else {
        this.selectedProducts[productId].checked = !this.selectedProducts[productId].checked;
        if (!this.selectedProducts[productId].checked) {
          this.selectedProducts[productId].quantity = 1; // Reset quantity if unchecked
        }
      }
      this.updateTotal();
    },
  
    updateTotal() {
      let total = 0;
      Object.keys(this.selectedProducts).forEach(id => {
        if (this.selectedProducts[id].checked) {
          total += Number(this.selectedProducts[id].quantity) * Number(this.selectedProducts[id].price);
        }
      });
      this.orderForm.total_amount = total;
    },    

    // Save a new order to the API
    async saveOrder() {
      if (!this.orderForm.user) {
        this.$message.error("Please select a user")
        return
      }

      let order_items = Object.keys(this.selectedProducts)
        .filter(productId => this.selectedProducts[productId].checked)
        .map(productId => {
          const quantity = Number(this.selectedProducts[productId].quantity);
          const price = Number(this.selectedProducts[productId].price);
          
          return {
            product: productId,
            quantity: quantity,
            price: price,
          };
        })

      let total_amount = order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      let payload = {
        user: this.orderForm.user,
        order_items: order_items,
        status: this.orderForm.status,
        total_amount
      }

      console.log(payload)
      try {
        await ApiConnector.post("/orders", payload);
        this.showOrderModal = false;
        this.resetOrderForm();
        this.init()
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
        order_items: []
      }
    },

    // Update the order status
    async updateOrderStatus(order) {
      try {
        await ApiConnector.put(`/orders/${order._id}`, { status: order.status })
        this.$message.success("Order status updated successfully")
      } catch (e) {
        console.error("Error updating order status:", e)
        this.$message.error(e.response.data.error)
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
          this.deleteOrder(order._id)
        })
        .catch(() => {
          this.$message.info("Deletion canceled")
        });
    },

    // Delete order and item order
    async deleteOrder(orderId) {
      try {
        let response = await ApiConnector.get(`/orders/${orderId}`)
        let order = response.data
        let orderItems = order.order_items || []

        if (orderItems.length > 0) {
          await Promise.all(
            orderItems.map((item) => {
              console.log(`/orderitems/${item._id}`)
              return ApiConnector.delete(`/orderitems/${item._id}`)
            })
          )
        }

        await ApiConnector.delete(`/orders/${orderId}`)

        this.init()
        this.$message.success("Order deleted successfully")
      } catch (e) {
        console.error("Error deleting order:", e)
        this.$message.error(e.response.data.error)
      }
    }
  },
  mounted() {
    this.init()
  },
}