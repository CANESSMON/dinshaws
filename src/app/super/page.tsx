"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  LogOut,
  ShieldCheck,
  Loader2,
  X,
  Camera,
  UserCheck,
  History,
  AlertCircle,
  CircleUserRound,
  Trash2,
  Edit3,
  Send
} from "lucide-react";
import { extractFaceDescriptor, extractFaceDescriptorAsync } from "@/lib/faceX";

export interface EmployeeUser {
  userId: string;
  name: string;
  mobile: string;
  faceData: string;
  faceDescriptor?: string | number[];
  isActive?: boolean;
}

// Helper to parse product name and quantity size
function parseItemName(fullName: string) {
  const regex = /^(.*?)\s*(\d+(?:\s*(?:ml|gm|g|kg|L)))$/i;
  const match = fullName.match(regex);
  if (match) {
    return { name: match[1].trim(), size: match[2].trim() };
  }
  return { name: fullName.trim(), size: "" };
}

// Helpers for high fidelity colored product icons matching reference design
function ProductIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  
  if (lower.includes("milk")) {
    return (
      <div className="tx-product-icon-container tx-milk-bg">
        <svg viewBox="0 0 24 24" className="tx-product-svg tx-milk-color" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" />
          <path d="M9 7V3h6v4" />
          <path d="M6 12h12" />
        </svg>
      </div>
    );
  }
  
  if (lower.includes("dahi") || lower.includes("curd") || lower.includes("yogurt") || lower.includes("lassi") || lower.includes("shrikhand")) {
    return (
      <div className="tx-product-icon-container tx-dahi-bg">
        <svg viewBox="0 0 24 24" className="tx-product-svg tx-dahi-color" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10H2Z" />
          <path d="M5 12h14" />
          <path d="M12 12V6" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }
  
  if (lower.includes("butter") || lower.includes("ghee")) {
    return (
      <div className="tx-product-icon-container tx-butter-bg">
        <svg viewBox="0 0 24 24" className="tx-product-svg tx-butter-color" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="10" width="18" height="9" rx="2" />
          <path d="M6 10c0-3.5 3-5.5 6-5.5s6 2 6 5.5" />
          <path d="M3 14h18" />
        </svg>
      </div>
    );
  }

  if (lower.includes("paneer") || lower.includes("cheese")) {
    return (
      <div className="tx-product-icon-container tx-paneer-bg">
        <svg viewBox="0 0 24 24" className="tx-product-svg tx-paneer-color" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M9 4v16" />
          <path d="M15 4v16" />
          <path d="M4 9h16" />
          <path d="M4 15h16" />
        </svg>
      </div>
    );
  }

  return (
    <div className="tx-product-icon-container tx-package-bg">
      <svg viewBox="0 0 24 24" className="tx-product-svg tx-package-color" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

export default function SuperAdminPage() {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const role = sessionStorage.getItem("dinshaws_admin_role");
    if (role === "super") {
      setIsAuthenticated(true);
    } else {
      router.replace("/login?redirect=/super");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("dinshaws_admin_role");
    router.replace("/login");
  };

  // Tab State: 'register' | 'employees' | 'transactions'
  const [activeTab, setActiveTab] = useState<'register' | 'employees' | 'transactions'>('register');

  // Employee Registration State
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserId, setNewUserId] = useState<string>("");
  const [newUserMobile, setNewUserMobile] = useState<string>("");
  const [newUserFaceData, setNewUserFaceData] = useState<string>("");
  const [newUserFaceDescriptor, setNewUserFaceDescriptor] = useState<any>(null);
  const [enrollStep, setEnrollStep] = useState<number>(1); // 1: Straight, 2: Left Angle, 3: Right Angle
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<number[][]>([]);
  const [regStream, setRegStream] = useState<MediaStream | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const regVideoRef = useRef<HTMLVideoElement | null>(null);

  // Employee Edit / Update State
  const [editingEmployee, setEditingEmployee] = useState<EmployeeUser | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editMobile, setEditMobile] = useState<string>("");
  const [editFaceData, setEditFaceData] = useState<string>("");
  const [editFaceDescriptor, setEditFaceDescriptor] = useState<number[] | null>(null);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isPushingRequirement, setIsPushingRequirement] = useState<boolean>(false);

  const handlePushRequirement = async () => {
    setIsPushingRequirement(true);
    try {
      const todayDate = new Date().toLocaleDateString("en-CA");
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayDate }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully pushed today's requirements (${data.requirement.totalItems} items from ${data.requirement.totalPurchases} purchases) to the Vendor Supply Portal!`);
      } else {
        const errData = await res.json();
        alert(`Failed to push requirements: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Push requirements error", err);
      alert("An unexpected error occurred while pushing requirements.");
    } finally {
      setIsPushingRequirement(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error("Failed to fetch employees list", e);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error("Failed to fetch transaction logs", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'register' || activeTab === 'employees') {
        fetchEmployees();
      } else if (activeTab === 'transactions') {
        fetchTransactions();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Handle Cleanups of Camera Streams on unmount
  useEffect(() => {
    return () => {
      if (regStream) {
        regStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [regStream]);



  // Bind camera stream to video element when it mounts
  useEffect(() => {
    if (regStream && regVideoRef.current) {
      regVideoRef.current.srcObject = regStream;
    }
  }, [regStream]);

  const startRegCamera = () => {
    setEnrollStep(1);
    setCapturedEmbeddings([]);
    if (editingEmployee) {
      setEditFaceData("");
    } else {
      setNewUserFaceData("");
    }
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } })
      .then((stream) => {
        setRegStream(stream);
      })
      .catch((err) => {
        console.error("Failed to access camera", err);
        alert("Unable to open camera. Please check video device permissions.");
      });
  };

  const stopRegCamera = () => {
    if (regStream) {
      regStream.getTracks().forEach((track) => track.stop());
      setRegStream(null);
    }
  };

  const handleCaptureFaceStep = async () => {
    if (regVideoRef.current) {
      const video = regVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Extract 128D ResNet Embedding Vector for current pose angle
        const descriptor = await extractFaceDescriptorAsync(canvas);
        const fallback = extractFaceDescriptor(canvas);
        const validDescriptor = (descriptor && descriptor.length === 128) ? descriptor : fallback;
        
        const updated = [...capturedEmbeddings, validDescriptor];
        setCapturedEmbeddings(updated);

        const dataUrl = canvas.toDataURL("image/png");

        if (enrollStep < 3) {
          setEnrollStep(prev => prev + 1);
        } else {
          // All 3 biometric angles (Straight, Left Angle, Right Angle) collected!
          const multiAngleTemplate = updated;
          const templateString = JSON.stringify(multiAngleTemplate);

          if (editingEmployee) {
            setEditFaceData(dataUrl);
            setEditFaceDescriptor(templateString as any);
          } else {
            setNewUserFaceData(dataUrl);
            setNewUserFaceDescriptor(templateString as any);
          }
          stopRegCamera();
        }
      }
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserId.trim() || !newUserMobile.trim()) {
      alert("Please fill in all text input fields.");
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newUserId,
          name: newUserName,
          mobile: newUserMobile,
          faceData: newUserFaceData,
          faceDescriptor: newUserFaceDescriptor
        })
      });

      if (res.ok) {
        alert("Employee successfully registered!");
        setNewUserName("");
        setNewUserId("");
        setNewUserMobile("");
        setNewUserFaceData("");
        setNewUserFaceDescriptor(null);
        fetchEmployees();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to register user"}`);
      }
    } catch (err) {
      console.error("User registration error", err);
      alert("An unexpected error occurred during registration.");
    } finally {
      setIsRegistering(false);
    }
  };

  const openEditModal = (emp: EmployeeUser) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditMobile(emp.mobile);
    setEditFaceData(emp.faceData || "");
    
    let parsedDesc: number[] | null = null;
    if (emp.faceDescriptor) {
      try {
        parsedDesc = typeof emp.faceDescriptor === "string"
          ? JSON.parse(emp.faceDescriptor)
          : emp.faceDescriptor as number[];
      } catch (e) {
        console.error("Failed to parse faceDescriptor:", e);
      }
    }
    setEditFaceDescriptor(parsedDesc);
    setEditIsActive(emp.isActive !== false);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingEmployee.userId,
          name: editName,
          mobile: editMobile,
          faceData: editFaceData,
          faceDescriptor: editFaceDescriptor,
          isActive: editIsActive
        })
      });

      if (res.ok) {
        alert("Employee details updated successfully!");
        fetchEmployees();
        setEditingEmployee(null);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to update employee details"}`);
      }
    } catch (err) {
      console.error("Failed to update employee", err);
      alert("An unexpected error occurred during update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEmployee = async (userIdToDelete: string) => {
    try {
      const res = await fetch(`/api/users?userId=${encodeURIComponent(userIdToDelete)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchEmployees();
      } else {
        alert("Failed to delete user profile.");
      }
    } catch (err) {
      console.error("Failed to delete employee", err);
    }
  };

  // Render Super Admin Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ color: "#ffffff", fontWeight: "600" }}>Redirecting to Login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Admin Top Header Bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-header-title-box">
            <h1 className="admin-title">SUPER ADMIN PORTAL</h1>
            <span className="admin-badge">Employee Registration & Kiosk History Logs</span>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            onClick={() => setActiveTab("register")}
            className={`admin-header-tab-btn ${activeTab === "register" ? "active" : ""}`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Registration</span>
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`admin-header-tab-btn ${activeTab === "employees" ? "active" : ""}`}
          >
            <CircleUserRound className="w-4 h-4" />
            <span>Employees</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`admin-header-tab-btn ${activeTab === "transactions" ? "active" : ""}`}
          >
            <History className="w-4 h-4" />
            <span>Logs</span>
          </button>

          <div className="header-actions-divider" />

          <button 
            onClick={handleLogout} 
            className="admin-logout-btn-icon"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Employee Registration Tab */}
      {activeTab === "register" && (
        <div className="admin-content-grid single-column">
          <div className="admin-card full-width-card visual-kiosk-card">
            <div className="admin-section-heading-row">
              <div className="heading-left-box">
                <h2 className="admin-section-heading">REGISTER NEW EMPLOYEE PROFILE</h2>
                <span className="heading-hint">Fill out biographical details and capture a facial identity profile for biometric scanning.</span>
              </div>
            </div>

            <div className="employee-registration-container-single">
              <div className="employee-registration-form-card horizontal-layout">
                <form onSubmit={handleRegisterUser} className="registration-form-horizontal">
                  {/* Left Column: Form Text Inputs */}
                  <div className="form-left-col">
                    <div className="form-group">
                      <label className="form-label">Employee Name <span className="required-star">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Amit Sharma"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employee ID (Unique ID) <span className="required-star">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. emp-102"
                        value={newUserId}
                        onChange={(e) => setNewUserId(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number <span className="required-star">*</span></label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={newUserMobile}
                        onChange={(e) => setNewUserMobile(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="submit-registration-btn"
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-5 h-5" />
                          <span>Register Profile</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Face Camera / Profile Picture */}
                  <div className="form-right-col">
                    <label className="form-label">Face Recognition Profile <span className="required-star">*</span></label>
                    <div className="face-capture-camera-box">
                      {newUserFaceData ? (
                        <div className="captured-preview-container">
                          <img src={newUserFaceData} alt="Captured Face" className="captured-preview-img" />
                          <div style={{
                            marginTop: "8px",
                            padding: "4px 10px",
                            background: "rgba(34, 197, 94, 0.2)",
                            color: "#22c55e",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            display: "inline-block"
                          }}>
                            ✓ 3 Biometric Angles Enrolled
                          </div>
                          <button 
                            type="button" 
                            onClick={startRegCamera} 
                            className="retake-camera-btn"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Re-enroll Angles</span>
                          </button>
                        </div>
                      ) : regStream ? (
                        <div className="reg-video-feed-container">
                          <video ref={regVideoRef} autoPlay playsInline muted className="reg-video-element" />
                          <div style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            right: 8,
                            background: "rgba(0, 0, 0, 0.65)",
                            backdropFilter: "blur(6px)",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            color: "#00f3ff",
                            fontSize: "12px",
                            fontWeight: 600,
                            textAlign: "center",
                            zIndex: 10
                          }}>
                            {enrollStep === 1 && "Step 1/3: Look Straight at Camera"}
                            {enrollStep === 2 && "Step 2/3: Turn Head Slightly Left"}
                            {enrollStep === 3 && "Step 3/3: Turn Head Slightly Right"}
                          </div>
                          <div className="camera-overlay-brackets">
                            <span className="bracket-tl" />
                            <span className="bracket-tr" />
                            <span className="bracket-bl" />
                            <span className="bracket-br" />
                          </div>
                          <div className="camera-actions-overlay">
                            <button type="button" onClick={handleCaptureFaceStep} className="capture-snap-btn">
                              {enrollStep === 1 && "Capture Straight"}
                              {enrollStep === 2 && "Capture Left"}
                              {enrollStep === 3 && "Capture Right"}
                            </button>
                            <button type="button" onClick={stopRegCamera} className="close-reg-cam-btn">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="camera-placeholder-start">
                          <CircleUserRound size={64} className="placeholder-avatar-svg" />
                          <p className="placeholder-text">Camera stream is offline</p>
                          <button type="button" onClick={startRegCamera} className="start-camera-feed-btn">
                            <Camera className="w-4 h-4" />
                            <span>Start Biometric Enrollment</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registered Employees Directory Tab */}
      {activeTab === "employees" && (
        <div className="admin-content-grid single-column">
          <div className="admin-card full-width-card visual-kiosk-card">
            <div className="admin-section-heading-row">
              <div className="heading-left-box">
                <h2 className="admin-section-heading">REGISTERED EMPLOYEE DIRECTORY</h2>
                <span className="heading-hint">View all active employee records, identity profiles, and update employee details or status.</span>
              </div>
            </div>

            <div className="employees-full-grid-scroll">
              {employees.length === 0 ? (
                <div className="directory-empty-state">
                  <AlertCircle className="w-8 h-8 text-muted" />
                  <p>No registered employees found. Go to the &quot;Registration&quot; tab to register profiles.</p>
                </div>
              ) : (
                <div className="employees-directory-full-grid">
                  {employees.map((emp) => (
                    <div key={emp.userId} className={`employee-profile-item-card-full ${emp.isActive === false ? "deactivated" : ""}`}>
                      <div className="employee-avatar-wrapper-full">
                        {emp.faceData ? (
                          <img src={emp.faceData} alt={emp.name} className="employee-registered-thumb-full" />
                        ) : (
                          <div className="employee-fallback-avatar-full">
                            <CircleUserRound size={40} />
                          </div>
                        )}
                        {emp.isActive === false && (
                          <div className="avatar-deactivated-overlay">
                            <span>Inactive</span>
                          </div>
                        )}
                      </div>
                      <div className="employee-details-box-full">
                        <h4 className="employee-item-name-full">{emp.name}</h4>
                        <span className="employee-item-id-full">ID: {emp.userId}</span>
                        <span className="employee-item-mobile-full">Mob: {emp.mobile}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="update-employee-profile-btn-full"
                        title="Update Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Logs Tab */}
      {activeTab === "transactions" && (
        <div className="admin-content-grid single-column">
          <div className="admin-card full-width-card visual-kiosk-card">
            <div className="admin-section-heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="heading-left-box">
                <h2 className="admin-section-heading">KIOSK TRANSACTION HISTORY LOGS</h2>
                <span className="heading-hint">View real-time records of goods retrieved and purchased by employees at the kiosk.</span>
              </div>
              <button
                type="button"
                onClick={handlePushRequirement}
                disabled={isPushingRequirement || transactions.length === 0}
                className="submit-registration-btn"
                style={{ width: "auto", padding: "10px 18px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}
                title="Aggregate today's purchases and send requirement list to Vendor Portal"
              >
                {isPushingRequirement ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>PUSH REQUIREMENTS TO VENDOR</span>
              </button>
            </div>

            <div className="transaction-history-logs-container">
              {isLoadingLogs ? (
                <div className="directory-empty-state">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p>Loading transaction logs...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="directory-empty-state">
                  <AlertCircle className="w-8 h-8 text-muted" />
                  <p>No transactions logged yet. Complete checkout at the kiosk to see records.</p>
                </div>
              ) : (
                <div className="tx-logs-scroll-wrapper">
                  {/* Fixed Header */}
                  <div className="tx-logs-header">
                    <div className="tx-logs-col tx-col-date">DATE & TIME</div>
                    <div className="tx-logs-col tx-col-emp">EMPLOYEE DETAILS</div>
                    <div className="tx-logs-col tx-col-goods">GOODS RETRIEVED</div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="tx-logs-body custom-scrollbar">
                    {transactions.map((tx) => {
                      const date = new Date(tx.timestamp);
                      const formattedDate = date.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });
                      const formattedTime = date.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      });

                      // Generate initials from employee name
                      const initials = tx.userName
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <div key={tx.id} className="tx-logs-row">
                          {/* Date & Time */}
                          <div className="tx-logs-col tx-col-date">
                            <span className="tx-date">{formattedDate}</span>
                            <span className="tx-time">{formattedTime}</span>
                          </div>

                          {/* Employee with Avatar */}
                          <div className="tx-logs-col tx-col-emp">
                            <div className="tx-emp-avatar">{initials}</div>
                            <div className="tx-emp-info">
                              <span className="tx-user-name">{tx.userName}</span>
                              <span className="tx-user-id">ID: {tx.userId}</span>
                            </div>
                          </div>

                          {/* Product Cards */}
                          <div className="tx-logs-col tx-col-goods">
                            <div className="tx-product-grid">
                              {tx.items.map((it: any) => {
                                const parsed = parseItemName(it.name);
                                return (
                                  <div key={it.id} className="tx-product-card">
                                    <ProductIcon name={it.name} />
                                    <div className="tx-product-info">
                                      <span className="tx-product-name">{parsed.name}</span>
                                      {parsed.size && (
                                        <span className="tx-product-size">{parsed.size}</span>
                                      )}
                                    </div>
                                    <span className="tx-product-qty">x{it.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Edit / Update Popup Modal */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="edit-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Update Employee Profile</h3>
              <button 
                type="button" 
                onClick={() => {
                  stopRegCamera();
                  setEditingEmployee(null);
                }} 
                className="close-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="edit-modal-form">
              <div className="modal-grid">
                {/* Left Side: Fields */}
                <div className="modal-fields-column">
                  <div className="form-group">
                    <label className="form-label">Employee ID (Unique - Read Only)</label>
                    <input
                      type="text"
                      value={editingEmployee.userId}
                      className="form-input disabled"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employee Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Sharma"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number <span className="required-star">*</span></label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <div className="status-toggle-row">
                      <button
                        type="button"
                        className={`status-toggle-btn ${editIsActive ? "active" : "inactive"}`}
                        onClick={() => setEditIsActive(!editIsActive)}
                      >
                        {editIsActive ? "Active" : "Deactivated"}
                      </button>
                      <span className="status-toggle-hint">
                        {editIsActive ? "Active for Kiosk checkout" : "Access suspended"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Face Capture */}
                <div className="modal-camera-column">
                  <label className="form-label">Face Recognition Profile</label>
                  <div className="face-capture-camera-box edit-modal-camera-box">
                    {editFaceData ? (
                      <div className="captured-preview-container">
                        <img src={editFaceData} alt="Captured Face" className="captured-preview-img" />
                        <button 
                          type="button" 
                          onClick={startRegCamera} 
                          className="retake-camera-btn"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Retake</span>
                        </button>
                      </div>
                    ) : regStream ? (
                      <div className="reg-video-feed-container">
                        <video ref={regVideoRef} autoPlay playsInline muted className="reg-video-element" />
                        <div className="camera-overlay-brackets">
                          <span className="bracket-tl" />
                          <span className="bracket-tr" />
                          <span className="bracket-bl" />
                          <span className="bracket-br" />
                        </div>
                        <div className="camera-actions-overlay">
                          <button type="button" onClick={handleCaptureFaceStep} className="capture-snap-btn">
                            {enrollStep === 1 && "Capture Straight"}
                            {enrollStep === 2 && "Capture Left"}
                            {enrollStep === 3 && "Capture Right"}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              stopRegCamera();
                              if (editingEmployee.faceData) {
                                setEditFaceData(editingEmployee.faceData);
                              }
                            }} 
                            className="close-reg-cam-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="camera-placeholder-start">
                        <CircleUserRound size={48} className="placeholder-avatar-svg" />
                        <p className="placeholder-text">Camera stream is offline</p>
                        <button type="button" onClick={startRegCamera} className="start-camera-feed-btn">
                          <Camera className="w-4 h-4" />
                          <span>Open Camera</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="modal-footer-row">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete the profile for ${editingEmployee.name}?`)) {
                      handleDeleteEmployee(editingEmployee.userId);
                      setEditingEmployee(null);
                    }
                  }}
                  className="delete-employee-modal-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Profile</span>
                </button>

                <div className="modal-footer-right-actions">
                  <button
                    type="button"
                    onClick={() => {
                      stopRegCamera();
                      setEditingEmployee(null);
                    }}
                    className="modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
