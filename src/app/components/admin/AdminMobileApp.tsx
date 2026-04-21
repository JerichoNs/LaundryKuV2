import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines as initialMachines, adminNotifications as initialNotifs,
  Machine, Notification, formatTime, getStatusColor, getStatusBg, getStatusLabel,
} from "../../data/mockData";

// ── Types ──────────────────────────────────────────────────────
type Screen = "login" | "dashboard" | "machine-detail" | "machine-edit"
  | "notifications" | "machines" | "settings";
type SettingsSub = "main" | "notifications" | "business" | "pricing" | "about";

const FONT = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = "#2563EB";

// ── Phone scale hook ──────────────────────────────────────────
function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      setScale(Math.min(1, (sw - 32) / 375, (sh - 32) / 812));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

function getDarkBg(s: string) {
  return s === "running" ? "#1E3A5F" : s === "done" ? "#14532D" : s === "almost" ? "#431407" : "#1E293B";
}
function statusBg(status: string, dark: boolean) {
  return dark ? getDarkBg(status) : getStatusBg(status as any);
}

// ── Root ───────────────────────────────────────────────────────
export function AdminMobileApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const scale = usePhoneScale();

  const [screen, setScreen] = useState<Screen>("login");
  const [settingsSub, setSettingsSub] = useState<SettingsSub>("main");
  const [selectedId, setSelectedId] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifs);

  // live timer
  useEffect(() => {
    const iv = setInterval(() => setMachines(prev => prev.map(m => {
      if (m.status !== "running" && m.status !== "almost") return m;
      const s = Math.max(0, m.remainingSeconds - 1);
      const newStatus = s === 0 ? "done" : s <= 300 ? "almost" : "running";
      return { ...m, remainingSeconds: s, status: newStatus };
    })), 1000);
    return () => clearInterval(iv);
  }, []);

  const stopMachine = useCallback((id: number) => {
    setMachines(p => p.map(m => m.id === id
      ? { ...m, status: "idle", remainingSeconds: 0, customer: null, customerId: null, startTime: null }
      : m));
  }, []);

  const saveMachine = useCallback((id: number, name: string, timer: number) => {
    setMachines(p => p.map(m => m.id === id ? { ...m, name, defaultTimer: timer } : m));
  }, []);

  const addMachine = useCallback(() => {
    const id = Math.max(...machines.map(m => m.id)) + 1;
    setMachines(p => [...p, { id, name: `Mesin ${id}`, status: "idle", remainingSeconds: 0, totalSeconds: 3600, customer: null, customerId: null, startTime: null, defaultTimer: 60 }]);
  }, [machines]);

  const deleteMachine = useCallback((id: number) => {
    setMachines(p => p.filter(m => m.id !== id));
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const selected = machines.find(m => m.id === selectedId) || machines[0];
  const editing = machines.find(m => m.id === editingId);

  const navTo = (s: Screen) => { setScreen(s); setSettingsSub("main"); };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: t.frameBg, fontFamily: FONT, transition: "background 0.3s" }}>
      <div style={{
        width: 375, height: 812,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        borderRadius: 44,
        boxShadow: "0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
        background: t.pageBg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-24 h-1.5 rounded-full"
          style={{ background: t.isDark ? "#334155" : "#CBD5E1" }} />

        {/* Controls */}
        {screen !== "login" && (
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
            <button onClick={() => navigate("/")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{ background: t.isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)", color: t.textSec, fontSize: 11, fontWeight: 600, boxShadow: t.shadowSm, backdropFilter: "blur(8px)" }}>
              <ChevL color={t.textSec} size={12} /> Kembali
            </button>
            <button onClick={t.toggle}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: t.isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)", boxShadow: t.shadowSm }}>
              {t.isDark ? <Sun /> : <Moon />}
            </button>
          </div>
        )}

        {/* Screens */}
        {screen === "login" && <LoginScreen t={t} onLogin={() => setScreen("dashboard")} />}
        {screen === "dashboard" && (
          <DashboardScreen t={t} machines={machines}
            onMachineClick={id => { setSelectedId(id); setScreen("machine-detail"); }} />
        )}
        {screen === "machine-detail" && (
          <MachineDetailScreen t={t} machine={selected}
            onBack={() => setScreen("dashboard")}
            onStop={() => { stopMachine(selected.id); setScreen("dashboard"); }}
            onEdit={() => { setEditingId(selected.id); setScreen("machine-edit"); }} />
        )}
        {screen === "machine-edit" && editing && (
          <MachineEditScreen t={t} machine={editing}
            onBack={() => setScreen(selectedId ? "machine-detail" : "machines")}
            onSave={(name, timer) => { saveMachine(editing.id, name, timer); setScreen("machines"); }} />
        )}
        {screen === "notifications" && (
          <NotificationsScreen t={t} notifs={notifs}
            onMarkAll={() => setNotifs(p => p.map(n => ({ ...n, read: true })))} />
        )}
        {screen === "machines" && (
          <MachinesScreen t={t} machines={machines}
            onStop={stopMachine}
            onEdit={id => { setEditingId(id); setScreen("machine-edit"); }}
            onDelete={deleteMachine}
            onAdd={addMachine} />
        )}
        {screen === "settings" && (
          <SettingsScreen t={t} sub={settingsSub} setSub={setSettingsSub} />
        )}

        {/* Bottom Nav */}
        {screen !== "login" && (
          <BottomNav t={t} active={screen === "machine-detail" || screen === "machine-edit" ? "dashboard" : screen}
            onNav={navTo} unread={unread} />
        )}
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────
function LoginScreen({ t, onLogin }: { t: ThemeColors; onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: t.pageBg }}>
      {/* Header wave */}
      <div className="h-56 flex flex-col items-center justify-end pb-8 relative"
        style={{ background: "linear-gradient(160deg,#1D4ED8,#2563EB)" }}>
        <button onClick={t.toggle} className="absolute top-12 right-4 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          {t.isDark ? <Sun /> : <Moon />}
        </button>
        <button onClick={() => window.history.back()} className="absolute top-12 left-4 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <ChevL color="white" size={18} />
        </button>
        <div className="w-18 h-18 w-[72px] h-[72px] rounded-3xl flex items-center justify-center mb-3"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
          <WashIco size={36} color="white" />
        </div>
        <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800 }}>LaundryKu Admin</h1>
        <p style={{ fontSize: 13, color: "#BFDBFE", marginTop: 2 }}>Sistem Monitoring Laundry</p>
      </div>

      <div className="flex-1 px-6 pt-8 space-y-4">
        <div>
          <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: t.textSec }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@laundryku.id" type="email"
            className="w-full rounded-xl px-4 py-3.5 outline-none"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
        </div>
        <div>
          <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: t.textSec }}>Password</label>
          <input value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" type="password"
            className="w-full rounded-xl px-4 py-3.5 outline-none"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
        </div>
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2"
          style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
          {loading ? (
            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Masuk...</>
          ) : "Masuk"}
        </button>
        <p className="text-center" style={{ fontSize: 12, color: t.textMuted }}>Demo: isi apa saja lalu klik Masuk</p>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
function DashboardScreen({ t, machines, onMachineClick }: { t: ThemeColors; machines: Machine[]; onMachineClick: (id: number) => void }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const active = machines.filter(m => m.status === "running" || m.status === "almost").length;
  const done = machines.filter(m => m.status === "done").length;
  const idle = machines.filter(m => m.status === "idle").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-5" style={{ background: "linear-gradient(160deg,#1D4ED8,#2563EB)" }}>
        <p className="text-blue-200" style={{ fontSize: 12 }}>{today}</p>
        <h2 className="text-white mt-0.5" style={{ fontSize: 20, fontWeight: 800 }}>Selamat Datang, Admin 👋</h2>
        <div className="flex gap-2 mt-3">
          {[{ l: "Aktif", v: active, c: "#60A5FA" }, { l: "Selesai", v: done, c: "#4ADE80" }, { l: "Kosong", v: idle, c: "#CBD5E1" }].map(s => (
            <div key={s.l} className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <span className="text-white" style={{ fontSize: 18, fontWeight: 800 }}>{s.v}</span>
              <span style={{ fontSize: 11, color: s.c }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, marginBottom: 12, letterSpacing: "0.07em" }}>STATUS MESIN</p>
        <div className="grid grid-cols-2 gap-3">
          {machines.map(m => <MachineCardSmall key={m.id} t={t} machine={m} onClick={() => onMachineClick(m.id)} />)}
        </div>
      </div>
    </div>
  );
}

function MachineCardSmall({ t, machine: m, onClick }: { t: ThemeColors; machine: Machine; onClick: () => void }) {
  const prog = m.totalSeconds > 0 ? 1 - m.remainingSeconds / m.totalSeconds : 0;
  const sc = getStatusColor(m.status);
  const sb = statusBg(m.status, t.isDark);
  return (
    <button onClick={onClick} className="rounded-2xl p-4 text-left transition-all active:scale-95"
      style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-start justify-between mb-3">
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{m.name}</p>
        <span className="px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: 9, fontWeight: 700, color: sc, background: sb }}>
          {getStatusLabel(m.status)}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: t.isDark ? "#334155" : "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${prog * 100}%`, background: sc, transition: "width 1s linear" }} />
      </div>
      {m.status !== "idle" ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>{formatTime(m.remainingSeconds)}</p>
          <p className="truncate mt-0.5" style={{ fontSize: 10, color: t.textMuted }}>{m.customer}</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 16, fontWeight: 700, color: t.textMuted }}>Kosong</p>
          <p style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>Siap digunakan</p>
        </>
      )}
    </button>
  );
}

// ── Machine Detail ─────────────────────────────────────────────
function MachineDetailScreen({ t, machine: m, onBack, onStop, onEdit }: {
  t: ThemeColors; machine: Machine; onBack: () => void; onStop: () => void; onEdit: () => void;
}) {
  const prog = m.totalSeconds > 0 ? 1 - m.remainingSeconds / m.totalSeconds : 0;
  const r = 88; const circ = 2 * Math.PI * r;
  const sc = getStatusColor(m.status);
  const sb = statusBg(m.status, t.isDark);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: t.pageBg }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3"
        style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.pillBg }}>
          <ChevL color={t.text} size={18} />
        </button>
        <div className="flex-1">
          <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{m.name}</h2>
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>
            {getStatusLabel(m.status)}
          </span>
        </div>
        <button onClick={onEdit} className="px-3 py-2 rounded-xl flex items-center gap-1.5"
          style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>
          <EditIco color={PRIMARY} size={13} /> Edit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-28 space-y-4">
        {/* Ring Timer */}
        <div className="rounded-2xl p-6 flex flex-col items-center"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="relative" style={{ width: 210, height: 210 }}>
            <svg width="210" height="210" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="105" cy="105" r={r} fill="none" stroke={t.isDark ? "#334155" : "#E2E8F0"} strokeWidth="14" />
              <circle cx="105" cy="105" r={r} fill="none" stroke={sc} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)}
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p style={{ fontSize: 36, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {formatTime(m.remainingSeconds)}
              </p>
              <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>Sisa Waktu</p>
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: 11, color: t.textMuted }}>Progres</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>{Math.round(prog * 100)}%</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 6, background: t.isDark ? "#334155" : "#E2E8F0" }}>
              <div className="h-full rounded-full" style={{ width: `${prog * 100}%`, background: sc, transition: "width 1s linear" }} />
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard t={t} label="PELANGGAN" value={m.customer || "—"} />
          <InfoCard t={t} label="TIMER DEFAULT" value={`${m.defaultTimer} mnt`} />
          <InfoCard t={t} label="MULAI" value={m.startTime || "—"} />
          <InfoCard t={t} label="STATUS" value={getStatusLabel(m.status)} />
        </div>

        {/* Actions */}
        {(m.status === "running" || m.status === "almost") && (
          <button onClick={onStop} className="w-full py-4 rounded-xl flex items-center justify-center gap-2"
            style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 15, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.08)" : "transparent" }}>
            <StopIco /> Hentikan Mesin Sekarang
          </button>
        )}
        {m.status === "done" && (
          <div className="rounded-xl p-4 text-center"
            style={{ background: t.isDark ? "#14532D" : "#F0FDF4", border: `1px solid ${t.isDark ? "#166534" : "#BBF7D0"}` }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#16A34A" }}>✅ Cucian Selesai!</p>
            <p style={{ fontSize: 12, color: "#4ADE80", marginTop: 2 }}>Pelanggan dapat mengambil cucian</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Machine Edit ───────────────────────────────────────────────
function MachineEditScreen({ t, machine: m, onBack, onSave }: {
  t: ThemeColors; machine: Machine; onBack: () => void; onSave: (name: string, timer: number) => void;
}) {
  const [name, setName] = useState(m.name);
  const [timer, setTimer] = useState(String(m.defaultTimer));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const t2 = parseInt(timer) || 60;
    onSave(name, t2);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: t.pageBg }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3"
        style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.pillBg }}>
          <ChevL color={t.text} size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Edit {m.name}</h2>
          <p style={{ fontSize: 12, color: t.textMuted }}>Ubah konfigurasi mesin</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-28 space-y-4">
        {/* Machine icon preview */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: statusBg(m.status, t.isDark) }}>
            <WashIco size={28} color={getStatusColor(m.status)} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{name || m.name}</p>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: getStatusColor(m.status), background: statusBg(m.status, t.isDark) }}>
              {getStatusLabel(m.status)}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.text, borderBottom: `1px solid ${t.divider}`, paddingBottom: 10 }}>Informasi Mesin</p>

          <F t={t} label="Nama Mesin">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="cth: Mesin Utama 1"
              className="w-full rounded-xl px-4 py-3 outline-none"
              style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
          </F>

          <F t={t} label="Timer Default (menit)" hint="Durasi cuci default saat memulai pesanan">
            <div className="flex items-center gap-2">
              <button onClick={() => setTimer(v => String(Math.max(1, parseInt(v) - 5)))}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: t.pillBg, color: t.text }}>−</button>
              <input value={timer} onChange={e => setTimer(e.target.value.replace(/\D/, ""))} type="number"
                className="flex-1 rounded-xl px-4 py-3 outline-none text-center"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 16, fontWeight: 700, fontFamily: FONT, color: PRIMARY }} />
              <button onClick={() => setTimer(v => String(Math.min(240, parseInt(v) + 5)))}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: t.pillBg, color: t.text }}>+</button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[30, 45, 60, 90, 120].map(v => (
                <button key={v} onClick={() => setTimer(String(v))}
                  className="px-3 py-1 rounded-lg"
                  style={{ background: timer === String(v) ? PRIMARY : t.pillBg, color: timer === String(v) ? "white" : t.textSec, fontSize: 12, fontWeight: 600 }}>
                  {v} mnt
                </button>
              ))}
            </div>
          </F>
        </div>

        <button onClick={handleSave}
          className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2"
          style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.35)", transition: "background 0.3s" }}>
          {saved ? "✅ Tersimpan!" : "💾 Simpan Perubahan"}
        </button>
        <button onClick={onBack} className="w-full py-3.5 rounded-xl"
          style={{ border: `1.5px solid ${t.cardBorder}`, color: t.textSec, fontSize: 15, fontWeight: 600 }}>
          Batal
        </button>
      </div>
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────
function NotificationsScreen({ t, notifs, onMarkAll }: { t: ThemeColors; notifs: Notification[]; onMarkAll: () => void }) {
  const unread = notifs.filter(n => !n.read).length;
  const getColor = (type: string) => type === "finish" ? "#22C55E" : type === "warning" ? "#F97316" : PRIMARY;
  const getEmoji = (type: string) => type === "finish" ? "✅" : type === "warning" ? "⚠️" : "📋";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between"
        style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Notifikasi</h2>
          {unread > 0 && <p style={{ fontSize: 12, color: t.textMuted }}>{unread} belum dibaca</p>}
        </div>
        {unread > 0 && (
          <button onClick={onMarkAll} style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>Tandai semua</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {notifs.map(n => {
          const c = getColor(n.type);
          const bgColor = n.type === "finish"
            ? (t.isDark ? "#14532D" : "#F0FDF4")
            : n.type === "warning"
              ? (t.isDark ? "#431407" : "#FFF7ED")
              : (t.isDark ? "#1E3A5F" : "#EFF6FF");
          return (
            <div key={n.id} className="rounded-2xl p-4 flex gap-3"
              style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${n.read ? t.cardBorder : c}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bgColor }}>
                <span style={{ fontSize: 18 }}>{getEmoji(n.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                {n.machineName && <p style={{ fontSize: 11, fontWeight: 700, color: PRIMARY }}>{n.machineName}</p>}
                <p style={{ fontSize: 13, color: t.text }}>{n.message}</p>
                <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{n.time}</p>
              </div>
              {!n.read && <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: PRIMARY }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Machines Management ────────────────────────────────────────
function MachinesScreen({ t, machines, onStop, onEdit, onDelete, onAdd }: {
  t: ThemeColors; machines: Machine[];
  onStop: (id: number) => void; onEdit: (id: number) => void;
  onDelete: (id: number) => void; onAdd: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4"
        style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Manajemen Mesin</h2>
        <p style={{ fontSize: 13, color: t.textMuted }}>{machines.length} mesin terdaftar</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
        {machines.map(m => {
          const sc = getStatusColor(m.status);
          const sb = statusBg(m.status, t.isDark);
          const isRunning = m.status === "running" || m.status === "almost";
          return (
            <div key={m.id} className="rounded-2xl overflow-hidden"
              style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: sb }}>
                  <WashIco size={24} color={sc} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>
                      {getStatusLabel(m.status)}
                    </span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>• {m.defaultTimer} mnt</span>
                    {isRunning && <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>{formatTime(m.remainingSeconds)}</span>}
                  </div>
                  {m.customer && <p className="truncate mt-0.5" style={{ fontSize: 12, color: t.textMuted }}>👤 {m.customer}</p>}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex border-t" style={{ borderColor: t.divider }}>
                <button onClick={() => onEdit(m.id)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5"
                  style={{ color: PRIMARY, fontSize: 12, fontWeight: 700, borderRight: `1px solid ${t.divider}` }}>
                  <EditIco color={PRIMARY} size={13} /> Edit
                </button>
                {isRunning && (
                  <button onClick={() => onStop(m.id)}
                    className="flex-1 py-3 flex items-center justify-center gap-1.5"
                    style={{ color: "#F97316", fontSize: 12, fontWeight: 700, borderRight: `1px solid ${t.divider}` }}>
                    <StopIco color="#F97316" size={13} /> Stop
                  </button>
                )}
                <button onClick={() => setConfirmDelete(m.id)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5"
                  style={{ color: "#EF4444", fontSize: 12, fontWeight: 700 }}>
                  <TrashIco color="#EF4444" size={13} /> Hapus
                </button>
              </div>

              {/* Delete confirm */}
              {confirmDelete === m.id && (
                <div className="p-4 flex gap-3 items-center" style={{ background: t.isDark ? "#3B1616" : "#FEF2F2", borderTop: `1px solid #FCA5A5` }}>
                  <p style={{ fontSize: 13, color: "#EF4444", flex: 1 }}>Yakin hapus {m.name}?</p>
                  <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded-lg"
                    style={{ background: t.pillBg, color: t.textSec, fontSize: 12, fontWeight: 600 }}>Batal</button>
                  <button onClick={() => { onDelete(m.id); setConfirmDelete(null); }} className="px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "#EF4444", fontSize: 12, fontWeight: 700 }}>Hapus</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={onAdd}
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white z-10"
        style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 8px 24px rgba(37,99,235,0.5)" }}>
        <PlusIco />
      </button>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function SettingsScreen({ t, sub, setSub }: { t: ThemeColors; sub: SettingsSub; setSub: (s: SettingsSub) => void }) {
  return (
    <>
      {sub === "main" && <SettingsMain t={t} setSub={setSub} />}
      {sub === "notifications" && <SettingsNotifs t={t} onBack={() => setSub("main")} />}
      {sub === "business" && <SettingsBusiness t={t} onBack={() => setSub("main")} />}
      {sub === "pricing" && <SettingsPricing t={t} onBack={() => setSub("main")} />}
      {sub === "about" && <SettingsAbout t={t} onBack={() => setSub("main")} />}
    </>
  );
}

function SettingsMain({ t, setSub }: { t: ThemeColors; setSub: (s: SettingsSub) => void }) {
  const items = [
    { id: "notifications" as SettingsSub, label: "Notifikasi", desc: "Atur preferensi notifikasi", bg: "#F59E0B", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7zm0 20a2 2 0 002-2h-4a2 2 0 002 2z"/></svg> },
    { id: "business" as SettingsSub, label: "Profil Bisnis", desc: "Nama toko, alamat & kontak", bg: "#0EA5E9", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2 7h20v13H2V7zm4-4h12v4H6V3zm3 8v5h6v-5H9z"/></svg> },
    { id: "pricing" as SettingsSub, label: "Harga & Tarif", desc: "Kelola tarif layanan", bg: "#F97316", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 12.76V16h-1.5v-1.29c-.87-.2-1.63-.71-1.73-1.7h.96c.09.64.54 1.05 1.38 1.05.9 0 1.27-.46 1.27-.97 0-.54-.3-.87-1.34-1.11-1.19-.28-2-.74-2-1.83 0-.91.65-1.59 1.47-1.81V7h1.5v1.36c.95.23 1.43.9 1.46 1.69h-.96c-.04-.67-.46-1.05-1.22-1.05-.72 0-1.18.37-1.18.91 0 .52.38.8 1.37 1.04 1.2.29 1.98.79 1.98 1.91-.01.91-.62 1.59-1.46 1.8z"/></svg> },
    { id: "about" as SettingsSub, label: "Tentang Aplikasi", desc: "Versi & informasi developer", bg: "#3B82F6", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> },
  ];
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Pengaturan</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {/* Profile card */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", fontSize: 20, fontWeight: 800 }}>A</div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Admin Utama</p>
            <p style={{ fontSize: 13, color: t.textMuted }} className="truncate">admin@laundryku.id</p>
          </div>
          <ChevR color={t.textMuted} />
        </div>

        {/* Theme */}
        <button onClick={t.toggle} className="w-full rounded-2xl p-4 flex items-center gap-3 transition-opacity active:opacity-70"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.isDark ? "#1E293B" : "#F1F5F9" }}>
            <span style={{ fontSize: 18 }}>{t.isDark ? "🌙" : "☀️"}</span>
          </div>
          <div className="flex-1 text-left">
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Tema Aplikasi</p>
            <p style={{ fontSize: 12, color: t.textMuted }}>{t.isDark ? "Mode gelap aktif" : "Mode terang aktif"}</p>
          </div>
          <TogglePill on={t.isDark} />
        </button>

        {items.map(item => (
          <button key={item.id} onClick={() => setSub(item.id)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 transition-opacity active:opacity-70"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.label}</p>
              <p style={{ fontSize: 12, color: t.textMuted }}>{item.desc}</p>
            </div>
            <ChevR color={t.textMuted} />
          </button>
        ))}

        <button className="w-full py-4 rounded-xl transition-opacity active:opacity-70"
          style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 14, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.06)" : "transparent" }}>
          Keluar
        </button>
      </div>
    </div>
  );
}

function SettingsNotifs({ t, onBack }: { t: ThemeColors; onBack: () => void }) {
  const [toggles, setToggles] = useState({
    push: true, sound: true, vibrate: false,
    finish: true, newOrder: true, almostDone: true,
  });
  const tog = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));

  const rows: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: "push", label: "Push Notification", desc: "Notifikasi pada layar" },
    { key: "sound", label: "Suara Notifikasi", desc: "Suara saat notifikasi masuk" },
    { key: "vibrate", label: "Getar", desc: "Getar saat notifikasi masuk" },
    { key: "finish", label: "Cuci Selesai", desc: "Notif ketika mesin selesai" },
    { key: "newOrder", label: "Pesanan Baru", desc: "Notif saat ada pesanan baru" },
    { key: "almostDone", label: "Hampir Selesai", desc: "Notif 5 menit sebelum selesai" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SubHeader t={t} title="Notifikasi" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-2">
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{row.label}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{row.desc}</p>
              </div>
              <button onClick={() => tog(row.key)}
                className="relative rounded-full"
                style={{ width: 48, height: 26, background: toggles[row.key] ? PRIMARY : (t.isDark ? "#334155" : "#CBD5E1"), padding: "3px" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", transform: toggles[row.key] ? "translateX(22px)" : "translateX(0)", transition: "transform 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
          ))}
        </div>
        <SaveBtn t={t} onSave={() => {}} label="Simpan Pengaturan" />
      </div>
    </div>
  );
}

function SettingsBusiness({ t, onBack }: { t: ThemeColors; onBack: () => void }) {
  const [form, setForm] = useState({
    shopName: "LaundryKu Utama", owner: "Bapak Santoso", phone: "0812-0000-1234",
    address: "Jl. Raya Utama No. 88, Jakarta Selatan", email: "info@laundryku.id",
    openTime: "06:00", closeTime: "21:00",
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputSty: React.CSSProperties = {
    background: t.inputBg, border: `1.5px solid ${t.inputBorder}`,
    fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "12px 14px", outline: "none", width: "100%",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SubHeader t={t} title="Profil Bisnis" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="INFORMASI TOKO" />
          <F t={t} label="Nama Toko"><input value={form.shopName} onChange={set("shopName")} style={inputSty} /></F>
          <F t={t} label="Nama Pemilik"><input value={form.owner} onChange={set("owner")} style={inputSty} /></F>
          <F t={t} label="Email Bisnis"><input value={form.email} onChange={set("email")} type="email" style={inputSty} /></F>
        </div>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="KONTAK & LOKASI" />
          <F t={t} label="No. Telepon"><input value={form.phone} onChange={set("phone")} style={inputSty} /></F>
          <F t={t} label="Alamat">
            <textarea value={form.address} onChange={set("address")} rows={2}
              style={{ ...inputSty, resize: "none" as const }} />
          </F>
        </div>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="JAM OPERASIONAL" />
          <div className="grid grid-cols-2 gap-3">
            <F t={t} label="Buka"><input value={form.openTime} onChange={set("openTime")} type="time" style={inputSty} /></F>
            <F t={t} label="Tutup"><input value={form.closeTime} onChange={set("closeTime")} type="time" style={inputSty} /></F>
          </div>
        </div>
        <SaveBtn t={t} onSave={handleSave} label={saved ? "✅ Tersimpan!" : "Simpan Profil"} saved={saved} />
      </div>
    </div>
  );
}

function SettingsPricing({ t, onBack }: { t: ThemeColors; onBack: () => void }) {
  const [prices, setPrices] = useState([
    { id: 1, name: "Cuci Biasa", unit: "per kg", price: "6000" },
    { id: 2, name: "Cuci Express", unit: "per kg", price: "10000" },
    { id: 3, name: "Cuci + Setrika", unit: "per kg", price: "8000" },
    { id: 4, name: "Setrika Saja", unit: "per kg", price: "4000" },
    { id: 5, name: "Dry Clean", unit: "per item", price: "25000" },
    { id: 6, name: "Bedcover Besar", unit: "per item", price: "30000" },
  ]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SubHeader t={t} title="Harga & Tarif" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        <p style={{ fontSize: 13, color: t.textSec, marginBottom: 4 }}>Ketuk harga untuk mengubah nominal tarif layanan.</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          {prices.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: i < prices.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{item.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 13, fontWeight: 500, color: t.textMuted }}>Rp</span>
                <input
                  value={item.price}
                  onChange={e => setPrices(p => p.map(x => x.id === item.id ? { ...x, price: e.target.value.replace(/\D/, "") } : x))}
                  className="text-right rounded-xl px-2 py-2 outline-none"
                  style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontWeight: 700, fontFamily: FONT, color: PRIMARY, width: 80 }}
                  type="number" min="0"
                />
              </div>
            </div>
          ))}
        </div>
        <SaveBtn t={t} onSave={handleSave} label={saved ? "✅ Tarif Tersimpan!" : "Simpan Tarif"} saved={saved} />
      </div>
    </div>
  );
}

function SettingsAbout({ t, onBack }: { t: ThemeColors; onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SubHeader t={t} title="Tentang Aplikasi" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
        {/* App card */}
        <div className="rounded-2xl p-6 flex flex-col items-center text-center"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 10px 30px rgba(37,99,235,0.4)" }}>
            <WashIco size={38} color="white" />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>LaundryKu</h3>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Sistem Monitoring Laundry Modern</p>
          <span className="mt-3 px-4 py-1.5 rounded-full"
            style={{ background: t.isDark ? "#1E3A5F" : "#DBEAFE", color: PRIMARY, fontSize: 13, fontWeight: 700 }}>
            Versi 1.0.0
          </span>
        </div>

        {/* Info rows */}
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          {[
            { label: "Versi Aplikasi", val: "1.0.0 (Build 100)" },
            { label: "Platform", val: "Web App (React + Vite)" },
            { label: "Terakhir Update", val: "20 April 2026" },
            { label: "Developer", val: "Tim LaundryKu" },
            { label: "Kontak Support", val: "support@laundryku.id" },
            { label: "Lisensi", val: "MIT License" },
          ].map((row, i, arr) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <p style={{ fontSize: 14, color: t.textSec }}>{row.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{row.val}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>🚀 Fitur Unggulan</p>
          {["Real-time monitoring mesin", "Notifikasi otomatis", "Manajemen pelanggan", "Laporan harian & mingguan", "Tema gelap & terang"].map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: PRIMARY, shrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <p style={{ fontSize: 13, color: t.text }}>{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────
function BottomNav({ t, active, onNav, unread }: {
  t: ThemeColors; active: string; onNav: (s: Screen) => void; unread: number;
}) {
  const items: { id: Screen; label: string; icon: (c: string) => JSX.Element }[] = [
    { id: "dashboard", label: "Beranda", icon: c => <HomeIco color={c} /> },
    { id: "machines", label: "Mesin", icon: c => <MachineIco color={c} /> },
    { id: "notifications", label: "Notif", icon: c => <BellIco color={c} unread={unread} /> },
    { id: "settings", label: "Setelan", icon: c => <GearIco color={c} /> },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 68, background: t.navBg, borderTop: `1px solid ${t.divider}` }}>
      {items.map(item => {
        const on = active === item.id;
        const color = on ? PRIMARY : t.textMuted;
        return (
          <button key={item.id} onClick={() => onNav(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1">
            {item.icon(color)}
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, color }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────
function SubHeader({ t, title, onBack }: { t: ThemeColors; title: string; onBack: () => void }) {
  return (
    <div className="px-5 pt-14 pb-4 flex items-center gap-3"
      style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
      <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.pillBg }}>
        <ChevL color={t.text} size={18} />
      </button>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{title}</h2>
    </div>
  );
}
function InfoCard({ t, label, value }: { t: ThemeColors; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: t.text, marginTop: 4 }}>{value}</p>
    </div>
  );
}
function F({ t, label, hint, children }: { t: ThemeColors; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: t.textSec }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}
function SecLabel({ t, text }: { t: ThemeColors; text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.07em", paddingBottom: 4, borderBottom: `1px solid ${t.divider}` }}>{text}</p>;
}
function SaveBtn({ t, onSave, label, saved }: { t: ThemeColors; onSave: () => void; label: string; saved?: boolean }) {
  return (
    <button onClick={onSave} className="w-full py-4 rounded-xl text-white"
      style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.35)", transition: "background 0.3s" }}>
      {label}
    </button>
  );
}
function TogglePill({ on }: { on: boolean }) {
  return (
    <div className="relative rounded-full flex items-center"
      style={{ width: 48, height: 26, background: on ? PRIMARY : "#CBD5E1", padding: "3px" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", transform: on ? "translateX(22px)" : "translateX(0)", transition: "transform 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function WashIco({ size = 24, color = PRIMARY }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="5" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="2" stroke={color} strokeWidth="1.4" /><circle cx="6.5" cy="5.5" r="1" fill={color} /><circle cx="9.5" cy="5.5" r="1" fill={color} /><line x1="13" y1="5.5" x2="17" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function ChevL({ color, size = 18 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ChevR({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Sun() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#F59E0B" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" /></svg>; }
function Moon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#64748B" /></svg>; }
function HomeIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MachineIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" /><circle cx="12" cy="13" r="4.5" stroke={color} strokeWidth="2" /></svg>; }
function BellIco({ color, unread }: { color: string; unread: number }) {
  return <div className="relative"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>{unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "#EF4444", fontSize: 9, fontWeight: 700 }}>{unread}</div>}</div>;
}
function GearIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function EditIco({ color, size = 15 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function TrashIco({ color, size = 15 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function StopIco({ color = "#EF4444", size = 16 }: { color?: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" fill={color} opacity="0.2" /></svg>; }
function PlusIco() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>; }
