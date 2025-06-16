import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import LoadingSpinner from './components/loading';
import HomePage from './pages/home';
import AboutPage from './pages/about';

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Suspense>
  );
}
