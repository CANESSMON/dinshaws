"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  LogOut,
  ShieldCheck,
  Loader2,
  History,
  AlertCircle,
  Package,
  Calendar,
  RefreshCw,
  Download,
  ShoppingBag,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface RequirementItem {
  name: string;
  totalQuantity: number;
}

interface Requirement {
  id: string;
  date: string;
  items: RequirementItem[];
  totalItems: number;
  totalPurchases: number;
  pushedAt: string;
  pushedBy: string;
}

// Dynamic mock fallback dates (covering the past 7 days)
const getDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-CA");
};

const todayStr = getDateStr(0);

const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: "mock-today-1",
    date: todayStr,
    pushedAt: new Date().toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 42,
    totalItems: 216,
    items: [
      { name: "Aahar Milk 500 ml", totalQuantity: 32 },
      { name: "Fresh Dahi 200 ml", totalQuantity: 22 },
      { name: "Fresh Paneer 200g", totalQuantity: 18 },
      { name: "Butter 100gm", totalQuantity: 14 },
      { name: "Mishti Dahi 160gm", totalQuantity: 12 },
      { name: "Sarvottam Gold 1 L", totalQuantity: 10 },
      { name: "Chocolate Ice Cream 500ml", totalQuantity: 9 },
      { name: "Vanilla Tub 1 L", totalQuantity: 8 },
      { name: "Mango Shrikhand 250g", totalQuantity: 8 },
      { name: "Sweet Lassi 200ml", totalQuantity: 15 },
      { name: "Kesar Pista Kulfi", totalQuantity: 12 },
      { name: "Pure Cow Ghee 500ml", totalQuantity: 6 },
      { name: "Cheese Slices 200g", totalQuantity: 7 },
      { name: "Flavored Badam Milk 200ml", totalQuantity: 11 },
      { name: "Phoorti Toned Milk 500ml", totalQuantity: 20 },
      { name: "Choco Dip Cone", totalQuantity: 14 },
    ],
  },
  {
    id: "mock-day-1",
    date: getDateStr(1),
    pushedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 25,
    totalItems: 92,
    items: [
      { name: "Aahar Milk 500 ml", totalQuantity: 20 },
      { name: "Fresh Dahi 200 ml", totalQuantity: 12 },
      { name: "Fresh Paneer 200g", totalQuantity: 10 },
      { name: "Butter 100gm", totalQuantity: 6 },
      { name: "Mishti Dahi 160gm", totalQuantity: 8 },
      { name: "Sarvottam Gold 1 L", totalQuantity: 4 },
      { name: "Aahar Milk 1 L", totalQuantity: 20 },
      { name: "Phoorti Milk 500 ml", totalQuantity: 12 },
    ],
  },
  {
    id: "mock-day-2",
    date: getDateStr(2),
    pushedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 14,
    totalItems: 48,
    items: [
      { name: "Aahar Milk 500 ml", totalQuantity: 20 },
      { name: "Fresh Dahi 200 ml", totalQuantity: 12 },
      { name: "Kadhi Dahi 1 kg", totalQuantity: 8 },
      { name: "Sarvottam Gold 500 ml", totalQuantity: 8 },
    ],
  },
  {
    id: "mock-day-3",
    date: getDateStr(3),
    pushedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 31,
    totalItems: 115,
    items: [
      { name: "Aahar Milk 500 ml", totalQuantity: 40 },
      { name: "Sarvottam Gold 1 L", totalQuantity: 25 },
      { name: "Fresh Paneer 500g", totalQuantity: 18 },
      { name: "Fresh Dahi 5 kg", totalQuantity: 12 },
      { name: "Butter 100gm", totalQuantity: 20 },
    ],
  },
  {
    id: "mock-day-4",
    date: getDateStr(4),
    pushedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 22,
    totalItems: 84,
    items: [
      { name: "Phoorti Milk 180 ml", totalQuantity: 32 },
      { name: "Aahar Milk 2 L", totalQuantity: 16 },
      { name: "Mishti Dahi 160gm", totalQuantity: 20 },
      { name: "Fresh Paneer 1 kg", totalQuantity: 16 },
    ],
  },
  {
    id: "mock-day-5",
    date: getDateStr(5),
    pushedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 19,
    totalItems: 63,
    items: [
      { name: "Aahar Milk 1 L", totalQuantity: 22 },
      { name: "Amrik Milk 500 ml", totalQuantity: 18 },
      { name: "Fresh Dahi 200 ml", totalQuantity: 15 },
      { name: "Butter 100gm", totalQuantity: 8 },
    ],
  },
  {
    id: "mock-day-6",
    date: getDateStr(6),
    pushedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 28,
    totalItems: 102,
    items: [
      { name: "Aahar Milk 500 ml", totalQuantity: 35 },
      { name: "Sarvottam Gold 500 ml", totalQuantity: 28 },
      { name: "Fresh Paneer 200g", totalQuantity: 24 },
      { name: "Kadhi Dahi 5 kg", totalQuantity: 15 },
    ],
  },
  {
    id: "mock-day-7",
    date: getDateStr(7),
    pushedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    pushedBy: "superadmin",
    totalPurchases: 16,
    totalItems: 55,
    items: [
      { name: "Aahar Milk 1 L", totalQuantity: 20 },
      { name: "Fresh Dahi 1 kg", totalQuantity: 15 },
      { name: "Malai Paneer 500g", totalQuantity: 12 },
      { name: "Mishti Dahi 160gm", totalQuantity: 8 },
    ],
  },
];

const mergeRequirements = (dbData: Requirement[]) => {
  const datesInDb = new Set(dbData.map((r) => r.date));
  const missingMocks = MOCK_REQUIREMENTS.filter((m) => !datesInDb.has(m.date));
  const combined = [...dbData, ...missingMocks];
  return combined.sort(
    (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
  );
};

export default function VendorPage() {
  const router = useRouter();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const role = sessionStorage.getItem("dinshaws_admin_role");
    if (role === "vendor") {
      setIsAuthenticated(true);
    } else {
      router.replace("/login?redirect=/vendor");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("dinshaws_admin_role");
    router.replace("/login");
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");

  // Data State
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // History Date Range Controls
  const [dateRangePreset, setDateRangePreset] = useState<"all" | "7days" | "15days" | "30days" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const fetchRequirements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requirements");
      if (res.ok) {
        const data = await res.json();
        const merged = mergeRequirements(Array.isArray(data) ? data : []);
        setRequirements(merged);
        if (merged.length > 0) {
          setExpandedCards((prev) => ({ ...prev, [merged[0].id]: true }));
        }
      } else {
        setRequirements(MOCK_REQUIREMENTS);
        if (MOCK_REQUIREMENTS.length > 0) {
          setExpandedCards((prev) => ({ ...prev, [MOCK_REQUIREMENTS[0].id]: true }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch requirements, using fallback data", e);
      setRequirements(MOCK_REQUIREMENTS);
      if (MOCK_REQUIREMENTS.length > 0) {
        setExpandedCards((prev) => ({ ...prev, [MOCK_REQUIREMENTS[0].id]: true }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequirements();
    }
  }, [isAuthenticated]);

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const todayDate = new Date().toLocaleDateString("en-CA");
  const todayRequirements = requirements.filter((r) => r.date === todayDate);
  const latestToday = todayRequirements.length > 0 ? todayRequirements[0] : null;

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPushedTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // Filter requirements based on selected range
  const filteredRequirements = requirements.filter((req) => {
    if (dateRangePreset === "all") return true;

    const reqDate = new Date(req.date + "T00:00:00").getTime();
    const todayTime = new Date(todayStr + "T00:00:00").getTime();

    if (dateRangePreset === "7days") {
      const past7 = todayTime - 7 * 86400000;
      return reqDate >= past7;
    }
    if (dateRangePreset === "15days") {
      const past15 = todayTime - 15 * 86400000;
      return reqDate >= past15;
    }
    if (dateRangePreset === "30days") {
      const past30 = todayTime - 30 * 86400000;
      return reqDate >= past30;
    }
    if (dateRangePreset === "custom") {
      if (customStartDate) {
        const start = new Date(customStartDate + "T00:00:00").getTime();
        if (reqDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate + "T23:59:59").getTime();
        if (reqDate > end) return false;
      }
      return true;
    }
    return true;
  });

  const exportToCSV = (req: Requirement) => {
    const headers = ["Index", "Product Name", "Required Quantity"];
    const rows = (req.items as RequirementItem[]).map((item, idx) => [
      idx + 1,
      `"${item.name}"`,
      item.totalQuantity,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendor_Requirements_${req.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllHistoryToCSV = () => {
    const headers = ["Date", "Pushed Time", "Pushed By", "Total Orders", "Total Items", "Product Name", "Quantity"];
    const rows: (string | number)[][] = [];

    filteredRequirements.forEach((req) => {
      (req.items as RequirementItem[]).forEach((item) => {
        rows.push([
          req.date,
          formatPushedTime(req.pushedAt),
          req.pushedBy || "superadmin",
          req.totalPurchases,
          req.totalItems,
          `"${item.name}"`,
          item.totalQuantity,
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendor_Requirements_Filtered_${dateRangePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayItems = (latestToday?.items as RequirementItem[] || []);
  const todayTotal = todayItems.reduce((acc, i) => acc + i.totalQuantity, 0);

  // ---------- LOGIN SCREEN ----------
  if (!isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ color: "#ffffff", fontWeight: "600" }}>Redirecting to Login...</div>
        </div>
      </div>
    );
  }

  // ---------- MAIN PORTAL LAYOUT (SMOOTH FULL SCREEN SCROLLING & RESPONSIVE) ----------
  return (
    <div
      className="admin-container"
      style={{
        background: "#f4f4f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#18181b",
        width: "100%",
      }}
    >
      {/* ===== COMPACT SYSTEM HEADER ===== */}
      <header
        className="admin-header vendor-header-bar"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #eaeaea",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          width: "100%",
          flexWrap: "wrap",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(222, 37, 30, 0.08)",
              border: "1px solid rgba(222, 37, 30, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#de251e",
              flexShrink: 0,
            }}
          >
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="vendor-header-title" style={{ fontSize: "20px", fontWeight: 900, color: "#de251e", margin: 0, fontFamily: "var(--font-heading-family)" }}>
              VENDOR SUPPLY PORTAL
            </h1>
            <span className="vendor-header-subtitle" style={{ fontSize: "12px", color: "#71717a", fontWeight: 500 }}>
              Product Requirements &amp; Audit Logs
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="admin-header-actions" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Header Tab Buttons */}
          <div style={{ display: "flex", background: "#f4f4f5", padding: "3px", borderRadius: "10px", border: "1px solid #e4e4e7" }}>
            <button
              onClick={() => setActiveTab("today")}
              className={`admin-header-tab-btn ${activeTab === "today" ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "today" ? "#de251e" : "transparent",
                color: activeTab === "today" ? "#ffffff" : "#71717a",
                transition: "all 0.15s ease",
              }}
            >
              <Package className="w-4 h-4" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`admin-header-tab-btn ${activeTab === "history" ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "history" ? "#de251e" : "transparent",
                color: activeTab === "history" ? "#ffffff" : "#71717a",
                transition: "all 0.15s ease",
              }}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>

          <div className="header-actions-divider" />

          {/* Sync Button */}
          <button
            onClick={fetchRequirements}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              color: "#18181b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-heading-family)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
            title="Sync latest demand updates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="admin-logout-btn-icon"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div
        className="vendor-main-wrapper"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: activeTab === "history" ? "auto" : "hidden",
          padding: activeTab === "history" ? "20px 24px 60px 24px" : "20px 24px",
          width: "100%",
          margin: "0 auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ===== TODAY TAB CONTENT (FIT TO SCREEN HEIGHT, ONLY TABLE SCROLLS) ===== */}
        {activeTab === "today" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              flex: 1,
              minHeight: 0,
              gap: "16px",
            }}
          >
            {/* 4 KPI METRIC CARDS ROW - FIXED AT TOP */}
            <div
              className="vendor-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                width: "100%",
                flexShrink: 0,
              }}
            >
              {/* CARD 1: TODAY'S DATE */}
              <div
                className="admin-card vendor-kpi-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaeaea",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  className="vendor-kpi-icon"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(22, 163, 74, 0.1)",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="vendor-kpi-title" style={{ fontSize: "11px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Today&apos;s Date
                  </div>
                  <div className="vendor-kpi-value" style={{ fontSize: "16px", fontWeight: 900, color: "#18181b", marginTop: "2px", fontFamily: "var(--font-heading-family)" }}>
                    {formatDisplayDate(todayDate)}
                  </div>
                </div>
              </div>

              {/* CARD 2: PURCHASES TODAY */}
              <div
                className="admin-card vendor-kpi-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaeaea",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  className="vendor-kpi-icon"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(147, 51, 234, 0.1)",
                    color: "#9333ea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="vendor-kpi-title" style={{ fontSize: "11px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Purchases Today
                  </div>
                  <div className="vendor-kpi-value" style={{ fontSize: "17px", fontWeight: 900, color: "#18181b", marginTop: "2px", fontFamily: "var(--font-heading-family)" }}>
                    {latestToday ? latestToday.totalPurchases : 0}{" "}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#71717a" }}>orders</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: ITEMS REQUIRED */}
              <div
                className="admin-card vendor-kpi-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(222, 37, 30, 0.25)",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 14px rgba(222, 37, 30, 0.04)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  className="vendor-kpi-icon"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(222, 37, 30, 0.1)",
                    color: "#de251e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="vendor-kpi-title" style={{ fontSize: "11px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Items Required
                  </div>
                  <div className="vendor-kpi-value" style={{ fontSize: "17px", fontWeight: 900, color: "#de251e", marginTop: "2px", fontFamily: "var(--font-heading-family)" }}>
                    {latestToday ? latestToday.totalItems : 0}{" "}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#71717a" }}>units</span>
                  </div>
                </div>
              </div>

              {/* CARD 4: LAST SYNCED */}
              <div
                className="admin-card vendor-kpi-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaeaea",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  className="vendor-kpi-icon"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#f4f4f5",
                    color: "#71717a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="vendor-kpi-title" style={{ fontSize: "11px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Last Synced
                  </div>
                  <div className="vendor-kpi-value" style={{ fontSize: "16px", fontWeight: 900, color: "#18181b", marginTop: "2px", fontFamily: "var(--font-heading-family)" }}>
                    {latestToday ? formatPushedTime(latestToday.pushedAt) : "Not Synced"}
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN TABLE CARD CONTAINER (FITS SCREEN, ONLY TABLE SCROLLS INTERNALLY) */}
            <div
              className="admin-card vendor-table-card"
              style={{
                background: "#ffffff",
                border: "1px solid #eaeaea",
                borderRadius: "20px",
                padding: "20px 24px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.03)",
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header Row with Export CSV */}
              <div
                className="vendor-table-header-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "12px",
                  flexShrink: 0,
                }}
              >
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#18181b", margin: 0, fontFamily: "var(--font-heading-family)" }}>
                    TODAY&apos;S PRODUCT REQUIREMENTS
                  </h2>
                  <span style={{ fontSize: "13px", color: "#71717a", fontWeight: 500 }}>
                    Aggregated product quantities requested from kiosk purchases
                  </span>
                </div>

                {/* Export CSV Button */}
                {latestToday && (
                  <button
                    onClick={() => exportToCSV(latestToday)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 800,
                      borderRadius: "8px",
                      border: "1px solid rgba(222, 37, 30, 0.3)",
                      background: "#fef2f2",
                      color: "#de251e",
                      cursor: "pointer",
                      fontFamily: "var(--font-heading-family)",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>

              {/* TABLE CONTAINER WRAPPER (FIXED HEADER & FOOTER, ONLY TBODY HAS SMALL SCROLLBAR) */}
              {isLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#71717a" }}>
                  <Loader2 className="w-6 h-6 animate-spin text-primary" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "13px" }}>Loading catalog requirements...</p>
                </div>
              ) : !latestToday || todayItems.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#71717a" }}>
                  <AlertCircle className="w-8 h-8" style={{ margin: "0 auto 8px", opacity: 0.6 }} />
                  <p style={{ fontSize: "14px" }}>No requirement records found for today.</p>
                </div>
              ) : (
                <div
                  className="vendor-table-box"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                    maxHeight: "calc(100vh - 270px)",
                    border: "1px solid #eaeaea",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  {/* 1. FIXED HEADER (OUTSIDE SCROLL AREA) */}
                  <div style={{ background: "#f8f9fa", borderBottom: "2px solid #eaeaea", flexShrink: 0 }}>
                    <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                      <thead>
                        <tr
                          style={{
                            color: "#71717a",
                            fontSize: "11px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          <th className="vendor-col-num" style={{ padding: "12px 16px", width: "50px" }}>#</th>
                          <th className="vendor-col-name" style={{ padding: "12px 16px" }}>Product Name</th>
                          <th className="vendor-col-qty" style={{ padding: "12px 16px", textAlign: "right", width: "150px" }}>
                            Required Quantity
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* 2. SCROLLABLE PRODUCT ROWS CONTAINER (GREEN BOX AREA WITH 5PX CUSTOM SCROLLBAR) */}
                  <div
                    className="custom-scrollbar"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      width: "100%",
                    }}
                  >
                    <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                      <tbody>
                        {todayItems.map((item, idx) => (
                          <tr
                            key={item.name}
                            style={{
                              borderBottom: "1px solid #f4f4f5",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <td className="vendor-col-num" style={{ padding: "12px 16px", width: "50px", color: "#a1a1aa", fontWeight: 600 }}>
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="vendor-col-name" style={{ padding: "12px 16px", fontWeight: 700, color: "#18181b" }}>
                              {item.name}
                            </td>
                            <td
                              className="vendor-col-qty"
                              style={{
                                padding: "12px 16px",
                                width: "150px",
                                textAlign: "right",
                                fontWeight: 800,
                                fontSize: "16px",
                                color: "#de251e",
                                fontFamily: "var(--font-heading-family)",
                              }}
                            >
                              {item.totalQuantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 3. FIXED FOOTER (OUTSIDE SCROLL AREA) */}
                  <div style={{ background: "#fff5f5", borderTop: "2px solid #de251e", flexShrink: 0 }}>
                    <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                      <tfoot>
                        <tr>
                          <td className="vendor-footer-label" style={{ padding: "14px 16px", fontWeight: 800, color: "#18181b", fontSize: "15px", fontFamily: "var(--font-heading-family)" }}>
                            TOTAL TODAY DEMAND
                          </td>
                          <td
                            className="vendor-footer-value"
                            style={{
                              padding: "14px 16px",
                              width: "150px",
                              textAlign: "right",
                              fontWeight: 900,
                              fontSize: "20px",
                              color: "#de251e",
                              fontFamily: "var(--font-heading-family)",
                            }}
                          >
                            {todayTotal} units
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== HISTORY AUDIT TAB CONTENT ===== */}
        {activeTab === "history" && (
          <div>
            {/* FROZEN STICKY TOP CONTAINER (Opaque background prevents scrolled cards from bleeding through at top) */}
            <div
              className="vendor-history-header-wrapper"
              style={{
                position: "sticky",
                top: "-20px",
                paddingTop: "20px",
                paddingBottom: "16px",
                marginTop: "-20px",
                background: "#f4f4f5",
                zIndex: 50,
              }}
            >
              {/* PAGE TITLE ON LEFT & FILTER RANGE + EXPORT BUTTON ON RIGHT CORNER */}
              <div
                className="admin-card vendor-history-header"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  background: "#ffffff",
                  padding: "18px 24px",
                  borderRadius: "16px",
                  border: "1px solid #eaeaea",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
                  width: "100%",
                }}
              >
                {/* LEFT: HEADING & SUBTITLE */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#de251e", margin: 0, fontFamily: "var(--font-heading-family)" }}>
                    Requirement History
                  </h2>
                  <p className="vendor-history-subtitle" style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
                    Full audit history of all daily product demand pushes and historical change logs.
                  </p>
                </div>

                {/* RIGHT CORNER: FILTER RANGE + EXPORT DATA BUTTON (HORIZONTAL FLEX ROW) */}
                <div className="vendor-history-controls" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  {/* FILTER CONTROLS */}
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
                    <Calendar className="w-4 h-4 text-primary" style={{ color: "#de251e" }} />
                    <select
                      value={dateRangePreset}
                      onChange={(e) => setDateRangePreset(e.target.value as any)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid #e4e4e7",
                        background: "#f8f9fa",
                        color: "#18181b",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "var(--font-heading-family)",
                      }}
                    >
                      <option value="all">All Time History</option>
                      <option value="7days">1 Week (7 Days)</option>
                      <option value="15days">2 Weeks (15 Days)</option>
                      <option value="30days">1 Month (30 Days)</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Custom Calendar Inputs if selected */}
                  {dateRangePreset === "custom" && (
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #e4e4e7",
                          background: "#ffffff",
                          fontSize: "12px",
                          color: "#18181b",
                          fontWeight: 600,
                        }}
                      />
                      <span style={{ fontSize: "12px", color: "#71717a", fontWeight: 600 }}>to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #e4e4e7",
                          background: "#ffffff",
                          fontSize: "12px",
                          color: "#18181b",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  )}

                  {/* EXPORT DATA BUTTON RIGHT BESIDE FILTER BUTTON */}
                  <button
                    onClick={exportAllHistoryToCSV}
                    style={{
                      display: "inline-flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 800,
                      borderRadius: "10px",
                      border: "1px solid rgba(222, 37, 30, 0.3)",
                      background: "#de251e",
                      color: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(222, 37, 30, 0.2)",
                      fontFamily: "var(--font-heading-family)",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export History (CSV)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FULL AUDIT TIMELINE PUSH CARDS (FILTERED DATA) */}
            {isLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#71717a" }}>
                <Loader2 className="w-6 h-6 animate-spin text-primary" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px" }}>Loading audit records...</p>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div
                className="admin-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaeaea",
                  borderRadius: "16px",
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#71717a",
                }}
              >
                <AlertCircle className="w-8 h-8" style={{ margin: "0 auto 8px", opacity: 0.6 }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No requirement pushes found for the selected date range.</p>
                <button
                  onClick={() => setDateRangePreset("all")}
                  style={{
                    marginTop: "12px",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "#de251e",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset to All Time
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
                {filteredRequirements.map((req) => {
                  const isExpanded = !!expandedCards[req.id];

                  // Compare with previous requirement
                  const originalIdx = requirements.findIndex((r) => r.id === req.id);
                  const prevReq = originalIdx < requirements.length - 1 ? requirements[originalIdx + 1] : null;
                  const prevMap: Record<string, number> = {};
                  if (prevReq) {
                    (prevReq.items as RequirementItem[]).forEach((i) => {
                      prevMap[i.name] = i.totalQuantity;
                    });
                  }

                  return (
                    <div
                      key={req.id}
                      className="admin-card"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #eaeaea",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                        width: "100%",
                      }}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleExpandCard(req.id)}
                        className="vendor-history-card-header"
                        style={{
                          padding: "16px 22px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          background: isExpanded ? "#f8f9fa" : "#ffffff",
                          transition: "background 0.15s ease",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "16px", fontWeight: 900, color: "#18181b", fontFamily: "var(--font-heading-family)" }}>
                              {formatDisplayDate(req.date)}
                            </span>
                            {req.date === todayDate && (
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  background: "#f0fdf4",
                                  color: "#16a34a",
                                  border: "1px solid rgba(22, 163, 74, 0.2)",
                                }}
                              >
                                Today
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "#71717a", fontWeight: 500 }}>
                            Pushed at {formatPushedTime(req.pushedAt)}
                          </span>
                        </div>

                        {/* Right Summary Metadata */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "#18181b" }}>
                              {req.totalPurchases} Orders &bull;{" "}
                              <span style={{ color: "#de251e" }}>{req.totalItems} Items</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#71717a" }}>
                              {isExpanded ? "Click to collapse" : "Click to expand"}
                            </div>
                          </div>

                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#f4f4f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#18181b",
                              flexShrink: 0,
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {isExpanded && (
                        <div
                          className="vendor-history-card-body"
                          style={{
                            padding: "0 22px 20px 22px",
                            borderTop: "1px solid #eaeaea",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              margin: "14px 0 12px 0",
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#71717a" }}>
                              Audit Item Breakdown ({req.items.length} unique products)
                            </span>
                          </div>

                          {/* Table Container with Touch Scroll */}
                          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
                            <table style={{ width: "100%", minWidth: prevReq ? "440px" : "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                              <thead>
                                <tr
                                  style={{
                                    borderBottom: "1px solid #eaeaea",
                                    background: "#f8f9fa",
                                    color: "#71717a",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  <th style={{ padding: "8px 6px", width: "36px", textAlign: "left" }}>#</th>
                                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Product Name</th>
                                  <th style={{ padding: "8px 6px", textAlign: "right", width: "80px" }}>
                                    Required
                                  </th>
                                  {prevReq && (
                                    <>
                                      <th style={{ padding: "8px 6px", textAlign: "right", width: "75px" }}>
                                        Previous
                                      </th>
                                      <th style={{ padding: "8px 6px", textAlign: "center", width: "70px" }}>
                                        Change
                                      </th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {(req.items as RequirementItem[]).map((item, idx) => {
                                  const prevQty = prevReq ? (prevMap[item.name] ?? 0) : null;
                                  const diff = prevQty !== null ? item.totalQuantity - prevQty : null;

                                  return (
                                    <tr
                                      key={item.name}
                                      style={{ borderBottom: "1px solid #f4f4f5" }}
                                    >
                                      <td style={{ padding: "8px 6px", width: "36px", color: "#a1a1aa", fontWeight: 600 }}>
                                        {String(idx + 1).padStart(2, "0")}
                                      </td>
                                      <td style={{ padding: "8px 6px", color: "#18181b", fontWeight: 700, wordBreak: "break-word" }}>
                                        {item.name}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 6px",
                                          width: "80px",
                                          textAlign: "right",
                                          fontWeight: 800,
                                          color: "#18181b",
                                          fontFamily: "var(--font-heading-family)",
                                        }}
                                      >
                                        {item.totalQuantity}
                                      </td>
                                      {prevReq && (
                                        <>
                                          <td
                                            style={{
                                              padding: "8px 6px",
                                              width: "75px",
                                              textAlign: "right",
                                              color: "#71717a",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {prevQty}
                                          </td>
                                          <td style={{ padding: "8px 6px", width: "70px", textAlign: "center" }}>
                                            {diff !== null && diff > 0 && (
                                              <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "11px" }}>
                                                ↑ +{diff}
                                              </span>
                                            )}
                                            {diff !== null && diff < 0 && (
                                              <span style={{ color: "#d97706", fontWeight: 800, fontSize: "11px" }}>
                                                ↓ {diff}
                                              </span>
                                            )}
                                            {diff !== null && diff === 0 && (
                                              <span style={{ color: "#a1a1aa", fontSize: "11px" }}>
                                                —
                                              </span>
                                            )}
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
