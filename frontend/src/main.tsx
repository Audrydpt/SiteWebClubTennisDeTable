import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './App.tsx';
import { SidebarProvider } from './components/ui/sidebar.tsx';
import './index.css';
import { ThemeProvider } from './theme-provider.tsx';

const basename = import.meta.env.BASE_URL || '';
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <Router basename={basename}>
            <App />
          </Router>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
