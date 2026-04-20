import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme, ThemeColors } from "../../context/ThemeContext";
import {
  machines as initialMachines,
  adminNotifications,
  orders,
  customers,
  Machine,
  formatTime,
  getStatusColor,
  getStatusBg,
  getStatusLabel,
  formatPrice,
} from "../../data/mockData";

type Page = "dashboard" | "machines" | "customers" | "reports" | "settings";
const FONT = "'Plus Jakarta Sans', sans-serif";

function getDarkStatusBg(status: string): string {
  if (status === "running") return "#1E3A5F";
  if (status === "done") return "#14532D";
  if (status === "almost") return "#431407";
  return "#1E293B";
}

export function AdminDesktopApp() {
  const navigate = useNavigate();
  const t = useTheme();
  const [page, setPage] = useState<Page>("dashboard");
  const [machineList, setMachineList] = useState<Machine[]>(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState<Machine>(initialMachines[0]);

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

  useEffect(() => {
    const u = machineList.find((m) => m.id === selectedMachine.id);
    if (u) setSelectedMachine(u);
  }, [machineList]);

  const stats = {
    total: machineList.length,
    active: machineList.filter((m) => m.status === "running" || m.status === "almost").length,
    idle: machineList.filter((m) => m.status === "idle").length,
    done: machineList.filter((m) => m.status === "done").length,
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONT, background: t.pageBg, transition: "background 0.3s" }}>
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen flex flex-col z-50"
        style={{ width: 240, background: t.sidebarBg, borderRight: `1px solid rgba(255,255,255,0.06)` }}>
        {/* Logo */}
        <div className="px-6 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#2563EB" }}>
              <WashIcon size={20} color="white" />
            </div>
            <div>
              <p className="text-white" style={{ fontSize: 16, fontWeight: 800 }}>LaundryKu</p>
              <p className="text-slate-500" style={{ fontSize: 11 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Back + Theme */}
        <div className="px-4 pt-4 pb-2 space-y-1">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-slate-400 hover:text-white"
            style={{ fontSize: 13, fontWeight: 500, background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = t.sidebarHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <BackIcon color="currentColor" size={16} />
            Kembali ke Selector
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 pt-2 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
            { id: "machines", label: "Monitor Mesin", Icon: MachineIcon },
            { id: "customers", label: "Pelanggan", Icon: PeopleIcon },
            { id: "reports", label: "Laporan", Icon: ReportIcon },
            { id: "settings", label: "Pengaturan", Icon: SettingIcon },
          ].map(({ id, label, Icon }) => {
            const isActive = page === id;
            return (
              <button key={id} onClick={() => setPage(id as Page)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{ background: isActive ? "#2563EB" : "transparent", color: isActive ? "white" : "#94A3B8", fontSize: 14, fontWeight: isActive ? 700 : 500 }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.sidebarHover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <Icon color="currentColor" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-4 pb-6 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
          <button onClick={t.toggle} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            style={{ fontSize: 13, fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = t.sidebarHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: 16 }}>{t.isDark ? "☀️" : "🌙"}</span>
            {t.isDark ? "Mode Terang" : "Mode Gelap"}
            <div className="ml-auto flex items-center rounded-full" style={{ width: 34, height: 18, background: t.isDark ? "#2563EB" : "#475569", padding: "2px" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", transform: t.isDark ? "translateX(16px)" : "translateX(0)", transition: "transform 0.25s" }} />
            </div>
          </button>
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 transition-all"
            style={{ fontSize: 14, fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <LogoutIcon />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto" style={{ marginLeft: 240, minHeight: "100vh" }}>
        {page === "dashboard" && <DashboardPage t={t} machines={machineList} stats={stats} activeOrders={orders.filter((o) => o.status === "active")} onSelectMachine={(m) => { setSelectedMachine(m); setPage("machines"); }} />}
        {page === "machines" && <MachineMonitorPage t={t} machines={machineList} selectedMachine={selectedMachine} onSelectMachine={setSelectedMachine} onStop={(id) => setMachineList((p) => p.map((m) => m.id === id ? { ...m, status: "idle", remainingSeconds: 0, customer: null, customerId: null } : m))} />}
        {page === "customers" && <CustomersPage t={t} />}
        {page === "reports" && <ReportsPage t={t} />}
        {page === "settings" && <SettingsPage t={t} />}
      </main>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────── */
function DashboardPage({ t, machines, stats, activeOrders, onSelectMachine }: {
  t: ThemeColors; machines: Machine[]; stats: { total: number; active: number; idle: number; done: number };
  activeOrders: any[]; onSelectMachine: (m: Machine) => void;
}) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: t.text }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: t.textSec, marginTop: 2 }}>{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Total Mesin", val: stats.total, icon: "🔧", color: "#2563EB", bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Aktif Sekarang", val: stats.active, icon: "⚡", color: "#3B82F6", bg: t.isDark ? "#1E3A5F" : "#EFF6FF" },
          { label: "Menunggu", val: stats.idle, icon: "⏳", color: "#94A3B8", bg: t.pillBg },
          { label: "Selesai Hari Ini", val: stats.done, icon: "✅", color: "#22C55E", bg: t.isDark ? "#14532D" : "#F0FDF4" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: 34, fontWeight: 800, color: t.text, lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 13, color: t.textMuted, marginTop: 6 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Machine Grid */}
      <SectionHeader t={t} title="Status Mesin Real-time" />
      <div className="grid grid-cols-3 gap-5 mb-8">
        {machines.map((m) => <DeskMachineCard key={m.id} t={t} machine={m} onClick={() => onSelectMachine(m)} />)}
      </div>

      {/* Orders Table */}
      <SectionHeader t={t} title="Pesanan Aktif" />
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
              {["No", "Pelanggan", "Mesin", "Mulai", "Timer", "Status"].map((c) => (
                <th key={c} className="px-5 py-3.5 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((order, i) => {
              const machine = machines.find((m) => m.id === order.machineId);
              return (
                <tr key={order.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td className="px-5 py-4" style={{ fontSize: 14, color: t.textMuted }}>{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: "#2563EB", fontSize: 12, fontWeight: 700 }}>
                        {order.customerName.charAt(0)}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{order.customerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.machineName}</td>
                  <td className="px-5 py-4" style={{ fontSize: 14, color: t.textSec }}>{order.startTime}</td>
                  <td className="px-5 py-4" style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", fontVariantNumeric: "tabular-nums" }}>
                    {machine ? formatTime(machine.remainingSeconds) : "--:--"}
                  </td>
                  <td className="px-5 py-4">
                    {machine && (
                      <span className="px-3 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(machine.status), background: t.isDark ? getDarkStatusBg(machine.status) : getStatusBg(machine.status) }}>
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
  );
}

function DeskMachineCard({ t, machine, onClick }: { t: ThemeColors; machine: Machine; onClick: () => void }) {
  const progress = machine.totalSeconds > 0 ? 1 - machine.remainingSeconds / machine.totalSeconds : 0;
  const sc = getStatusColor(machine.status);
  const sb = t.isDark ? getDarkStatusBg(machine.status) : getStatusBg(machine.status);
  return (
    <button onClick={onClick} className="rounded-2xl p-5 text-left transition-all hover:scale-[1.015] active:scale-[0.99]"
      style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sb }}>
            <WashIcon size={20} color={sc} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{machine.name}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(machine.status)}</span>
      </div>
      <div className="rounded-full overflow-hidden mb-4" style={{ height: 6, background: t.isDark ? "#334155" : "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: sc, transition: "width 1s linear" }} />
      </div>
      {machine.status !== "idle" ? (
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#2563EB", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{formatTime(machine.remainingSeconds)}</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{machine.customer}</p>
          </div>
          <p style={{ fontSize: 12, color: t.textMuted }}>{Math.round(progress * 100)}%</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: t.textMuted }}>Mesin Kosong</p>
          <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Siap digunakan</p>
        </div>
      )}
    </button>
  );
}

/* ─── Machine Monitor ──────────────────────────────────── */
function MachineMonitorPage({ t, machines, selectedMachine, onSelectMachine, onStop }: {
  t: ThemeColors; machines: Machine[]; selectedMachine: Machine;
  onSelectMachine: (m: Machine) => void; onStop: (id: number) => void;
}) {
  const progress = selectedMachine.totalSeconds > 0 ? 1 - selectedMachine.remainingSeconds / selectedMachine.totalSeconds : 0;
  const r = 110; const circ = 2 * Math.PI * r;
  const sc = getStatusColor(selectedMachine.status);
  const sb = t.isDark ? getDarkStatusBg(selectedMachine.status) : getStatusBg(selectedMachine.status);

  return (
    <div className="p-8">
      <h1 style={{ fontSize: 28, fontWeight: 800, color: t.text }}>Monitor Mesin</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 32 }}>Pantau status mesin secara real-time</p>

      <div className="flex gap-6">
        {/* List */}
        <div className="w-72 shrink-0 space-y-3">
          {machines.map((m) => {
            const msc = getStatusColor(m.status);
            const msb = t.isDark ? getDarkStatusBg(m.status) : getStatusBg(m.status);
            const isSelected = selectedMachine.id === m.id;
            return (
              <button key={m.id} onClick={() => onSelectMachine(m)} className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{ background: isSelected ? (t.isDark ? "#1E3A5F" : "#EFF6FF") : t.cardBg, border: `2px solid ${isSelected ? "#2563EB" : t.cardBorder}`, boxShadow: t.shadow }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: msb }}>
                  <WashIcon size={18} color={msc} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.name}</p>
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, color: msc, background: msb }}>{getStatusLabel(m.status)}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", fontVariantNumeric: "tabular-nums" }}>
                  {m.status !== "idle" ? formatTime(m.remainingSeconds) : "—"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="flex-1 grid grid-cols-2 gap-6">
          {/* Ring */}
          <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <div className="relative" style={{ width: 280, height: 280 }}>
              <svg width="280" height="280" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="140" cy="140" r={r} fill="none" stroke={t.isDark ? "#334155" : "#F1F5F9"} strokeWidth="16" />
                <circle cx="140" cy="140" r={r} fill="none" stroke={sc} strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p style={{ fontSize: 44, fontWeight: 800, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{formatTime(selectedMachine.remainingSeconds)}</p>
                <p style={{ fontSize: 14, color: t.textMuted, marginTop: 8 }}>Sisa Waktu</p>
                <span className="mt-3 px-4 py-1.5 rounded-full" style={{ fontSize: 13, fontWeight: 700, color: sc, background: sb }}>{getStatusLabel(selectedMachine.status)}</span>
              </div>
            </div>
            <div className="w-full mt-4">
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 12, color: t.textMuted }}>Progres Pencucian</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{Math.round(progress * 100)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: t.isDark ? "#334155" : "#F1F5F9" }}>
                <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: sc, transition: "width 1s linear" }} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <h3 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{selectedMachine.name}</h3>
            <InfoCard t={t} label="PELANGGAN" value={selectedMachine.customer || "—"} large />
            <div className="grid grid-cols-2 gap-4">
              <InfoCard t={t} label="MULAI" value={selectedMachine.startTime || "—"} />
              <InfoCard t={t} label="DURASI" value={`${selectedMachine.defaultTimer} mnt`} />
            </div>
            <InfoCard t={t} label="PROGRES" value={`${Math.round(progress * 100)}%`} large />
            {(selectedMachine.status === "running" || selectedMachine.status === "almost") && (
              <button onClick={() => onStop(selectedMachine.id)} className="w-full py-4 rounded-xl transition-all"
                style={{ border: "2px solid #EF4444", color: "#EF4444", fontSize: 15, fontWeight: 700, background: t.isDark ? "rgba(239,68,68,0.08)" : "transparent" }}>
                ⏹ Hentikan Mesin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Customers ────────────────────────────────────────── */
function CustomersPage({ t }: { t: ThemeColors }) {
  return (
    <div className="p-8">
      <h1 style={{ fontSize: 28, fontWeight: 800, color: t.text }}>Pelanggan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 32 }}>{customers.length} pelanggan terdaftar</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
              {["No", "Nama", "No. HP", "Alamat", "Total Order", "Aksi"].map((c) => (
                <th key={c} className="px-6 py-4 text-left" style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.05em" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                <td className="px-6 py-4" style={{ fontSize: 14, color: t.textMuted }}>{i + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "#2563EB", fontSize: 13, fontWeight: 700 }}>{c.avatar}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4" style={{ fontSize: 14, color: t.textSec }}>{c.phone}</td>
                <td className="px-6 py-4" style={{ fontSize: 14, color: t.textSec }}>{c.address}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 700 }}>
                    {orders.filter((o) => o.customerId === c.id).length} order
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="px-3 py-1.5 rounded-xl" style={{ background: t.isDark ? "#1E3A5F" : "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 600 }}>Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Reports ──────────────────────────────────────────── */
function ReportsPage({ t }: { t: ThemeColors }) {
  const weekData = [
    { day: "Sen", orders: 8 }, { day: "Sel", orders: 12 }, { day: "Rab", orders: 7 },
    { day: "Kam", orders: 15 }, { day: "Jum", orders: 11 }, { day: "Sab", orders: 18 }, { day: "Min", orders: 5 },
  ];
  const max = Math.max(...weekData.map((d) => d.orders));
  return (
    <div className="p-8">
      <h1 style={{ fontSize: 28, fontWeight: 800, color: t.text }}>Laporan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 32 }}>Ringkasan kinerja laundry</p>
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Pesanan (Minggu Ini)", val: "76", sub: "+12% dari minggu lalu", subColor: "#22C55E" },
          { label: "Pendapatan (Minggu Ini)", val: "Rp 1.82Jt", sub: "+8% dari minggu lalu", subColor: "#22C55E" },
          { label: "Rata-rata per Pesanan", val: "Rp 23.9Rb", sub: "Stabil", subColor: t.textMuted },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, letterSpacing: "0.04em", marginBottom: 12 }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: t.text }}>{s.val}</p>
            <p style={{ fontSize: 12, color: s.subColor, marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 24 }}>Pesanan per Hari (Minggu Ini)</h3>
        <div className="flex items-end gap-4" style={{ height: 160 }}>
          {weekData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <p style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{d.orders}</p>
              <div className="w-full rounded-t-xl" style={{ height: `${(d.orders / max) * 120}px`, background: d.day === "Sab" ? "#2563EB" : t.isDark ? "#334155" : "#BFDBFE", transition: "all 0.3s" }} />
              <p style={{ fontSize: 12, color: t.textMuted }}>{d.day}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Settings ─────────────────────────────────────────── */
function SettingsPage({ t }: { t: ThemeColors }) {
  return (
    <div className="p-8">
      <h1 style={{ fontSize: 28, fontWeight: 800, color: t.text }}>Pengaturan</h1>
      <p style={{ fontSize: 14, color: t.textSec, marginTop: 2, marginBottom: 32 }}>Konfigurasi sistem laundry</p>
      <div className="grid grid-cols-2 gap-5 max-w-3xl">
        {[
          { title: "Profil Bisnis", desc: "Nama toko, alamat, dan kontak", icon: "🏪" },
          { title: "Harga & Tarif", desc: "Atur tarif laundry per kg", icon: "💰" },
          { title: "Notifikasi", desc: "Push notification dan email", icon: "🔔" },
          { title: "Pengelolaan Admin", desc: "Tambah dan kelola akun admin", icon: "👥" },
          { title: "Backup Data", desc: "Ekspor dan backup data", icon: "💾" },
          { title: "Tentang Aplikasi", desc: "Versi 1.0.0 · LaundryKu", icon: "ℹ️" },
        ].map((item) => (
          <button key={item.title} className="rounded-2xl p-6 text-left flex items-center gap-4 transition-all hover:scale-[1.01]"
            style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{item.title}</p>
              <p style={{ fontSize: 13, color: t.textMuted }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared ───────────────────────────────────────────── */
function SectionHeader({ t, title }: { t: ThemeColors; title: string }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 16 }}>{title}</h2>;
}
function InfoCard({ t, label, value, large }: { t: ThemeColors; label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, boxShadow: t.shadow, border: `1px solid ${t.cardBorder}` }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: large ? 20 : 18, fontWeight: 700, color: t.text }}>{value}</p>
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
function BackIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function HomeIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function MachineIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" stroke={color} strokeWidth="2" fill="none" /><circle cx="12" cy="13" r="4.5" stroke={color} strokeWidth="2" fill="none" /></svg>;
}
function PeopleIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ReportIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SettingIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
