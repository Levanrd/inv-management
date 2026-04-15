import Vue from "vue"
import Router from "vue-router"
import Login from "../components/login"
import Register from "../components/register"
import Ims from "../apps/ims/app.vue"
import OverviewPage from "../apps/ims/pages/OverviewPage.vue"
import ProductsPage from "../apps/ims/pages/ProductsPage.vue"
import OrdersPage from "../apps/ims/pages/OrdersPage.vue"
import AdminPage from "../apps/ims/pages/AdminPage.vue"
import store from "../store"

Vue.use(Router)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/ims',
    component: Ims,
    meta: { requiresAuth: true },
    redirect: '/ims/overview',
    children: [
      {
        path: 'overview',
        name: 'ImsOverview',
        component: OverviewPage,
        meta: {
          requiresAuth: true,
          section: 'Workspace',
          title: 'Inventory Management System',
          subtitle: 'Track stock, fulfill orders, and keep your catalog healthy from one place.',
        },
      },
      {
        path: 'products',
        name: 'ImsProducts',
        component: ProductsPage,
        meta: {
          requiresAuth: true,
          section: 'Catalog',
          title: 'Products',
          subtitle: 'Manage inventory records, stock levels, suppliers, and product metadata.',
        },
      },
      {
        path: 'orders',
        name: 'ImsOrders',
        component: OrdersPage,
        meta: {
          requiresAuth: true,
          section: 'Fulfillment',
          title: 'Orders',
          subtitle: 'Create and monitor orders through dedicated route-based workflows.',
        },
      },
      {
        path: 'admin',
        name: 'ImsAdmin',
        component: AdminPage,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          section: 'Administration',
          title: 'Admin Setup',
          subtitle: 'Maintain users, categories, and suppliers in a dedicated admin-only area.',
        },
      },
    ]
  }
]

const router = new Router({
  mode: 'history',
  routes
})

const isTokenValid = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    return exp && Date.now() / 1000 < exp
  } catch (e) {
    console.error('Invalid token format', e)
    return false
  }
}

router.beforeEach((to, from, next) => {
  const token = store.getters.getToken
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  const needsAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (needsAuth) {
    if (!token || !isTokenValid(token)) {
      store.dispatch('logout')
      next({ name: "Login" })
      return
    }

    if (needsAdmin && store.getters.getRole !== 'admin') {
      next({ name: "ImsOverview" })
      return
    }
  }

  if ((to.name === "Login" || to.name === "Register") && token && isTokenValid(token)) {
    next({ name: "ImsOverview" })
    return
  }

  next()
})

export default router
