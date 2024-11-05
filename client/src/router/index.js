import Vue from "vue"
import Router from "vue-router"
import Login from "../components/login"
import Ims from "../apps/ims/app.vue"

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
  }
]
// .concat(Ims.routes)

const router = new Router({
  mode: 'history',
  routes
})

// Navigation guard to check for token
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // If the route requires authentication and no token is found, redirect to login
    if (!token) {
      next({ name: 'Login' })
    } else {
      next()
    }
  } else if (to.path === '/login' && token) {
    // If the user is trying to access the login page and is already authenticated, redirect to /ims
    next({ name: 'Ims' })
    } else {
    next()
  }
})

export default router