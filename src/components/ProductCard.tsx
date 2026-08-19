"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";

export interface ProductItem {
  id: string;
  name: string;
  imageSrc: string;
}

interface ProductCardProps {
  product: ProductItem;
  quantity?: number;
  initialQuantity?: number;
  onQuantityChange?: (product: ProductItem, quantity: number) => void;
}

export function ProductCard({
  product,
  quantity: controlledQty,
  initialQuantity = 0,
  onQuantityChange,
}: ProductCardProps) {
  const [internalQuantity, setInternalQuantity] = useState<number>(initialQuantity);
  const quantity = controlledQty !== undefined ? controlledQty : internalQuantity;

  const updateQty = (newQty: number) => {
    setInternalQuantity(newQty);
    if (onQuantityChange) {
      onQuantityChange(product, newQty);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQty(1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQty(quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextQty = quantity - 1;
    updateQty(nextQty < 0 ? 0 : nextQty);
  };

  return (
    <div className={`kiosk-product-card ${quantity > 0 ? "has-quantity" : ""}`}>
      {/* Prominent Visual Photo */}
      <div className="product-image-box">
        {product.imageSrc ? (
          <Image
            src={product.imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="product-photo"
            priority
            unoptimized={product.imageSrc.startsWith("data:")}
          />
        ) : (
          <div className="product-no-image-fallback">
            <span className="brand-logo-letter">D</span>
            <span className="fallback-text">Fresh & Pure</span>
          </div>
        )}
      </div>

      {/* Product Title */}
      <div className="product-info-box">
        <h3 className="product-name">{product.name}</h3>

        {/* Action Area: Toggles between ADD button and Active Quantity Counter Bar */}
        <div className="card-actions-container">
          {quantity === 0 ? (
            <button onClick={handleAddClick} className="add-initial-btn">
              <span>ADD</span>
            </button>
          ) : (
            <div className="active-qty-bar">
              <button
                onClick={handleDecrease}
                className="qty-step-btn btn-minus"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </button>

              <span className="qty-value-display">{quantity}</span>

              <button
                onClick={handleIncrease}
                className="qty-step-btn btn-plus"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
