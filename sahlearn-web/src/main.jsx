import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' },
      }}
    />
  </StrictMode>

);
