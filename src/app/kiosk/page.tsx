"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, KIOSK_CATEGORIES } from "@/components/Sidebar";
import { ProductCard, ProductItem } from "@/components/ProductCard";
import { CartFloatingBar } from "@/components/CartFloatingBar";
import { CartPage } from "@/components/CartPage";
import { ThankYouPage } from "@/components/ThankYouPage";
import { fetchCatalogAsync, SectionProducts } from "@/lib/productStore";
import {
  generateTextReceipt,
  generateHtmlReceipt,
  downloadReceiptFile,
  downloadReceiptPdf,
  printReceiptHtml
} from "@/lib/receiptHelper";

export interface CartMapItem {
  product: ProductItem;
  quantity: number;
}

export default function KioskPage() {
  const router = useRouter();
  
  // Logged-in User State (loaded from sessionStorage set by face scan)
  const [userId, setUserId] = useState<string>("emp-999");
  const [userName, setUserName] = useState<string>("Guest User");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUser = sessionStorage.getItem("dinshaws_logged_in_user");
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser);
          setUserId(user.userId || "emp-999");
          setUserName(user.name || "Guest User");
        } catch (e) {
          console.error("Failed to parse logged in user session", e);
        }
      }
    }
  }, []);

  // Default to Dairy category (id: 2)
  const [activeTab, setActiveTab] = useState<number>(2);
  const [cartMap, setCartMap] = useState<Record<string, CartMapItem>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState<boolean>(false);
  const [activeSections, setActiveSections] = useState<SectionProducts[]>([]);

  // Inactivity countdown state (15 seconds)
  const [idleSeconds, setIdleSeconds] = useState<number>(15);

  // Monitor idle countdown timer
  useEffect(() => {
    if (isCartOpen) {
      setIdleSeconds(15);
      return;
    }

    const interval = setInterval(() => {
      setIdleSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCartOpen]);

  // Trigger redirect and cleanup when idleSeconds hits 0
  useEffect(() => {
    if (idleSeconds <= 0) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dinshaws_logged_in_user");
      }
      setCartMap({});
      setIdleSeconds(15);
      router.push("/timeout");
    }
  }, [idleSeconds, router]);

  // Reset idle countdown timer upon any interaction event
  useEffect(() => {
    const handleActivity = () => {
      setIdleSeconds(15);
    };

    const activityEvents = ["click", "keypress", "touchstart", "mousedown"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const refreshCatalog = async () => {
    const catalog = await fetchCatalogAsync();
    setActiveSections(catalog[activeTab] || []);
  };

  useEffect(() => {
    refreshCatalog();
    const handleUpdate = () => refreshCatalog();
    window.addEventListener("dinshaws_catalog_updated", handleUpdate);
    return () => window.removeEventListener("dinshaws_catalog_updated", handleUpdate);
  }, [activeTab]);

  const currentCategory =
    KIOSK_CATEGORIES.find((cat) => cat.id === activeTab) || KIOSK_CATEGORIES[1];

  const handleQuantityChange = (product: ProductItem, qty: number) => {
    setCartMap((prev) => {
      const nextMap = { ...prev };
      if (qty <= 0) {
        delete nextMap[product.id];
      } else {
        nextMap[product.id] = { product, quantity: qty };
      }
      return nextMap;
    });
  };

  // Calculate total item count across all selected products
  const totalItems = Object.values(cartMap).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleReceiptAction = async (purchase: any) => {
    try {
      const settingsRes = await fetch("/api/receipt-settings");
      const settings = settingsRes.ok 
        ? await settingsRes.json() 
        : {
            headerText: "DINSHAW'S ICE CREAM & DAIRY",
            subHeaderText: "Welcome to Dinshaw's Kiosk",
            kioskName: "Kiosk #01",
            phone: "+91 12345 67890",
            footerText: "Please present this receipt at the counter to collect your order.",
            showLogo: true,
            showUser: true,
            showTimestamp: true
          };

      const downloadFlag = process.env.NEXT_PUBLIC_DOWNLOAD_RECEIPT === "true";
      
      const receiptItems = Array.isArray(purchase.items)
        ? purchase.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity
          }))
        : [];

      if (downloadFlag) {
        // 1. Download Canteen Copy PDF
        downloadReceiptPdf(
          receiptItems,
          purchase.id,
          purchase.userId,
          purchase.userName,
          settings,
          "canteen"
        );

        // 2. Download Gate Exit Copy PDF
        downloadReceiptPdf(
          receiptItems,
          purchase.id,
          purchase.userId,
          purchase.userName,
          settings,
          "gate"
        );
      } else {
        // 1. Generate & Print Canteen Copy
        const canteenHtml = generateHtmlReceipt(
          receiptItems,
          purchase.id,
          purchase.userId,
          purchase.userName,
          settings,
          "canteen"
        );
        printReceiptHtml(canteenHtml);

        // 2. Generate & Print Gate Copy (with delay to avoid browser printer overlap blocking)
        setTimeout(() => {
          const gateHtml = generateHtmlReceipt(
            receiptItems,
            purchase.id,
            purchase.userId,
            purchase.userName,
            settings,
            "gate"
          );
          printReceiptHtml(gateHtml);
        }, 1200);
      }
    } catch (err) {
      console.error("Error generating or printing receipts:", err);
    }
  };

  const handleCheckout = async () => {
    try {
      // POST purchase log to backend database
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          items: Object.values(cartMap),
          totalItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.purchase) {
          // Trigger automatic print or download based on .env configuration
          await handleReceiptAction(data.purchase);
        }
      }
    } catch (e) {
      console.warn("Failed to log checkout transaction", e);
    }
    setIsCartOpen(false);
    setIsThankYouOpen(true);
  };

  const handleThankYouReset = useCallback(() => {
    setIsThankYouOpen(false);
    setCartMap({});
    // Clear logged in session on logout/reset
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("dinshaws_logged_in_user");
    }
    // Redirect directly to Home page on completion
    router.push("/");
  }, [router]);

  return (
    <div className="kiosk-app-wrapper">
      {/* Top Navbar */}
      <header className="kiosk-top-navbar" style={{ position: "relative" }}>
        <div className="navbar-logo-wrapper">
          <img
            src="https://www.dinshaws.co.in/assets/static/dinshaw-logo-white-text-png.PNG"
            alt="Dinshaw's Logo"
            className="navbar-logo-img"
          />
        </div>
        {idleSeconds < 15 && (
          <div className="kiosk-inactivity-timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Auto logout in {idleSeconds}s
          </div>
        )}
      </header>

      {/* Main Kiosk Area */}
      <div className="kiosk-container">
        {/* 4 Circle Icon Sidebar */}
        <Sidebar activeId={activeTab} onSelect={(id) => setActiveTab(id)} userId={userId} />

        {/* Main Content View Area */}
        <main className="kiosk-main-content">
          {activeSections.length > 0 ? (
            <div className="dairy-sections-container">
              {activeSections.map((sec, idx) => (
                <section
                  key={sec.sectionTitle}
                  className={`kiosk-section ${idx > 0 ? "category-section-gap" : ""}`}
                >
                  <header className="main-header-center">
                    <h1 className="bars-product-heading">{sec.sectionTitle}</h1>
                  </header>
                  <div className="products-grid-preview">
                    {sec.products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        quantity={cartMap[prod.id]?.quantity || 0}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Empty Category Placeholder */
            <section className="kiosk-section">
              <header className="main-header-center">
                <h1 className="bars-product-heading">{currentCategory.label.toUpperCase()}</h1>
              </header>
              <div className="empty-category-placeholder">
                <p>No products added for {currentCategory.label} yet.</p>
              </div>
            </section>
          )}
        </main>

        {/* Floating Bottom-Centered Cart Bar (Appears when totalItems > 0, hides when 0) */}
        <CartFloatingBar
          totalItems={totalItems}
          onViewCart={() => setIsCartOpen(true)}
        />

        {/* Full-Page View Cart View */}
        <CartPage
          isOpen={isCartOpen}
          cartItems={Object.values(cartMap)}
          onClose={() => setIsCartOpen(false)}
          onQuantityChange={handleQuantityChange}
          onCheckout={handleCheckout}
        />

        {/* Thank You / Order Confirmation Screen */}
        <ThankYouPage
          isOpen={isThankYouOpen}
          onReset={handleThankYouReset}
          autoResetSeconds={10}
        />
      </div>
    </div>
  );
}
