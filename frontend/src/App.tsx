import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import Header from './layouts/header.tsx';
import Footer from './layouts/footer.tsx';
import LoadingSpinner from './components/loading';
import ProtectedRoute from './lib/protectedRoutes';
import HomePage from './pages/home';
import AboutPage from './pages/about';
import AdminHomePage from './features/admin/website/Home';

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

            {/* Routes admin protégées */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminHomePage />
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
