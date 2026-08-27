import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TargetsPage from './pages/TargetsPage';
import AttackSurfacePage from './pages/AttackSurfacePage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import ResultsPage from './pages/ResultsPage';
import FindingsPage from './pages/FindingsPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import RemediationPage from './pages/RemediationPage';
import ReportsPage from './pages/ReportsPage';
import CLIPage from './pages/CLIPage';
import SystemStatusPage from './pages/SystemStatusPage';
import MethodologyPage from './pages/MethodologyPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-cinematic-mesh text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-screen-2xl mx-auto">
          <Routes>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/targets"           element={<TargetsPage />} />
            <Route path="/attack-surface"    element={<AttackSurfacePage />} />
            <Route path="/scan"              element={<ScanPage />} />
            <Route path="/assessments"       element={<HistoryPage />} />
            <Route path="/results/:id"       element={<ResultsPage />} />
            <Route path="/findings"          element={<FindingsPage />} />
            <Route path="/risk-analysis"     element={<RiskAnalysisPage />} />
            <Route path="/remediation"       element={<RemediationPage />} />
            <Route path="/reports"           element={<ReportsPage />} />
            <Route path="/cli"               element={<CLIPage />} />
            <Route path="/status"            element={<SystemStatusPage />} />
            <Route path="/methodology"       element={<MethodologyPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
