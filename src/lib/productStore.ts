"use client";

import { ProductItem } from "@/components/ProductCard";

export interface SectionProducts {
  sectionTitle: string;
  products: ProductItem[];
}

export const DEFAULT_DAIRY_SECTIONS: SectionProducts[] = [
  {
    sectionTitle: "MILK",
    products: [
      { id: "milk-aahar-170", name: "Aahar Milk 170 ml", imageSrc: "/products/milk/Milk_Aahar.png" },
      { id: "milk-phoorti-180", name: "Phoorti Milk 180 ml", imageSrc: "/products/milk/Milk_Phoorti.png" },
      { id: "milk-aahar-500", name: "Aahar Milk 500 ml", imageSrc: "/products/milk/Milk_Aahar.png" },
      { id: "milk-phoorti-500", name: "Phoorti Milk 500 ml", imageSrc: "/products/milk/Milk_Phoorti.png" },
      { id: "milk-sarvottam-500", name: "Sarvottam Gold 500 ml", imageSrc: "/products/milk/Milk_Sarvottam.png" },
      { id: "milk-amrik-500", name: "Amrik Milk 500 ml", imageSrc: "/products/milk/Milk_Amrik.png" },
      { id: "milk-aahar-1l", name: "Aahar Milk 1 L", imageSrc: "/products/milk/Milk_Aahar.png" },
      { id: "milk-sarvottam-1l", name: "Sarvottam Gold 1 L", imageSrc: "/products/milk/Milk_Sarvottam.png" },
      { id: "milk-amrik-1l", name: "Amrik Milk 1 L", imageSrc: "/products/milk/Milk_Amrik.png" },
      { id: "milk-aahar-2l", name: "Aahar Milk 2 L", imageSrc: "/products/milk/Milk_Aahar.png" }
    ]
  },
  {
    sectionTitle: "DAHI",
    products: [
      { id: "dahi-mishti-160gm", name: "Mishti Dahi 160gm", imageSrc: "/products/dahi/Dahi_Mishti_Dahi.png" },
      { id: "dahi-fresh-200ml", name: "Fresh Dahi 200 ml", imageSrc: "/products/dahi/Dahi_Dahi.png" },
      { id: "dahi-fresh-1kg", name: "Fresh Dahi 1 kg", imageSrc: "/products/dahi/Dahi_Dahi.png" },
      { id: "dahi-kadhi-1kg", name: "Kadhi Dahi 1 kg", imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png" },
      { id: "dahi-fresh-5kg", name: "Fresh Dahi 5 kg", imageSrc: "/products/dahi/Dahi_Dahi.png" },
      { id: "dahi-kadhi-5kg", name: "Kadhi Dahi 5 kg", imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png" },
      { id: "dahi-kadhi-10kg", name: "Kadhi Dahi 10 kg", imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png" }
    ]
  },
  {
    sectionTitle: "PANEER",
    products: [
      { id: "paneer-fresh-200g", name: "Fresh Paneer 200g", imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png" },
      { id: "paneer-fresh-500g", name: "Fresh Paneer 500g", imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png" },
      { id: "paneer-malai-500g", name: "Malai Paneer 500g", imageSrc: "/products/paneer/Paneer_Frozen_Paneer.png" },
      { id: "paneer-fresh-1kg", name: "Fresh Paneer 1 kg", imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png" }
    ]
  },
  {
    sectionTitle: "BUTTER",
    products: [
      { id: "butter-100gm", name: "Butter 100gm", imageSrc: "/products/butter/Butter.png" }
    ]
  }
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
