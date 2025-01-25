import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    token: null,
    user_name: null,
    role: null,
    isAuthenticated: false
  },

  mutations: {
    SET_AUTH(state, {token, user_name, role}) {
      state.token = token
      state.user_name = user_name
      state.role = role
      state.isAuthenticated = true

      localStorage.setItem("token", token)
      localStorage.setItem("user_name", user_name)
      localStorage.setItem("role", role)
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.user_name = null
      state.role = null
      state.isAuthenticated = false

      localStorage.removeItem("token")
      localStorage.removeItem("user_name")
      localStorage.removeItem("role")
    }
  },

  actions: {
    login({ commit }, { token, user_name, role }) {
      commit('SET_AUTH', { token, user_name, role });
    },
    logout({ commit }) {
      commit('CLEAR_AUTH');
    }
  },

  getters: {
    isAuthenticated: (state) => state.isAuthenticated,
    getToken: (state) => state.token,
    getUserName: (state) => state.user_name,
    getRole: (state) => state.role
  }
})

export default store