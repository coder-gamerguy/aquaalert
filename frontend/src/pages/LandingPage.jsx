// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { Droplets, Bell, Clock, Map, ShieldCheck, Smartphone, ArrowRight, ChevronDown } from 'lucide-react';

const STATS = [
  { value: '8', label: 'Distribution zones covered' },
  { value: '<60s', label: 'Alert delivery time' },
  { value: '3', label: 'Networks supported (MTN, Vodafone, AirtelTigo)' },
  { value: '98%', label: 'SMS delivery rate' },
];

const HOW_IT_WORKS = [
  {
    icon: Droplets,
    title: 'GWCL opens the tap',
    desc: 'When Ghana Water Company activates water supply for your zone, our system detects it instantly.',
    color: 'bg-blue-500',
  },
  {
    icon: Bell,
    title: 'You get an SMS alert',
    desc: 'Within seconds, you receive an SMS on your phone — no data, no app, no internet needed.',
    color: 'bg-emerald-500',
  },
  {
    icon: Clock,
    title: 'Fill your containers',
    desc: 'You know exactly when water is flowing and how long it will last. No more guessing or waiting.',
    color: 'bg-violet-500',
  },
];

const FEATURES = [
  { icon: Bell, title: 'Instant tap-open alerts', desc: 'Get notified the moment water flows in your zone.' },
  { icon: Clock, title: '30-min advance warning', desc: 'Prepare your containers before supply starts.' },
  { icon: Map, title: 'Zone-based targeting', desc: 'Only receive alerts for your specific area of Tamale.' },
  { icon: ShieldCheck, title: 'Tap-close notification', desc: 'Know when supply is ending so you can top up.' },
  { icon: Smartphone, title: 'Works on any phone', desc: 'SMS alerts — no smartphone or data required.' },
  { icon: Droplets, title: 'Low-pressure warnings', desc: 'Alert when flow drops so you can adjust pumps.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800">AquaAlert</span>
          <span className="text-xs text-slate-400 ml-1 hidden sm:block">by GWCL Tamale</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operator/login')}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Operator Login
          </button>
          <button
            onClick={() => navigate('/app')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            Get alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a3d6b] via-[#1260a8] to-[#0d5c47] text-white px-6 py-20 text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-white/5 translate-y-1/2" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Live in Tamale, Northern Region
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            Know when water<br />is flowing.<br />
            <span className="text-cyan-300">Before it stops.</span>
          </h1>
          <p className="text-lg text-blue-200 mb-8 max-w-lg mx-auto leading-relaxed">
            Ghana Water Company now alerts Tamale residents via SMS the instant water supply opens in their zone — so you never miss a supply window again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/app')}
              className="bg-white text-blue-800 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" /> Subscribe — it's free
            </button>
            <button
              onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
              className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
            >
              How it works <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black font-mono text-cyan-400">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">How AquaAlert works</h2>
          <p className="text-slate-500 max-w-md mx-auto">A simple 3-step process that puts water knowledge in your hands.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="text-center p-6">
              <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-mono font-bold text-slate-400 mb-2">STEP {i + 1}</div>
              <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SMS Preview */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">What an alert looks like</h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              You'll receive a clear, plain-English SMS on any phone — no app, no internet, no data needed. Works on MTN, Vodafone, and AirtelTigo.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors inline-flex items-center gap-2"
            >
              Subscribe for free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Mock phone */}
          <div className="flex-1 flex justify-center">
            <div className="bg-slate-800 rounded-3xl w-64 p-4 shadow-2xl">
              <div className="bg-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">GW</div>
                  <div>
                    <p className="text-white text-xs font-bold">GWCL-Alert</p>
                    <p className="text-slate-400 text-xs">Now</p>
                  </div>
                </div>
                <div className="bg-blue-600 rounded-2xl rounded-tl-sm p-3 mb-2">
                  <p className="text-white text-xs leading-relaxed">
                    AquaAlert: 💧 Water is NOW flowing in <strong>LAMASHEGU</strong> zone. Supply started 6:15 AM. Est. 4 hours. Fill your tanks now!<br/><br/>- GWCL Tamale. Reply STOP to unsubscribe.
                  </p>
                </div>
                <p className="text-slate-500 text-xs text-center">6:15 AM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Everything you need</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-700 to-teal-700 text-white px-6 py-14 text-center">
        <h2 className="text-2xl font-bold mb-3">Stop waiting. Start knowing.</h2>
        <p className="text-blue-200 mb-7 max-w-sm mx-auto text-sm">
          Join thousands of Tamale residents who never miss a water supply window.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="bg-white text-blue-800 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm inline-flex items-center gap-2"
        >
          <Bell className="w-4 h-4" /> Get free water alerts now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 px-6 py-10 text-center text-xs">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white">AquaAlert Tamale</span>
        </div>
        <p>A Ghana Water Company (GWCL) Northern Region initiative</p>
        <p className="mt-1">Tamale, Ghana 🇬🇭 · Reply STOP to any SMS to unsubscribe · Free service</p>
        <div className="mt-4 flex justify-center gap-6 text-slate-500">
          <button onClick={() => navigate('/app')} className="hover:text-white transition-colors">Customer App</button>
          <button onClick={() => navigate('/operator/login')} className="hover:text-white transition-colors">Operator Login</button>
        </div>
      </footer>
    </div>
  );
}
