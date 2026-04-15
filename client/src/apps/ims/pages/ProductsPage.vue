<template>
  <div class="ims-page">
    <section class="panel" v-loading="loading.page">
      <div class="panel-heading panel-heading--split">
        <div>
          <p class="eyebrow">Catalog</p>
          <h3>Inventory records</h3>
        </div>
        <div class="toolbar-cluster">
          <el-input v-model="filters.keyword" clearable placeholder="Search by name, SKU, or description" class="toolbar-search" />
          <el-select v-model="filters.category" clearable placeholder="Category">
            <el-option v-for="category in categories" :key="category._id" :label="category.category_name" :value="category._id" />
          </el-select>
          <el-select v-model="filters.supplier" clearable placeholder="Supplier">
            <el-option v-for="supplier in suppliers" :key="supplier._id" :label="supplier.supplier_name" :value="supplier._id" />
          </el-select>
          <el-button v-if="isAdmin" type="primary" @click="openDialog()">Add product</el-button>
        </div>
      </div>

      <el-table :data="filteredProducts" stripe>
        <el-table-column prop="sku" label="SKU" width="120">
          <template slot-scope="scope">{{ scope.row.sku || 'Auto' }}</template>
        </el-table-column>
        <el-table-column prop="product_name" label="Product" min-width="220" />
        <el-table-column prop="category.category_name" label="Category" min-width="150" />
        <el-table-column prop="supplier.supplier_name" label="Supplier" min-width="170" />
        <el-table-column label="Price" width="130">
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
        <el-table-column v-if="isAdmin" label="Actions" width="220">
          <template slot-scope="scope">
            <el-button size="mini" @click="openDialog(scope.row)">Edit</el-button>
            <el-button size="mini" type="danger" @click="removeProduct(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog :title="dialog.mode === 'create' ? 'Add product' : 'Edit product'" :visible.sync="dialog.visible" width="640px">
      <el-form :model="dialog.form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="SKU">
              <el-input v-model="dialog.form.sku" placeholder="Optional SKU" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="Product name">
              <el-input v-model="dialog.form.product_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Description">
          <el-input type="textarea" :rows="3" v-model="dialog.form.description" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Price">
              <el-input-number v-model="dialog.form.price" :min="0" :step="0.5" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Stock">
              <el-input-number v-model="dialog.form.stock_qty" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Category">
              <el-select v-model="dialog.form.category">
                <el-option v-for="category in categories" :key="category._id" :label="category.category_name" :value="category._id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Supplier">
          <el-select v-model="dialog.form.supplier">
            <el-option v-for="supplier in suppliers" :key="supplier._id" :label="supplier.supplier_name" :value="supplier._id" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialog.visible = false">Cancel</el-button>
        <el-button type="primary" :loading="loading.action" @click="submitProduct">Save</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ApiConnector from '../../../api/ApiConnector'

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

const extractItems = (response) => response.data.items || response.data

export default {
  name: 'ProductsPage',
  data() {
    return {
      loading: { page: false, action: false },
      products: [],
      categories: [],
      suppliers: [],
      filters: { keyword: '', category: '', supplier: '' },
      dialog: { visible: false, mode: 'create', form: emptyProduct() },
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.getRole === 'admin'
    },
    filteredProducts() {
      return this.products.filter((product) => {
        const keyword = this.filters.keyword.trim().toLowerCase()
        const matchesKeyword = !keyword || [product.product_name, product.sku, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword))
        const matchesCategory = !this.filters.category || product.category?._id === this.filters.category
        const matchesSupplier = !this.filters.supplier || product.supplier?._id === this.filters.supplier
        return matchesKeyword && matchesCategory && matchesSupplier
      })
    },
  },
  methods: {
    async refreshPage() {
      this.loading.page = true
      try {
        const [products, categories, suppliers] = await Promise.all([
          ApiConnector.get('/products', { params: { limit: 100 } }),
          ApiConnector.get('/categories', { params: { limit: 100 } }),
          ApiConnector.get('/suppliers', { params: { limit: 100 } }),
        ])
        this.products = extractItems(products)
        this.categories = extractItems(categories)
        this.suppliers = extractItems(suppliers)
      } catch (error) {
        this.$message.error(error.message || 'Failed to load product data')
      } finally {
        this.loading.page = false
      }
    },
    openDialog(product = null) {
      this.dialog.mode = product ? 'edit' : 'create'
      this.dialog.form = product
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
      this.dialog.visible = true
    },
    async submitProduct() {
      const form = this.dialog.form
      if (!form.product_name || !form.category || !form.supplier) {
        this.$message.error('Product name, category, and supplier are required')
        return
      }
      this.loading.action = true
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
        if (this.dialog.mode === 'create') {
          await ApiConnector.post('/products', payload)
        } else {
          await ApiConnector.put(`/products/${form._id}`, payload)
        }
        this.dialog.visible = false
        await this.refreshPage()
        this.$message.success(`Product ${this.dialog.mode === 'create' ? 'created' : 'updated'} successfully`)
      } catch (error) {
        this.$message.error(error.message || 'Unable to save product')
      } finally {
        this.loading.action = false
      }
    },
    async removeProduct(product) {
      try {
        await this.$confirm(`Delete ${product.product_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/products/${product._id}`)
        await this.refreshPage()
        this.$message.success('Product deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message || 'Unable to delete product')
        }
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
    },
    formatDate(value) {
      return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    },
  },
  mounted() {
    this.refreshPage()
  },
}
</script>
