"use client";

import { ProductItem } from "@/components/ProductCard";
import {
  DAIRY_MILK_PRODUCTS,
  DAIRY_DAHI_PRODUCTS,
  DAIRY_PANEER_PRODUCTS,
  DAIRY_BUTTER_PRODUCTS,
} from "@/data/products";

export interface SectionProducts {
  sectionTitle: string;
  products: ProductItem[];
}

export const DEFAULT_DAIRY_SECTIONS: SectionProducts[] = [
  { sectionTitle: "MILK", products: DAIRY_MILK_PRODUCTS },
  { sectionTitle: "DAHI", products: DAIRY_DAHI_PRODUCTS },
  { sectionTitle: "PANEER", products: DAIRY_PANEER_PRODUCTS },
  { sectionTitle: "BUTTER", products: DAIRY_BUTTER_PRODUCTS },
];

/**
 * Fetch catalog from API with fallback to localStorage
 */
export async function fetchCatalogAsync(): Promise<Record<number, SectionProducts[]>> {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("dinshaws_kiosk_catalog_v1", JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.error("API fetch catalog failed, falling back to localStorage", err);
  }

  return getStoredCatalogSync();
}

/**
 * Synchronous local reader
 */
export function getStoredCatalogSync(): Record<number, SectionProducts[]> {
  if (typeof window === "undefined") {
    return { 2: DEFAULT_DAIRY_SECTIONS };
  }

  try {
    const raw = localStorage.getItem("dinshaws_kiosk_catalog_v1");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse stored catalog", e);
  }

  return { 2: DEFAULT_DAIRY_SECTIONS };
}

/**
 * Add a new product via API
 */
export async function addProductAsync(
  categoryId: number,
  sectionTitle: string,
  product: { name: string; imageSrc: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        sectionTitle,
        name: product.name,
        imageSrc: product.imageSrc,
      }),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Add product API failed", err);
  }
  return false;
}

/**
 * Move Section Up or Down
 */
export async function moveSectionAsync(
  categoryId: number,
  sectionIndex: number,
  direction: "up" | "down"
): Promise<boolean> {
  try {
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move-section",
        categoryId,
        sectionIndex,
        direction,
      }),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Move section API failed", err);
  }
  return false;
}

/**
 * Move Product Up or Down
 */
export async function moveProductAsync(
  categoryId: number,
  sectionTitle: string,
  productIndex: number,
  direction: "up" | "down"
): Promise<boolean> {
  try {
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move-product",
        categoryId,
        sectionTitle,
        productIndex,
        direction,
      }),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Move product API failed", err);
  }
  return false;
}

/**
 * Save complete drag and drop layout to backend
 */
export async function saveLayoutAsync(
  categoryId: number,
  sections: SectionProducts[]
): Promise<boolean> {
  try {
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-layout",
        categoryId,
        sections,
      }),
    });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Save layout API failed", err);
  }
  return false;
}

/**
 * Delete a product via API
 */
export async function deleteProductAsync(
  categoryId: number,
  sectionTitle: string,
  productId: string
): Promise<boolean> {
  try {
    const url = `/api/products?categoryId=${categoryId}&sectionTitle=${encodeURIComponent(
      sectionTitle
    )}&productId=${productId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Delete product API failed", err);
  }
  return false;
}

/**
 * Reset catalog via API
 */
export async function resetCatalogAsync(): Promise<boolean> {
  try {
    const res = await fetch("/api/products", { method: "PUT" });
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dinshaws_catalog_updated"));
      }
      return true;
    }
  } catch (err) {
    console.error("Reset catalog API failed", err);
  }
  return false;
}

/**
 * Upload an image file via API
 */
export async function uploadImageAsync(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch (err) {
    console.error("Upload image API failed", err);
  }
  return null;
}
