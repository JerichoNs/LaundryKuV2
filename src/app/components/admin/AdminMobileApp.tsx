import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines as initialMachines,
  adminNotifications as initialNotifications,
  Machine,
  Notification,
  formatTime,
  getStatusColor,
  getStatusBg,
  getStatusLabel,
} from "../../data/mockData";

type Screen = "login" | "dashboard" | "machine-detail" | "notifications" | "machines" | "settings";
const FONT = "'Plus Jakarta Sans', sans-serif";

export function AdminMobileApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedMachineId, setSelectedMachineId] = useState<number>(1);
  const [machineList, setMachineList] = useState<Machine[]>(initialMachines);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const iv = setInterval(() => {
      setMachineList((prev) =>
        prev.map((m) => {
          if (m.status === "running" || m.status === "almost") {
            const s = Math.max(0, m.remainingSeconds - 1);
            return { ...m, remainingSeconds: s, status: s === 0 ? "done" : s <= 300 && m.status === "running" ? "almost" : m.status };
          }
          return m;
        })
      );
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedMachine = machineList.find((m) => m.id === selectedMachineId) || machineList[0];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: t.frameBg, fontFamily: FONT, transition: "background 0.3s" }}
    >
      {/* Phone Frame */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{ width: 375, height: 812, borderRadius: 44, boxShadow: "0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)", background: t.pageBg }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full z-50" style={{ background: t.isDark ? "#334155" : "#CBD5E1" }} />

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-5 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: t.isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)", color: t.textSec, fontSize: 11, fontWeight: 600, boxShadow: t.shadowSm, backdropFilter: "blur(10px)" }}
        >
          <BackIcon color={t.textSec} size={12} />
          Kembali
        </button>

        {/* Theme toggle inside phone */}
        {screen !== "login" && (
          <button
            onClick={t.toggle}
            className="absolute top-5 left-4 z-50 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: t.isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)", boxShadow: t.shadowSm }}
          >
            {t.isDark ? <SunIcon color="#F59E0B" /> : <MoonIcon color="#64748B" />}
          </button>
        )}

        {screen === "login" && (
          <LoginScreen t={t} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onLogin={() => setScreen("dashboard")} />
        )}
        {screen === "dashboard" && (
          <DashboardScreen t={t} machines={machineList} onMachineClick={(id) => { setSelectedMachineId(id); setScreen("machine-detail"); }} />
        )}
        {screen === "machine-detail" && (
          <MachineDetailScreen t={t} machine={selectedMachine} onBack={() => setScreen("dashboard")}
            onStop={() => { setMachineList((p) => p.map((m) => m.id === selectedMachineId ? { ...m, status: "idle", remainingSeconds: 0, customer: null, customerId: null } : m)); setScreen("dashboard"); }}
          />
        )}
        {screen === "notifications" && (
          <NotificationsScreen t={t} notifications={notifications} onMarkAllRead={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))} />
        )}
        {screen === "machines" && (
          <MachinesScreen t={t} machines={machineList}
            onDelete={(id) => setMachineList((p) => p.filter((m) => m.id !== id))}
            onAdd={() => {
              const id = Math.max(...machineList.map((m) => m.id)) + 1;
              setMachineList((p) => [...p, { id, name: `Mesin ${id}`, status: "idle", remainingSeconds: 0, totalSeconds: 3600, customer: null, customerId: null, startTime: null, defaultTimer: 60 }]);
            }}
          />
        )}
        {screen === "settings" && <SettingsScreen t={t} onThemeToggle={t.toggle} />}

        {screen !== "login" && (
          <BottomNav t={t} active={screen === "machine-detail" ? "dashboard" : screen} onNavigate={(s) => setScreen(s as Screen)} unreadCount={unreadCount} />
        )}
      </div>
    </div>
  );
}

/* ─── Login ────────────────────────────────────────────── */
function LoginScreen({ t, email, setEmail, password, setPassword, onLogin }: {
  t: ThemeColors; email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void; onLogin: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8" style={{ background: t.pageBg }}>
      <div
        className="absolute top-12 right-4 px-3 py-1.5 rounded-xl"
        style={{ background: t.isDark ? "#1E3A5F" : "#DBEAFE", fontSize: 11, fontWeight: 700, color: "#2563EB" }}
      >
        Admin Access
      </div>

      {/* Theme toggle on login */}
      <button
        onClick={t.toggle}
        className="absolute top-12 left-4 w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: t.isDark ? "#1E293B" : "#F1F5F9" }}
      >
        {t.isDark ? <SunIcon color="#F59E0B" /> : <MoonIcon color="#64748B" />}
      </button>

      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(145deg, #2563EB, #1D4ED8)", boxShadow: "0 12px 32px rgba(37,99,235,0.4)" }}>
          <WashIcon size={40} color="white" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>LaundryKu</h1>
        <p style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>Sistem Monitoring Laundry</p>
      </div>

      <div className="w-full space-y-4">
        <Field label="Email" t={t}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@laundryku.id"
            className="w-full rounded-xl px-4 py-3.5 outline-none"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
        </Field>
        <Field label="Password" t={t}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl px-4 py-3.5 outline-none"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
        </Field>
        <button onClick={onLogin} className="w-full py-4 rounded-xl text-white mt-1"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.45)" }}>
          Masuk
        </button>
        <p className="text-center" style={{ fontSize: 12, color: t.textMuted }}>Demo: ketik apa saja lalu tekan Masuk</p>
      </div>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────── */
function DashboardScreen({ t, machines, onMachineClick }: { t: ThemeColors; machines: Machine[]; onMachineClick: (id: number) => void }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const active = machines.filter((m) => m.status === "running" || m.status === "almost").length;
  const done = machines.filter((m) => m.status === "done").length;
  const idle = machines.filter((m) => m.status === "idle").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-5" style={{ background: "linear-gradient(160deg, #1D4ED8 0%, #2563EB 100%)" }}>
        <p className="text-blue-200" style={{ fontSize: 12, fontWeight: 500 }}>{today}</p>
        <h2 className="text-white mt-0.5" style={{ fontSize: 21, fontWeight: 800 }}>Selamat Datang, Admin 👋</h2>
        <div className="flex gap-2.5 mt-4">
          {[{ label: "Aktif", val: active }, { label: "Selesai", val: done }, { label: "Kosong", val: idle }].map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <span className="text-white" style={{ fontSize: 17, fontWeight: 800 }}>{s.val}</span>
              <span className="text-blue-200" style={{ fontSize: 11 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: t.textSec, marginBottom: 12, letterSpacing: "0.04em" }}>STATUS MESIN</p>
        <div className="grid grid-cols-2 gap-3">
          {machines.map((m) => <MachineCard key={m.id} t={t} machine={m} onClick={() => onMachineClick(m.id)} />)}
        </div>
      </div>
    </div>
  );
}

function MachineCard({ t, machine, onClick }: { t: ThemeColors; machine: Machine; onClick: () => void }) {
  const progress = machine.totalSeconds > 0 ? 1 - machine.remainingSeconds / machine.totalSeconds : 0;
  const sc = getStatusColor(machine.status);
  const sb = t.isDark ? getDarkStatusBg(machine.status) : getStatusBg(machine.status);

  return (
    <button onClick={onClick} className="rounded-2xl p-4 text-left transition-all active:scale-[0.97]"
      style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-start justify-between mb-3">
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{machine.name}</p>
        <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(machine.status)}</span>
      </div>
      <div className="rounded-full overflow-hidden mb-3" style={{ height: 4, background: t.isDark ? "#334155" : "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: sc, transition: "width 1s linear" }} />
      </div>
      {machine.status !== "idle" ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontVariantNumeric: "tabular-nums" }}>{formatTime(machine.remainingSeconds)}</p>
          <p className="truncate mt-0.5" style={{ fontSize: 10, fontWeight: 500, color: t.textMuted }}>{machine.customer}</p>
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

/* ─── Machine Detail ───────────────────────────────────── */
function MachineDetailScreen({ t, machine, onBack, onStop }: { t: ThemeColors; machine: Machine; onBack: () => void; onStop: () => void }) {
  const progress = machine.totalSeconds > 0 ? 1 - machine.remainingSeconds / machine.totalSeconds : 0;
  const r = 90; const circ = 2 * Math.PI * r;
  const sc = getStatusColor(machine.status);
  const sb = t.isDark ? getDarkStatusBg(machine.status) : getStatusBg(machine.status);
  const estFinish = machine.startTime ? (() => {
    const [h, m] = machine.startTime.split(":").map(Number);
    const tot = h * 60 + m + Math.floor(machine.totalSeconds / 60);
    return `${String(Math.floor(tot / 60) % 24).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
  })() : "--:--";

  return (
    <div className="flex-1 flex flex-col pb-20" style={{ background: t.pageBg }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3" style={{ background: t.headerBg, boxShadow: t.shadowSm, borderBottom: `1px solid ${t.divider}` }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.pillBg }}>
          <BackIcon color={t.text} size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{machine.name}</h2>
          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(machine.status)}</span>
        </div>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="110" cy="110" r={r} fill="none" stroke={t.isDark ? "#334155" : "#E2E8F0"} strokeWidth="14" />
            <circle cx="110" cy="110" r={r} fill="none" stroke={sc} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p style={{ fontSize: 38, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{formatTime(machine.remainingSeconds)}</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>Sisa Waktu</p>
          </div>
        </div>
        <div className="w-64 mt-3">
          <div className="flex justify-between mb-1.5">
            <span style={{ fontSize: 11, color: t.textMuted }}>Progres</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>{Math.round(progress * 100)}%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#E2E8F0" }}>
            <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: sc, transition: "width 1s linear" }} />
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3">
        <Card t={t}><InfoRow t={t} label="PELANGGAN" value={machine.customer || "—"} /></Card>
        <div className="grid grid-cols-2 gap-3">
          <Card t={t}><InfoRow t={t} label="MULAI" value={machine.startTime || "—"} /></Card>
          <Card t={t}><InfoRow t={t} label="EST. SELESAI" value={estFinish} /></Card>
        </div>
        {(machine.status === "running" || machine.status === "almost") && (
          <button onClick={onStop} className="w-full py-4 rounded-xl transition-all active:scale-[0.98]"
            style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 15, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.08)" : "transparent" }}>
            ⏹ Hentikan Mesin
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Notifications ────────────────────────────────────── */
function NotificationsScreen({ t, notifications, onMarkAllRead }: { t: ThemeColors; notifications: Notification[]; onMarkAllRead: () => void }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Notifikasi</h2>
        {unread > 0 && <button onClick={onMarkAllRead} style={{ fontSize: 13, fontWeight: 600, color: "#2563EB" }}>Tandai dibaca</button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {notifications.map((n) => (
          <div key={n.id} className="rounded-2xl p-4 flex gap-3"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}`, borderLeft: `4px solid ${!n.read ? getNotifColor(n.type) : t.cardBorder}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: t.isDark ? getDarkNotifBg(n.type) : getNotifBg(n.type) }}>
              <span style={{ fontSize: 18 }}>{getNotifEmoji(n.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              {n.machineName && <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB" }}>{n.machineName.toUpperCase()}</p>}
              <p style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{n.message}</p>
              <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{n.time} · Hari ini</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#2563EB" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Machines Management ──────────────────────────────── */
function MachinesScreen({ t, machines, onDelete, onAdd }: { t: ThemeColors; machines: Machine[]; onDelete: (id: number) => void; onAdd: () => void }) {
  const sc = (m: Machine) => getStatusColor(m.status);
  const sb = (m: Machine) => t.isDark ? getDarkStatusBg(m.status) : getStatusBg(m.status);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Manajemen Mesin</h2>
        <p style={{ fontSize: 13, color: t.textMuted }}>{machines.length} mesin terdaftar</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
        {machines.map((m) => (
          <div key={m.id} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: sb(m) }}>
              <WashIcon size={22} color={sc(m)} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc(m), background: sb(m) }}>{getStatusLabel(m.status)}</span>
                <span style={{ fontSize: 11, color: t.textMuted }}>Timer: {m.defaultTimer} mnt</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF" }}>
                <EditIcon color="#2563EB" />
              </button>
              <button onClick={() => onDelete(m.id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: t.isDark ? "#3B1616" : "#FEF2F2" }}>
                <TrashIcon color="#EF4444" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="absolute bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", boxShadow: "0 8px 24px rgba(37,99,235,0.5)" }}>
        <PlusIcon />
      </button>
    </div>
  );
}

/* ─── Settings ─────────────────────────────────────────── */
function SettingsScreen({ t, onThemeToggle }: { t: ThemeColors; onThemeToggle: () => void }) {
  const items = [
    { label: "Notifikasi", desc: "Kelola preferensi notifikasi", bg: "#F59E0B", icon: <BellSolidIcon /> },
    { label: "Profil Bisnis", desc: "Nama toko, alamat, kontak", bg: "#0EA5E9", icon: <StoreSolidIcon /> },
    { label: "Harga & Tarif", desc: "Atur tarif per kg", bg: "#F97316", icon: <PriceSolidIcon /> },
    { label: "Pengelolaan Admin", desc: "Tambah dan kelola akun admin", bg: "#8B5CF6", icon: <AdminSolidIcon /> },
    { label: "Backup Data", desc: "Ekspor dan backup data", bg: "#6366F1", icon: <BackupSolidIcon /> },
    { label: "Tentang Aplikasi", desc: "Versi 1.0.0", bg: "#3B82F6", icon: <InfoSolidIcon /> },
  ];
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Pengaturan</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {/* Profile Card */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", fontSize: 22, fontWeight: 800 }}>A</div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Admin</p>
            <p style={{ fontSize: 12, color: t.textMuted }} className="truncate">admin@laundryku.id</p>
          </div>
          <ChevronRightIcon color={t.textMuted} />
        </div>

        {/* Theme toggle */}
        <button onClick={onThemeToggle} className="w-full rounded-2xl p-4 flex items-center gap-3 transition-opacity active:opacity-70"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.isDark ? "#1E293B" : "#F1F5F9" }}>
            <span style={{ fontSize: 18 }}>{t.isDark ? "🌙" : "☀️"}</span>
          </div>
          <div className="flex-1 text-left">
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Tema Aplikasi</p>
            <p style={{ fontSize: 12, color: t.textMuted }}>{t.isDark ? "Mode gelap aktif" : "Mode terang aktif"}</p>
          </div>
          <ThemeToggleSmall isDark={t.isDark} />
        </button>

        {/* Settings Items */}
        {items.map((item) => (
          <button key={item.label} className="w-full rounded-2xl p-4 flex items-center gap-3 transition-opacity active:opacity-70"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.label}</p>
              <p style={{ fontSize: 12, color: t.textMuted }}>{item.desc}</p>
            </div>
            <ChevronRightIcon color={t.textMuted} />
          </button>
        ))}

        <button className="w-full py-4 rounded-xl transition-opacity active:opacity-70"
          style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 15, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.06)" : "transparent" }}>
          Keluar
        </button>
      </div>
    </div>
  );
}

/* ─── Bottom Nav ───────────────────────────────────────── */
function BottomNav({ t, active, onNavigate, unreadCount }: { t: ThemeColors; active: string; onNavigate: (s: string) => void; unreadCount: number }) {
  const items = [
    { id: "dashboard", label: "Beranda", icon: (c: string) => <HomeIcon color={c} /> },
    { id: "machines", label: "Mesin", icon: (c: string) => <MachineNavIcon color={c} /> },
    { id: "notifications", label: "Notif", icon: (c: string) => <BellIcon color={c} unread={unreadCount} /> },
    { id: "settings", label: "Setelan", icon: (c: string) => <SettingIcon color={c} /> },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 72, background: t.navBg, borderTop: `1px solid ${t.divider}`, boxShadow: `0 -4px 20px rgba(0,0,0,${t.isDark ? "0.3" : "0.06"})` }}>
      {items.map((item) => {
        const isActive = active === item.id;
        const color = isActive ? "#2563EB" : t.textMuted;
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1" style={{ color }}>
            {item.icon(color)}
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Shared helpers ───────────────────────────────────── */
function Card({ t, children }: { t: ThemeColors; children: React.ReactNode }) {
  return <div className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>{children}</div>;
}
function InfoRow({ t, label, value }: { t: ThemeColors; label: string; value: string }) {
  return <>
    <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em" }}>{label}</p>
    <p style={{ fontSize: 17, fontWeight: 700, color: t.text, marginTop: 4 }}>{value}</p>
  </>;
}
function Field({ t, label, children }: { t: ThemeColors; label: string; children: React.ReactNode }) {
  return <div><label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 600, color: t.textSec }}>{label}</label>{children}</div>;
}

function getDarkStatusBg(status: string): string {
  if (status === "running") return "#1E3A5F";
  if (status === "done") return "#14532D";
  if (status === "almost") return "#431407";
  return "#1E293B";
}
function getDarkNotifBg(type: string): string {
  if (type === "finish") return "#14532D";
  if (type === "warning") return "#431407";
  return "#1E3A5F";
}
function getNotifColor(type: string) { return type === "finish" ? "#22C55E" : type === "warning" ? "#F97316" : "#3B82F6"; }
function getNotifBg(type: string) { return type === "finish" ? "#F0FDF4" : type === "warning" ? "#FFF7ED" : "#EFF6FF"; }
function getNotifEmoji(type: string) { return type === "finish" ? "✅" : type === "warning" ? "⚠️" : "📋"; }

function ThemeToggleSmall({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center rounded-full" style={{ width: 40, height: 22, background: isDark ? "#2563EB" : "#CBD5E1", padding: "2px" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", transform: isDark ? "translateX(18px)" : "translateX(0)", transition: "transform 0.25s" }} />
    </div>
  );
}

/* ─── SVG Icons ────────────────────────────────────────── */
function WashIcon({ size = 24, color = "#2563EB" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="13" r="5" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="13" r="2.2" stroke={color} strokeWidth="1.4" fill="none" />
      <circle cx="6.5" cy="5.5" r="1" fill={color} />
      <circle cx="9.5" cy="5.5" r="1" fill={color} />
      <line x1="13" y1="5.5" x2="17" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BellSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7zm0 20a2 2 0 002-2h-4a2 2 0 002 2z" /></svg>; }
function StoreSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2 6h20l-2 7H4L2 6zm2 9h16v4H4v-4zm5-9V4h6v2" /></svg>; }
function PriceSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="11" fill="#F97316" fontWeight="bold">Rp</text></svg>; }
function AdminSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>; }
function BackupSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>; }
function InfoSolidIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>; }
function BackIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function HomeIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function MachineNavIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" fill="none" /><circle cx="12" cy="13" r="4.5" stroke={color} strokeWidth="2" fill="none" /><circle cx="6.5" cy="5.5" r="1" fill={color} /><circle cx="9.5" cy="5.5" r="1" fill={color} /></svg>;
}
function BellIcon({ color, unread }: { color: string; unread: number }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "#EF4444", fontSize: 9, fontWeight: 700 }}>{unread}</div>}
    </div>
  );
}
function SettingIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ChevronRightIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function EditIcon({ color }: { color: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function TrashIcon({ color }: { color: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PlusIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>;
}
function SunIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill={color} /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}
function MoonIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={color} /></svg>;
}
