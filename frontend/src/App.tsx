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
import Palmares from '@/pages/palmares.tsx';
import Contact from '@/pages/contact.tsx';
import CalendarEvent from '@/pages/calendarEvent.tsx';
import Galery from '@/pages/galery.tsx';
import { MemberRoute, AdminRoute } from './lib/protectedRoutes';
import HomeLogged from '@/features/public/HomeLogged.tsx';
import ResetPasswordPage from '@/features/public/comps/credential/reset.tsx';
import Credentials from '@/features/public/comps/Credentials.tsx';
import CommandePage from '@/features/public/comps/CommandeForm.tsx';
import Stats from '@/features/public/comps/Stats.tsx';
import Selections from '@/features/public/comps/Selections.tsx';
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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/infos/about" element={<AboutPage />} />
            <Route path="/infos/palmares" element={<Palmares />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/competition/equipes" element={<EquipesPage />} />
            <Route
              path="/competition/calendrier"
              element={<CalendrierPage />}
            />
            <Route path="/evenements/galerie" element={<Galery />} />
            <Route path="/evenements/calendrier" element={<CalendarEvent />} />
            <Route path="/contact" element={<Contact />} />

            {/* Route pour la page d'accueil des membres */}

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
            <Route
              path="/espace-membre/credentials"
              element={
                <MemberRoute>
                  <Credentials />
                </MemberRoute>
              }
            />
            <Route
              path="/espace-membre/statistiques"
              element={
                <MemberRoute>
                  <Stats />
                </MemberRoute>
              }
            />
            <Route
              path="/espace-membre/commandes"
              element={
                <MemberRoute>
                  <CommandePage />
                </MemberRoute>
              }
            />
            <Route
              path="/espace-membre/selections"
              element={
                <MemberRoute>
                  <Selections />
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
