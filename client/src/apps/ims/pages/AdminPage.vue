<template>
  <div class="ims-page">
    <section class="admin-grid" v-loading="loading.page">
      <article class="panel">
        <div class="panel-heading panel-heading--split">
          <div>
            <p class="eyebrow">Master data</p>
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
            <p class="eyebrow">Master data</p>
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
            <p class="eyebrow">Access control</p>
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

<script>
import ApiConnector from '../../../api/ApiConnector'

const extractItems = (response) => response.data.items || response.data
const emptyCategory = () => ({ _id: null, category_name: '', description: '' })
const emptySupplier = () => ({ _id: null, supplier_name: '', contact_info: { address: '', phone: '', email: '' } })
const emptyUser = () => ({ _id: null, user_name: '', first_name: '', last_name: '', email: '', password: '', role: 'user' })

export default {
  name: 'AdminPage',
  data() {
    return {
      loading: { page: false, categoryAction: false, supplierAction: false, userAction: false },
      categories: [],
      suppliers: [],
      users: [],
      categoryDialog: { visible: false, mode: 'create', form: emptyCategory() },
      supplierDialog: { visible: false, mode: 'create', form: emptySupplier() },
      userDialog: { visible: false, mode: 'create', form: emptyUser() },
    }
  },
  methods: {
    async refreshPage() {
      this.loading.page = true
      try {
        const [categories, suppliers, users] = await Promise.all([
          ApiConnector.get('/categories', { params: { limit: 100 } }),
          ApiConnector.get('/suppliers', { params: { limit: 100 } }),
          ApiConnector.get('/users', { params: { limit: 100 } }),
        ])
        this.categories = extractItems(categories)
        this.suppliers = extractItems(suppliers)
        this.users = extractItems(users)
      } catch (error) {
        this.$message.error(error.message || 'Failed to load admin data')
      } finally {
        this.loading.page = false
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
        await this.refreshPage()
        this.$message.success('Category saved successfully')
      } catch (error) {
        this.$message.error(error.message || 'Unable to save category')
      } finally {
        this.loading.categoryAction = false
      }
    },
    async removeCategory(category) {
      try {
        await this.$confirm(`Delete ${category.category_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/categories/${category._id}`)
        await this.refreshPage()
        this.$message.success('Category deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message || 'Unable to delete category')
        }
      }
    },
    openSupplierDialog(supplier = null) {
      this.supplierDialog.mode = supplier ? 'edit' : 'create'
      this.supplierDialog.form = supplier
        ? { _id: supplier._id, supplier_name: supplier.supplier_name, contact_info: { ...supplier.contact_info } }
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
        await this.refreshPage()
        this.$message.success('Supplier saved successfully')
      } catch (error) {
        this.$message.error(error.message || 'Unable to save supplier')
      } finally {
        this.loading.supplierAction = false
      }
    },
    async removeSupplier(supplier) {
      try {
        await this.$confirm(`Delete ${supplier.supplier_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/suppliers/${supplier._id}`)
        await this.refreshPage()
        this.$message.success('Supplier deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message || 'Unable to delete supplier')
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
        await this.refreshPage()
        this.$message.success('User saved successfully')
      } catch (error) {
        this.$message.error(error.message || 'Unable to save user')
      } finally {
        this.loading.userAction = false
      }
    },
    async removeUser(user) {
      try {
        await this.$confirm(`Delete ${user.user_name}?`, 'Confirm deletion', { type: 'warning' })
        await ApiConnector.delete(`/users/${user._id}`)
        await this.refreshPage()
        this.$message.success('User deleted successfully')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message || 'Unable to delete user')
        }
      }
    },
  },
  mounted() {
    this.refreshPage()
  },
}
</script>
