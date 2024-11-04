import Vue from "vue"
import App from "./App.vue"
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"
import locale from "element-ui/lib/locale/lang/en"
import router from "./router"

Vue.config.productionTip = false
Vue.use(ElementUI, { locale })

new Vue({
  el: "#app",
  router,
  render: h => h(App)
})