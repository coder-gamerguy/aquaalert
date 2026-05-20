// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import CustomerApp from './pages/CustomerApp';
import OperatorDashboard from './pages/OperatorDashboard';
import OperatorLogin from './pages/OperatorLogin';
import { useState } from 'react';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('operator_token');
  return token ? children : <Navigate to="/operator/login" replace />;
}

export default function App() {
  const [, forceUpdate] = useState(0);
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<CustomerApp />} />
          <Route path="/operator/login" element={
            <OperatorLogin onLogin={() => {
              forceUpdate(n => n + 1);
              window.location.href = '/operator';
            }} />
          } />
          <Route path="/operator" element={
            <ProtectedRoute><OperatorDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
