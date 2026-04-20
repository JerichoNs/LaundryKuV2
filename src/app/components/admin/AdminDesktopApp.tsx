import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines as initialMachines, adminNotifications, orders, customers,
  Machine, formatTime, getStatusColor, getStatusBg, getStatusLabel, formatPrice,
} from "../../data/mockData";

type Page = "dashboard" | "machines" | "customers" | "reports" | "settings";
type SettingsSub = "main" | "notifications" | "business" | "pricing" | "about";
const FONT = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = "#2563EB";

function getDarkBg(s: string) {
  return s === "running" ? "#1E3A5F" : s === "done" ? "#14532D" : s === "almost" ? "#431407" : "#1E293B";
}
function statusBg(status: string, dark: boolean) {
  return dark ? getDarkBg(status) : getStatusBg(status as any);
}

// ── Sidebar collapse hook ──────────────────────────────────────
function useSidebarWidth() {
  const [mini, setMini] = useState(false);
  useEffect(() => {
    const check = () => setMini(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return { mini, toggle: () => setMini(p => !p) };
}

// ── Root ───────────────────────────────────────────────────────
export function AdminDesktopApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const { mini, toggle: toggleSidebar } = useSidebarWidth();

  const [page, setPage] = useState<Page>("dashboard");
  const [settingsSub, setSettingsSub] = useState<SettingsSub>("main");
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState<Machine>(initialMachines[0]);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

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
    setMachines(p => p.map(m => m.id === id
      ? { ...m, status: "idle", remainingSeconds: 0, customer: null, customerId: null, startTime: null }
      : m));
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

  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", Icon: HomeIco },
    { id: "machines" as Page, label: "Monitor Mesin", Icon: MachineIco },
    { id: "customers" as Page, label: "Pelanggan", Icon: PeopleIco },
    { id: "reports" as Page, label: "Laporan", Icon: ChartIco },
    { id: "settings" as Page, label: "Pengaturan", Icon: GearIco },
  ];

  const sideW = mini ? 64 : 240;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONT, background: t.pageBg, transition: "background 0.3s" }}>
      {/* ── Sidebar ── */}
      <aside className="fixed top-0 left-0 h-screen flex flex-col z-50 transition-all duration-300 overflow-hidden"
        style={{ width: sideW, background: t.sidebarBg, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 72 }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: PRIMARY }}>
            <WashIco size={20} color="white" />
          </div>
          {!mini && (
            <div>
              <p className="text-white" style={{ fontSize: 15, fontWeight: 800 }}>LaundryKu</p>
              <p style={{ fontSize: 10, color: "#64748B" }}>Admin Panel</p>
            </div>
          )}
          <button onClick={toggleSidebar} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d={mini ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Back */}
        <div className="px-2 pt-3 pb-1">
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-white transition-all"
            style={{ fontSize: 13, fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.background = t.sidebarHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <ChevL color="currentColor" size={16} />
            {!mini && <span>Kembali</span>}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-1 space-y-0.5">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = page === id;
            return (
              <button key={id} onClick={() => { setPage(id); setSettingsSub("main"); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                title={mini ? label : ""}
                style={{ background: isActive ? PRIMARY : "transparent", color: isActive ? "white" : "#94A3B8", fontSize: 14, fontWeight: isActive ? 700 : 500 }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.sidebarHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <Icon color="currentColor" />
                {!mini && label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-5 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <button onClick={t.toggle}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-white transition-all"
            title={mini ? (t.isDark ? "Mode Terang" : "Mode Gelap") : ""}
            onMouseEnter={e => (e.currentTarget.style.background = t.sidebarHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: 16 }}>{t.isDark ? "☀️" : "🌙"}</span>
            {!mini && (
              <>
                <span style={{ fontSize: 13 }}>{t.isDark ? "Mode Terang" : "Mode Gelap"}</span>
                <TogglePill on={t.isDark} mini />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-h-screen overflow-y-auto transition-all duration-300" style={{ marginLeft: sideW }}>
        {page === "dashboard" && (
          <DashboardPage t={t} machines={machines} stats={stats}
            onSelectMachine={m => { setSelectedMachine(m); setPage("machines"); }} />
        )}
        {page === "machines" && (
          <MachineMonitorPage t={t} machines={machines} selectedMachine={selectedMachine}
            editingMachine={editingMachine}
            onSelectMachine={setSelectedMachine}
            onStop={stopMachine}
            onEdit={m => setEditingMachine(m)}
            onSaveEdit={saveMachineEdit}
            onCancelEdit={() => setEditingMachine(null)} />
        )}
        {page === "customers" && <CustomersPage t={t} />}
        {page === "reports" && <ReportsPage t={t} />}
        {page === "settings" && (
          <SettingsPage t={t} sub={settingsSub} setSub={setSettingsSub} />
        )}
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
function DashboardPage({ t, machines, stats, onSelectMachine }: {
  t: ThemeColors; machines: Machine[]; stats: any; onSelectMachine: (m: Machine) => void;
}) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const activeOrders = orders.filter(o => o.status === "active");

  return (
    <div className="p-6 xl:p-8">
      <div className="mb-6 xl:mb-8">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: t.textSec, marginTop: 2 }}>{today}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-6 xl:mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "Total Mesin", val: stats.total, icon: "🔧", color: PRIMARY, bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Aktif", val: stats.active, icon: "⚡", color: "#3B82F6", bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Kosong", val: stats.idle, icon: "⏳", color: "#94A3B8", bg: t.pillBg },
          { label: "Selesai Hari Ini", val: stats.done, icon: "✅", color: "#22C55E", bg: t.isDark ? "#14532D" : "#F0FDF4" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, color: t.text, lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Machine Grid */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 14 }}>Status Mesin Real-time</h2>
      <div className="grid gap-4 mb-6 xl:mb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {machines.map(m => <DeskMachineCard key={m.id} t={t} machine={m} onClick={() => onSelectMachine(m)} />)}
      </div>

      {/* Orders Table */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 14 }}>Pesanan Aktif</h2>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                {["No", "Pelanggan", "Mesin", "Mulai", "Sisa Waktu", "Status"].map(c => (
                  <th key={c} className="px-5 py-3.5 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order, i) => {
                const machine = machines.find(m => m.id === order.machineId);
                return (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: t.textMuted }}>{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ background: PRIMARY, fontSize: 12, fontWeight: 700 }}>
                          {order.customerName.charAt(0)}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{order.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.machineName}</td>
                    <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.startTime}</td>
                    <td className="px-5 py-4" style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>
                      {machine ? formatTime(machine.remainingSeconds) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {machine && (
                        <span className="px-3 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(machine.status), background: statusBg(machine.status, t.isDark) }}>
                          {getStatusLabel(machine.status)}
                        </span>
                      )}
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

function DeskMachineCard({ t, machine: m, onClick }: { t: ThemeColors; machine: Machine; onClick: () => void }) {
  const prog = m.totalSeconds > 0 ? 1 - m.remainingSeconds / m.totalSeconds : 0;
  const sc = getStatusColor(m.status);
  const sb = statusBg(m.status, t.isDark);
  return (
    <button onClick={onClick} className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sb }}>
            <WashIco size={20} color={sc} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: sc, background: sb }}>
          {getStatusLabel(m.status)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: t.isDark ? "#334155" : "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${prog * 100}%`, background: sc, transition: "width 1s linear" }} />
      </div>
      {m.status !== "idle" ? (
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: 26, fontWeight: 800, color: PRIMARY, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {formatTime(m.remainingSeconds)}
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{m.customer}</p>
          </div>
          <p style={{ fontSize: 12, color: t.textMuted }}>{Math.round(prog * 100)}%</p>
        </div>
      ) : (
        <p style={{ fontSize: 18, fontWeight: 700, color: t.textMuted }}>Mesin Kosong</p>
      )}
    </button>
  );
}

// ── Machine Monitor ────────────────────────────────────────────
function MachineMonitorPage({ t, machines, selectedMachine, editingMachine, onSelectMachine, onStop, onEdit, onSaveEdit, onCancelEdit }: {
  t: ThemeColors; machines: Machine[]; selectedMachine: Machine; editingMachine: Machine | null;
  onSelectMachine: (m: Machine) => void; onStop: (id: number) => void;
  onEdit: (m: Machine) => void; onSaveEdit: (id: number, name: string, timer: number) => void; onCancelEdit: () => void;
}) {
  const prog = selectedMachine.totalSeconds > 0 ? 1 - selectedMachine.remainingSeconds / selectedMachine.totalSeconds : 0;
  const r = 100; const circ = 2 * Math.PI * r;
  const sc = getStatusColor(selectedMachine.status);
  const sb = statusBg(selectedMachine.status, t.isDark);

  const [editName, setEditName] = useState("");
  const [editTimer, setEditTimer] = useState("");
  useEffect(() => {
    if (editingMachine) { setEditName(editingMachine.name); setEditTimer(String(editingMachine.defaultTimer)); }
  }, [editingMachine]);

  return (
    <div className="p-6 xl:p-8">
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Monitor Mesin</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 24 }}>Pantau & kelola setiap mesin</p>

      <div className="flex gap-6 items-start">
        {/* Machine List */}
        <div className="shrink-0 space-y-2" style={{ width: 260 }}>
          {machines.map(m => {
            const msc = getStatusColor(m.status);
            const msb = statusBg(m.status, t.isDark);
            const isSelected = selectedMachine.id === m.id;
            const isRunning = m.status === "running" || m.status === "almost";
            return (
              <div key={m.id} className="rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${isSelected ? PRIMARY : t.cardBorder}`, background: isSelected ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.cardBg, boxShadow: t.shadow }}>
                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => onSelectMachine(m)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: msb }}>
                    <WashIco size={18} color={msc} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p>
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: msc, background: msb }}>{getStatusLabel(m.status)}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>
                    {isRunning ? formatTime(m.remainingSeconds) : "—"}
                  </p>
                </button>
                <div className="flex" style={{ borderTop: `1px solid ${t.divider}` }}>
                  <button onClick={() => onEdit(m)}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5"
                    style={{ color: PRIMARY, fontSize: 12, fontWeight: 700, borderRight: `1px solid ${t.divider}` }}>
                    <EditIco color={PRIMARY} size={13} /> Edit
                  </button>
                  {isRunning ? (
                    <button onClick={() => onStop(m.id)}
                      className="flex-1 py-2.5 flex items-center justify-center gap-1.5"
                      style={{ color: "#F97316", fontSize: 12, fontWeight: 700 }}>
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

        {/* Detail / Edit panel */}
        <div className="flex-1">
          {editingMachine ? (
            /* Edit Form */
            <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: statusBg(editingMachine.status, t.isDark) }}>
                  <WashIco size={24} color={getStatusColor(editingMachine.status)} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: t.text }}>Edit {editingMachine.name}</h3>
                  <p style={{ fontSize: 13, color: t.textMuted }}>Ubah konfigurasi mesin</p>
                </div>
              </div>

              <div className="space-y-5">
                <DField t={t} label="Nama Mesin">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontFamily: FONT, color: t.text }} />
                </DField>

                <DField t={t} label="Timer Default (menit)">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditTimer(v => String(Math.max(1, parseInt(v) - 5)))}
                      className="w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center"
                      style={{ background: t.pillBg, color: t.text }}>−</button>
                    <input value={editTimer} onChange={e => setEditTimer(e.target.value.replace(/\D/, ""))} type="number"
                      className="flex-1 rounded-xl px-4 py-3 outline-none text-center"
                      style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 18, fontWeight: 700, fontFamily: FONT, color: PRIMARY }} />
                    <button onClick={() => setEditTimer(v => String(Math.min(240, parseInt(v) + 5)))}
                      className="w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center"
                      style={{ background: t.pillBg, color: t.text }}>+</button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[30, 45, 60, 90, 120].map(v => (
                      <button key={v} onClick={() => setEditTimer(String(v))}
                        className="px-3 py-1.5 rounded-lg"
                        style={{ background: editTimer === String(v) ? PRIMARY : t.pillBg, color: editTimer === String(v) ? "white" : t.textSec, fontSize: 12, fontWeight: 600 }}>
                        {v} mnt
                      </button>
                    ))}
                  </div>
                </DField>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => onSaveEdit(editingMachine.id, editName, parseInt(editTimer) || 60)}
                  className="flex-1 py-3.5 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 20px rgba(37,99,235,0.35)" }}>
                  💾 Simpan Perubahan
                </button>
                <button onClick={onCancelEdit} className="px-6 py-3.5 rounded-xl"
                  style={{ border: `1.5px solid ${t.cardBorder}`, color: t.textSec, fontSize: 14, fontWeight: 600 }}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            /* Machine Detail */
            <div>
              <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Ring */}
                <div className="rounded-2xl p-6 flex flex-col items-center"
                  style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                  <div className="relative" style={{ width: 260, height: 260 }}>
                    <svg width="260" height="260" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="130" cy="130" r={r} fill="none" stroke={t.isDark ? "#334155" : "#F1F5F9"} strokeWidth="16" />
                      <circle cx="130" cy="130" r={r} fill="none" stroke={sc} strokeWidth="16" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)}
                        style={{ transition: "stroke-dashoffset 1s linear" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p style={{ fontSize: 40, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                        {formatTime(selectedMachine.remainingSeconds)}
                      </p>
                      <p style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>Sisa Waktu</p>
                      <span className="mt-3 px-4 py-1.5 rounded-full" style={{ fontSize: 13, fontWeight: 700, color: sc, background: sb }}>
                        {getStatusLabel(selectedMachine.status)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full mt-4">
                    <div className="flex justify-between mb-2">
                      <span style={{ fontSize: 12, color: t.textMuted }}>Progres</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{Math.round(prog * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: t.isDark ? "#334155" : "#F1F5F9" }}>
                      <div className="h-full rounded-full" style={{ width: `${prog * 100}%`, background: sc, transition: "width 1s linear" }} />
                    </div>
                  </div>
                </div>

                {/* Info + Actions */}
                <div className="flex flex-col gap-4">
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{selectedMachine.name}</h3>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {[
                      { label: "PELANGGAN", val: selectedMachine.customer || "—" },
                      { label: "TIMER DEFAULT", val: `${selectedMachine.defaultTimer} mnt` },
                      { label: "MULAI", val: selectedMachine.startTime || "—" },
                      { label: "PROGRES", val: `${Math.round(prog * 100)}%` },
                    ].map(item => (
                      <div key={item.label} className="rounded-2xl p-4"
                        style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em" }}>{item.label}</p>
                        <p style={{ fontSize: 17, fontWeight: 700, color: t.text, marginTop: 5 }}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onEdit(selectedMachine)}
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
                    style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 14, fontWeight: 700 }}>
                    <EditIco color={PRIMARY} size={16} /> Edit Mesin
                  </button>
                  {(selectedMachine.status === "running" || selectedMachine.status === "almost") && (
                    <button onClick={() => onStop(selectedMachine.id)}
                      className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
                      style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 14, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.08)" : "transparent" }}>
                      <StopIco color="#EF4444" size={16} /> Hentikan Mesin
                    </button>
                  )}
                  {selectedMachine.status === "done" && (
                    <div className="w-full py-3.5 rounded-xl text-center"
                      style={{ background: t.isDark ? "#14532D" : "#F0FDF4", border: "1px solid #4ADE80", color: "#16A34A", fontSize: 14, fontWeight: 700 }}>
                      ✅ Cucian Siap Diambil
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Customers ──────────────────────────────────────────────────
function CustomersPage({ t }: { t: ThemeColors }) {
  return (
    <div className="p-6 xl:p-8">
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Pelanggan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 24 }}>{customers.length} pelanggan terdaftar</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                {["No", "Nama", "No. HP", "Alamat", "Total Order", "Aksi"].map(c => (
                  <th key={c} className="px-5 py-4 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td className="px-5 py-4" style={{ fontSize: 13, color: t.textMuted }}>{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: PRIMARY, fontSize: 12, fontWeight: 700 }}>{c.avatar}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{c.phone}</td>
                  <td className="px-5 py-4" style={{ fontSize: 13, color: t.textSec }}>{c.address}</td>
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 700 }}>
                      {orders.filter(o => o.customerId === c.id).length} order
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="px-3 py-1.5 rounded-xl" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: PRIMARY, fontSize: 12, fontWeight: 600 }}>
                      Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────
function ReportsPage({ t }: { t: ThemeColors }) {
  const weekly = [
    { day: "Sen", orders: 8 }, { day: "Sel", orders: 12 }, { day: "Rab", orders: 7 },
    { day: "Kam", orders: 15 }, { day: "Jum", orders: 11 }, { day: "Sab", orders: 18 }, { day: "Min", orders: 5 },
  ];
  const max = Math.max(...weekly.map(d => d.orders));

  return (
    <div className="p-6 xl:p-8">
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>Laporan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 24 }}>Ringkasan kinerja laundry</p>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {[
          { label: "Total Order (Minggu)", val: "76", trend: "+12%", up: true },
          { label: "Pendapatan (Minggu)", val: "Rp 1.82Jt", trend: "+8%", up: true },
          { label: "Rata-rata per Order", val: "Rp 23.9Rb", trend: "Stabil", up: null },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.04em", marginBottom: 10 }}>
              {s.label.toUpperCase()}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: t.text }}>{s.val}</p>
            <p style={{ fontSize: 12, color: s.up === true ? "#22C55E" : s.up === false ? "#EF4444" : t.textMuted, marginTop: 4 }}>
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 24 }}>Pesanan per Hari (Minggu Ini)</h3>
        <div className="flex items-end gap-3" style={{ height: 180 }}>
          {weekly.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <p style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{d.orders}</p>
              <div className="w-full rounded-t-xl transition-all"
                style={{ height: `${(d.orders / max) * 140}px`, background: d.day === "Sab" ? PRIMARY : t.isDark ? "#334155" : "#BFDBFE" }} />
              <p style={{ fontSize: 12, color: t.textMuted }}>{d.day}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function SettingsPage({ t, sub, setSub }: { t: ThemeColors; sub: SettingsSub; setSub: (s: SettingsSub) => void }) {
  return (
    <div className="p-6 xl:p-8">
      <div className="flex items-center gap-3 mb-6">
        {sub !== "main" && (
          <button onClick={() => setSub("main")} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: t.pillBg }}>
            <ChevL color={t.text} size={18} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text }}>
            {sub === "main" ? "Pengaturan" : sub === "notifications" ? "Notifikasi" : sub === "business" ? "Profil Bisnis" : sub === "pricing" ? "Harga & Tarif" : "Tentang Aplikasi"}
          </h1>
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
      <div className="rounded-2xl p-5 flex items-center gap-4 col-span-full"
        style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", fontSize: 22, fontWeight: 800 }}>A</div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Admin Utama</p>
          <p style={{ fontSize: 14, color: t.textMuted }}>admin@laundryku.id</p>
        </div>
        <button onClick={t.toggle}
          className="flex items-center gap-3 px-5 py-3 rounded-xl flex-shrink-0"
          style={{ background: t.pillBg, color: t.text, fontSize: 14, fontWeight: 600 }}>
          <span>{t.isDark ? "☀️" : "🌙"}</span>
          {t.isDark ? "Mode Terang" : "Mode Gelap"}
          <TogglePill on={t.isDark} mini />
        </button>
      </div>
      {items.map(item => (
        <button key={item.id} onClick={() => setSub(item.id)}
          className="rounded-2xl p-5 text-left flex items-center gap-4 transition-all hover:scale-[1.015] active:scale-[0.99]"
          style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{item.label}</p>
            <p style={{ fontSize: 13, color: t.textMuted }} className="truncate">{item.desc}</p>
          </div>
          <ChevR color={t.textMuted} />
        </button>
      ))}
    </div>
  );
}

function SettingsNotifs({ t }: { t: ThemeColors }) {
  const [state, setState] = useState({
    push: true, sound: true, vibrate: false,
    finish: true, newOrder: true, almostDone: true,
  });
  const tog = (k: keyof typeof state) => setState(p => ({ ...p, [k]: !p[k] }));
  const [saved, setSaved] = useState(false);

  const rows = [
    { key: "push" as const, label: "Push Notification", desc: "Tampilkan notifikasi di layar" },
    { key: "sound" as const, label: "Suara Notifikasi", desc: "Putar suara saat ada notifikasi" },
    { key: "vibrate" as const, label: "Getar", desc: "Getar saat notifikasi masuk" },
    { key: "finish" as const, label: "Cuci Selesai", desc: "Notifikasi ketika mesin selesai" },
    { key: "newOrder" as const, label: "Pesanan Baru", desc: "Notifikasi saat ada pesanan baru" },
    { key: "almostDone" as const, label: "Hampir Selesai", desc: "Notifikasi 5 menit sebelum selesai" },
  ];

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{row.label}</p>
              <p style={{ fontSize: 12, color: t.textMuted }}>{row.desc}</p>
            </div>
            <button onClick={() => tog(row.key)} className="relative rounded-full"
              style={{ width: 48, height: 26, background: state[row.key] ? PRIMARY : (t.isDark ? "#334155" : "#CBD5E1"), padding: "3px" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", transform: state[row.key] ? "translateX(22px)" : "translateX(0)", transition: "transform 0.25s" }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700 }}>
        {saved ? "✅ Tersimpan!" : "Simpan Pengaturan"}
      </button>
    </div>
  );
}

function SettingsBusiness({ t }: { t: ThemeColors }) {
  const [form, setForm] = useState({
    shopName: "LaundryKu Utama", owner: "Bapak Santoso", phone: "0812-0000-1234",
    address: "Jl. Raya Utama No. 88, Jakarta Selatan", email: "info@laundryku.id",
    openTime: "06:00", closeTime: "21:00",
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const inputSty: React.CSSProperties = {
    background: t.inputBg, border: `1.5px solid ${t.inputBorder}`,
    fontSize: 14, fontFamily: FONT, color: t.text, borderRadius: 12, padding: "12px 14px", outline: "none", width: "100%",
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="INFORMASI TOKO" />
          <DField t={t} label="Nama Toko"><input value={form.shopName} onChange={set("shopName")} style={inputSty} /></DField>
          <DField t={t} label="Pemilik"><input value={form.owner} onChange={set("owner")} style={inputSty} /></DField>
          <DField t={t} label="Email"><input value={form.email} onChange={set("email")} type="email" style={inputSty} /></DField>
        </div>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="KONTAK & LOKASI" />
          <DField t={t} label="No. Telepon"><input value={form.phone} onChange={set("phone")} style={inputSty} /></DField>
          <DField t={t} label="Alamat"><textarea value={form.address} onChange={set("address")} rows={3} style={{ ...inputSty, resize: "none" as const }} /></DField>
        </div>
        <div className="rounded-2xl p-5 space-y-4 col-span-2" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
          <SecLabel t={t} text="JAM OPERASIONAL" />
          <div className="flex gap-4">
            <DField t={t} label="Jam Buka"><input value={form.openTime} onChange={set("openTime")} type="time" style={inputSty} /></DField>
            <DField t={t} label="Jam Tutup"><input value={form.closeTime} onChange={set("closeTime")} type="time" style={inputSty} /></DField>
          </div>
        </div>
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700 }}>
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
          <div key={item.id} className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: i < prices.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <div className="flex-1">
              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</p>
              <p style={{ fontSize: 12, color: t.textMuted }}>{item.unit}</p>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 500, color: t.textMuted }}>Rp</span>
              <input value={item.price}
                onChange={e => setPrices(p => p.map(x => x.id === item.id ? { ...x, price: e.target.value.replace(/\D/, "") } : x))}
                type="number" min="0"
                className="text-right rounded-xl px-3 py-2 outline-none"
                style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, fontWeight: 700, fontFamily: FONT, color: PRIMARY, width: 100 }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="px-6 py-3.5 rounded-xl text-white"
        style={{ background: saved ? "#22C55E" : "linear-gradient(135deg,#2563EB,#1D4ED8)", fontSize: 14, fontWeight: 700 }}>
        {saved ? "✅ Tarif Tersimpan!" : "Simpan Tarif"}
      </button>
    </div>
  );
}

function SettingsAbout({ t }: { t: ThemeColors }) {
  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl p-6 flex flex-col items-center text-center"
        style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 10px 30px rgba(37,99,235,0.4)" }}>
          <WashIco size={44} color="white" />
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: t.text }}>LaundryKu</h3>
        <p style={{ fontSize: 14, color: t.textMuted, marginTop: 4 }}>Sistem Monitoring Laundry Modern</p>
        <span className="mt-3 px-4 py-1.5 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#DBEAFE", color: PRIMARY, fontSize: 13, fontWeight: 700 }}>Versi 1.0.0</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        {[
          ["Versi Aplikasi", "1.0.0 (Build 100)"],
          ["Platform", "Web App (React + Vite)"],
          ["Terakhir Update", "20 April 2026"],
          ["Developer", "Tim LaundryKu"],
          ["Kontak Support", "support@laundryku.id"],
          ["Lisensi", "MIT License"],
        ].map(([label, val], i, arr) => (
          <div key={label} className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <p style={{ fontSize: 14, color: t.textSec }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{val}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>🚀 Fitur Unggulan</p>
        {["Real-time monitoring mesin", "Notifikasi otomatis", "Manajemen pelanggan", "Laporan harian & mingguan", "Tema gelap & terang", "Responsif di semua ukuran layar"].map(f => (
          <div key={f} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: PRIMARY }}>
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ fontSize: 13, color: t.text }}>{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared Micro ───────────────────────────────────────────────
function DField({ t, label, children }: { t: ThemeColors; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 700, color: t.textSec }}>{label}</label>
      {children}
    </div>
  );
}
function SecLabel({ t, text }: { t: ThemeColors; text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.07em", paddingBottom: 8, borderBottom: `1px solid ${t.divider}` }}>{text}</p>;
}
function TogglePill({ on, mini }: { on: boolean; mini?: boolean }) {
  return (
    <div className="relative rounded-full flex items-center"
      style={{ width: mini ? 36 : 48, height: mini ? 20 : 26, background: on ? PRIMARY : "#475569", padding: "2px" }}>
      <div style={{ width: mini ? 16 : 20, height: mini ? 16 : 20, borderRadius: "50%", background: "white", transform: on ? `translateX(${mini ? 16 : 22}px)` : "translateX(0)", transition: "transform 0.25s" }} />
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
function HomeIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MachineIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" /><circle cx="12" cy="13" r="4.5" stroke={color} strokeWidth="2" /></svg>; }
function PeopleIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ChartIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function GearIco({ color }: { color: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function EditIco({ color, size = 15 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function StopIco({ color = "#EF4444", size = 16 }: { color?: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" /></svg>; }
