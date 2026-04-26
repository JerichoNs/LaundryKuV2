import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines as initialMachines, adminNotifications, orders, customers as customersData,
  Machine, Customer, Order, formatTime, getStatusColor, getStatusBg, getStatusLabel, formatPrice,
} from "../../data/mockData";

type Page = "dashboard" | "machines" | "customers" | "reports" | "settings";
type SettingsSub = "main" | "notifications" | "business" | "pricing" | "about";
const FONT = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = "#2563EB";

// ── Mock report data generator ────────────────────────────────
const CUSTOMER_NAMES = ["Budi Santoso", "Siti Rahayu", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama", "Hana Wijaya", "Fajar Nugraha"];
const MACHINE_NAMES = ["Mesin 1", "Mesin 2", "Mesin 3", "Mesin 4", "Mesin 5", "Mesin 6"];
const SERVICE_TYPES = ["Cuci Biasa", "Cuci Express", "Cuci + Setrika", "Setrika Saja", "Dry Clean"];

function generateDailyOrders(date: Date): Order[] {
  const seed = date.getDate() + date.getMonth() * 31;
  const count = 3 + (seed % 7); // 3–9 orders
  const result: Order[] = [];
  for (let i = 0; i < count; i++) {
    const h = 6 + Math.floor(((seed + i * 7) % 1000) / 66);
    const m = Math.floor(((seed + i * 13) % 60));
    const weight = 2 + ((seed + i * 3) % 7) + 0.5;
    const pricePerKg = 6000 + (((seed + i) % 3) * 2000);
    result.push({
      id: seed * 100 + i,
      customerId: (i % 4) + 1,
      customerName: CUSTOMER_NAMES[(seed + i) % CUSTOMER_NAMES.length],
      machineId: (i % 6) + 1,
      machineName: MACHINE_NAMES[(seed + i) % MACHINE_NAMES.length],
      weight,
      price: Math.round(weight * pricePerKg / 1000) * 1000,
      status: i < count - 1 ? "done" : "active",
      startTime: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      endTime: i < count - 1 ? `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}` : null,
      date: date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    });
  }
  return result;
}

function generateMonthlyData(): { date: Date; orders: Order[] }[] {
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: d, orders: generateDailyOrders(d) });
  }
  return result;
}

// ── Helpers ────────────────────────────────────────────────────
function getDarkBg(s: string) { return s === "running" ? "#1E3A5F" : s === "done" ? "#14532D" : s === "almost" ? "#431407" : "#1E293B"; }
function statusBg(status: string, dark: boolean) { return dark ? getDarkBg(status) : getStatusBg(status as any); }
function formatIDR(v: number) { return `Rp ${v.toLocaleString("id-ID")}`; }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function formatDateID(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("id-ID", opts || { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Sidebar collapse ──────────────────────────────────────────
function useSidebarWidth() {
  const [mini, setMini] = useState(false);
  useEffect(() => { const c = () => setMini(window.innerWidth < 1024); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return { mini, toggle: () => setMini(p => !p) };
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export function AdminDesktopApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const { mini, toggle: toggleSidebar } = useSidebarWidth();

  const [page, setPage] = useState<Page>("dashboard");
  const [settingsSub, setSettingsSub] = useState<SettingsSub>("main");
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState<Machine>(initialMachines[0]);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setMachines(prev => prev.map(m => {
      if (m.status !== "running" && m.status !== "almost") return m;
      const s = Math.max(0, m.remainingSeconds - 1);
      return { ...m, remainingSeconds: s, status: s === 0 ? "done" : s <= 300 ? "almost" : "running" };
    })), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const updated = machines.find(m => m.id === selectedMachine.id);
    if (updated) setSelectedMachine(updated);
  }, [machines]);

  const stopMachine = useCallback((id: number) => {
    setMachines(p => p.map(m => m.id === id ? { ...m, status: "idle", remainingSeconds: 0, customer: null, customerId: null, startTime: null } : m));
  }, []);
  const saveMachineEdit = useCallback((id: number, name: string, timer: number) => {
    setMachines(p => p.map(m => m.id === id ? { ...m, name, defaultTimer: timer } : m));
    setEditingMachine(null);
  }, []);

  const stats = {
    total: machines.length,
    active: machines.filter(m => m.status === "running" || m.status === "almost").length,
    idle: machines.filter(m => m.status === "idle").length,
    done: machines.filter(m => m.status === "done").length,
  };

  const navItems: { id: Page; label: string; Icon: React.FC<{ color: string }> }[] = [
    { id: "dashboard", label: "Dashboard", Icon: HomeIco },
    { id: "machines", label: "Monitor Mesin", Icon: MachineIco },
    { id: "customers", label: "Pelanggan", Icon: PeopleIco },
    { id: "reports", label: "Laporan", Icon: ChartIco },
    { id: "settings", label: "Pengaturan", Icon: GearIco },
  ];
  const sideW = mini ? 64 : 240;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONT, background: t.pageBg, transition: "background 0.3s" }}>
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen flex flex-col z-50 transition-all duration-300 overflow-hidden"
        style={{ width: sideW, background: t.sidebarBg, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 px-4 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 72 }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: PRIMARY }}>
            <WashIco size={20} color="white" />
          </div>
          {!mini && (<div><p className="text-white" style={{ fontSize: 15, fontWeight: 800 }}>LaundryKu</p><p style={{ fontSize: 10, color: "#64748B" }}>Admin Panel</p></div>)}
          <button onClick={toggleSidebar} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={mini ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="px-2 pt-3 pb-1">
          <NavBtn mini={mini} label="Kembali" onClick={() => navigate("/")} icon={<ChevL color="currentColor" size={16} />} active={false} t={t} />
        </div>
        <nav className="flex-1 px-2 pt-1 space-y-0.5">
          {navItems.map(({ id, label, Icon }) => (
            <NavBtn key={id} mini={mini} label={label} active={page === id} t={t}
              icon={<Icon color="currentColor" />}
              onClick={() => { setPage(id); setSettingsSub("main"); setSelectedCustomer(null); }} />
          ))}
        </nav>
        <div className="px-2 pb-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={t.toggle} title={mini ? "Toggle Theme" : ""}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-white transition-all"
            onMouseEnter={e => (e.currentTarget.style.background = t.sidebarHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: 16 }}>{t.isDark ? "☀️" : "🌙"}</span>
            {!mini && (<><span style={{ fontSize: 13 }}>{t.isDark ? "Mode Terang" : "Mode Gelap"}</span><TogglePill on={t.isDark} mini /></>)}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-y-auto transition-all duration-300" style={{ marginLeft: sideW }}>
        {page === "dashboard" && <DashboardPage t={t} machines={machines} stats={stats} onSelectMachine={m => { setSelectedMachine(m); setPage("machines"); }} />}
        {page === "machines" && <MachineMonitorPage t={t} machines={machines} selectedMachine={selectedMachine} editingMachine={editingMachine} onSelectMachine={setSelectedMachine} onStop={stopMachine} onEdit={m => setEditingMachine(m)} onSaveEdit={saveMachineEdit} onCancelEdit={() => setEditingMachine(null)} />}
        {page === "customers" && <CustomersPage t={t} selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />}
        {page === "reports" && <ReportsPage t={t} />}
        {page === "settings" && <SettingsPage t={t} sub={settingsSub} setSub={setSettingsSub} />}
      </main>
    </div>
  );
}

function NavBtn({ mini, label, active, t, icon, onClick }: { mini: boolean; label: string; active: boolean; t: ThemeColors; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left" title={mini ? label : ""}
      style={{ background: active ? PRIMARY : "transparent", color: active ? "white" : "#94A3B8", fontSize: 14, fontWeight: active ? 700 : 500 }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.sidebarHover; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      {icon}{!mini && label}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function DashboardPage({ t, machines, stats, onSelectMachine }: { t: ThemeColors; machines: Machine[]; stats: any; onSelectMachine: (m: Machine) => void }) {
  const today = formatDateID(new Date());
  const activeOrders = orders.filter(o => o.status === "active");
  return (
    <div className="p-6 xl:p-8">
      <div className="mb-6"><h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Dashboard</h1><p style={{ fontSize: 14, color: t.textSec, marginTop: 2 }}>{today}</p></div>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "Total Mesin", val: stats.total, icon: "🔧", color: PRIMARY, bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Aktif", val: stats.active, icon: "⚡", color: "#3B82F6", bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Kosong", val: stats.idle, icon: "⏳", color: "#94A3B8", bg: t.pillBg },
          { label: "Selesai Hari Ini", val: stats.done, icon: "✅", color: "#22C55E", bg: t.isDark ? "#14532D" : "#F0FDF4" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-3"><span style={{ fontSize: 22 }}>{s.icon}</span><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /></div></div>
            <p style={{ fontSize: 32, fontWeight: 800, color: t.text, lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 5 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 14 }}>Status Mesin Real-time</h2>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {machines.map(m => <DeskMachineCard key={m.id} t={t} machine={m} onClick={() => onSelectMachine(m)} />)}
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 14 }}>Pesanan Aktif</h2>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <OrderTable t={t} orders={activeOrders} machines={machines} showStatus />
      </div>
    </div>
  );
}

function DeskMachineCard({ t, machine: m, onClick }: { t: ThemeColors; machine: Machine; onClick: () => void }) {
  const prog = m.totalSeconds > 0 ? 1 - m.remainingSeconds / m.totalSeconds : 0;
  const sc = getStatusColor(m.status); const sb = statusBg(m.status, t.isDark);
  return (
    <button onClick={onClick} className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sb }}><WashIco size={20} color={sc} /></div><p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p></div>
        <span className="px-2.5 py-1 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(m.status)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: t.isDark ? "#334155" : "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${prog * 100}%`, background: sc, transition: "width 1s linear" }} />
      </div>
      {m.status !== "idle" ? (
        <div className="flex items-end justify-between">
          <div><p style={{ fontSize: 26, fontWeight: 800, color: PRIMARY, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{formatTime(m.remainingSeconds)}</p><p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{m.customer}</p></div>
          <p style={{ fontSize: 12, color: t.textMuted }}>{Math.round(prog * 100)}%</p>
        </div>
      ) : <p style={{ fontSize: 18, fontWeight: 700, color: t.textMuted }}>Mesin Kosong</p>}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// MACHINE MONITOR
// ══════════════════════════════════════════════════════════════
function MachineMonitorPage({ t, machines, selectedMachine, editingMachine, onSelectMachine, onStop, onEdit, onSaveEdit, onCancelEdit }: {
  t: ThemeColors; machines: Machine[]; selectedMachine: Machine; editingMachine: Machine | null;
  onSelectMachine: (m: Machine) => void; onStop: (id: number) => void;
  onEdit: (m: Machine) => void; onSaveEdit: (id: number, name: string, timer: number) => void; onCancelEdit: () => void;
}) {
  const prog = selectedMachine.totalSeconds > 0 ? 1 - selectedMachine.remainingSeconds / selectedMachine.totalSeconds : 0;
  const r = 100; const circ = 2 * Math.PI * r;
  const sc = getStatusColor(selectedMachine.status); const sb = statusBg(selectedMachine.status, t.isDark);
  const [editName, setEditName] = useState(""); const [editTimer, setEditTimer] = useState("");
  useEffect(() => { if (editingMachine) { setEditName(editingMachine.name); setEditTimer(String(editingMachine.defaultTimer)); } }, [editingMachine]);

  return (
    <div className="p-6 xl:p-8">
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Monitor Mesin</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 24 }}>Pantau & kelola setiap mesin</p>
      <div className="flex gap-6 items-start">
        <div className="shrink-0 space-y-2" style={{ width: 260 }}>
          {machines.map(m => {
            const msc = getStatusColor(m.status); const msb = statusBg(m.status, t.isDark);
            const isSelected = selectedMachine.id === m.id; const isRunning = m.status === "running" || m.status === "almost";
            return (
              <div key={m.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${isSelected ? PRIMARY : t.cardBorder}`, background: isSelected ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.cardBg, boxShadow: t.shadow }}>
                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => onSelectMachine(m)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: msb }}><WashIco size={18} color={msc} /></div>
                  <div className="flex-1 min-w-0"><p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p><span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: msc, background: msb }}>{getStatusLabel(m.status)}</span></div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>{isRunning ? formatTime(m.remainingSeconds) : "—"}</p>
                </button>
                <div className="flex" style={{ borderTop: `1px solid ${t.divider}` }}>
                  <button onClick={() => onEdit(m)} className="flex-1 py-2.5 flex items-center justify-center gap-1.5" style={{ color: PRIMARY, fontSize: 12, fontWeight: 700, borderRight: `1px solid ${t.divider}` }}>
                    <EditIco color={PRIMARY} size={13} /> Edit
                  </button>
                  {isRunning ? (
                    <button onClick={() => onStop(m.id)} className="flex-1 py-2.5 flex items-center justify-center gap-1.5" style={{ color: "#F97316", fontSize: 12, fontWeight: 700 }}>
                      <StopIco color="#F97316" size={13} /> Stop
                    </button>
                  ) : (
                    <div className="flex-1 py-2.5 flex items-center justify-center" style={{ color: t.textMuted, fontSize: 12 }}>
                      {m.status === "done" ? "✅ Selesai" : "— Kosong"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1">
          {editingMachine ? (
            <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: statusBg(editingMachine.status, t.isDark) }}><WashIco size={24} color={getStatusColor(editingMachine.status)} /></div>
                <div><h3 style={{ fontSize: 18, fontWeight: 800, color: t.text }}>Edit {editingMachine.name}</h3><p style={{ fontSize: 13, color: t.textMuted }}>Ubah konfigurasi mesin</p></div>
              </div>
              <div className="space-y-5">
                <DField t={t} label="Nama Mesin"><input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} /></DField>
                <DField t={t} label="Timer Default (menit)">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditTimer(v => String(Math.max(1, parseInt(v) - 5)))} className="w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center" style={{ background: t.pillBg, color: t.text }}>−</button>
                    <input value={editTimer} onChange={e => setEditTimer(e.target.value.replace(/\D/, ""))} type="number" className="flex-1 rounded-xl px-4 py-3 outline-none text-center" style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 18, fontWeight: 700, fontFamily: FONT, color: PRIMARY }} />
                    <button onClick={() => setEditTimer(v => String(Math.min(240, parseInt(v) + 5)))} className="w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center" style={{ background: t.pillBg, color: t.text }}>+</button>
                  </div>
                  <div className="flex gap-2 mt-2">{[30, 45, 60, 90, 120].map(v => (<button key={v} onClick={() => setEditTimer(String(v))} className="px-3 py-1.5 rounded-lg" style={{ background: editTimer === String(v) ? PRIMARY : t.pillBg, color: editTimer === String(v) ? "white" : t.textSec, fontSize: 12, fontWeight: 600 }}>{v} mnt</button>))}</div>
                </DField>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => onSaveEdit(editingMachine.id, editName, parseInt(editTimer) || 60)} className="flex-1 py-3.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700 }}>💾 Simpan</button>
                <button onClick={onCancelEdit} className="px-6 py-3.5 rounded-xl" style={{ border: `1.5px solid ${t.cardBorder}`, color: t.textSec, fontSize: 14, fontWeight: 600 }}>Batal</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl p-6 flex flex-col items-center" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                <div className="relative" style={{ width: 240, height: 240 }}>
                  <svg width="240" height="240" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="120" cy="120" r={r} fill="none" stroke={t.isDark ? "#334155" : "#F1F5F9"} strokeWidth="16" />
                    <circle cx="120" cy="120" r={r} fill="none" stroke={sc} strokeWidth="16" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)} style={{ transition: "stroke-dashoffset 1s linear" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p style={{ fontSize: 38, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{formatTime(selectedMachine.remainingSeconds)}</p>
                    <p style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>Sisa Waktu</p>
                    <span className="mt-3 px-4 py-1.5 rounded-full" style={{ fontSize: 13, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(selectedMachine.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{selectedMachine.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[["PELANGGAN", selectedMachine.customer || "—"], ["TIMER DEFAULT", `${selectedMachine.defaultTimer} mnt`], ["MULAI", selectedMachine.startTime || "—"], ["PROGRES", `${Math.round(prog * 100)}%`]].map(([l, v]) => (
                    <div key={l} className="rounded-2xl p-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em" }}>{l}</p>
                      <p style={{ fontSize: 17, fontWeight: 700, color: t.text, marginTop: 5 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => onEdit(selectedMachine)} className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 14, fontWeight: 700 }}>
                  <EditIco color={PRIMARY} size={16} /> Edit Mesin
                </button>
                {(selectedMachine.status === "running" || selectedMachine.status === "almost") && (
                  <button onClick={() => onStop(selectedMachine.id)} className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 14, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.08)" : "transparent" }}>
                    <StopIco color="#EF4444" size={16} /> Hentikan Mesin
                  </button>
                )}
                {selectedMachine.status === "done" && (
                  <div className="w-full py-3.5 rounded-xl text-center" style={{ background: t.isDark ? "#14532D" : "#F0FDF4", border: "1px solid #4ADE80", color: "#16A34A", fontSize: 14, fontWeight: 700 }}>✅ Cucian Siap Diambil</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════
function CustomersPage({ t, selectedCustomer, onSelectCustomer }: {
  t: ThemeColors; selectedCustomer: Customer | null; onSelectCustomer: (c: Customer | null) => void;
}) {
  if (selectedCustomer) {
    return <CustomerDetailPage t={t} customer={selectedCustomer} onBack={() => onSelectCustomer(null)} />;
  }
  return (
    <div className="p-6 xl:p-8">
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Pelanggan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 24 }}>{customersData.length} pelanggan terdaftar</p>

      {/* Summary cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "Total Pelanggan", val: customersData.length, icon: "👥" },
          { label: "Order Hari Ini", val: orders.filter(o => o.date.includes("19 Apr")).length, icon: "📋" },
          { label: "Pelanggan Aktif", val: [...new Set(orders.filter(o => o.status === "active").map(o => o.customerId))].length, icon: "⚡" },
          { label: "Avg. Order/Pelanggan", val: (orders.length / customersData.length).toFixed(1), icon: "📊" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 800, color: t.text, marginTop: 8, lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Daftar Pelanggan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                {["No", "Nama", "No. HP", "Alamat", "Total Order", "Total Bayar", "Aksi"].map(c => (
                  <th key={c} className="px-5 py-3.5 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customersData.map((c, i) => {
                const cOrders = orders.filter(o => o.customerId === c.id);
                const totalSpend = cOrders.reduce((s, o) => s + o.price, 0);
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textMuted }}>{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: PRIMARY, fontSize: 12, fontWeight: 700 }}>{c.avatar}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{c.phone}</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{c.address.substring(0, 28)}{c.address.length > 28 ? "…" : ""}</td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>{cOrders.length} order</span>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatIDR(totalSpend)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => onSelectCustomer(c)} className="px-4 py-2 rounded-xl flex items-center gap-1.5 text-white"
                        style={{ background: PRIMARY, fontSize: 12, fontWeight: 700 }}>
                        Lihat Detail →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailPage({ t, customer: c, onBack }: { t: ThemeColors; customer: Customer; onBack: () => void }) {
  const cOrders = orders.filter(o => o.customerId === c.id);
  const totalSpend = cOrders.reduce((s, o) => s + o.price, 0);
  const doneOrders = cOrders.filter(o => o.status === "done");
  const stamps = doneOrders.length % 5;
  const totalFreeEarned = Math.floor(doneOrders.length / 5);
  const favMachine = (() => {
    const cnt: Record<string, number> = {};
    cOrders.forEach(o => { cnt[o.machineName] = (cnt[o.machineName] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  return (
    <div className="p-6 xl:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
          style={{ background: t.pillBg, color: t.textSec, fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.background = t.cardBorder)}
          onMouseLeave={e => (e.currentTarget.style.background = t.pillBg)}>
          <ChevL color={t.textSec} size={16} /> Daftar Pelanggan
        </button>
        <span style={{ color: t.textMuted }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{c.name}</span>
      </div>

      <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: "340px 1fr" }}>
        {/* Profile Card */}
        <div className="space-y-4">
          <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-3"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 26, fontWeight: 800 }}>{c.avatar}</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{c.name}</h2>
              <span className="mt-2 px-3 py-1 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>Member Aktif</span>
            </div>
            <div className="space-y-3" style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 16 }}>
              {[{ icon: "📱", label: "No. HP", val: c.phone }, { icon: "📍", label: "Alamat", val: c.address }, { icon: "🔧", label: "Mesin Favorit", val: favMachine }].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div><p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>{item.label}</p><p style={{ fontSize: 13, color: t.text }}>{item.val}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="rounded-2xl p-5 overflow-hidden" style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}>
            <p className="text-blue-200" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>KARTU LOYALITAS</p>
            <div className="flex gap-2 mt-3 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 aspect-square rounded-xl flex items-center justify-center"
                  style={{ background: i < stamps ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)" }}>
                  {i < stamps ? <WashIco size={18} color={PRIMARY} /> : <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>+</span>}
                </div>
              ))}
            </div>
            <p className="text-blue-200" style={{ fontSize: 12 }}>{stamps}/5 stamp · {totalFreeEarned}x gratis diperoleh</p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {[
              { label: "Total Order", val: cOrders.length, icon: "📋", color: PRIMARY },
              { label: "Order Selesai", val: doneOrders.length, icon: "✅", color: "#22C55E" },
              { label: "Total Bayar", val: formatIDR(totalSpend), icon: "💰", color: "#F59E0B" },
              { label: "Avg. per Order", val: cOrders.length ? formatIDR(Math.round(totalSpend / cOrders.length)) : "—", icon: "📊", color: "#8B5CF6" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <p style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 8, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Machine usage bar */}
          <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>Penggunaan per Mesin</p>
            {(() => {
              const cnt: Record<string, number> = {};
              cOrders.forEach(o => { cnt[o.machineName] = (cnt[o.machineName] || 0) + 1; });
              const mx = Math.max(...Object.values(cnt), 1);
              return Object.entries(cnt).map(([name, n]) => (
                <div key={name} className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 12, color: t.textSec, width: 64, shrink: 0 }}>{name}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#F1F5F9" }}>
                    <div className="h-full rounded-full" style={{ width: `${(n / mx) * 100}%`, background: PRIMARY }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.text, width: 20 }}>{n}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Riwayat Pesanan</p>
          <span className="px-3 py-1 rounded-full" style={{ background: t.pillBg, color: t.textSec, fontSize: 12, fontWeight: 600 }}>{cOrders.length} order</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 500 }}>
            <thead><tr style={{ borderBottom: `1px solid ${t.divider}` }}>
              {["#", "Tanggal", "Mesin", "Berat", "Harga", "Waktu", "Status"].map(c => (
                <th key={c} className="px-5 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
              ))}
            </tr></thead>
            <tbody>
              {cOrders.map((order, i) => {
                const sc = order.status === "done" ? "#22C55E" : order.status === "active" ? PRIMARY : "#94A3B8";
                const sb = order.status === "done" ? (t.isDark ? "#14532D" : "#F0FDF4") : order.status === "active" ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.pillBg;
                const label = order.status === "done" ? "Selesai" : order.status === "active" ? "Aktif" : "Dibatalkan";
                return (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textMuted }}>{i + 1}</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{order.date}</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{order.machineName}</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{order.weight} kg</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatIDR(order.price)}</td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{order.startTime}{order.endTime ? ` – ${order.endTime}` : ""}</td>
                    <td className="px-5 py-4"><span className="px-3 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 700, color: sc, background: sb }}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
function ReportsPage({ t }: { t: ThemeColors }) {
  type ReportTab = "daily" | "monthly" | "income";
  const [tab, setTab] = useState<ReportTab>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const monthlyData = useMemo(() => generateMonthlyData(), []);

  // ── Income input state ──────────────────────────────────────
  type PayMethod = "Tunai" | "Transfer" | "QRIS";
  type IncomeEntry = {
    id: number; orderId: string; customerName: string; machineName: string;
    service: string; weight: number; pricePerKg: number; subtotal: number;
    discount: number; total: number; payMethod: PayMethod;
    notes: string; date: string; time: string; paid: boolean;
  };
  const initEntries: IncomeEntry[] = useMemo(() => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return [
      { id: 1, orderId: "#LK-001", customerName: "Budi Santoso", machineName: "Mesin 1", service: "Cuci Biasa", weight: 4.5, pricePerKg: 6000, subtotal: 27000, discount: 0, total: 27000, payMethod: "Tunai", notes: "", date: today, time: "08:15", paid: true },
      { id: 2, orderId: "#LK-002", customerName: "Siti Rahayu", machineName: "Mesin 2", service: "Cuci + Setrika", weight: 3.0, pricePerKg: 8000, subtotal: 24000, discount: 2000, total: 22000, payMethod: "Transfer", notes: "Pelanggan tetap", date: today, time: "09:00", paid: true },
      { id: 3, orderId: "#LK-003", customerName: "Ahmad Fauzi", machineName: "Mesin 3", service: "Cuci Express", weight: 5.5, pricePerKg: 10000, subtotal: 55000, discount: 5000, total: 50000, payMethod: "QRIS", notes: "", date: today, time: "10:30", paid: true },
      { id: 4, orderId: "#LK-004", customerName: "Dewi Lestari", machineName: "Mesin 4", service: "Setrika Saja", weight: 2.0, pricePerKg: 5000, subtotal: 10000, discount: 0, total: 10000, payMethod: "Tunai", notes: "", date: today, time: "11:00", paid: false },
    ];
  }, []);
  const [entries, setEntries] = useState<IncomeEntry[]>(initEntries);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = (): Omit<IncomeEntry, "id"> => ({
    orderId: "", customerName: "", machineName: "Mesin 1", service: "Cuci Biasa",
    weight: 0, pricePerKg: 6000, subtotal: 0, discount: 0, total: 0,
    payMethod: "Tunai", notes: "", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), paid: false,
  });
  const [form, setForm] = useState<Omit<IncomeEntry, "id">>(emptyForm());

  const paidEntries = entries.filter(e => e.paid);
  const totalPemasukan = paidEntries.reduce((s, e) => s + e.total, 0);
  const totalSubtotal = paidEntries.reduce((s, e) => s + e.subtotal, 0);
  const totalDiskon = paidEntries.reduce((s, e) => s + e.discount, 0);
  const totalBelumLunas = entries.filter(e => !e.paid).reduce((s, e) => s + e.total, 0);
  const byMethod = (m: PayMethod) => paidEntries.filter(e => e.payMethod === m).reduce((s, e) => s + e.total, 0);

  const recalc = (f: typeof form) => {
    const sub = Math.round(f.weight * f.pricePerKg);
    return { ...f, subtotal: sub, total: Math.max(0, sub - f.discount) };
  };
  const handleFormChange = (key: keyof typeof form, val: any) => {
    setForm(prev => recalc({ ...prev, [key]: val }));
  };
  const handleSave = () => {
    if (!form.customerName || !form.machineName) return;
    if (editId !== null) {
      setEntries(prev => prev.map(e => e.id === editId ? { ...form, id: editId } : e));
      setEditId(null);
    } else {
      const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
      const orderId = `#LK-${String(newId + 100).padStart(3, "0")}`;
      setEntries(prev => [...prev, { ...form, id: newId, orderId }]);
    }
    setForm(emptyForm());
    setShowForm(false);
  };
  const handleEdit = (e: IncomeEntry) => {
    setForm({ orderId: e.orderId, customerName: e.customerName, machineName: e.machineName, service: e.service, weight: e.weight, pricePerKg: e.pricePerKg, subtotal: e.subtotal, discount: e.discount, total: e.total, payMethod: e.payMethod, notes: e.notes, date: e.date, time: e.time, paid: e.paid });
    setEditId(e.id); setShowForm(true);
  };
  const handleDelete = (id: number) => setEntries(prev => prev.filter(e => e.id !== id));
  const togglePaid = (id: number) => setEntries(prev => prev.map(e => e.id === id ? { ...e, paid: !e.paid } : e));

  // Daily data for selected date
  const todayData = useMemo(() => {
    const found = monthlyData.find(d => isSameDay(d.date, selectedDate));
    return found ? found.orders : generateDailyOrders(selectedDate);
  }, [selectedDate, monthlyData]);

  const dailyRevenue = todayData.reduce((s, o) => s + o.price, 0);
  const doneOrders = todayData.filter(o => o.status === "done");
  const machineStat = (() => {
    const cnt: Record<string, number> = {};
    todayData.forEach(o => { cnt[o.machineName] = (cnt[o.machineName] || 0) + 1; });
    return cnt;
  })();

  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
    if (d <= new Date()) setSelectedDate(d);
  };
  const isToday = isSameDay(selectedDate, new Date());

  // Monthly stats
  const monthlyRevenue = monthlyData.reduce((s, d) => s + d.orders.reduce((ss, o) => ss + o.price, 0), 0);
  const monthlyOrders = monthlyData.reduce((s, d) => s + d.orders.length, 0);
  const maxDailyOrders = Math.max(...monthlyData.map(d => d.orders.length), 1);
  const maxDailyRevenue = Math.max(...monthlyData.map(d => d.orders.reduce((s, o) => s + o.price, 0)), 1);

  return (
    <div className="p-6 xl:p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Laporan</h1><p style={{ fontSize: 14, color: t.textSec, marginTop: 2 }}>Kinerja laundry harian, bulanan & pemasukan</p></div>
        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.pillBg }}>
          {([["daily","📅 Harian"],["monthly","📆 Bulanan"],["income","💰 Pemasukan"]] as [ReportTab,string][]).map(([tb,lbl]) => (
            <button key={tb} onClick={() => setTab(tb)} className="px-5 py-2.5 rounded-xl transition-all"
              style={{ background: tab === tb ? (tb === "income" ? "#F59E0B" : PRIMARY) : "transparent", color: tab === tb ? "white" : t.textMuted, fontSize: 13, fontWeight: 700 }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {tab === "daily" && (
        <div className="space-y-5">
          {/* Date navigator */}
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <button onClick={prevDay} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: t.pillBg, color: t.text }}
              onMouseEnter={e => (e.currentTarget.style.background = t.cardBorder)}
              onMouseLeave={e => (e.currentTarget.style.background = t.pillBg)}>
              <ChevL color={t.text} size={18} />
            </button>
            <div className="flex-1 text-center">
              <p style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{formatDateID(selectedDate)}</p>
              {isToday && <span className="px-3 py-0.5 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>Hari Ini</span>}
            </div>
            <button onClick={nextDay} disabled={isToday} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: isToday ? (t.isDark ? "#1E293B" : "#F8FAFC") : t.pillBg, color: isToday ? t.textMuted : t.text, cursor: isToday ? "not-allowed" : "pointer" }}>
              <ChevR color={isToday ? t.textMuted : t.text} />
            </button>
            {/* Mini calendar row – last 7 days */}
            <div className="flex gap-1.5 ml-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                const isSelected = isSameDay(d, selectedDate);
                const found = monthlyData.find(x => isSameDay(x.date, d));
                const cnt = found ? found.orders.length : 0;
                return (
                  <button key={i} onClick={() => setSelectedDate(new Date(d))}
                    className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl transition-all"
                    style={{ background: isSelected ? PRIMARY : t.pillBg, minWidth: 44 }}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: isSelected ? "rgba(255,255,255,0.7)" : t.textMuted }}>{d.toLocaleDateString("id-ID", { weekday: "short" })}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: isSelected ? "white" : t.text }}>{d.getDate()}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(cnt, 5) }).map((_, j) => (
                        <div key={j} className="w-1 h-1 rounded-full" style={{ background: isSelected ? "rgba(255,255,255,0.7)" : PRIMARY }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day stats */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {[
              { label: "Total Pesanan", val: todayData.length, icon: "📋", color: PRIMARY },
              { label: "Pesanan Selesai", val: doneOrders.length, icon: "✅", color: "#22C55E" },
              { label: "Total Pendapatan", val: formatIDR(dailyRevenue), icon: "💰", color: "#F59E0B" },
              { label: "Rata-rata/Order", val: todayData.length ? formatIDR(Math.round(dailyRevenue / todayData.length)) : "—", icon: "📊", color: "#8B5CF6" },
              { label: "Pelanggan Unik", val: new Set(todayData.map(o => o.customerName)).size, icon: "👥", color: "#EC4899" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <p style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 8, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
            {/* Orders table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.divider}` }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Daftar Pesanan</p>
                <span className="px-3 py-1 rounded-full" style={{ background: t.pillBg, color: t.textSec, fontSize: 12 }}>{todayData.length} order</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 480 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {["No", "Pelanggan", "Mesin", "Berat", "Harga", "Mulai", "Status"].map(c => (
                      <th key={c} className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>{c}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {todayData.map((order, i) => {
                      const sc = order.status === "done" ? "#22C55E" : order.status === "active" ? PRIMARY : "#94A3B8";
                      const sb = order.status === "done" ? (t.isDark ? "#14532D" : "#F0FDF4") : order.status === "active" ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.pillBg;
                      const lbl = order.status === "done" ? "Selesai" : order.status === "active" ? "Aktif" : "Batal";
                      return (
                        <tr key={order.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                          <td className="px-4 py-3" style={{ fontSize: 12, color: t.textMuted }}>{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: PRIMARY, fontSize: 10, fontWeight: 700 }}>{order.customerName.charAt(0)}</div>
                              <span style={{ fontSize: 13, color: t.text }}>{order.customerName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: 13, color: t.textSec }}>{order.machineName}</td>
                          <td className="px-4 py-3" style={{ fontSize: 13, color: t.textSec }}>{order.weight} kg</td>
                          <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatIDR(order.price)}</td>
                          <td className="px-4 py-3" style={{ fontSize: 13, color: t.textSec }}>{order.startTime}</td>
                          <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>{lbl}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Machine usage */}
            <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>Penggunaan Mesin</p>
              {Object.keys(machineStat).length === 0 ? (
                <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", marginTop: 32 }}>Tidak ada data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(machineStat).sort((a, b) => b[1] - a[1]).map(([name, cnt]) => {
                    const maxCnt = Math.max(...Object.values(machineStat));
                    return (
                      <div key={name}>
                        <div className="flex justify-between mb-1">
                          <span style={{ fontSize: 12, color: t.textSec }}>{name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{cnt}x</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${(cnt / maxCnt) * 100}%`, background: PRIMARY }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ borderTop: `1px solid ${t.divider}`, marginTop: 20, paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 10 }}>LAYANAN POPULER</p>
                {SERVICE_TYPES.slice(0, 3).map((s, i) => (
                  <div key={s} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center text-white" style={{ background: PRIMARY, fontSize: 10, fontWeight: 800 }}>{i + 1}</div>
                      <span style={{ fontSize: 12, color: t.textSec }}>{s}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{3 - i}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-5">
          {/* Monthly summary */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              { label: "Total Order (30 Hari)", val: monthlyOrders, icon: "📋" },
              { label: "Total Pendapatan", val: `Rp ${(monthlyRevenue / 1000000).toFixed(1)}Jt`, icon: "💰" },
              { label: "Rata-rata/Hari", val: Math.round(monthlyOrders / 30), icon: "📊" },
              { label: "Pendapatan/Hari", val: `Rp ${Math.round(monthlyRevenue / 30 / 1000)}Rb`, icon: "📈" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <p style={{ fontSize: 22, fontWeight: 800, color: t.text, marginTop: 8, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chart - Orders per day */}
          <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-5">
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Jumlah Pesanan per Hari</p>
              <span style={{ fontSize: 12, color: t.textMuted }}>30 hari terakhir</span>
            </div>
            <div className="flex items-end gap-1" style={{ height: 160 }}>
              {monthlyData.map((d, i) => {
                const cnt = d.orders.length;
                const barH = Math.max(4, (cnt / maxDailyOrders) * 140);
                const isToday2 = isSameDay(d.date, new Date());
                const isSel = isSameDay(d.date, selectedDate);
                return (
                  <button key={i} onClick={() => { setSelectedDate(new Date(d.date)); setTab("daily"); }}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${formatDateID(d.date, { day: "numeric", month: "short" })}: ${cnt} order`}>
                    <div className="w-full rounded-t-md transition-all group-hover:opacity-80"
                      style={{ height: barH, background: isSel ? "#F97316" : isToday2 ? PRIMARY : (t.isDark ? "#334155" : "#BFDBFE") }} />
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ fontSize: 11, color: t.textMuted }}>{formatDateID(monthlyData[0].date, { day: "numeric", month: "short" })}</span>
              <span style={{ fontSize: 11, color: t.textMuted }}>Hari Ini</span>
            </div>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>💡 Klik bar untuk lihat detail hari tersebut</p>
          </div>

          {/* Chart - Revenue per day */}
          <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-5">
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Pendapatan per Hari</p>
              <span style={{ fontSize: 12, color: t.textMuted }}>30 hari terakhir</span>
            </div>
            <div className="flex items-end gap-1" style={{ height: 140 }}>
              {monthlyData.map((d, i) => {
                const rev = d.orders.reduce((s, o) => s + o.price, 0);
                const barH = Math.max(4, (rev / maxDailyRevenue) * 120);
                const isToday2 = isSameDay(d.date, new Date());
                const isSel = isSameDay(d.date, selectedDate);
                return (
                  <button key={i} onClick={() => { setSelectedDate(new Date(d.date)); setTab("daily"); }}
                    className="flex-1 group" title={`${formatDateID(d.date, { day: "numeric", month: "short" })}: ${formatIDR(rev)}`}>
                    <div className="w-full rounded-t-md group-hover:opacity-80"
                      style={{ height: barH, background: isSel ? "#F97316" : isToday2 ? "#22C55E" : (t.isDark ? "#14532D" : "#D1FAE5") }} />
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ fontSize: 11, color: t.textMuted }}>{formatDateID(monthlyData[0].date, { day: "numeric", month: "short" })}</span>
              <span style={{ fontSize: 11, color: t.textMuted }}>Hari Ini</span>
            </div>
          </div>

          {/* Monthly table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.divider}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Rekap 30 Hari</p>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 360, overflowY: "auto" }}>
              <table className="w-full" style={{ minWidth: 480 }}>
                <thead className="sticky top-0" style={{ background: t.cardBg }}>
                  <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {["Tanggal", "Hari", "Total Order", "Selesai", "Pendapatan", "Aksi"].map(c => (
                      <th key={c} className="px-5 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyData].reverse().map((d, i) => {
                    const rev = d.orders.reduce((s, o) => s + o.price, 0);
                    const done = d.orders.filter(o => o.status === "done").length;
                    const isToday2 = isSameDay(d.date, new Date());
                    const isSel = isSameDay(d.date, selectedDate);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${t.divider}`, background: isSel ? (t.isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)") : "transparent" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.date.getDate()} {d.date.toLocaleDateString("id-ID", { month: "short" })}</span>
                            {isToday2 && <span className="px-2 py-0.5 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 9, fontWeight: 700 }}>Hari Ini</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5" style={{ fontSize: 13, color: t.textSec }}>{d.date.toLocaleDateString("id-ID", { weekday: "long" })}</td>
                        <td className="px-5 py-3.5"><span className="px-3 py-1 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>{d.orders.length}</span></td>
                        <td className="px-5 py-3.5"><span className="px-3 py-1 rounded-full" style={{ background: t.isDark ? "#14532D" : "#F0FDF4", color: "#22C55E", fontSize: 12, fontWeight: 700 }}>{done}</span></td>
                        <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatIDR(rev)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => { setSelectedDate(new Date(d.date)); setTab("daily"); }}
                            className="px-3 py-1.5 rounded-xl" style={{ background: t.pillBg, color: PRIMARY, fontSize: 12, fontWeight: 600 }}>
                            Detail →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "income" && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              { label: "Total Pemasukan", val: formatIDR(totalPemasukan), icon: "💰", color: "#F59E0B", bg: t.isDark ? "#451A03" : "#FFFBEB" },
              { label: "Subtotal Kotor", val: formatIDR(totalSubtotal), icon: "🧾", color: "#2563EB", bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
              { label: "Total Diskon", val: formatIDR(totalDiskon), icon: "🏷️", color: "#22C55E", bg: t.isDark ? "#14532D" : "#F0FDF4" },
              { label: "Belum Lunas", val: formatIDR(totalBelumLunas), icon: "⏳", color: "#EF4444", bg: t.isDark ? "#450A0A" : "#FFF1F2" },
              { label: "Tunai", val: formatIDR(byMethod("Tunai")), icon: "💵", color: "#8B5CF6", bg: t.isDark ? "#2E1065" : "#F5F3FF" },
              { label: "Transfer", val: formatIDR(byMethod("Transfer")), icon: "🏦", color: "#EC4899", bg: t.isDark ? "#500724" : "#FDF2F8" },
              { label: "QRIS", val: formatIDR(byMethod("QRIS")), icon: "📱", color: "#06B6D4", bg: t.isDark ? "#083344" : "#ECFEFF" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color, marginTop: 6, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Form input */}
          {showForm && (
            <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `2px solid ${editId ? "#F59E0B" : PRIMARY}` }}>
              <div className="flex items-center justify-between mb-5">
                <p style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{editId ? "✏️ Edit Pemasukan" : "➕ Input Pemasukan Baru"}</p>
                <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm()); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.pillBg, color: t.textMuted }}>✕</button>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {/* Nama Pelanggan */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Nama Pelanggan *</label>
                  <input value={form.customerName} onChange={e => handleFormChange("customerName", e.target.value)} placeholder="cth: Budi Santoso"
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
                {/* Mesin */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Mesin</label>
                  <select value={form.machineName} onChange={e => handleFormChange("machineName", e.target.value)}
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}>
                    {["Mesin 1","Mesin 2","Mesin 3","Mesin 4","Mesin 5","Mesin 6"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                {/* Layanan */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Jenis Layanan</label>
                  <select value={form.service} onChange={e => handleFormChange("service", e.target.value)}
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}>
                    {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {/* Berat */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Berat (kg)</label>
                  <input type="number" min="0" step="0.5" value={form.weight} onChange={e => handleFormChange("weight", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
                {/* Harga/kg */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Harga per kg (Rp)</label>
                  <input type="number" min="0" step="500" value={form.pricePerKg} onChange={e => handleFormChange("pricePerKg", parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
                {/* Diskon */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Diskon (Rp)</label>
                  <input type="number" min="0" step="1000" value={form.discount} onChange={e => handleFormChange("discount", parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
                {/* Metode bayar */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Metode Pembayaran</label>
                  <div className="flex gap-2">
                    {(["Tunai","Transfer","QRIS"] as PayMethod[]).map(m => (
                      <button key={m} onClick={() => handleFormChange("payMethod", m)} className="flex-1 py-2.5 rounded-xl transition-all"
                        style={{ background: form.payMethod === m ? PRIMARY : t.pillBg, color: form.payMethod === m ? "white" : t.text, fontSize: 12, fontWeight: 700, border: `1.5px solid ${form.payMethod === m ? PRIMARY : t.cardBorder}` }}>
                        {m === "Tunai" ? "💵" : m === "Transfer" ? "🏦" : "📱"} {m}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Tanggal & Waktu */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Waktu Selesai</label>
                  <input value={form.time} onChange={e => handleFormChange("time", e.target.value)} placeholder="09:30"
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
                {/* Catatan */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: t.textSec, display: "block", marginBottom: 6 }}>Catatan (opsional)</label>
                  <input value={form.notes} onChange={e => handleFormChange("notes", e.target.value)} placeholder="Catatan tambahan..."
                    className="w-full rounded-xl px-4 py-3" style={{ border: `1.5px solid ${t.cardBorder}`, background: t.inputBg ?? t.pillBg, color: t.text, fontSize: 13, outline: "none" }}/>
                </div>
              </div>
              {/* Preview total */}
              <div className="flex items-center gap-4 mt-5 p-4 rounded-xl" style={{ background: t.isDark ? "#1E293B" : "#F8FAFC", border: `1px solid ${t.cardBorder}` }}>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: t.textMuted }}>Subtotal</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{formatIDR(form.subtotal)}</p>
                </div>
                <div style={{ fontSize: 18, color: t.textMuted }}>−</div>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: t.textMuted }}>Diskon</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#22C55E" }}>{formatIDR(form.discount)}</p>
                </div>
                <div style={{ fontSize: 18, color: t.textMuted }}>=</div>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: t.textMuted }}>Total</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B" }}>{formatIDR(form.total)}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => handleFormChange("paid", !form.paid)} className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: form.paid ? "#22C55E" : t.pillBg, border: `2px solid ${form.paid ? "#22C55E" : t.cardBorder}` }}>
                      {form.paid && <span style={{ color: "white", fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Sudah Lunas</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm()); }} className="px-6 py-2.5 rounded-xl"
                  style={{ background: t.pillBg, color: t.text, fontSize: 13, fontWeight: 700 }}>Batal</button>
                <button onClick={handleSave} className="px-8 py-2.5 rounded-xl"
                  style={{ background: "#F59E0B", color: "white", fontSize: 13, fontWeight: 700 }}>
                  {editId ? "💾 Simpan Perubahan" : "✅ Simpan Pemasukan"}
                </button>
              </div>
            </div>
          )}

          {/* Action bar */}
          {!showForm && (
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 14, color: t.textSec }}>{entries.length} entri · {paidEntries.length} lunas · {entries.length - paidEntries.length} belum lunas</p>
              <button onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                style={{ background: "#F59E0B", color: "white", fontSize: 13, fontWeight: 700 }}>
                ➕ Input Pemasukan
              </button>
            </div>
          )}

          {/* Income table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.divider}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>📋 Daftar Pemasukan</p>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 12, color: t.textMuted }}>Total: <strong style={{ color: "#F59E0B" }}>{formatIDR(totalPemasukan)}</strong></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 780 }}>
                <thead><tr style={{ borderBottom: `1px solid ${t.divider}`, background: t.isDark ? "#0F172A" : "#F8FAFC" }}>
                  {["No","ID Order","Pelanggan","Mesin","Layanan","Berat","Subtotal","Diskon","Total","Metode","Waktu","Status","Aksi"].map(c => (
                    <th key={c} className="px-3 py-3 text-left" style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, whiteSpace: "nowrap" }}>{c}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${t.divider}`, background: e.paid ? "transparent" : (t.isDark ? "rgba(239,68,68,0.04)" : "rgba(239,68,68,0.02)") }}>
                      <td className="px-3 py-3" style={{ fontSize: 11, color: t.textMuted }}>{i+1}</td>
                      <td className="px-3 py-3" style={{ fontSize: 11, fontWeight: 700, color: PRIMARY }}>{e.orderId}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: "#F59E0B", fontSize: 10, fontWeight: 700 }}>{e.customerName.charAt(0)}</div>
                          <span style={{ fontSize: 12, color: t.text, whiteSpace: "nowrap" }}>{e.customerName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: t.textSec }}>{e.machineName}</td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, background: t.pillBg, color: t.textSec, whiteSpace: "nowrap" }}>{e.service}</span></td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: t.textSec }}>{e.weight} kg</td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: t.textSec }}>{formatIDR(e.subtotal)}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>{e.discount > 0 ? `−${formatIDR(e.discount)}` : "—"}</td>
                      <td className="px-3 py-3" style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B" }}>{formatIDR(e.total)}</td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, background: e.payMethod === "Tunai" ? "#FEF9C3" : e.payMethod === "Transfer" ? "#EFF6FF" : "#ECFEFF", color: e.payMethod === "Tunai" ? "#92400E" : e.payMethod === "Transfer" ? PRIMARY : "#0891B2" }}>{e.payMethod === "Tunai" ? "💵" : e.payMethod === "Transfer" ? "🏦" : "📱"} {e.payMethod}</span></td>
                      <td className="px-3 py-3" style={{ fontSize: 11, color: t.textMuted }}>{e.time}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => togglePaid(e.id)} className="px-2.5 py-0.5 rounded-full transition-all"
                          style={{ fontSize: 10, fontWeight: 700, background: e.paid ? (t.isDark ? "#14532D" : "#F0FDF4") : (t.isDark ? "#450A0A" : "#FFF1F2"), color: e.paid ? "#22C55E" : "#EF4444" }}>
                          {e.paid ? "✓ Lunas" : "⏳ Belum"}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(e)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: t.pillBg, fontSize: 12 }}>✏️</button>
                          <button onClick={() => handleDelete(e.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: t.isDark ? "#450A0A" : "#FFF1F2", fontSize: 12 }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer total row */}
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${t.divider}`, background: t.isDark ? "#0F172A" : "#F8FAFC" }}>
                    <td colSpan={6} className="px-3 py-3" style={{ fontSize: 12, fontWeight: 800, color: t.text }}>TOTAL ({paidEntries.length} Transaksi Lunas)</td>
                    <td className="px-3 py-3" style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{formatIDR(totalSubtotal)}</td>
                    <td className="px-3 py-3" style={{ fontSize: 13, fontWeight: 800, color: "#22C55E" }}>−{formatIDR(totalDiskon)}</td>
                    <td className="px-3 py-3" style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B" }}>{formatIDR(totalPemasukan)}</td>
                    <td colSpan={4} className="px-3 py-3" style={{ fontSize: 11, color: t.textMuted }}>Belum lunas: {formatIDR(totalBelumLunas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function SettingsPage({ t, sub, setSub }: { t: ThemeColors; sub: SettingsSub; setSub: (s: SettingsSub) => void }) {
  return (
    <div className="p-6 xl:p-8">
      <div className="flex items-center gap-3 mb-6">
        {sub !== "main" && (<button onClick={() => setSub("main")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.pillBg }}><ChevL color={t.text} size={18} /></button>)}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{sub === "main" ? "Pengaturan" : sub === "notifications" ? "Notifikasi" : sub === "business" ? "Profil Bisnis" : sub === "pricing" ? "Harga & Tarif" : "Tentang Aplikasi"}</h1>
          {sub === "main" && <p style={{ fontSize: 14, color: t.textSec, marginTop: 2 }}>Konfigurasi sistem laundry</p>}
        </div>
      </div>
      {sub === "main" && <SettingsMain t={t} setSub={setSub} />}
      {sub === "notifications" && <SettingsNotifs t={t} />}
      {sub === "business" && <SettingsBusiness t={t} />}
      {sub === "pricing" && <SettingsPricing t={t} />}
      {sub === "about" && <SettingsAbout t={t} />}
    </div>
  );
}

function SettingsMain({ t, setSub }: { t: ThemeColors; setSub: (s: SettingsSub) => void }) {
  const items = [
    { id: "notifications" as SettingsSub, label: "Notifikasi", desc: "Push, suara, dan preferensi notifikasi", bg: "#F59E0B", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2a7 7 0 00-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 00-7-7zm0 20a2 2 0 002-2h-4a2 2 0 002 2z"/></svg> },
    { id: "business" as SettingsSub, label: "Profil Bisnis", desc: "Nama toko, alamat, dan jam operasional", bg: "#0EA5E9", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M2 7h20v13H2V7zm4-4h12v4H6V3zm3 8v5h6v-5H9z"/></svg> },
    { id: "pricing" as SettingsSub, label: "Harga & Tarif", desc: "Kelola tarif setiap jenis layanan", bg: "#F97316", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 12.76V16h-1.5v-1.29c-.87-.2-1.63-.71-1.73-1.7h.96c.09.64.54 1.05 1.38 1.05.9 0 1.27-.46 1.27-.97 0-.54-.3-.87-1.34-1.11-1.19-.28-2-.74-2-1.83 0-.91.65-1.59 1.47-1.81V7h1.5v1.36c.95.23 1.43.9 1.46 1.69h-.96c-.04-.67-.46-1.05-1.22-1.05-.72 0-1.18.37-1.18.91 0 .52.38.8 1.37 1.04 1.2.29 1.98.79 1.98 1.91-.01.91-.62 1.59-1.46 1.8z"/></svg> },
    { id: "about" as SettingsSub, label: "Tentang Aplikasi", desc: "Versi, developer, dan informasi sistem", bg: "#3B82F6", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> },
  ];
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
      <div className="rounded-2xl p-5 flex items-center gap-4 col-span-full" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", fontSize: 22, fontWeight: 800 }}>A</div>
        <div className="flex-1 min-w-0"><p style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Admin Utama</p><p style={{ fontSize: 14, color: t.textMuted }}>admin@laundryku.id</p></div>
        <button onClick={t.toggle} className="flex items-center gap-3 px-5 py-3 rounded-xl flex-shrink-0" style={{ background: t.pillBg, color: t.text, fontSize: 14, fontWeight: 600 }}>
          <span>{t.isDark ? "☀️" : "🌙"}</span>{t.isDark ? "Mode Terang" : "Mode Gelap"}<TogglePill on={t.isDark} mini />
        </button>
      </div>
      {items.map(item => (
        <button key={item.id} onClick={() => setSub(item.id)} className="rounded-2xl p-5 text-left flex items-center gap-4 transition-all hover:scale-[1.015] active:scale-[0.99]" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>{item.icon}</div>
          <div className="flex-1 min-w-0"><p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{item.label}</p><p style={{ fontSize: 13, color: t.textMuted }} className="truncate">{item.desc}</p></div>
          <ChevR color={t.textMuted} />
        </button>
      ))}
    </div>
  );
}

function SettingsNotifs({ t }: { t: ThemeColors }) {
  const [state, setState] = useState({ push: true, sound: true, vibrate: false, finish: true, newOrder: true, almostDone: true });
  const tog = (k: keyof typeof state) => setState(p => ({ ...p, [k]: !p[k] }));
  const [saved, setSaved] = useState(false);
  const rows: { key: keyof typeof state; label: string; desc: string }[] = [
    { key: "push", label: "Push Notification", desc: "Tampilkan notifikasi di layar" },
    { key: "sound", label: "Suara Notifikasi", desc: "Putar suara saat ada notifikasi" },
    { key: "vibrate", label: "Getar", desc: "Getar saat notifikasi masuk" },
    { key: "finish", label: "Cuci Selesai", desc: "Notifikasi ketika mesin selesai" },
    { key: "newOrder", label: "Pesanan Baru", desc: "Notifikasi saat ada pesanan baru" },
    { key: "almostDone", label: "Hampir Selesai", desc: "Notifikasi 5 menit sebelum selesai" },
  ];
  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <div><p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{row.label}</p><p style={{ fontSize: 12, color: t.textMuted }}>{row.desc}</p></div>
            <button onClick={() => tog(row.key)} className="relative rounded-full" style={{ width: 48, height: 26, background: state[row.key] ? PRIMARY : (t.isDark ? "#334155" : "#CBD5E1"), padding: "3px" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", transform: state[row.key] ? "translateX(22px)" : "translateX(0)", transition: "transform 0.25s" }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700, transition: "background 0.3s" }}>
        {saved ? "✅ Tersimpan!" : "Simpan Pengaturan"}
      </button>
    </div>
  );
}

function SettingsBusiness({ t }: { t: ThemeColors }) {
  const [form, setForm] = useState({ shopName: "LaundryKu Utama", owner: "Bapak Santoso", phone: "0812-0000-1234", address: "Jl. Raya Utama No. 88, Jakarta Selatan", email: "info@laundryku.id", openTime: "06:00", closeTime: "21:00" });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp: React.CSSProperties = { background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "12px 14px", outline: "none", width: "100%" };
  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="INFORMASI TOKO" />
          <DField t={t} label="Nama Toko"><input value={form.shopName} onChange={set("shopName")} style={inp} /></DField>
          <DField t={t} label="Pemilik"><input value={form.owner} onChange={set("owner")} style={inp} /></DField>
          <DField t={t} label="Email"><input value={form.email} onChange={set("email")} type="email" style={inp} /></DField>
        </div>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="KONTAK & LOKASI" />
          <DField t={t} label="No. Telepon"><input value={form.phone} onChange={set("phone")} style={inp} /></DField>
          <DField t={t} label="Alamat"><textarea value={form.address} onChange={set("address")} rows={3} style={{ ...inp, resize: "none" as const }} /></DField>
        </div>
        <div className="rounded-2xl p-5 space-y-4 col-span-2" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="JAM OPERASIONAL" />
          <div className="flex gap-4">
            <DField t={t} label="Jam Buka"><input value={form.openTime} onChange={set("openTime")} type="time" style={inp} /></DField>
            <DField t={t} label="Jam Tutup"><input value={form.closeTime} onChange={set("closeTime")} type="time" style={inp} /></DField>
          </div>
        </div>
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700, transition: "background 0.3s" }}>
        {saved ? "✅ Profil Tersimpan!" : "Simpan Profil Bisnis"}
      </button>
    </div>
  );
}

function SettingsPricing({ t }: { t: ThemeColors }) {
  const [prices, setPrices] = useState([
    { id: 1, name: "Cuci Biasa", unit: "per kg", price: "6000" },
    { id: 2, name: "Cuci Express", unit: "per kg", price: "10000" },
    { id: 3, name: "Cuci + Setrika", unit: "per kg", price: "8000" },
    { id: 4, name: "Setrika Saja", unit: "per kg", price: "4000" },
    { id: 5, name: "Dry Clean", unit: "per item", price: "25000" },
    { id: 6, name: "Bedcover Besar", unit: "per item", price: "30000" },
  ]);
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        {prices.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < prices.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <div className="flex-1"><p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</p><p style={{ fontSize: 12, color: t.textMuted }}>{item.unit}</p></div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, color: t.textMuted }}>Rp</span>
              <input value={item.price} onChange={e => setPrices(p => p.map(x => x.id === item.id ? { ...x, price: e.target.value.replace(/\D/, "") } : x))} type="number" min="0"
                className="text-right rounded-xl px-3 py-2 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontWeight: 700, fontFamily: FONT, color: PRIMARY, width: 100 }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700, transition: "background 0.3s" }}>
        {saved ? "✅ Tarif Tersimpan!" : "Simpan Tarif"}
      </button>
    </div>
  );
}

function SettingsAbout({ t }: { t: ThemeColors }) {
  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 10px 30px rgba(37,99,235,0.4)" }}><WashIco size={44} color="white" /></div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: t.text }}>LaundryKu</h3>
        <p style={{ fontSize: 14, color: t.textMuted, marginTop: 4 }}>Sistem Monitoring Laundry Modern</p>
        <span className="mt-3 px-4 py-1.5 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#DBEAFE", color: PRIMARY, fontSize: 13, fontWeight: 700 }}>Versi 1.0.0</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        {[["Versi Aplikasi", "1.0.0 (Build 100)"], ["Platform", "Web App (React + Vite)"], ["Terakhir Update", "20 April 2026"], ["Developer", "Tim LaundryKu"], ["Kontak Support", "support@laundryku.id"], ["Lisensi", "MIT License"]].map(([label, val], i, arr) => (
          <div key={label} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <p style={{ fontSize: 14, color: t.textSec }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════
function OrderTable({ t, orders: o, machines, showStatus }: { t: ThemeColors; orders: Order[]; machines?: Machine[]; showStatus?: boolean }) {
  return (
    <table className="w-full" style={{ minWidth: 500 }}>
      <thead><tr style={{ borderBottom: `1px solid ${t.divider}` }}>
        {["No", "Pelanggan", "Mesin", "Mulai", "Sisa Waktu", showStatus ? "Status" : "Harga"].map(c => (
          <th key={c} className="px-5 py-3.5 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
        ))}
      </tr></thead>
      <tbody>
        {o.map((order, i) => {
          const machine = machines?.find(m => m.id === order.machineId);
          const sc = order.status === "done" ? "#22C55E" : order.status === "active" ? PRIMARY : "#94A3B8";
          const sb = order.status === "done" ? (t.isDark ? "#14532D" : "#F0FDF4") : order.status === "active" ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.pillBg;
          return (
            <tr key={order.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
              <td className="px-5 py-4" style={{ fontSize: 13, color: t.textMuted }}>{i + 1}</td>
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: PRIMARY, fontSize: 12, fontWeight: 700 }}>{order.customerName.charAt(0)}</div><span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{order.customerName}</span></div></td>
              <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.machineName}</td>
              <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.startTime}</td>
              <td className="px-5 py-4" style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>
                {machine ? formatTime(machine.remainingSeconds) : order.endTime || "—"}
              </td>
              {showStatus && <td className="px-5 py-4">{machine && <span className="px-3 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(machine.status), background: statusBg(machine.status, t.isDark) }}>{getStatusLabel(machine.status)}</span>}</td>}
              {!showStatus && <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{formatPrice(order.price)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DField({ t, label, children }: { t: ThemeColors; label: string; children: React.ReactNode }) {
  return <div><label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: t.textSec }}>{label}</label>{children}</div>;
}
function SecLabel({ t, text }: { t: ThemeColors; text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.07em", paddingBottom: 8, borderBottom: `1px solid ${t.divider}` }}>{text}</p>;
}
function TogglePill({ on, mini }: { on: boolean; mini?: boolean }) {
  return <div className="relative rounded-full flex items-center" style={{ width: mini ? 36 : 48, height: mini ? 20 : 26, background: on ? PRIMARY : "#475569", padding: "2px" }}><div style={{ width: mini ? 16 : 20, height: mini ? 16 : 20, borderRadius: "50%", background: "white", transform: on ? `translateX(${mini ? 16 : 22}px)` : "translateX(0)", transition: "transform 0.25s" }} /></div>;
}

// ── Icons ──────────────────────────────────────────────────────
function WashIco({ size = 24, color = PRIMARY }: { size?: number; color?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="5" stroke={color} strokeWidth="1.8" /><circle cx="12" cy="13" r="2" stroke={color} strokeWidth="1.4" /><circle cx="6.5" cy="5.5" r="1" fill={color} /><circle cx="9.5" cy="5.5" r="1" fill={color} /><line x1="13" y1="5.5" x2="17" y2="5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function ChevL({ color, size = 18 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ChevR({ color }: { color: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function HomeIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MachineIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" /><circle cx="12" cy="13" r="4.5" stroke={color} strokeWidth="2" /></svg>; }
function PeopleIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ChartIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function GearIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function EditIco({ color, size = 15 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function StopIco({ color = "#EF4444", size = 16 }: { color?: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" /></svg>; }
