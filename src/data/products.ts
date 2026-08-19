import { ProductItem } from "@/components/ProductCard";

export interface CategoryProducts {
  categoryId: number; // 1: Ice Cream, 2: Dairy, 3: Bakery, 4: Namkeen
  products: ProductItem[];
}

/**
 * Helper to convert quantity strings (e.g. "100gm", "160gm", "170 ml", "200g", "500g", "500 ml", "1 L", "1 kg", "5 kg", "10 kg") 
 * to numeric values for accurate ascending sorting.
 */
export function getVolumeInMl(name: string): number {
  const kgMatch = name.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  const lMatch = name.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (lMatch) {
    return parseFloat(lMatch[1]) * 1000;
  }
  const mlMatch = name.match(/(\d+(?:\.\d+)?)\s*(?:ml|g|gm|gram|grams)\b/i);
  if (mlMatch) {
    return parseFloat(mlMatch[1]);
  }
  return 0;
}

/**
 * Utility function to sort an array of products in ascending order by product quantity/volume/weight.
 */
export function sortProductsByQuantityAsc(products: ProductItem[]): ProductItem[] {
  return [...products].sort((a, b) => {
    const volA = getVolumeInMl(a.name);
    const volB = getVolumeInMl(b.name);
    if (volA !== volB) {
      return volA - volB;
    }
    return a.name.localeCompare(b.name);
  });
}

// 1. MILK PRODUCTS
const RAW_DAIRY_MILK_PRODUCTS: ProductItem[] = [
  // Aahar Milk (170 ml, 500 ml, 1 L, 2 L)
  {
    id: "milk-aahar-170",
    name: "Aahar Milk 170 ml",
    imageSrc: "/products/milk/Milk_Aahar.png",
  },
  {
    id: "milk-aahar-500",
    name: "Aahar Milk 500 ml",
    imageSrc: "/products/milk/Milk_Aahar.png",
  },
  {
    id: "milk-aahar-1l",
    name: "Aahar Milk 1 L",
    imageSrc: "/products/milk/Milk_Aahar.png",
  },
  {
    id: "milk-aahar-2l",
    name: "Aahar Milk 2 L",
    imageSrc: "/products/milk/Milk_Aahar.png",
  },

  // Phoorti Milk (180 ml, 500 ml)
  {
    id: "milk-phoorti-180",
    name: "Phoorti Milk 180 ml",
    imageSrc: "/products/milk/Milk_Phoorti.png",
  },
  {
    id: "milk-phoorti-500",
    name: "Phoorti Milk 500 ml",
    imageSrc: "/products/milk/Milk_Phoorti.png",
  },

  // Sarvottam Gold (500 ml, 1 L)
  {
    id: "milk-sarvottam-500",
    name: "Sarvottam Gold 500 ml",
    imageSrc: "/products/milk/Milk_Sarvottam.png",
  },
  {
    id: "milk-sarvottam-1l",
    name: "Sarvottam Gold 1 L",
    imageSrc: "/products/milk/Milk_Sarvottam.png",
  },

  // Amrik Milk (500 ml, 1 L)
  {
    id: "milk-amrik-500",
    name: "Amrik Milk 500 ml",
    imageSrc: "/products/milk/Milk_Amrik.png",
  },
  {
    id: "milk-amrik-1l",
    name: "Amrik Milk 1 L",
    imageSrc: "/products/milk/Milk_Amrik.png",
  },
];

export const DAIRY_MILK_PRODUCTS: ProductItem[] = sortProductsByQuantityAsc(RAW_DAIRY_MILK_PRODUCTS);

// 2. DAHI PRODUCTS
const RAW_DAIRY_DAHI_PRODUCTS: ProductItem[] = [
  // Mishti Dahi (160gm)
  {
    id: "dahi-mishti-160gm",
    name: "Mishti Dahi 160gm",
    imageSrc: "/products/dahi/Dahi_Mishti_Dahi.png",
  },

  // Fresh Dahi (200 ml, 1 kg, 5 kg)
  {
    id: "dahi-fresh-200ml",
    name: "Fresh Dahi 200 ml",
    imageSrc: "/products/dahi/Dahi_Dahi.png",
  },
  {
    id: "dahi-fresh-1kg",
    name: "Fresh Dahi 1 kg",
    imageSrc: "/products/dahi/Dahi_Dahi.png",
  },
  {
    id: "dahi-fresh-5kg",
    name: "Fresh Dahi 5 kg",
    imageSrc: "/products/dahi/Dahi_Dahi.png",
  },

  // Kadhi Dahi (1 kg, 5 kg, 10 kg)
  {
    id: "dahi-kadhi-1kg",
    name: "Kadhi Dahi 1 kg",
    imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png",
  },
  {
    id: "dahi-kadhi-5kg",
    name: "Kadhi Dahi 5 kg",
    imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png",
  },
  {
    id: "dahi-kadhi-10kg",
    name: "Kadhi Dahi 10 kg",
    imageSrc: "/products/dahi/Dahi_Kadhi_Dahi.png",
  },
];

export const DAIRY_DAHI_PRODUCTS: ProductItem[] = sortProductsByQuantityAsc(RAW_DAIRY_DAHI_PRODUCTS);

// 3. PANEER PRODUCTS
const RAW_DAIRY_PANEER_PRODUCTS: ProductItem[] = [
  {
    id: "paneer-fresh-200g",
    name: "Fresh Paneer 200g",
    imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png",
  },
  {
    id: "paneer-fresh-500g",
    name: "Fresh Paneer 500g",
    imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png",
  },
  {
    id: "paneer-fresh-1kg",
    name: "Fresh Paneer 1 kg",
    imageSrc: "/products/paneer/Paneer_Fresh_Paneer.png",
  },
  {
    id: "paneer-malai-500g",
    name: "Malai Paneer 500g",
    imageSrc: "/products/paneer/Paneer_Frozen_Paneer.png",
  },
];

export const DAIRY_PANEER_PRODUCTS: ProductItem[] = sortProductsByQuantityAsc(RAW_DAIRY_PANEER_PRODUCTS);

// 4. BUTTER PRODUCTS
const RAW_DAIRY_BUTTER_PRODUCTS: ProductItem[] = [
  {
    id: "butter-100gm",
    name: "Butter 100gm",
    imageSrc: "/products/butter/Butter.png",
  },
];

export const DAIRY_BUTTER_PRODUCTS: ProductItem[] = sortProductsByQuantityAsc(RAW_DAIRY_BUTTER_PRODUCTS);
