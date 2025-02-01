import Vue from "vue"
import Router from "vue-router"
import Login from "../components/login"
import ProductDetails from "../apps/ims/components/product-details"
import Ims from "../apps/ims/app.vue"
import store from "../store"

Vue.use(Router)

let routes = [
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
    path: '/ims',
    name: 'Ims',
    component: Ims,
    meta: { requiresAuth: true } 
  },
  {
    path: '/ims/products/:id',
    name: 'ProductDetails',
    component: ProductDetails,
    meta: { requiresAuth: true }
  }
]
// .concat(Ims.routes)

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

// Navigation guard to check for token
router.beforeEach((to, from, next) => {
  const token = store.getters.getToken

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // Check for token and validity
    if (!token || !isTokenValid(token)) {
      next({ name: "Login" })
    } else {
      next()
    }
  } else if (to.name === "Login" && token && isTokenValid(token)) {
    next({ name: "Ims" })
  } else {
    next()
  }
})

export default router