import { Route, Routes } from 'react-router-dom';

import Forensic from './Forensic';

export default function ForensicMain() {
  return (
    <Routes>
      <Route index element={<Forensic />} />
      <Route path=":taskId" element={<Forensic />} />
    </Routes>
  );
}
