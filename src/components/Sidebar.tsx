"use client";

import React from "react";
import Image from "next/image";
import { CircleUserRound } from "lucide-react";

export interface SidebarItem {
  id: number;
  label: string;
  imageSrc: string;
  bgColor: string;
}

interface SidebarProps {
  activeId: number;
  onSelect: (id: number) => void;
  items?: SidebarItem[];
  userId?: string;
}

export const KIOSK_CATEGORIES: SidebarItem[] = [
  {
    id: 1,
    label: "Ice Cream",
    imageSrc: "/sidebar/D-ice-cream.png",
    bgColor: "#ffab00",
  },
  {
    id: 2,
    label: "Dairy",
    imageSrc: "/sidebar/D-dairy.png",
    bgColor: "#4b2a6f",
  },
  {
    id: 3,
    label: "Bakery",
    imageSrc: "/sidebar/D-bakery.png",
    bgColor: "#add302",
  },
  {
    id: 4,
    label: "Namkeen",
    imageSrc: "/sidebar/D-snack.png",
    bgColor: "#21a9d1",
  },
];

export function Sidebar({ activeId, onSelect, items = KIOSK_CATEGORIES, userId = "USR-2026" }: SidebarProps) {
  return (
    <aside className="kiosk-sidebar">
      {/* Category Selection Group */}
      <div className="sidebar-categories-group">
        {items.slice(0, 4).map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`circle-icon-btn ${isActive ? "active" : ""}`}
              style={{ backgroundColor: item.bgColor }}
              title={item.label}
              aria-label={item.label}
            >
              <div className="img-container">
                <Image
                  src={item.imageSrc}
                  alt={item.label}
                  fill
                  sizes="68px"
                  className="icon-img"
                  priority
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* User Section at bottom */}
      <div className="sidebar-user-section">
        <div className="sidebar-user-avatar" title="Authenticated User Session">
          <CircleUserRound size={48} color="#de251e" strokeWidth={1.5} />
        </div>
        <span className="sidebar-user-id">{userId}</span>
      </div>
    </aside>
  );
}
