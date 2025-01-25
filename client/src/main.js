import Vue from "vue"
import App from "./App.vue"
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"
import locale from "element-ui/lib/locale/lang/en"
import router from "./router"
import store from "./store"

Vue.config.productionTip = false
Vue.use(ElementUI, { locale })

const token = localStorage.getItem("token")
const user_name = localStorage.getItem("user_name")
const role = localStorage.getItem("role")

if (token && user_name && role) {
  store.commit("SET_AUTH", { token, user_name, role })
}

new Vue({
  el: "#app",
  store,
  router,
  render: h => h(App)
})