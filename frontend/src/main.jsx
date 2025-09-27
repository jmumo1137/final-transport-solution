import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';           // ✅ Import Provider
import { store } from './store';                  // ✅ Import your Redux store
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>                        
    <App />
  </Provider>
);
