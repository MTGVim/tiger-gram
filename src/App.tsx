import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { NonogramPage } from './pages/NonogramPage';
import { SudokuPage } from './pages/SudokuPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/nonogram" element={<NonogramPage />} />
        <Route path="/sudoku" element={<SudokuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
