/* eslint-disable prettier/prettier */
import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import Header from './layouts/header.tsx';
import LoadingSpinner from './components/loading';
import HomePage from '@/pages/home';
import AboutPage from '@/pages/about';
import Sponsors from '@/pages/sponsors.tsx';
import AdminPage from '@/features/admin/website/AdminPage.tsx';
import EquipesPage from '@/pages/teams.tsx';
import CalendrierPage from '@/pages/calendarTeam.tsx';
import { MemberRoute, AdminRoute } from './lib/protectedRoutes';
import HomeLogged from '@/features/public/HomeLogged.tsx';
import Footer from './layouts/footer.tsx';

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
            <Route path="/competition/equipes" element={<EquipesPage />} />
            <Route path="/competition/calendrier" element={<CalendrierPage />} />

            {/* Route pour la page 404 */}

            {/* Routes membres protégées */}
            <Route
              path="/espace-membre"
              element={
                <MemberRoute>
                  <HomeLogged />
                </MemberRoute>
              }
            />

            {/* Routes admin protégées */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}