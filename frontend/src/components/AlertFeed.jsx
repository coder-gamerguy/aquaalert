// src/components/AlertFeed.jsx
import { CheckCircle, XCircle, Clock, AlertTriangle, Droplets } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  open:        { icon: Droplets,       color: 'border-l-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Flowing' },
  close:       { icon: XCircle,        color: 'border-l-slate-400',   bg: 'bg-slate-50',    text: 'text-slate-500',   label: 'Closed' },
  advance:     { icon: Clock,          color: 'border-l-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Coming soon' },
  pressure:    { icon: AlertTriangle,  color: 'border-l-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-600',   label: 'Low pressure' },
  emergency:   { icon: AlertTriangle,  color: 'border-l-red-600',     bg: 'bg-red-50',      text: 'text-red-600',     label: 'Emergency' },
  maintenance: { icon: Clock,          color: 'border-l-violet-400',  bg: 'bg-violet-50',   text: 'text-violet-600',  label: 'Maintenance' },
};

export default function AlertFeed({ alerts = [], emptyMessage = 'No recent alerts' }) {
  if (!alerts.length) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        <Droplets className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.advance;
        const Icon = cfg.icon;

        return (
          <div
            key={alert.id}
            className={`flex gap-3 items-start rounded-xl border border-slate-100 border-l-4 ${cfg.color} p-3.5 bg-white shadow-sm`}
          >
            <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${cfg.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {alert.zone_name || 'All Zones'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                {alert.message_en}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                {alert.sent_to > 0 && (
                  <span className="ml-2 text-slate-300">· {alert.sent_to.toLocaleString()} notified</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
