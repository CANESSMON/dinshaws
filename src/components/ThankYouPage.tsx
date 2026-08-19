"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle, Printer, RotateCcw } from "lucide-react";

export interface ThankYouPageProps {
  isOpen: boolean;
  onReset: () => void;
  autoResetSeconds?: number;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  isOpen,
  onReset,
  autoResetSeconds = 10,
}) => {
  const [countdown, setCountdown] = useState(autoResetSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableOnReset = useCallback(onReset, [onReset]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoResetSeconds);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setCountdown(autoResetSeconds);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, autoResetSeconds]);

  // Separate effect to trigger reset when countdown hits 0
  useEffect(() => {
    if (isOpen && countdown === 0) {
      stableOnReset();
    }
  }, [isOpen, countdown, stableOnReset]);

  if (!isOpen) return null;

  return (
    <div className="thankyou-fullpage">
      {/* Animated Background Particles */}
      <div className="thankyou-bg-particles">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="particle particle-6" />
      </div>

      <div className="thankyou-content">
        {/* Animated Check Icon */}
        <div className="thankyou-icon-circle">
          <CheckCircle className="thankyou-check-icon" />
        </div>

        {/* Thank You Title */}
        <h1 className="thankyou-title">THANK YOU!</h1>
        <p className="thankyou-subtitle">
          Your order has been placed successfully
        </p>

        {/* Receipt Prompt Card */}
        <div className="thankyou-receipt-card">
          <div className="receipt-icon-wrapper">
            <Printer className="receipt-icon" />
          </div>
          <div className="receipt-text-wrapper">
            <h2 className="receipt-heading">Collect Your Receipt</h2>
            <p className="receipt-description">
              Please collect your receipt from the machine below.
              <br />
              Show it at the counter to pick up your order.
            </p>
          </div>
        </div>

        {/* Dinshaw's Brand Text */}
        <p className="thankyou-brand-line">
          Thank you for choosing <strong>Dinshaw&apos;s</strong>!
        </p>

        {/* Auto-reset countdown and manual button */}
        <div className="thankyou-footer">
          <button className="thankyou-new-order-btn" onClick={onReset}>
            <RotateCcw className="w-5 h-5" />
            <span>START NEW ORDER</span>
          </button>
          <p className="thankyou-countdown">
            Returning to home screen in <strong>{countdown}s</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
