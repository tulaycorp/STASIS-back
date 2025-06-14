import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global-layout.css';
import './styles/layout-overrides.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap App component */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);