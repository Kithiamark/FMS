import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';

import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with immediate check and auto-reload on update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New application content available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
