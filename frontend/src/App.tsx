import { Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './layouts/header.tsx';
import LoadingSpinner from './components/loading';
import { MemberRoute, AdminRoute } from './lib/protectedRoutes';

const HomePage = lazy(() => import('@/pages/home'));
const AboutPage = lazy(() => import('@/pages/about'));
const Sponsors = lazy(() => import('@/pages/sponsors.tsx'));
const AdminPage = lazy(() => import('@/features/admin/website/AdminPage.tsx'));
const EquipesPage = lazy(() => import('@/pages/teams.tsx'));
const CalendrierPage = lazy(() => import('@/pages/calendarTeam.tsx'));
const Palmares = lazy(() => import('@/pages/palmares.tsx'));
const Contact = lazy(() => import('@/pages/contact.tsx'));
const CalendarEvent = lazy(() => import('@/pages/calendarEvent.tsx'));
const Galery = lazy(() => import('@/pages/galery.tsx'));
const HomeLogged = lazy(() => import('@/features/public/HomeLogged.tsx'));
const ResetPasswordPage = lazy(
  () => import('@/features/public/comps/credential/reset.tsx')
);
const Credentials = lazy(
  () => import('@/features/public/comps/Credentials.tsx')
);
const CommandePage = lazy(
  () => import('@/features/public/comps/CommandeForm.tsx')
);
const Stats = lazy(() => import('@/features/public/comps/Stats.tsx'));
const Footer = lazy(() => import('./layouts/footer.tsx'));
const MembresListing = lazy(
  () => import('@/features/public/comps/MembresListing.tsx')
);
const AllSelections = lazy(() => import('@/features/public/AllSelections.tsx'));
const SalleView = lazy(() => import('@/features/public/SalleView.tsx'));
const CaissePage = lazy(() => import('@/features/caisse/CaissePage'));

export default function App() {
  const location = useLocation();

  if (location.pathname.startsWith('/caisse')) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        }
      >
        <Routes>
          <Route path="/caisse" element={<CaissePage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="" />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
              <LoadingSpinner />
            </div>
          }
        >
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
            <Route
              path="/competition/calendrier/:nomEquipe"
              element={<CalendrierPage />}
            />
            <Route path="/evenements/galerie" element={<Galery />} />
            <Route path="/evenements/calendrier" element={<CalendarEvent />} />
            <Route path="/contact" element={<Contact />} />

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
              path="/espace-membre/listing"
              element={
                <MemberRoute>
                  <MembresListing />
                </MemberRoute>
              }
            />
            <Route
              path="/espace-membre/selections"
              element={
                <MemberRoute>
                  <AllSelections />
                </MemberRoute>
              }
            />
            <Route
              path="/espace-membre/salle"
              element={
                <MemberRoute>
                  <SalleView />
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

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
