// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { zonesAPI, alertsAPI } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [zones, 
    
  ] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadData();

    // Real-time socket for live updates
    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001');
    setSocket(s);

    s.on('zone:opened', ({ zoneId }) => {
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, status: 'open' } : z));
      loadAlerts();
    });
    s.on('zone:closed', ({ zoneId }) => {
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, status: 'closed', flow_pct: 0 } : z));
    });
    s.on('emergency:broadcast', () => loadAlerts());

    return () => s.disconnect();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [zonesRes, alertsRes] = await Promise.all([
        zonesAPI.list(),
        alertsAPI.list({ limit: 15 }),
      ]);
      setZones(zonesRes.data.zones || zonesRes.data);
      setAlerts(alertsRes.data.alerts || alertsRes.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      const res = await alertsAPI.list({ limit: 15 });
      setAlerts(res.data.alerts);
    } catch {}
  }

  return (
    <AppContext.Provider value={{ zones, alerts, loading, loadData, socket }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
