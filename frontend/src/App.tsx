import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import Header from './layouts/header.tsx';
import Footer from './layouts/footer.tsx';
import LoadingSpinner from './components/loading';
import ProtectedRoute from './lib/protectedRoutes';
import HomePage from '@/pages/home';
import AboutPage from '@/pages/about';
import Sponsors from '@/pages/sponsors.tsx';
import AdminPage from '@/features/admin/website/AdminPage.tsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="" />

      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/sponsors" element={<Sponsors />} />

            {/* Route pour la page 404 */}

            {/* Routes admin protégées */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
