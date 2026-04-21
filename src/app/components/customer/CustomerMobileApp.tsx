import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines, customerOrders, customerNotifications,
  formatTime, getStatusColor, formatPrice,
} from "../../data/mockData";

type Screen =
  | "splash" | "login" | "home" | "history"
  | "notifications" | "profile"
  | "loyalty" | "faq" | "privacy" | "contact";
type AuthTab = "login" | "register";

const FONT = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = "#2563EB";
const CUSTOMER = {
  name: "Budi Santoso", phone: "0812-3456-7890",
  email: "budi@email.com", address: "Jl. Merdeka No. 12, Jakarta", avatar: "BS",
};

// Customer's stamp count (out of 5)
const TOTAL_ORDERS = 4; // 4 pesanan selesai/aktif = 4 stamp
const STAMPS_FOR_FREE = 5;

function getDarkBg(s: string) { return s === "running" ? "#1E3A5F" : s === "done" ? "#14532D" : s === "almost" ? "#431407" : "#1E293B"; }
function sbSafe(s: string, dark: boolean) { if (dark) return getDarkBg(s); return s === "running" ? "#EFF6FF" : s === "done" ? "#F0FDF4" : s === "almost" ? "#FFF7ED" : "#F8FAFC"; }

function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const u = () => setScale(Math.min(1, (window.innerWidth - 32) / 375, (window.innerHeight - 32) / 812));
    u(); window.addEventListener("resize", u); return () => window.removeEventListener("resize", u);
  }, []);
  return scale;
}

/* ══════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════ */
export function CustomerMobileApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const scale = usePhoneScale();
  const [screen, setScreen] = useState<Screen>("splash");
  const [machineList, setMachineList] = useState(machines);
  const [notifs, setNotifs] = useState(customerNotifications);
  const [stamps, setStamps] = useState(TOTAL_ORDERS); // live stamps

  useEffect(() => {
    if (screen === "splash") { const tm = setTimeout(() => setScreen("login"), 2500); return () => clearTimeout(tm); }
  }, [screen]);

  useEffect(() => {
    const iv = setInterval(() => setMachineList(p => p.map(m => {
      if (m.status !== "running" && m.status !== "almost") return m;
      const s = Math.max(0, m.remainingSeconds - 1);
      return { ...m, remainingSeconds: s, status: s === 0 ? "done" : s <= 300 ? "almost" : "running" };
    })), 1000);
    return () => clearInterval(iv);
  }, []);

  const activeMachine = machineList.find(m => m.id === 1)!;
  const unread = notifs.filter(n => !n.read).length;

  const goTo = (s: Screen) => setScreen(s);

  const isBottomNav = !["splash", "login", "loyalty", "faq", "privacy", "contact"].includes(screen);
  const isSubScreen = ["loyalty", "faq", "privacy", "contact"].includes(screen);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: t.frameBg, fontFamily: FONT, transition: "background 0.3s" }}>
      <div style={{
        width: 375, height: 812,
        transform: `scale(${scale})`, transformOrigin: "center center",
        borderRadius: 44,
        boxShadow: "0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
        background: t.pageBg, overflow: "hidden",
        display: "flex", flexDirection: "column", position: "relative",
      }}>
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-24 h-1.5 rounded-full"
          style={{ background: t.isDark ? "#334155" : "#CBD5E1" }} />

        {/* Controls */}
        {screen !== "splash" && (
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
            {isSubScreen ? (
              <button onClick={() => setScreen("profile")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                style={{ background: t.isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)", color: t.textSec, fontSize: 11, fontWeight: 600, boxShadow: t.shadowSm, backdropFilter: "blur(8px)" }}>
                <ChevL color={t.textSec} size={12} /> Kembali
              </button>
            ) : (
              <button onClick={() => navigate("/")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                style={{ background: t.isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)", color: t.textSec, fontSize: 11, fontWeight: 600, boxShadow: t.shadowSm, backdropFilter: "blur(8px)" }}>
                <ChevL color={t.textSec} size={12} /> Home
              </button>
            )}
            <button onClick={t.toggle} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: t.isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)", boxShadow: t.shadowSm }}>
              {t.isDark ? <Sun /> : <Moon />}
            </button>
          </div>
        )}

        {screen === "splash" && <SplashScreen t={t} />}
        {screen === "login" && <AuthScreen t={t} onLogin={() => setScreen("home")} />}
        {screen === "home" && <HomeScreen t={t} machine={activeMachine} customerName={CUSTOMER.name} stamps={stamps} onGoLoyalty={() => goTo("loyalty")} />}
        {screen === "history" && <HistoryScreen t={t} />}
        {screen === "notifications" && <NotificationsScreen t={t} notifs={notifs} onMarkAll={() => setNotifs(p => p.map(n => ({ ...n, read: true })))} />}
        {screen === "profile" && <ProfileScreen t={t} customer={CUSTOMER} stamps={stamps} onLogout={() => setScreen("login")} onNavigate={goTo} />}
        {screen === "loyalty" && <LoyaltyScreen t={t} stamps={stamps} onUseReward={() => setStamps(0)} />}
        {screen === "faq" && <FAQScreen t={t} />}
        {screen === "privacy" && <PrivacyScreen t={t} />}
        {screen === "contact" && <ContactScreen t={t} />}

        {isBottomNav && (
          <BottomNav t={t} active={screen} onNav={s => setScreen(s as Screen)} unread={unread} />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SPLASH
══════════════════════════════════════════════ */
function SplashScreen({ t }: { t: ThemeColors }) {
  const [pct, setPct] = useState(0);
  useEffect(() => { const iv = setInterval(() => setPct(p => Math.min(p + 4, 100)), 100); return () => clearInterval(iv); }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center"
      style={{ background: t.isDark ? "linear-gradient(160deg,#0F172A,#0B1120)" : "linear-gradient(160deg,#2563EB,#1D4ED8,#1E40AF)" }}>
      <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: t.isDark ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: t.isDark ? "1px solid rgba(37,99,235,0.4)" : "none" }}>
        <WashIco size={52} color="white" />
      </div>
      <h1 className="text-white" style={{ fontSize: 34, fontWeight: 800 }}>LaundryKu</h1>
      <p style={{ fontSize: 14, color: t.isDark ? "#94A3B8" : "#BFDBFE", marginTop: 8 }}>Lacak laundry kamu kapan saja</p>
      <div className="mt-14 w-40">
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.15)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.isDark ? PRIMARY : "white", transition: "width 0.1s" }} />
        </div>
        <p className="text-center mt-3" style={{ fontSize: 12, color: t.isDark ? "#64748B" : "#BFDBFE" }}>Memuat...</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════ */
function AuthScreen({ t, onLogin }: { t: ThemeColors; onLogin: () => void }) {
  const [tab, setTab] = useState<AuthTab>("login");
  const [vals, setVals] = useState({ phone: "", pass: "", name: "", rphone: "", rpass: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setVals(v => ({ ...v, [k]: e.target.value }));
  const [loading, setLoading] = useState(false);
  const submit = () => { setLoading(true); setTimeout(() => { setLoading(false); onLogin(); }, 800); };
  const inp: React.CSSProperties = { background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "12px 14px", outline: "none", width: "100%" };

  return (
    <div className="flex-1 flex flex-col" style={{ background: t.pageBg }}>
      <div className="h-40 flex flex-col items-center justify-end pb-6" style={{ background: "linear-gradient(160deg,#1D4ED8,#2563EB)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><WashIco size={20} color="white" /></div>
          <h1 className="text-white" style={{ fontSize: 22, fontWeight: 800 }}>LaundryKu</h1>
        </div>
      </div>
      <div className="mx-5 mt-5 p-1 rounded-xl flex" style={{ background: t.isDark ? "#1E293B" : "white", boxShadow: t.shadowSm }}>
        {(["login", "register"] as AuthTab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className="flex-1 py-3 rounded-xl"
            style={{ background: tab === tb ? PRIMARY : "transparent", color: tab === tb ? "white" : t.textMuted, fontSize: 14, fontWeight: 700 }}>
            {tb === "login" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>
      <div className="flex-1 px-5 pt-5 space-y-3.5 overflow-y-auto pb-8">
        {tab === "login" ? (
          <>
            <IF t={t} label="No. HP / Email"><input value={vals.phone} onChange={set("phone")} placeholder="0812-xxxx-xxxx" style={inp} /></IF>
            <IF t={t} label="Password"><input type="password" value={vals.pass} onChange={set("pass")} placeholder="••••••••" style={inp} /></IF>
            <button onClick={submit} disabled={loading} className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2"
              style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
              {loading ? <><Spinner /> Masuk...</> : "Masuk"}
            </button>
            <p className="text-center" style={{ fontSize: 12, color: t.textMuted }}>Demo: klik Masuk untuk lanjut</p>
          </>
        ) : (
          <>
            <IF t={t} label="Nama Lengkap"><input value={vals.name} onChange={set("name")} placeholder="Nama kamu" style={inp} /></IF>
            <IF t={t} label="No. HP"><input value={vals.rphone} onChange={set("rphone")} placeholder="0812-xxxx-xxxx" style={inp} /></IF>
            <IF t={t} label="Password"><input type="password" value={vals.rpass} onChange={set("rpass")} placeholder="Buat password" style={inp} /></IF>
            <button onClick={submit} disabled={loading} className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2"
              style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
              {loading ? <><Spinner /> Daftar...</> : "Daftar Sekarang"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME
══════════════════════════════════════════════ */
function HomeScreen({ t, machine: m, customerName, stamps, onGoLoyalty }: {
  t: ThemeColors; machine: typeof machines[0]; customerName: string; stamps: number; onGoLoyalty: () => void;
}) {
  const prog = m.totalSeconds > 0 ? 1 - m.remainingSeconds / m.totalSeconds : 0;
  const sc = getStatusColor(m.status);
  const sb = sbSafe(m.status, t.isDark);
  const steps = ["Diterima", "Dicuci", "Selesai", "Ambil"];
  const step = m.status === "idle" ? 0 : (m.status === "running" || m.status === "almost") ? 1 : m.status === "done" ? 2 : 3;
  const statusLabel = (m.status === "running" || m.status === "almost") ? "Sedang Dicuci" : m.status === "done" ? "Selesai" : "Menunggu";
  const statusEmoji = (m.status === "running" || m.status === "almost") ? "🔄" : m.status === "done" ? "✅" : "⏳";
  const freeReady = stamps >= STAMPS_FOR_FREE;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-14 pb-5" style={{ background: "linear-gradient(160deg,#1D4ED8,#2563EB)" }}>
        <p className="text-blue-200" style={{ fontSize: 12 }}>Halo,</p>
        <h2 className="text-white mt-0.5" style={{ fontSize: 21, fontWeight: 800 }}>{customerName} 👋</h2>
        <p className="text-blue-200" style={{ fontSize: 13, marginTop: 2 }}>
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Loyalty mini card */}
        <button onClick={onGoLoyalty} className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
          style={{ background: freeReady ? "linear-gradient(135deg,#22C55E,#16A34A)" : (t.isDark ? "linear-gradient(135deg,#1E3A5F,#1E40AF)" : "linear-gradient(135deg,#EFF6FF,#DBEAFE)"), border: `1px solid ${freeReady ? "#4ADE80" : (t.isDark ? "#334155" : "#BFDBFE")}`, boxShadow: t.shadowSm }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: freeReady ? "rgba(255,255,255,0.25)" : (t.isDark ? "rgba(37,99,235,0.3)" : "rgba(37,99,235,0.15)") }}>
            <span style={{ fontSize: 22 }}>{freeReady ? "🎁" : "⭐"}</span>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 700, color: freeReady ? "white" : (t.isDark ? "#93C5FD" : PRIMARY) }}>
              {freeReady ? "Cuci Gratis Tersedia!" : "Program Loyalitas"}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: i < stamps ? (freeReady ? "white" : PRIMARY) : (t.isDark ? "#334155" : "#CBD5E1") }}>
                  {i < stamps && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={freeReady ? "#16A34A" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
              ))}
              <p style={{ fontSize: 11, color: freeReady ? "rgba(255,255,255,0.85)" : (t.isDark ? "#93C5FD" : "#3B82F6"), marginLeft: 4, fontWeight: 600 }}>
                {freeReady ? "Tap untuk klaim!" : `${stamps}/${STAMPS_FOR_FREE} stamp`}
              </p>
            </div>
          </div>
          <ChevR color={freeReady ? "rgba(255,255,255,0.7)" : (t.isDark ? "#60A5FA" : PRIMARY)} />
        </button>

        {/* Active order */}
        {m.status !== "idle" ? (
          <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Pesanan Aktif</p>
              <span style={{ fontSize: 11, color: t.textMuted }}>#000{m.id}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: sb }}>
              <span style={{ fontSize: 22 }}>{statusEmoji}</span>
              <div className="flex-1">
                <p style={{ fontSize: 15, fontWeight: 700, color: sc }}>{statusLabel}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{m.name}</p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 24, fontWeight: 800, color: sc, fontVariantNumeric: "tabular-nums" }}>
                  {m.status !== "done" ? formatTime(m.remainingSeconds) : "00:00"}
                </p>
                <p style={{ fontSize: 11, color: t.textMuted }}>Sisa waktu</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span style={{ fontSize: 11, color: t.textMuted }}>Progres</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sc }}>{Math.round(prog * 100)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#F1F5F9" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${prog * 100}%`, background: sc }} />
              </div>
            </div>
            {/* Stepper */}
            <div className="flex items-center">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: i <= step ? sc : t.isDark ? "#334155" : "#E2E8F0" }}>
                      {i < step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <div className="w-2 h-2 rounded-full" style={{ background: i <= step ? "white" : t.textMuted }} />}
                    </div>
                    <p style={{ fontSize: 9, fontWeight: i <= step ? 700 : 400, color: i <= step ? sc : t.textMuted, marginTop: 4, width: 48, textAlign: "center" }}>{label}</p>
                  </div>
                  {i < steps.length - 1 && <div className="flex-1 mb-5 mx-0.5" style={{ height: 2, background: i < step ? sc : t.isDark ? "#334155" : "#E2E8F0", borderRadius: 2 }} />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: t.pillBg }}>
              <WashIco size={36} color={t.textMuted} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Tidak ada pesanan aktif</p>
            <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Pesanan laundry kamu akan tampil di sini</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[{ l: "TOTAL ORDER", v: "4", s: "Semua waktu" }, { l: "TOTAL BAYAR", v: "Rp 84Rb", s: "Semua waktu" }].map(x => (
            <div key={x.l} className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{x.l}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 4 }}>{x.v}</p>
              <p style={{ fontSize: 11, color: t.textMuted }}>{x.s}</p>
            </div>
          ))}
        </div>

        {/* Promo */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: t.isDark ? "linear-gradient(135deg,#1E3A5F,#1D4ED8)" : "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
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

/* ══════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════ */
function HistoryScreen({ t }: { t: ThemeColors }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Riwayat Pesanan" sub={`${customerOrders.length} total pesanan`} />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {customerOrders.map(order => {
          const sc = order.status === "done" ? "#22C55E" : order.status === "active" ? PRIMARY : "#94A3B8";
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
                {[{ l: "BERAT", v: `${order.weight} kg` }, { l: "HARGA", v: formatPrice(order.price) }, { l: "MULAI", v: order.startTime }].map(d => (
                  <div key={d.l} className="flex-1 rounded-xl p-3" style={{ background: t.pillBg }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, letterSpacing: "0.04em" }}>{d.l}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginTop: 2 }}>{d.v}</p>
                  </div>
                ))}
              </div>
              {order.status === "done" && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <p style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>+1 Stamp Loyalitas</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════ */
function NotificationsScreen({ t, notifs, onMarkAll }: { t: ThemeColors; notifs: typeof customerNotifications; onMarkAll: () => void }) {
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between"
        style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Notifikasi</h2>
          {unread > 0 && <p style={{ fontSize: 12, color: t.textMuted }}>{unread} belum dibaca</p>}</div>
        {unread > 0 && <button onClick={onMarkAll} style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>Tandai dibaca</button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {notifs.map(n => (
          <div key={n.id} className="rounded-2xl p-4 flex gap-3"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${n.read ? t.cardBorder : PRIMARY}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: n.read ? t.pillBg : (t.isDark ? "#1E3A5F" : "#EFF6FF") }}>
              <span style={{ fontSize: 18 }}>{n.message.includes("selesai") ? "✅" : "📋"}</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 13, color: t.text }}>{n.message}</p>
              <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{n.time}</p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: PRIMARY }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════ */
function ProfileScreen({ t, customer, stamps, onLogout, onNavigate }: {
  t: ThemeColors; customer: typeof CUSTOMER; stamps: number; onLogout: () => void; onNavigate: (s: Screen) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [email, setEmail] = useState(customer.email);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); setEditing(false); }, 1500); };
  const inp: React.CSSProperties = { background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "11px 14px", outline: "none", width: "100%" };
  const freeReady = stamps >= STAMPS_FOR_FREE;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Profil Saya" />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {/* Avatar */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 20, fontWeight: 800 }}>{customer.avatar}</div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{name}</p>
            <p style={{ fontSize: 13, color: t.textMuted }}>{email}</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: editing ? PRIMARY : (t.isDark ? "#1E3A5F" : "#EFF6FF") }}>
            <EditIco color={editing ? "white" : PRIMARY} />
          </button>
        </div>

        {/* Edit form */}
        {editing ? (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, paddingBottom: 10, borderBottom: `1px solid ${t.divider}` }}>Edit Profil</p>
            <IF t={t} label="Nama Lengkap"><input value={name} onChange={e => setName(e.target.value)} style={inp} /></IF>
            <IF t={t} label="No. HP"><input value={phone} onChange={e => setPhone(e.target.value)} style={inp} /></IF>
            <IF t={t} label="Email"><input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inp} /></IF>
            <IF t={t} label="Alamat"><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ ...inp, resize: "none" as const }} /></IF>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} className="flex-1 py-3.5 rounded-xl text-white"
                style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700, transition: "background 0.3s" }}>
                {saved ? "✅ Tersimpan!" : "Simpan"}
              </button>
              <button onClick={() => setEditing(false)} className="px-5 py-3.5 rounded-xl"
                style={{ border: `1.5px solid ${t.cardBorder}`, color: t.textSec, fontSize: 14, fontWeight: 600 }}>Batal</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            {[{ l: "No. HP", v: phone, i: "📱" }, { l: "Alamat", v: address, i: "📍" }, { l: "Email", v: email, i: "✉️" }].map(item => (
              <div key={item.l} className="flex items-start gap-3">
                <span style={{ fontSize: 18 }}>{item.i}</span>
                <div><p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>{item.l}</p><p style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{item.v}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Loyalty mini */}
        <button onClick={() => onNavigate("loyalty")} className="w-full rounded-2xl p-4 flex items-center gap-3"
          style={{ background: freeReady ? "linear-gradient(135deg,#22C55E,#16A34A)" : (t.isDark ? "#1E3A5F" : "#EFF6FF"), border: `1px solid ${freeReady ? "#4ADE80" : (t.isDark ? "#334155" : "#BFDBFE")}`, boxShadow: t.shadowSm }}>
          <span style={{ fontSize: 22 }}>{freeReady ? "🎁" : "⭐"}</span>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 700, color: freeReady ? "white" : (t.isDark ? "#93C5FD" : PRIMARY) }}>Program Loyalitas</p>
            <p style={{ fontSize: 12, color: freeReady ? "rgba(255,255,255,0.8)" : (t.isDark ? "#60A5FA" : "#3B82F6") }}>
              {freeReady ? "Gratis 1x cuci siap diklaim!" : `${stamps}/${STAMPS_FOR_FREE} stamp terkumpul`}
            </p>
          </div>
          <ChevR color={freeReady ? "rgba(255,255,255,0.7)" : (t.isDark ? "#60A5FA" : PRIMARY)} />
        </button>

        {/* Menu items */}
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          {[
            { id: "faq" as Screen, l: "Bantuan & FAQ", i: "❓", desc: "Pertanyaan yang sering ditanya" },
            { id: "privacy" as Screen, l: "Kebijakan Privasi", i: "🔒", desc: "Cara kami melindungi data kamu" },
            { id: "contact" as Screen, l: "Hubungi Kami", i: "💬", desc: "Ada masalah? Kami siap bantu" },
          ].map((item, idx, arr) => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <span style={{ fontSize: 20 }}>{item.i}</span>
              <div className="flex-1 text-left">
                <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.l}</p>
                <p style={{ fontSize: 11, color: t.textMuted }}>{item.desc}</p>
              </div>
              <ChevR color={t.textMuted} />
            </button>
          ))}
        </div>

        <button onClick={onLogout} className="w-full py-4 rounded-xl"
          style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 14, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.06)" : "transparent" }}>
          Keluar
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOYALTY SCREEN
══════════════════════════════════════════════ */
function LoyaltyScreen({ t, stamps, onUseReward }: { t: ThemeColors; stamps: number; onUseReward: () => void }) {
  const freeReady = stamps >= STAMPS_FOR_FREE;
  const [claimed, setClaimed] = useState(false);

  const history = [
    { date: "19 Apr 2026", desc: "Cuci Biasa 4.5kg — Mesin 1", stamp: true },
    { date: "18 Apr 2026", desc: "Cuci Biasa 3.5kg — Mesin 3", stamp: true },
    { date: "17 Apr 2026", desc: "Cuci Biasa 4.0kg — Mesin 1", stamp: true },
    { date: "15 Apr 2026", desc: "Cuci Biasa 2.0kg — Mesin 2", stamp: false },
    { date: "10 Apr 2026", desc: "Cuci + Setrika 3.0kg — Mesin 4", stamp: true },
  ];

  const handleClaim = () => {
    if (!freeReady) return;
    setClaimed(true);
    setTimeout(() => onUseReward(), 1800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Program Loyalitas" sub="5x cuci = 1x cuci GRATIS" />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">

        {/* Hero stamp card */}
        <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB,#3B82F6)", boxShadow: "0 12px 40px rgba(37,99,235,0.45)" }}>
          <div className="px-5 pt-6 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-blue-200" style={{ fontSize: 12, fontWeight: 600 }}>KARTU LOYALITAS</p>
                <p className="text-white" style={{ fontSize: 20, fontWeight: 800 }}>LaundryKu</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                <WashIco size={26} color="white" />
              </div>
            </div>
            <p className="text-blue-200 mb-5" style={{ fontSize: 12 }}>Budi Santoso · Member Sejak Apr 2026</p>
          </div>

          {/* Stamps row */}
          <div className="px-5 pb-5">
            <p className="text-blue-200 mb-3" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
              STAMP KAMU ({stamps}/{STAMPS_FOR_FREE})
            </p>
            <div className="flex gap-3 mb-4">
              {Array.from({ length: STAMPS_FOR_FREE }).map((_, i) => (
                <div key={i} className="flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center relative"
                  style={{ background: i < stamps ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)", maxWidth: 56 }}>
                  {i < stamps ? (
                    <>
                      <WashIco size={22} color={PRIMARY} />
                      <span style={{ fontSize: 8, fontWeight: 800, color: PRIMARY, marginTop: 2 }}>#{i + 1}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 22, color: "rgba(255,255,255,0.4)" }}>+</span>
                  )}
                  {i < stamps && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#22C55E" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(stamps / STAMPS_FOR_FREE) * 100}%`, background: stamps >= STAMPS_FOR_FREE ? "#4ADE80" : "white" }} />
            </div>
            <p className="text-blue-200" style={{ fontSize: 11 }}>
              {freeReady ? "🎉 Selamat! Cuci gratis siap diklaim" : `${STAMPS_FOR_FREE - stamps} stamp lagi untuk cuci gratis`}
            </p>
          </div>
        </div>

        {/* Claim button */}
        {freeReady && (
          <button onClick={handleClaim} disabled={claimed}
            className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2"
            style={{ background: claimed ? "#22C55E" : "linear-gradient(135deg,#16A34A,#22C55E)", fontSize: 16, fontWeight: 800, boxShadow: "0 8px 24px rgba(34,197,94,0.45)", transition: "all 0.3s" }}>
            {claimed ? "✅ Reward Diklaim! Terima kasih 🎉" : "🎁 Klaim Cuci Gratis Sekarang"}
          </button>
        )}

        {/* How it works */}
        <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>🤔 Cara Kerja Program</p>
          <div className="space-y-3.5">
            {[
              { step: "1", text: "Lakukan pembayaran laundry — setiap transaksi lunas mendapat 1 stamp", icon: "💳" },
              { step: "2", text: "Kumpulkan 5 stamp dalam kartu loyalitas kamu", icon: "⭐" },
              { step: "3", text: "Setelah 5 stamp terkumpul, kamu berhak cuci GRATIS 1x (maks. 5kg)", icon: "🎁" },
              { step: "4", text: "Stamp akan direset setelah reward diklaim. Mulai lagi kumpulkan!", icon: "🔄" },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF" }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: 13, color: t.textSec, lineHeight: 1.5, flex: 1 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stamp history */}
        <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="px-4 py-4" style={{ borderBottom: `1px solid ${t.divider}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Riwayat Stamp</p>
          </div>
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: i < history.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: h.stamp ? (t.isDark ? "#14532D" : "#F0FDF4") : t.pillBg }}>
                <span style={{ fontSize: 16 }}>{h.stamp ? "⭐" : "✖️"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{h.desc}</p>
                <p style={{ fontSize: 11, color: t.textMuted }}>{h.date}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: h.stamp ? "#22C55E" : "#94A3B8" }}>
                {h.stamp ? "+1 ⭐" : "Batal"}
              </span>
            </div>
          ))}
        </div>

        {/* Terms */}
        <div className="rounded-2xl p-4" style={{ background: t.pillBg, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: t.textSec, marginBottom: 6 }}>📋 Syarat & Ketentuan</p>
          <ul className="space-y-1.5">
            {["Stamp berlaku 3 bulan sejak diperoleh", "Reward tidak dapat diuangkan", "Maks. pemakaian gratis 5kg per klaim", "Program dapat berubah sewaktu-waktu"].map(s => (
              <li key={s} className="flex items-start gap-1.5">
                <span style={{ color: t.textMuted, fontSize: 12 }}>•</span>
                <p style={{ fontSize: 12, color: t.textMuted }}>{s}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FAQ SCREEN
══════════════════════════════════════════════ */
const FAQ_DATA = [
  {
    cat: "📦 Pesanan & Layanan",
    items: [
      { q: "Bagaimana cara melihat status laundry saya?", a: "Buka halaman Beranda, status laundry aktif kamu akan tampil secara real-time lengkap dengan progress bar dan perkiraan waktu selesai." },
      { q: "Berapa lama proses pencucian?", a: "Tergantung jenis layanan. Cuci Biasa biasanya 45–60 menit, Cuci Express 30 menit, Cuci + Setrika 60–90 menit." },
      { q: "Apakah saya bisa membatalkan pesanan?", a: "Pembatalan hanya bisa dilakukan sebelum mesin mulai berjalan. Hubungi petugas konter atau hubungi kami melalui menu Hubungi Kami." },
      { q: "Bagaimana cara mengambil laundry yang sudah selesai?", a: "Setelah status berubah menjadi 'Selesai', kamu akan mendapat notifikasi. Ambil langsung di konter LaundryKu dengan menunjukkan nomor order." },
    ]
  },
  {
    cat: "💰 Pembayaran & Harga",
    items: [
      { q: "Apa saja metode pembayaran yang diterima?", a: "Kami menerima tunai, transfer bank (BCA, Mandiri, BRI), dan dompet digital (GoPay, OVO, DANA, ShopeePay)." },
      { q: "Mengapa harga saya berbeda dari tarif standar?", a: "Harga dihitung berdasarkan berat aktual cucian. Estimasi bisa berbeda dengan berat asli yang ditimbang di konter." },
      { q: "Apakah ada biaya tambahan untuk pakaian khusus?", a: "Ya, untuk pakaian berbahan khusus (sutra, wol, batik, jas) dikenakan biaya tambahan. Informasikan kepada petugas saat penyerahan." },
    ]
  },
  {
    cat: "⭐ Program Loyalitas",
    items: [
      { q: "Bagaimana cara mendapatkan stamp?", a: "Setiap transaksi laundry yang selesai dan dibayar lunas mendapat 1 stamp secara otomatis. Stamp akan langsung muncul di kartu loyalitas kamu." },
      { q: "Kapan reward cuci gratis bisa diklaim?", a: "Setelah mengumpulkan 5 stamp. Klaim bisa dilakukan langsung dari aplikasi di menu Program Loyalitas, atau tunjukkan ke petugas konter." },
      { q: "Apakah stamp bisa expired?", a: "Ya, stamp berlaku selama 3 bulan sejak tanggal diperoleh. Pastikan kamu klaim reward sebelum stamp kadaluarsa." },
    ]
  },
  {
    cat: "📱 Akun & Aplikasi",
    items: [
      { q: "Bagaimana cara mengubah data profil saya?", a: "Buka menu Profil, tap ikon edit di pojok kanan atas kartu profil, ubah data yang diinginkan, lalu simpan." },
      { q: "Saya lupa password, bagaimana cara reset?", a: "Di halaman login, tap 'Lupa Password?', masukkan nomor HP terdaftar, dan ikuti instruksi via SMS untuk reset password." },
      { q: "Apakah aplikasi ini aman?", a: "Ya, seluruh data kamu dienkripsi dan disimpan dengan aman. Kami tidak menyebarkan data pribadi kamu kepada pihak ketiga." },
    ]
  },
];

function FAQScreen({ t }: { t: ThemeColors }) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCats = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      search === "" || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Bantuan & FAQ" sub="Pertanyaan yang sering ditanyakan" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><SearchIco color={t.textMuted} /></div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari pertanyaan..."
            className="w-full rounded-xl py-3 pl-10 pr-4 outline-none"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
        </div>

        {filteredCats.length === 0 && (
          <div className="rounded-2xl p-8 flex flex-col items-center text-center"
            style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginTop: 10 }}>Tidak ditemukan</p>
            <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Coba kata kunci lain</p>
          </div>
        )}

        {filteredCats.map(cat => (
          <div key={cat.cat}>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em", marginBottom: 10 }}>{cat.cat.toUpperCase()}</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              {cat.items.map((item, i) => {
                const key = `${cat.cat}-${i}`;
                const isOpen = openItem === key;
                return (
                  <div key={key} style={{ borderBottom: i < cat.items.length - 1 ? `1px solid ${t.divider}` : "none" }}>
                    <button className="w-full flex items-start gap-3 px-4 py-4 text-left"
                      onClick={() => setOpenItem(isOpen ? null : key)}>
                      <div className="flex-1">
                        <p style={{ fontSize: 13, fontWeight: 600, color: t.text, lineHeight: 1.4 }}>{item.q}</p>
                      </div>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: isOpen ? PRIMARY : t.pillBg, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.2s" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9l6 6 6-6" stroke={isOpen ? "white" : t.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="rounded-xl p-3.5" style={{ background: t.pillBg }}>
                          <p style={{ fontSize: 13, color: t.textSec, lineHeight: 1.6 }}>{item.a}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still need help */}
        <div className="rounded-2xl p-5 text-center" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.isDark ? "#93C5FD" : PRIMARY }}>Masih bingung?</p>
          <p style={{ fontSize: 13, color: t.isDark ? "#60A5FA" : "#3B82F6", marginTop: 4 }}>Tim kami siap membantu kamu 24/7</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginTop: 8 }}>📞 0800-1234-5678 (Gratis)</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PRIVACY SCREEN
══════════════════════════════════════════════ */
function PrivacyScreen({ t }: { t: ThemeColors }) {
  const sections = [
    {
      title: "1. Data yang Kami Kumpulkan",
      content: "Kami mengumpulkan informasi yang kamu berikan saat mendaftar, termasuk nama lengkap, nomor telepon, alamat email, dan alamat pengiriman. Kami juga mengumpulkan data transaksi laundry dan riwayat penggunaan aplikasi secara otomatis.",
    },
    {
      title: "2. Cara Kami Menggunakan Data",
      content: "Data kamu digunakan untuk memproses pesanan, mengirim notifikasi status laundry, mengelola program loyalitas, meningkatkan kualitas layanan, dan berkomunikasi terkait promosi (hanya jika kamu setuju).",
    },
    {
      title: "3. Perlindungan Data",
      content: "Seluruh data pribadi kamu dienkripsi menggunakan standar keamanan SSL/TLS. Kami tidak pernah menjual, menyewakan, atau membagikan data kamu kepada pihak ketiga tanpa persetujuan eksplisit kamu, kecuali diwajibkan oleh hukum.",
    },
    {
      title: "4. Cookie & Pelacakan",
      content: "Aplikasi kami menggunakan cookie dan teknologi serupa untuk mengingat preferensi kamu (seperti tema gelap/terang) dan meningkatkan pengalaman pengguna. Kamu dapat menonaktifkan cookie melalui pengaturan browser.",
    },
    {
      title: "5. Hak Kamu",
      content: "Kamu berhak untuk mengakses, memperbaiki, atau menghapus data pribadi kamu kapan saja. Untuk menghapus akun dan semua data terkait, hubungi kami melalui menu Hubungi Kami.",
    },
    {
      title: "6. Retensi Data",
      content: "Data transaksi disimpan selama 2 tahun untuk keperluan akuntansi dan perpajakan. Data profil akan dihapus dalam 30 hari setelah permintaan penghapusan akun.",
    },
    {
      title: "7. Perubahan Kebijakan",
      content: "Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui notifikasi aplikasi atau email. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.",
    },
    {
      title: "8. Kontak",
      content: "Untuk pertanyaan terkait privasi data, hubungi Data Protection Officer kami di privacy@laundryku.id atau telepon 0800-1234-5678.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Kebijakan Privasi" sub="Terakhir diperbarui: 1 April 2026" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-3">
        {/* Intro */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}>
          <span style={{ fontSize: 22 }}>🔒</span>
          <p style={{ fontSize: 13, color: t.isDark ? "#93C5FD" : PRIMARY, lineHeight: 1.5 }}>
            LaundryKu berkomitmen melindungi privasi dan keamanan data pribadi kamu. Kebijakan ini menjelaskan bagaimana kami mengelola informasimu.
          </p>
        </div>

        {sections.map(sec => (
          <div key={sec.title} className="rounded-2xl p-5"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, marginBottom: 8 }}>{sec.title}</p>
            <p style={{ fontSize: 13, color: t.textSec, lineHeight: 1.65 }}>{sec.content}</p>
          </div>
        ))}

        <div className="rounded-2xl p-4 text-center" style={{ background: t.pillBg, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 12, color: t.textMuted }}>Dengan menggunakan aplikasi LaundryKu, kamu menyetujui kebijakan privasi ini.</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, marginTop: 4 }}>privacy@laundryku.id</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONTACT SCREEN
══════════════════════════════════════════════ */
function ContactScreen({ t }: { t: ThemeColors }) {
  const [form, setForm] = useState({ name: CUSTOMER.name, email: CUSTOMER.email, subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSend = () => {
    if (!form.subject || !form.message) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => setSent(false), 3000); setForm(p => ({ ...p, subject: "", message: "" })); }, 1200);
  };

  const inp: React.CSSProperties = { background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "11px 14px", outline: "none", width: "100%" };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PH t={t} title="Hubungi Kami" sub="Kami siap membantu kamu" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "📞", label: "Telepon", val: "0800-1234-5678", sub: "Gratis 24/7" },
            { icon: "✉️", label: "Email", val: "help@laundryku.id", sub: "Balas < 2 jam" },
            { icon: "💬", label: "WhatsApp", val: "0812-0000-9999", sub: "Senin–Sabtu" },
            { icon: "📍", label: "Konter", val: "Jl. Raya No. 88", sub: "06:00–21:00" },
          ].map(info => (
            <div key={info.label} className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <span style={{ fontSize: 22 }}>{info.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: t.text, marginTop: 8 }}>{info.label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginTop: 2 }}>{info.val}</p>
              <p style={{ fontSize: 10, color: t.textMuted }}>{info.sub}</p>
            </div>
          ))}
        </div>

        {/* Jam layanan */}
        <div className="rounded-2xl p-4" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 8 }}>🕐 Jam Layanan Customer Service</p>
          <div className="space-y-2">
            {[["Senin – Jumat", "07:00 – 21:00"], ["Sabtu", "08:00 – 20:00"], ["Minggu & Hari Libur", "09:00 – 18:00"]].map(([day, time]) => (
              <div key={day} className="flex justify-between">
                <span style={{ fontSize: 12, color: t.isDark ? "#93C5FD" : "#3B82F6" }}>{day}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Kirim Pesan</p>
          {sent && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: t.isDark ? "#14532D" : "#F0FDF4", border: "1px solid #4ADE80" }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>Pesan terkirim! Kami akan membalas segera.</p>
            </div>
          )}
          <IF t={t} label="Nama"><input value={form.name} onChange={set("name")} style={inp} /></IF>
          <IF t={t} label="Email"><input value={form.email} onChange={set("email")} type="email" style={inp} /></IF>
          <IF t={t} label="Subjek">
            <select value={form.subject} onChange={set("subject")} style={{ ...inp, appearance: "none" as const }}>
              <option value="">-- Pilih subjek --</option>
              <option value="pesanan">Masalah Pesanan</option>
              <option value="pembayaran">Masalah Pembayaran</option>
              <option value="loyalty">Program Loyalitas</option>
              <option value="akun">Masalah Akun</option>
              <option value="saran">Saran & Masukan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </IF>
          <IF t={t} label="Pesan">
            <textarea value={form.message} onChange={set("message")} rows={4} placeholder="Ceritakan masalah atau pertanyaan kamu..."
              style={{ ...inp, resize: "none" as const }} />
          </IF>
          <button onClick={handleSend} disabled={sending || !form.subject || !form.message}
            className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2"
            style={{ background: (!form.subject || !form.message) ? (t.isDark ? "#334155" : "#CBD5E1") : (sending ? "#93C5FD" : "linear-gradient(135deg,#2563EB,#1D4ED8)"), fontSize: 15, fontWeight: 700, color: (!form.subject || !form.message) ? t.textMuted : "white", cursor: (!form.subject || !form.message) ? "not-allowed" : "pointer" }}>
            {sending ? <><Spinner /> Mengirim...</> : "Kirim Pesan"}
          </button>
        </div>

        {/* Social media */}
        <div className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>Ikuti Kami</p>
          <div className="flex gap-3">
            {[{ icon: "📸", label: "@laundryku_id", platform: "Instagram" }, { icon: "🐦", label: "@LaundryKu", platform: "Twitter/X" }, { icon: "📘", label: "LaundryKu Official", platform: "Facebook" }].map(s => (
              <div key={s.platform} className="flex-1 rounded-xl p-3 text-center" style={{ background: t.pillBg }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <p style={{ fontSize: 9, fontWeight: 700, color: PRIMARY, marginTop: 4 }}>{s.platform}</p>
                <p style={{ fontSize: 9, color: t.textMuted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════════════ */
function BottomNav({ t, active, onNav, unread }: { t: ThemeColors; active: string; onNav: (s: string) => void; unread: number }) {
  const items = [
    { id: "home", label: "Beranda", icon: (c: string) => <HomeIco color={c} /> },
    { id: "history", label: "Riwayat", icon: (c: string) => <HistIco color={c} /> },
    { id: "notifications", label: "Notif", icon: (c: string) => <BellIco color={c} unread={unread} /> },
    { id: "profile", label: "Profil", icon: (c: string) => <ProfIco color={c} /> },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: 68, background: t.navBg, borderTop: `1px solid ${t.divider}` }}>
      {items.map(item => {
        const on = active === item.id;
        const color = on ? PRIMARY : t.textMuted;
        return (
          <button key={item.id} onClick={() => onNav(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1" style={{ color }}>
            {item.icon(color)}
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, color }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARED
══════════════════════════════════════════════ */
function PH({ t, title, sub }: { t: ThemeColors; title: string; sub?: string }) {
  return (
    <div className="px-5 pt-14 pb-4" style={{ background: t.headerBg, borderBottom: `1px solid ${t.divider}`, boxShadow: t.shadowSm }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}
function IF({ t, label, children }: { t: ThemeColors; label: string; children: React.ReactNode }) {
  return <div><label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: t.textSec }}>{label}</label>{children}</div>;
}
function Spinner() { return <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />; }

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */
function WashIco({ size = 24, color = PRIMARY }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="5" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="2" stroke={color} strokeWidth="1.4" /><circle cx="6.5" cy="5.5" r="1" fill={color} /><circle cx="9.5" cy="5.5" r="1" fill={color} /></svg>;
}
function ChevL({ color, size = 14 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ChevR({ color }: { color: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function Sun() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#F59E0B" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" /></svg>; }
function Moon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#64748B" /></svg>; }
function SearchIco({ color }: { color: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" fill="none" /><path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>; }
function HomeIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function HistIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" /></svg>; }
function BellIco({ color, unread }: { color: string; unread: number }) {
  return <div className="relative"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>{unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "#EF4444", fontSize: 9, fontWeight: 700 }}>{unread}</div>}</div>;
}
function ProfIco({ color }: { color: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>; }
function EditIco({ color }: { color: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
