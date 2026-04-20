import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines,
  customerOrders,
  customerNotifications,
  formatTime,
  getStatusColor,
  formatPrice,
} from "../../data/mockData";

type Screen = "splash" | "login" | "home" | "history" | "notifications" | "profile";
type AuthTab = "login" | "register";
const FONT = "'Plus Jakarta Sans', sans-serif";

const CUSTOMER = {
  name: "Budi Santoso",
  phone: "0812-3456-7890",
  email: "budi@email.com",
  address: "Jl. Merdeka No. 12, Jakarta",
  avatar: "BS",
};

function getDarkStatusBg(status: string): string {
  if (status === "running") return "#1E3A5F";
  if (status === "done") return "#14532D";
  if (status === "almost") return "#431407";
  return "#1E293B";
}

function getStatusBgSafe(status: string, isDark: boolean): string {
  if (isDark) return getDarkStatusBg(status);
  if (status === "running") return "#EFF6FF";
  if (status === "done") return "#F0FDF4";
  if (status === "almost") return "#FFF7ED";
  return "#F8FAFC";
}

export function CustomerMobileApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const [screen, setScreen] = useState<Screen>("splash");
  const [machineList, setMachineList] = useState(machines);
  const [notifications, setNotifications] = useState(customerNotifications);

  useEffect(() => {
    if (screen === "splash") {
      const tm = setTimeout(() => setScreen("login"), 2500);
      return () => clearTimeout(tm);
    }
  }, [screen]);

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

  const activeMachine = machineList.find((m) => m.id === 1)!;
  const unreadCount = notifications.filter((n) => !n.read).length;

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

        {/* Controls */}
        {screen !== "splash" && (
          <>
            <button onClick={() => navigate("/")}
              className="absolute top-5 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: t.isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)", color: t.textSec, fontSize: 11, fontWeight: 600, boxShadow: t.shadowSm, backdropFilter: "blur(10px)" }}>
              <BackIcon color={t.textSec} size={12} />
              Kembali
            </button>
            <button onClick={t.toggle}
              className="absolute top-5 right-4 z-50 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: t.isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)", boxShadow: t.shadowSm }}>
              {t.isDark ? <SunIcon color="#F59E0B" /> : <MoonIcon color="#64748B" />}
            </button>
          </>
        )}

        {screen === "splash" && <SplashScreen t={t} />}
        {screen === "login" && <AuthScreen t={t} onLogin={() => setScreen("home")} />}
        {screen === "home" && <HomeScreen t={t} machine={activeMachine} customerName={CUSTOMER.name} />}
        {screen === "history" && <HistoryScreen t={t} />}
        {screen === "notifications" && (
          <NotificationsScreen t={t} notifications={notifications} onMarkAllRead={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))} />
        )}
        {screen === "profile" && <ProfileScreen t={t} customer={CUSTOMER} onLogout={() => setScreen("login")} />}

        {screen !== "splash" && screen !== "login" && (
          <BottomNav t={t} active={screen} onNavigate={(s) => setScreen(s as Screen)} unreadCount={unreadCount} />
        )}
      </div>
    </div>
  );
}

/* ─── Splash ───────────────────────────────────────────── */
function SplashScreen({ t }: { t: ThemeColors }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPct((p) => Math.min(p + 4, 100)), 100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center"
      style={{ background: t.isDark ? "linear-gradient(160deg, #0F172A 0%, #0B1120 100%)" : "linear-gradient(160deg, #2563EB 0%, #1D4ED8 40%, #1E40AF 100%)" }}>
      <div className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: t.isDark ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: t.isDark ? "1px solid rgba(37,99,235,0.4)" : "none" }}>
        <WashIllustration />
      </div>
      <h1 style={{ fontSize: 34, fontWeight: 800, color: "white" }}>LaundryKu</h1>
      <p style={{ fontSize: 14, color: t.isDark ? "#94A3B8" : "#BFDBFE", marginTop: 8 }}>Lacak laundry kamu kapan saja</p>
      <div className="mt-16 w-40">
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.15)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.isDark ? "#2563EB" : "white" }} />
        </div>
        <p className="text-center mt-3" style={{ fontSize: 12, color: t.isDark ? "#64748B" : "#BFDBFE" }}>Memuat...</p>
      </div>
    </div>
  );
}

/* ─── Auth ─────────────────────────────────────────────── */
function AuthScreen({ t, onLogin }: { t: ThemeColors; onLogin: () => void }) {
  const [tab, setTab] = useState<AuthTab>("login");
  const [vals, setVals] = useState({ phone: "", pass: "", name: "", rphone: "", rpass: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setVals((v) => ({ ...v, [k]: e.target.value }));

  return (
    <div className="flex-1 flex flex-col" style={{ background: t.pageBg }}>
      <div className="h-36 flex flex-col items-center justify-end pb-5" style={{ background: "linear-gradient(160deg, #1D4ED8, #2563EB)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <WashIconSm color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "white" }}>LaundryKu</h1>
        </div>
      </div>

      {/* Tab */}
      <div className="mx-6 mt-5 p-1 rounded-xl flex" style={{ background: t.isDark ? "#1E293B" : "white", boxShadow: t.shadowSm }}>
        {(["login", "register"] as AuthTab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className="flex-1 py-3 rounded-xl transition-all"
            style={{ background: tab === tb ? "#2563EB" : "transparent", color: tab === tb ? "white" : t.textMuted, fontSize: 14, fontWeight: 700 }}>
            {tb === "login" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 pt-6 space-y-4">
        {tab === "login" ? (
          <>
            <Field t={t} label="No. HP / Email">
              <input value={vals.phone} onChange={set("phone")} placeholder="0812-xxxx-xxxx" className="w-full rounded-xl px-4 py-3.5 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <Field t={t} label="Password">
              <input type="password" value={vals.pass} onChange={set("pass")} placeholder="••••••••" className="w-full rounded-xl px-4 py-3.5 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <button onClick={onLogin} className="w-full py-4 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
              Masuk
            </button>
            <p className="text-center" style={{ fontSize: 12, color: t.textMuted }}>Demo: klik Masuk untuk lanjut</p>
          </>
        ) : (
          <>
            <Field t={t} label="Nama Lengkap">
              <input value={vals.name} onChange={set("name")} placeholder="Nama kamu" className="w-full rounded-xl px-4 py-3.5 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <Field t={t} label="No. HP">
              <input value={vals.rphone} onChange={set("rphone")} placeholder="0812-xxxx-xxxx" className="w-full rounded-xl px-4 py-3.5 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <Field t={t} label="Password">
              <input type="password" value={vals.rpass} onChange={set("rpass")} placeholder="Buat password" className="w-full rounded-xl px-4 py-3.5 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <button onClick={onLogin} className="w-full py-4 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
              Daftar Sekarang
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Home ─────────────────────────────────────────────── */
function HomeScreen({ t, machine, customerName }: { t: ThemeColors; machine: typeof machines[0]; customerName: string }) {
  const progress = machine.totalSeconds > 0 ? 1 - machine.remainingSeconds / machine.totalSeconds : 0;
  const sc = getStatusColor(machine.status);
  const sb = getStatusBgSafe(machine.status, t.isDark);
  const steps = ["Diterima", "Dicuci", "Selesai", "Ambil"];
  const step = machine.status === "idle" ? 0 : machine.status === "running" || machine.status === "almost" ? 1 : machine.status === "done" ? 2 : 3;
  const statusLabel = machine.status === "running" || machine.status === "almost" ? "Sedang Dicuci" : machine.status === "done" ? "Selesai" : "Menunggu";
  const statusEmoji = machine.status === "running" || machine.status === "almost" ? "🔄" : machine.status === "done" ? "✅" : "⏳";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-5" style={{ background: "linear-gradient(160deg, #1D4ED8 0%, #2563EB 100%)" }}>
        <p style={{ fontSize: 12, color: "#BFDBFE", fontWeight: 500 }}>Halo,</p>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: "white", marginTop: 2 }}>{customerName} 👋</h2>
        <p style={{ fontSize: 13, color: "#BFDBFE", marginTop: 2 }}>
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Active Order */}
        {machine.status !== "idle" ? (
          <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Pesanan Aktif</p>
              <span style={{ fontSize: 11, color: t.textMuted }}>#000{machine.id}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: sb }}>
              <span style={{ fontSize: 22 }}>{statusEmoji}</span>
              <div className="flex-1">
                <p style={{ fontSize: 15, fontWeight: 700, color: sc }}>{statusLabel}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{machine.name}</p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 24, fontWeight: 800, color: sc, fontVariantNumeric: "tabular-nums" }}>
                  {machine.status !== "done" ? formatTime(machine.remainingSeconds) : "00:00"}
                </p>
                <p style={{ fontSize: 11, color: t.textMuted }}>Sisa waktu</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span style={{ fontSize: 11, color: t.textMuted }}>Progres</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sc }}>{Math.round(progress * 100)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#F1F5F9" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: sc }} />
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: i <= step ? sc : t.isDark ? "#334155" : "#E2E8F0" }}>
                      {i < step ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ background: i <= step ? "white" : t.textMuted }} />
                      )}
                    </div>
                    <p style={{ fontSize: 9, fontWeight: i <= step ? 700 : 400, color: i <= step ? sc : t.textMuted, marginTop: 4, width: 48, textAlign: "center" }}>{label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 mb-5 mx-1" style={{ height: 2, background: i < step ? sc : t.isDark ? "#334155" : "#E2E8F0", borderRadius: 2 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: t.pillBg }}>
              <WashIconSm color={t.textMuted} size={36} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Tidak ada pesanan aktif</p>
            <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Pesanan laundry kamu akan tampil di sini</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "TOTAL ORDER", val: "4", sub: "Semua waktu" },
            { label: "TOTAL BAYAR", val: "Rp 84Rb", sub: "Semua waktu" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 4 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: t.textMuted }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Promo */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: t.isDark ? "linear-gradient(135deg, #1E3A5F, #1D4ED8)" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Promo Hari Ini! 🎉</p>
            <p style={{ fontSize: 12, color: "#BFDBFE", marginTop: 2 }}>Diskon 10% untuk laundry di atas 5kg</p>
          </div>
          <span className="ml-auto" style={{ fontSize: 28, fontWeight: 900, color: "white" }}>10%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── History ──────────────────────────────────────────── */
function HistoryScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader t={t} title="Riwayat Pesanan" subtitle={`${customerOrders.length} total pesanan`} />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {customerOrders.map((order) => {
          const sc = order.status === "done" ? "#22C55E" : order.status === "active" ? "#3B82F6" : "#94A3B8";
          const sb = order.status === "done" ? (t.isDark ? "#14532D" : "#F0FDF4") : order.status === "active" ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.pillBg;
          const label = order.status === "done" ? "Selesai" : order.status === "active" ? "Aktif" : "Dibatalkan";
          return (
            <div key={order.id} className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{order.machineName}</p>
                  <p style={{ fontSize: 12, color: t.textMuted }}>{order.date}</p>
                </div>
                <span className="px-3 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 700, color: sc, background: sb }}>{label}</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "BERAT", val: `${order.weight} kg` },
                  { label: "HARGA", val: formatPrice(order.price) },
                  { label: "MULAI", val: order.startTime },
                ].map((d) => (
                  <div key={d.label} className="flex-1 rounded-xl p-3" style={{ background: t.pillBg }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, letterSpacing: "0.04em" }}>{d.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginTop: 2 }}>{d.val}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Notifications ────────────────────────────────────── */
function NotificationsScreen({ t, notifications, onMarkAllRead }: { t: ThemeColors; notifications: typeof customerNotifications; onMarkAllRead: () => void }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Notifikasi</h2>
          {unread > 0 && <p style={{ fontSize: 12, color: t.textMuted }}>{unread} belum dibaca</p>}
        </div>
        {unread > 0 && <button onClick={onMarkAllRead} style={{ fontSize: 13, fontWeight: 600, color: "#2563EB" }}>Tandai dibaca</button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {notifications.map((n) => (
          <div key={n.id} className="rounded-2xl p-4 flex gap-3"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}`, borderLeft: `4px solid ${!n.read ? "#2563EB" : t.cardBorder}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: n.read ? t.pillBg : (t.isDark ? "#1E3A5F" : "#EFF6FF") }}>
              <span style={{ fontSize: 18 }}>{n.message.includes("selesai") ? "✅" : "📋"}</span>
            </div>
            <div className="flex-1">
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

/* ─── Profile ──────────────────────────────────────────── */
function ProfileScreen({ t, customer, onLogout }: { t: ThemeColors; customer: typeof CUSTOMER; onLogout: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader t={t} title="Profil" />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {/* Avatar */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontSize: 22, fontWeight: 800 }}>
            {customer.avatar}
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{name}</p>
            <p style={{ fontSize: 13, color: t.textMuted }}>{customer.email}</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF" }}>
            <EditIcon color="#2563EB" />
          </button>
        </div>

        {editing ? (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Edit Profil</p>
            <Field t={t} label="Nama Lengkap">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <Field t={t} label="No. HP">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <Field t={t} label="Alamat">
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full rounded-xl px-4 py-3 outline-none resize-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
            </Field>
            <button onClick={() => setEditing(false)} className="w-full py-3.5 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontSize: 14, fontWeight: 700 }}>
              Simpan Perubahan
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            {[{ label: "No. HP", val: phone, icon: "📱" }, { label: "Alamat", val: address, icon: "📍" }, { label: "Email", val: customer.email, icon: "✉️" }].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>{item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{item.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {[{ label: "Bantuan & FAQ", icon: "❓" }, { label: "Kebijakan Privasi", icon: "🔒" }, { label: "Hubungi Kami", icon: "💬" }].map((item) => (
          <button key={item.label} className="w-full rounded-2xl p-4 flex items-center gap-3"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span className="flex-1 text-left" style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{item.label}</span>
            <ChevronRightIcon color={t.textMuted} />
          </button>
        ))}

        <button onClick={onLogout} className="w-full py-4 rounded-xl"
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
    { id: "home", label: "Beranda", icon: (c: string) => <HomeIcon color={c} /> },
    { id: "history", label: "Riwayat", icon: (c: string) => <HistoryIcon color={c} /> },
    { id: "notifications", label: "Notif", icon: (c: string) => <BellIcon color={c} unread={unreadCount} /> },
    { id: "profile", label: "Profil", icon: (c: string) => <ProfileIcon color={c} /> },
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

/* ─── Shared ───────────────────────────────────────────── */
function PageHeader({ t, title, subtitle }: { t: ThemeColors; title: string; subtitle?: string }) {
  return (
    <div className="px-5 pt-14 pb-4" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}
function Field({ t, label, children }: { t: ThemeColors; label: string; children: React.ReactNode }) {
  return <div><label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: t.textSec }}>{label}</label>{children}</div>;
}

/* ─── SVG Icons ────────────────────────────────────────── */
function WashIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="6" width="48" height="52" rx="8" stroke="white" strokeWidth="2.5" fill="none" />
      <rect x="8" y="6" width="48" height="14" rx="8" fill="rgba(255,255,255,0.12)" />
      <circle cx="32" cy="38" r="14" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="38" r="8" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
      <circle cx="32" cy="38" r="3.5" fill="white" />
      <circle cx="18" cy="14" r="2.5" fill="white" />
      <circle cx="25" cy="14" r="2.5" fill="white" />
      <line x1="34" y1="14" x2="46" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="30" r="2" fill="rgba(255,255,255,0.4)" />
      <circle cx="42" cy="28" r="3" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}
function WashIconSm({ color = "#2563EB", size = 20 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" fill="none" /><circle cx="12" cy="13" r="5" stroke={color} strokeWidth="2" fill="none" /><circle cx="6.5" cy="5.5" r="1" fill={color} /><circle cx="9.5" cy="5.5" r="1" fill={color} /></svg>;
}
function BackIcon({ color, size = 14 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function HomeIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function HistoryIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" /></svg>;
}
function BellIcon({ color, unread }: { color: string; unread: number }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "#EF4444", fontSize: 9, fontWeight: 700 }}>{unread}</div>}
    </div>
  );
}
function ProfileIcon({ color }: { color: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}
function ChevronRightIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function EditIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SunIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill={color} /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}
function MoonIcon({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={color} /></svg>;
}
