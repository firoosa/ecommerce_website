import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    count: 0,
  },
  reducers: {
    setCart: (state, action) => {
      const cart = action.payload
      state.items = cart.items || []
      state.subtotal = parseFloat(cart.subtotal || 0)
      state.tax = parseFloat(cart.tax || 0)
      state.total = parseFloat(cart.total || 0)
      state.count = state.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    clearCart: (state) => {
      state.items = []
      state.subtotal = 0
      state.tax = 0
      state.total = 0
      state.count = 0
    },
  },
})

export const { setCart, clearCart } = cartSlice.actions
export default cartSlice.reducer
