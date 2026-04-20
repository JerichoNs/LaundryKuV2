import { useNavigate } from "react-router";
import { useTheme } from "../context/ThemeContext";

const FONT = "'Plus Jakarta Sans', sans-serif";

export function PlatformSelector() {
  const navigate = useNavigate();
  const t = useTheme();

  const views = [
    {
      path: "/admin-mobile",
      title: "Admin — Mobile",
      subtitle: "375 × 812px · Dashboard pemilik",
      icon: <MobileIcon />,
      iconBg: t.isDark ? "#1E3A5F" : "#EFF6FF",
      iconColor: "#2563EB",
      badge: "Admin",
      badgeBg: t.isDark ? "#1E3A5F" : "#DBEAFE",
      badgeColor: "#2563EB",
    },
    {
      path: "/admin-desktop",
      title: "Admin — Desktop",
      subtitle: "1440 × 900px · Panel manajemen penuh",
      icon: <DesktopIcon />,
      iconBg: t.isDark ? "#1E3A5F" : "#EFF6FF",
      iconColor: "#2563EB",
      badge: "Admin",
      badgeBg: t.isDark ? "#1E3A5F" : "#DBEAFE",
      badgeColor: "#2563EB",
    },
    {
      path: "/customer-mobile",
      title: "Pelanggan — Mobile",
      subtitle: "375 × 812px · Lacak status laundry",
      icon: <MobileIcon />,
      iconBg: t.isDark ? "#14532D" : "#F0FDF4",
      iconColor: "#22C55E",
      badge: "Pelanggan",
      badgeBg: t.isDark ? "#14532D" : "#DCFCE7",
      badgeColor: "#16A34A",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: t.pageBg, fontFamily: FONT, transition: "background 0.3s" }}
    >
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: t.cardBorder, background: t.headerBg, boxShadow: t.shadowSm }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#2563EB" }}
          >
            <WashIcon size={20} color="white" />
          </div>
          <div>
            <span className="text-[#2563EB]" style={{ fontSize: 17, fontWeight: 800 }}>LaundryKu</span>
            <span className="ml-2" style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>v1.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>
            {t.isDark ? "Tema Gelap" : "Tema Terang"}
          </span>
          <ThemeToggle isDark={t.isDark} onToggle={t.toggle} />
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Logo */}
        <div className="flex flex-col items-center mb-14">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(145deg, #2563EB, #1D4ED8)", boxShadow: "0 12px 40px rgba(37,99,235,0.35)" }}
          >
            <WashIcon size={48} color="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>
            LaundryKu
          </h1>
          <p style={{ fontSize: 15, color: t.textSec, fontWeight: 400, marginTop: 6 }}>
            Sistem Monitoring Laundry Cerdas
          </p>

          {/* Feature Pills */}
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            {["Real-time", "Multi-mesin", "Notifikasi Otomatis"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full"
                style={{ background: t.isDark ? "#1E293B" : "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 600, border: `1px solid ${t.isDark ? "#334155" : "#BFDBFE"}` }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* View Cards */}
        <div className="w-full max-w-md space-y-3">
          <p
            className="text-center mb-4"
            style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: "0.08em" }}
          >
            PILIH TAMPILAN
          </p>
          {views.map((v) => (
            <button
              key={v.path}
              onClick={() => navigate(v.path)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all hover:scale-[1.015] active:scale-[0.99]"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.shadow,
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: v.iconBg }}
              >
                <div style={{ color: v.iconColor }}>{v.icon}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{v.title}</p>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: 10, fontWeight: 700, color: v.badgeColor, background: v.badgeBg }}
                  >
                    {v.badge}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: t.textSec }}>{v.subtitle}</p>
              </div>
              <ChevronIcon color={t.textMuted} />
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-12" style={{ fontSize: 12, color: t.textMuted }}>
          Mode demo · Semua data bersifat simulasi
        </p>
      </div>
    </div>
  );
}

/* ─── Theme Toggle ─────────────────────────────────────── */
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center rounded-full transition-all"
      style={{
        width: 52,
        height: 28,
        background: isDark ? "#2563EB" : "#CBD5E1",
        padding: "3px",
      }}
      aria-label="Toggle theme"
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: "white",
          transform: isDark ? "translateX(24px)" : "translateX(0)",
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isDark ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#1D4ED8" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#F59E0B" />
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

/* ─── Icons ────────────────────────────────────────────── */
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

function MobileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
