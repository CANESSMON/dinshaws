"use client";

import React from "react";

export interface CartFloatingBarProps {
  totalItems: number;
  onViewCart?: () => void;
}

export const CartFloatingBar: React.FC<CartFloatingBarProps> = ({
  totalItems,
  onViewCart,
}) => {
  if (totalItems <= 0) return null;

  return (
    <div className="cart-floating-bar-wrapper">
      <div className="cart-floating-bar" onClick={onViewCart}>
        <div className="cart-bar-left">
          <div className="cart-icon-badge">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="cart-count-badge">{totalItems}</span>
          </div>

          <div className="cart-info">
            <span className="cart-items-title">
              {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
            </span>
          </div>
        </div>

        <button className="cart-view-btn" aria-label="View Cart">
          <span>VIEW CART</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
};
