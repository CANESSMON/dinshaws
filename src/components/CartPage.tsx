"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ProductItem } from "./ProductCard";
import { CartMapItem } from "@/app/kiosk/page";
import { ArrowLeft } from "lucide-react";

export interface CartPageProps {
  isOpen: boolean;
  cartItems: CartMapItem[];
  onClose: () => void;
  onQuantityChange: (product: ProductItem, newQty: number) => void;
  onCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  isOpen,
  cartItems,
  onClose,
  onQuantityChange,
  onCheckout,
}) => {
  // Automatically close cart and return to products page if no items remain
  useEffect(() => {
    if (isOpen && cartItems.length === 0) {
      onClose();
    }
  }, [isOpen, cartItems.length, onClose]);

  if (!isOpen) return null;

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-full-page">
      {/* Full Page Header with centered YOUR CART title and right-aligned total item badge */}
      <header className="cart-page-header">
        <h1 className="bars-product-heading cart-heading-stroke">YOUR CART</h1>
        <div className="cart-page-count-wrapper">
          <span className="cart-page-count-badge">
            {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
          </span>
        </div>
      </header>

      {/* Main Cart Items List View */}
      <main className="cart-page-main">
        <div className="cart-page-list-container">
          {cartItems.map(({ product, quantity }) => (
            <div className="cart-page-item-card" key={product.id}>
              {/* Product Thumbnail Image */}
              <div className="cart-page-img-box">
                <Image
                  src={product.imageSrc}
                  alt={product.name}
                  fill
                  className="cart-page-photo"
                  sizes="100px"
                  priority
                />
              </div>

              {/* Product Info */}
              <div className="cart-page-info">
                <h3 className="cart-page-product-name">{product.name}</h3>
              </div>

              {/* Quantity Counter (- <qty> +) */}
              <div className="cart-page-qty-controls">
                <div className="active-qty-bar">
                  <button
                    className="qty-step-btn btn-minus"
                    onClick={() => onQuantityChange(product, quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <span className="qty-value-display">{quantity}</span>

                  <button
                    className="qty-step-btn btn-plus"
                    onClick={() => onQuantityChange(product, quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Action Footer Bar: Icon-only Back button on bottom left + Checkout button beside it */}
      <footer className="cart-page-footer">
        <div className="cart-footer-controls">
          {/* Back Button: Icon only on bottom left */}
          <button
            className="cart-icon-back-btn"
            onClick={onClose}
            aria-label="Back to Products"
            title="Back to Products"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          {/* Checkout Button beside it */}
          <button className="cart-page-checkout-btn" onClick={onCheckout}>
            <span>CHECKOUT</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
