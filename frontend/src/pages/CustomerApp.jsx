// src/pages/CustomerApp.jsx
import { useState } from 'react';
import { Droplets, Bell, Calendar, Map, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Phone, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribersAPI } from '../utils/api';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function StatusBadge({ status }) {
  if (status === 'open') return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>Flowing
    </span>
  );
  if (status === 'maintenance') return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Maintenance</span>
  );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Closed</span>
  );
}

function FlowBar({ pct }) {
  const color = pct > 70 ? 'bg-emerald-500' : pct > 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function AlertIcon({ type }) {
  const icons = {
    open: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    close: <XCircle className="w-4 h-4 text-slate-500" />,
    advance: <Clock className="w-4 h-4 text-blue-600" />,
    pressure: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    emergency: <AlertTriangle className="w-4 h-4 text-red-600" />,
  };
  return icons[type] || icons.advance;
}

export default function CustomerApp() {
  const { zones, alerts, loading } = useApp();
  const [tab, setTab] = useState('zones');
  const [form, setForm] = useState({ phone: '', zone_id: '', name: '', alert_open: true, alert_close: true, alert_advance: true });
  const [subState, setSubState] = useState('idle'); // idle | loading | success | error
  const [subMsg, setSubMsg] = useState('');

  const openZones = zones.filter(z => z.status === 'open');

  async function handleSubscribe() {
    if (!form.phone || !form.zone_id) {
      setSubMsg('Please enter your phone number and select a zone.');
      setSubState('error');
      return;
    }
    setSubState('loading');
    try {
      await subscribersAPI.register({
        phone: form.phone,
        zone_id: parseInt(form.zone_id),
        name: form.name,
        alert_open: form.alert_open,
        alert_close: form.alert_close,
        alert_advance: form.alert_advance,
      });
      setSubState('success');
      setSubMsg(`Subscribed! You'll receive alerts for ${zones.find(z=>z.id==form.zone_id)?.name}.`);
    } catch (e) {
      setSubState('error');
      setSubMsg(e.response?.data?.error || 'Subscription failed. Please try again.');
    }
  }

  const tabs = [
    { id: 'zones', icon: Map, label: 'Zones' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'subscribe', icon: Phone, label: 'Subscribe' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0C447C] via-[#185FA5] to-[#0F6E56] px-5 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/4 translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-cyan-300" />
            <span className="text-xs font-mono text-cyan-200 tracking-widest uppercase">GWCL Tamale</span>
            {openZones.length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-xs bg-white/15 border border-white/25 rounded-full px-3 py-1 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
                {openZones.length} zone{openZones.length > 1 ? 's' : ''} flowing
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AquaAlert Tamale</h1>
          <p className="text-sm text-blue-200 mt-1">Real-time water supply notifications</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === t.id ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-500'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {/* ZONES TAB */}
        {!loading && tab === 'zones' && (
          <div className="space-y-3">
            {zones.map(zone => (
              <div key={zone.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{zone.name}</h3>
                    <p className="text-xs text-slate-500">{zone.area_name}</p>
                  </div>
                  <StatusBadge status={zone.status} />
                </div>
                {zone.status === 'open' && (
                  <>
                    <FlowBar pct={zone.flow_pct} />
                    <p className="text-xs text-slate-500 mt-1">{zone.flow_pct}% flow capacity</p>
                  </>
                )}
                {zone.status === 'open' && zone.estimated_close_at && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                    Supply until ~{new Date(zone.estimated_close_at).toLocaleTimeString('en-GH', {hour:'2-digit',minute:'2-digit'})}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">
                    {zone.live_subscribers || zone.subscriber_count || 0} subscribers
                  </span>
                  <button
                    onClick={() => { setForm(f=>({...f, zone_id: zone.id})); setTab('subscribe'); }}
                    className="flex items-center gap-1 text-xs text-blue-600 font-medium"
                  >
                    Get alerts <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALERTS TAB */}
        {!loading && tab === 'alerts' && (
          <div className="space-y-2.5">
            {alerts.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">No recent alerts</p>
            )}
            {alerts.map(alert => (
              <div key={alert.id} className={`bg-white rounded-xl border-l-4 border border-slate-100 p-3.5 shadow-sm ${
                alert.type==='open' ? 'border-l-emerald-500' :
                alert.type==='emergency' ? 'border-l-red-500' :
                alert.type==='pressure' ? 'border-l-amber-400' :
                'border-l-blue-400'
              }`}>
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5"><AlertIcon type={alert.type} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{alert.zone_name}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.message_en}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {new Date(alert.created_at).toLocaleString('en-GH')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBSCRIBE TAB */}
        {tab === 'subscribe' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-1">Get water alerts</h2>
            <p className="text-xs text-slate-500 mb-5">Register to receive SMS the moment water flows in your zone.</p>

            {subState === 'success' ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-slate-800">{subMsg}</p>
                <button onClick={() => { setSubState('idle'); setSubMsg(''); }}
                  className="mt-4 text-sm text-blue-600 underline">Subscribe to another zone</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Your phone number</label>
                  <input
                    type="tel"
                    placeholder="0244 000 000"
                    value={form.phone}
                    onChange={e => setForm(f=>({...f, phone: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Your name (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Amina Alhassan"
                    value={form.name}
                    onChange={e => setForm(f=>({...f, name: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Select your zone</label>
                  <div className="grid grid-cols-2 gap-2">
                    {zones.map(z => (
                      <button
                        key={z.id}
                        onClick={() => setForm(f=>({...f, zone_id: z.id}))}
                        className={`text-xs py-2 px-3 rounded-xl border text-left transition-all ${
                          form.zone_id === z.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {z.name}
                        {z.status === 'open' && <span className="block text-emerald-600 font-medium text-[10px]">● Flowing now</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-600">Notification types</p>
                  {[
                    { key: 'alert_open', label: 'Water starts flowing', desc: 'Instant alert when tap opens' },
                    { key: 'alert_advance', label: '30-min advance warning', desc: 'Heads-up before scheduled supply' },
                    { key: 'alert_close', label: 'Supply ending alert', desc: 'When water is about to stop' },
                  ].map(pref => (
                    <label key={pref.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[pref.key]}
                        onChange={e => setForm(f=>({...f, [pref.key]: e.target.checked}))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{pref.label}</p>
                        <p className="text-xs text-slate-400">{pref.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {subState === 'error' && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{subMsg}</p>
                )}
                <button
                  onClick={handleSubscribe}
                  disabled={subState === 'loading'}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {subState === 'loading' ? <Loader className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Subscribe to alerts
                </button>
              </div>
            )}
          </div>
        )}

      {/* SCHEDULE TAB */}
{!loading && tab === 'schedule' && (
  <div className="space-y-4">

    {/* Header Card */}
    <div className="bg-blue-700 rounded-2xl p-5 text-white shadow-sm">
      <p className="text-xs font-medium text-blue-200 mb-1">
        Weekly supply schedule
      </p>

      <p className="text-sm text-blue-100">
        Schedules may change. Subscribe for real-time alerts when times shift.
      </p>

      <div className="mt-4 bg-white/10 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold">
          Next scheduled supply: 6:00 AM
        </p>

        <p className="text-xs text-blue-100 mt-1">
          Countdown: 5h 24m remaining
        </p>
      </div>
    </div>

    {/* Zone Schedules */}
    {zones.map(zone => (
      <div
        key={zone.id}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">
            {zone.name}
          </h3>

          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
            Weekly Plan
          </span>
        </div>

        <div className="space-y-2">

          {DAYS.map((d, i) => {
            const active = [0,2,4,6].includes(i);

            return (
              <div
                key={d}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {d}
                  </p>
                </div>

                <div className="text-right">
                  {active ? (
                    <>
                      <p className="text-sm font-bold text-blue-700">
                        {i % 2 === 0
                        ? "6:00 AM - 10:00 AM"
                         : "4:00 PM - 8:00 PM"}
                      </p>

                      <p className="text-[11px] text-emerald-600 font-medium">
                        Supply expected
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-400">
                        No supply
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Inactive day
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    ))}
  </div>
)}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 mt-4">
        <p>AquaAlert by Ghana Water Company Ltd</p>
        <p className="mt-1">Northern Region — Tamale • Reply STOP to unsubscribe</p>
      </div>
    </div>
  );
}
