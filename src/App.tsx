import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from "./components/Sidebar/Sidebar";

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));


export default function App() {

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<h1>Welcome</h1>} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}
