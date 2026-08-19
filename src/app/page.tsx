"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/scan");
  };

  return (
    <div className="kiosk-welcome-screen">
      <img
        src="https://www.dinshaws.co.in/assets/static/dinshaw-logo-white-text-png.PNG"
        alt="Dinshaw's Logo"
        className="welcome-logo"
      />
      <button 
        className="welcome-start-btn"
        onClick={handleStart}
      >
        Touch to Start
      </button>
    </div>
  );
}
