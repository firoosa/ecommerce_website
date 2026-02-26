import { createSlice } from '@reduxjs/toolkit'

const loadUser = () => {
  try {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      return JSON.parse(userStr)
    }
  } catch (e) {
    console.error(e)
  }
  return null
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadUser(),
    isAuthenticated: !!localStorage.getItem('access_token'),
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem('access_token', action.payload.access)
      localStorage.setItem('refresh_token', action.payload.refresh)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    },
    updateUser: (state, action) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    rehydrateAuth: (state) => {
      const token = localStorage.getItem('access_token')
      const userStr = localStorage.getItem('user')
      state.isAuthenticated = !!token
      state.user = token && userStr ? (() => {
        try { return JSON.parse(userStr) } catch { return null }
      })() : null
    },
  },
})

export const { setCredentials, logout, updateUser, rehydrateAuth } = authSlice.actions
export default authSlice.reducer
