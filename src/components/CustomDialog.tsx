import React from "react";
import { ShieldCheck, AlertCircle, Info, X } from "lucide-react";

export interface CustomDialogProps {
  isOpen: boolean;
  type: "info" | "success" | "error" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export function CustomDialog({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  onClose
}: CustomDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <ShieldCheck className="w-8 h-8" style={{ color: "#10b981" }} />;
      case "error":
        return <AlertCircle className="w-8 h-8" style={{ color: "#de251e" }} />;
      case "confirm":
        return <AlertCircle className="w-8 h-8" style={{ color: "#f59e0b" }} />;
      case "info":
      default:
        return <Info className="w-8 h-8" style={{ color: "#3b82f6" }} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "#ecfdf5";
      case "error":
        return "#fef2f2";
      case "confirm":
        return "#fffbeb";
      case "info":
      default:
        return "#eff6ff";
    }
  };

  const getButtonBg = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#de251e";
      case "confirm":
        return "#de251e";
      case "info":
      default:
        return "#de251e";
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="custom-dialog-card"
        style={{
          maxWidth: "400px",
          width: "90%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          border: "1px solid #eaeaea",
          textAlign: "center",
          animation: "slideUpModal 0.2s ease-out"
        }}
      >
        <div
          className="dialog-icon-container"
          style={{
            margin: "0 auto 16px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: getIconBg()
          }}
        >
          {getIcon()}
        </div>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#18181b",
            marginBottom: "8px",
            fontFamily: "var(--font-heading-family), sans-serif"
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#71717a",
            lineHeight: "1.5",
            marginBottom: "24px"
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {type === "confirm" ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="modal-cancel-btn"
                style={{ margin: 0, padding: "10px 20px", flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="modal-submit-btn"
                style={{
                  margin: 0,
                  padding: "10px 20px",
                  flex: 1,
                  backgroundColor: "#de251e"
                }}
              >
                Yes, Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="modal-submit-btn"
              style={{
                margin: 0,
                padding: "10px 24px",
                flex: 1,
                backgroundColor: getButtonBg()
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
