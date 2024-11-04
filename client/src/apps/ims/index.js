const App = () => import('./app.vue')
import { APP_PATH } from './config'

export default {
  routes: [
    {
      path: APP_PATH,
      name: 'Ims',
      component: App,
    }
  ]
}