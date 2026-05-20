import { useEffect, useState } from "react";
import { Clock, Droplets } from "lucide-react";

const schedules = [
  {
    zone: "Bilp'ela",
    days: [
      { day: "Sun", time: "6:00 AM - 10:00 AM" },
      { day: "Mon", time: "Closed" },
      { day: "Tue", time: "4:00 PM - 8:00 PM" },
      { day: "Wed", time: "6:00 AM - 10:00 AM" },
      { day: "Thu", time: "Closed" },
      { day: "Fri", time: "5:00 PM - 9:00 PM" },
      { day: "Sat", time: "6:00 AM - 11:00 AM" },
    ],
  },
  {
    zone: "Choggu",
    days: [
      { day: "Sun", time: "Closed" },
      { day: "Mon", time: "7:00 AM - 11:00 AM" },
      { day: "Tue", time: "Closed" },
      { day: "Wed", time: "5:00 PM - 9:00 PM" },
      { day: "Thu", time: "7:00 AM - 11:00 AM" },
      { day: "Fri", time: "Closed" },
      { day: "Sat", time: "4:00 PM - 8:00 PM" },
    ],
  },
  {
    zone: "Kalpohin",
    days: [
      { day: "Sun", time: "6:00 AM - 10:00 AM" },
      { day: "Mon", time: "6:00 AM - 10:00 AM" },
      { day: "Tue", time: "Closed" },
      { day: "Wed", time: "Closed" },
      { day: "Thu", time: "5:00 PM - 9:00 PM" },
      { day: "Fri", time: "5:00 PM - 9:00 PM" },
      { day: "Sat", time: "Closed" },
    ],
  },
];

export default function ScheduleTable() {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const target = new Date();
      target.setHours(18, 0, 0);

      const diff = target - now;

      if (diff <= 0) {
        setCountdown("Water supply active");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown(`${hours}h ${mins}m remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-blue-700 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5" />
          <p className="font-semibold">Weekly supply schedule</p>
        </div>

        <p className="text-sm text-blue-100">
          Schedules may change. Subscribe for real-time alerts.
        </p>

        <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">
          Next supply countdown: {countdown}
        </div>
      </div>

      {schedules.map((item, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-800">
              {item.zone}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {item.days.map((d, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-xl p-3 border border-slate-100"
              >
                <p className="text-xs font-semibold text-slate-500">
                  {d.day}
                </p>

                <p
                 className="text-black text-sm font-bold mt-1"
                >
                 {d.time || d.start_time || d.start || "No time set"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}