import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MonitoringPage from './pages/MonitoringPage';
import HistoryPage from './pages/HistoryPage';
import { Shield, History } from 'lucide-react';

function Layout({ children }) {
  // Simple bottom nav for Phase 1
  return (
    <div className="fullscreen-container">
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
      {/* Navigation placeholder - Phase 1 mainly just Home */}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/monitor" element={<MonitoringPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
