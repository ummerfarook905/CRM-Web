import { useEffect, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";
import { api } from "../../api/axios";

type NotificationItem = { id: string; title?: string; message?: string; isRead?: boolean };

export default function NotificationToast() {
  const knownIds = useRef<Set<string> | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await api.get("/notifications", { params: { page: 1, limit: 20 } });
        if (!active) return;
        const rows = response.data?.data;
        if (!Array.isArray(rows)) return;
        const unread = (rows as NotificationItem[]).filter((item) => !item.isRead);
        const currentIds = new Set(unread.map((item) => String(item.id)));
        if (knownIds.current !== null) {
          const incoming = unread.find((item) => !knownIds.current?.has(String(item.id)));
          if (incoming) {
            setNotification(incoming);
            window.setTimeout(() => setNotification((current) => current?.id === incoming.id ? null : current), 7000);
          }
        }
        knownIds.current = currentIds;
      } catch { /* Notification polling is best effort. */ }
    };
    void check();
    const interval = window.setInterval(() => void check(), 20000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (!notification) return null;
  return <aside role="status" aria-live="polite" className="fixed right-4 top-20 z-[120] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl sm:right-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BellRing size={19}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">New notification</p><p className="mt-1 text-sm font-semibold text-slate-900">{notification.title || "CRM notification"}</p><p className="mt-1 text-sm leading-5 text-slate-600">{notification.message || "You have a new update."}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotification(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17}/></button></div></aside>;
}
