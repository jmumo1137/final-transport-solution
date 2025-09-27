import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: token || null, role: role || null, userId: userId || null },
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.userId = action.payload.userId;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('role', action.payload.role);
      localStorage.setItem('userId', action.payload.userId);
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.userId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export const selectToken = (state) => state.auth.token;
export const selectUserRole = (state) => state.auth.role;
export const selectUserId = (state) => state.auth.userId;
export default authSlice.reducer;
