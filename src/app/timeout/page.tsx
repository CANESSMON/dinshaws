"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TimeoutPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(3);

  // Handle countdown decrement and redirection side-effects
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="kiosk-welcome-screen">
      <img
        src="https://www.dinshaws.co.in/assets/static/dinshaw-logo-white-text-png.PNG"
        alt="Dinshaw's Logo"
        className="welcome-logo"
      />
      <h1 style={{ 
        color: "#ffffff", 
        fontSize: "36px", 
        fontWeight: "900", 
        fontFamily: "var(--font-heading-family), sans-serif", 
        textTransform: "uppercase", 
        letterSpacing: "0.05em",
        margin: 0
      }}>
        Session Timed Out
      </h1>
      <p style={{ 
        color: "rgba(255, 255, 255, 0.8)", 
        fontSize: "18px", 
        fontWeight: "500",
        marginTop: "12px"
      }}>
        Redirecting to start in {countdown}s...
      </p>
    </div>
  );
}
