// src/pages/OperatorDashboard.jsx
import { useState, useEffect } from 'react';
import { Droplets, Power, PowerOff, Users, Bell, BarChart2, Send, LogOut, Loader, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { zonesAPI, alertsAPI, subscribersAPI, broadcastAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OperatorDashboard() {
  const { zones, alerts, loadData } = useApp();
  const [stats, setStats] = useState(null);
  const [actionZone, setActionZone] = useState(null); // zone being acted on
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
const [actionLog, setActionLog] = useState([]);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [tab, setTab] = useState('zones');
  const operator = JSON.parse(localStorage.getItem('operator_info') || '{}');

  useEffect(() => {
    alertsAPI.stats().then(r => setStats(r.data.stats)).catch(()=>{});
  }, []);

  async function toggleZone(zone) {
    setActionZone(zone.id);
    try {
     if (zone.status === 'open') {
  await zonesAPI.close(zone.id);
  addActionLog(`${zone.name} tap closed. SMS notification sent.`);
} else {
  await zonesAPI.open(zone.id, 80);
  addActionLog(`${zone.name} tap opened at 80% flow. SMS notification sent.`);
}
      await loadData();
    } catch (e) {
      alert(`Failed: ${e.response?.data?.error || e.message}`);
    } finally {
      setActionZone(null);
    }
  }
function addActionLog(message) {
  const time = new Date().toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  setActionLog(prev => [
    { time, message },
    ...prev.slice(0, 4),
  ]);
}

async function openAllZones() {
  setBulkLoading(true);
  try {
    await Promise.all(zones.map(zone => zonesAPI.open(zone.id, 80)));
    await loadData();
    addActionLog('All zones opened and residents notified.');
  } catch (e) {
    alert('Failed to open all zones');
  } finally {
    setBulkLoading(false);
  }
}

async function closeAllZones() {
  setBulkLoading(true);
  try {
    await Promise.all(zones.map(zone => zonesAPI.close(zone.id)));
    await loadData();
    addActionLog('All zones closed and residents notified.');
  } catch (e) {
    alert('Failed to close all zones');
  } finally {
    setBulkLoading(false);
  }
}
  async function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await broadcastAPI.send(broadcastMsg, null);
      setBroadcastResult(res.data);
      setBroadcastMsg('');
    } catch (e) {
      alert('Broadcast failed');
    } finally {
      setBroadcastSending(false);
    }
  }

  function logout() {
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_info');
    window.location.href = '/operator/login';
  }

  const openCount = zones.filter(z => z.status === 'open').length;
  const totalSubs = zones.reduce((s, z) => s + (parseInt(z.live_subscribers) || parseInt(z.subscriber_count) || 0), 0);

  const chartData = zones.map(z => ({
    name: z.name.split(' ')[0],
    subscribers: parseInt(z.live_subscribers) || parseInt(z.subscriber_count) || 0,
    open: z.status === 'open',
  }));

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AquaAlert Operator</p>
            <p className="text-xs text-slate-400">GWCL Tamale — Northern Region</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{operator.name || 'Operator'}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Stats strip */}
    <div className="bg-emerald-950/40 border border-emerald-700 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
  <div>
    <p className="text-sm font-semibold text-emerald-300">
      System operational
    </p>

    <p className="text-xs text-emerald-500 mt-1">
      SMS gateway connected • Water flow monitoring active
    </p>
  </div>

  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
    LIVE
  </div>
</div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-700 px-6">
        {[
          { id: 'zones', icon: Power, label: 'Tap Control' },
          { id: 'analytics', icon: BarChart2, label: 'Analytics' },
          { id: 'broadcast', icon: Send, label: 'Emergency' },
          { id: 'log', icon: Bell, label: 'Alert Log' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ZONE CONTROL */}
      {tab === 'zones' && (
  <div className="space-y-5">
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-white">Tap Control Center</h2>
        <p className="text-sm text-slate-400 mt-1">
          Open, close, and notify residents by zone.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={openAllZones}
          disabled={bulkLoading}
          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          Open All Zones
        </button>

        <button
          onClick={closeAllZones}
          disabled={bulkLoading}
          className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          Close All Zones
        </button>
      </div>
    </div>

    {actionLog.length > 0 && (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-300 mb-3">
          Recent operator actions
        </p>

        <div className="space-y-2">
         {actionLog.map((log, i) => (
  <div
    key={i}
    className="flex items-start gap-3 text-sm bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2"
  >
    <div className="mt-1">
      <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-pulse"></span>
    </div>

    <div className="flex-1 flex items-center justify-between gap-4">
  <p className="text-slate-200 text-sm">
    {log.message}
  </p>

  <p className="text-[11px] text-slate-500 whitespace-nowrap">
    {log.time}
  </p>
</div>
  </div>
))}
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {zones.map(zone => (
        <div key={zone.id} className={`rounded-xl border p-5 ${
          zone.status === 'open'
            ? 'border-emerald-600/50 bg-emerald-950/40'
            : 'border-slate-700 bg-slate-800/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">{zone.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{zone.area_name}</p>
            </div>

            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
              zone.status === 'open'
                ? 'bg-emerald-900 text-emerald-300'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {zone.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {(zone.live_subscribers || zone.subscriber_count || 0).toLocaleString()} subscribers
            </span>

            {zone.status === 'open' && (
  <div className="text-right">
    <p className="text-emerald-400">
      {zone.flow_pct}% flow
    </p>

    <p className="text-[11px] text-slate-500 mt-0.5">
      Pressure: {
        zone.flow_pct > 70
          ? 'High'
          : zone.flow_pct > 40
          ? 'Medium'
          : 'Low'
      }
    </p>
  </div>
)}
          </div>

          {zone.status === 'open' && (
            <div className="mb-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    zone.flow_pct > 70
                      ? 'bg-emerald-400'
                      : zone.flow_pct > 40
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${zone.flow_pct}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Estimated close time: 9:30 PM
              </p>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mb-3">
  Last updated: {new Date().toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit'
  })}
</p>
          <button
            onClick={() => toggleZone(zone)}
            disabled={actionZone === zone.id}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              zone.status === 'open'
                ? 'bg-red-800 hover:bg-red-700 text-red-100'
                : 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100'
            }`}
          >
            {actionZone === zone.id ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : zone.status === 'open' ? (
              <><PowerOff className="w-4 h-4" /> Close Tap & Notify</>
            ) : (
              <><Power className="w-4 h-4" /> Open Tap & Notify</>
            )}
          </button>
        </div>
      ))}
    </div>
  </div>
)}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Subscribers per zone</h2>
              <div className="bg-slate-800 rounded-xl p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="subscribers" radius={[4,4,0,0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.open ? '#10b981' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Open alerts sent (30d)', value: stats.open_alerts || 0 },
                  { label: 'Close alerts sent (30d)', value: stats.close_alerts || 0 },
                  { label: 'Emergency broadcasts', value: stats.emergency_alerts || 0 },
                  { label: 'Total SMS dispatched', value: parseInt(stats.total_sms_sent||0).toLocaleString() },
                  { label: 'SMS delivered', value: parseInt(stats.total_delivered||0).toLocaleString() },
                  { label: 'Avg delivery rate', value: `${stats.avg_delivery_rate||0}%` },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-lg font-bold font-mono text-white">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMERGENCY BROADCAST */}
        {tab === 'broadcast' && (
          <div className="max-w-lg">
            <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Emergency broadcast sends an SMS to ALL active subscribers across all zones. Use only for critical announcements.
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5">
              <label className="text-xs font-medium text-slate-400 block mb-2">Message</label>
              <div className="flex flex-wrap gap-2 mb-4">
  {[
    'Pipe burst detected',
    'Low pressure in some areas',
    'Scheduled maintenance ongoing',
    'Temporary water shutdown',
  ].map(msg => (
    <button
      key={msg}
      onClick={() => setBroadcastMsg(msg)}
      className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-2 rounded-lg text-slate-200 transition-colors"
    >
      {msg}
    </button>
  ))}
</div>
              <textarea
                rows={4}
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="e.g. Major pipe repair on Savelugu Rd. Water supply for all zones suspended until 6 PM today. We apologise for the inconvenience."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">{broadcastMsg.length} / 160 chars</p>
                <button
                  onClick={sendBroadcast}
                  disabled={broadcastSending || !broadcastMsg.trim()}
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {broadcastSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to all subscribers
                </button>
              </div>
              {broadcastResult && (
                <div className="mt-3 text-sm bg-slate-700 rounded-lg px-4 py-3">
                  <span className="text-emerald-400 font-semibold">{broadcastResult.sent} delivered</span>
                  {broadcastResult.failed > 0 && <span className="text-red-400 ml-2">{broadcastResult.failed} failed</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALERT LOG */}
        {tab === 'log' && (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-4 bg-slate-800 rounded-xl px-4 py-3 text-sm">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  a.type==='open' ? 'bg-emerald-400' :
                  a.type==='emergency' ? 'bg-red-400' :
                  a.type==='close' ? 'bg-slate-400' : 'bg-blue-400'
                }`} />
                <span className="text-slate-300 font-medium w-24 flex-shrink-0">{a.zone_name || 'All zones'}</span>
                <span className="text-slate-400 flex-1 truncate">{a.message_en}</span>
                <span className="text-slate-500 text-xs font-mono flex-shrink-0">
                  {a.sent_to} sent · {new Date(a.created_at).toLocaleString('en-GH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
