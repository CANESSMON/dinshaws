"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // If already authenticated, redirect to appropriate portal
  useEffect(() => {
    const role = sessionStorage.getItem("dinshaws_admin_role");
    if (role === "dev") {
      router.replace("/admin");
    } else if (role === "super") {
      router.replace("/super");
    } else if (role === "vendor") {
      router.replace("/vendor");
    }
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save authenticated admin role to session storage
        sessionStorage.setItem("dinshaws_admin_role", data.role);

        // Retrieve redirect query param
        const redirectParam = searchParams.get("redirect");
        
        if (data.role === "dev") {
          router.push(redirectParam || "/admin");
        } else if (data.role === "super") {
          router.push(redirectParam || "/super");
        } else if (data.role === "vendor") {
          router.push(redirectParam || "/vendor");
        }
      } else {
        setLoginError(data.error || "Invalid username or password!");
      }
    } catch (err) {
      console.error("Login request failed", err);
      setLoginError("Failed to connect to authentication server!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="login-brand-header">
          <div className="lock-icon-circle">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="login-brand-title">ADMINISTRATIVE LOGIN</h1>
          <p className="login-brand-subtitle">
            Enter credentials to log into your portal
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="login-form">
          {loginError && <div className="login-error-banner">{loginError}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingRight: "44px" }}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: 0
                }}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">Authenticating...</span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>AUTHENTICATE & LOG IN</span>
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer-info" style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
          Common access for Super Admin, Catalog Dev, and Vendor Portal.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="admin-login-screen">
        <div className="admin-login-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ color: "#ffffff", fontWeight: "600" }}>Loading...</div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
