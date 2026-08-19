import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

const DEFAULT_CATALOG = {
  "2": [
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
  ]
};

// Helper function to build structured catalog from database rows
async function getCatalogFromDB() {
  const dbProducts = await prisma.product.findMany({
    orderBy: [
      { orderIndex: "asc" },
      { createdAt: "asc" }
    ]
  });

  const catalog: Record<string, any[]> = {};

  dbProducts.forEach(prod => {
    const catIdStr = String(prod.categoryId);
    if (!catalog[catIdStr]) {
      catalog[catIdStr] = [];
    }

    let section = catalog[catIdStr].find(s => s.sectionTitle === prod.sectionTitle);
    if (!section) {
      section = { sectionTitle: prod.sectionTitle, products: [] };
      catalog[catIdStr].push(section);
    }

    section.products.push({
      id: prod.id,
      name: prod.name,
      imageSrc: prod.imageSrc
    });
  });

  return catalog;
}

// Seed helper
async function seedDefaultCatalog() {
  let orderIdx = 0;
  for (const [catId, sections] of Object.entries(DEFAULT_CATALOG)) {
    const categoryId = parseInt(catId, 10);
    for (const section of sections) {
      for (const prod of section.products) {
        await prisma.product.create({
          data: {
            id: prod.id,
            name: prod.name,
            imageSrc: prod.imageSrc,
            sectionTitle: section.sectionTitle,
            categoryId,
            orderIndex: orderIdx++
          }
        });
      }
    }
  }
}

// GET: Fetch product catalog
export async function GET() {
  try {
    const seedFlagPath = path.join(process.cwd(), "src", "data", ".seeded_products");
    const count = await prisma.product.count();
    if (count === 0 && !fs.existsSync(seedFlagPath)) {
      console.log("Product table is empty. Seeding default catalog...");
      await seedDefaultCatalog();
      fs.writeFileSync(seedFlagPath, "true", "utf8");
    }
    const catalog = await getCatalogFromDB();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add a new product (appended to end to respect custom order)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, sectionTitle, name, imageSrc } = body;

    if (!categoryId || !sectionTitle || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const catId = parseInt(categoryId, 10);
    const formattedSection = sectionTitle.trim().toUpperCase();

    // Find the current max order index to append to the end
    const maxProduct = await prisma.product.findFirst({
      where: { categoryId: catId },
      orderBy: { orderIndex: "desc" }
    });
    const nextOrderIndex = maxProduct ? maxProduct.orderIndex + 1 : 0;

    await prisma.product.create({
      data: {
        name: name.trim(),
        imageSrc: imageSrc || "/products/milk/Milk_Aahar.png",
        sectionTitle: formattedSection,
        categoryId: catId,
        orderIndex: nextOrderIndex
      }
    });

    const catalog = await getCatalogFromDB();
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Manual Reordering for Sections, Products, or full Layout Drag-and-Drop
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, categoryId, sectionTitle, sectionIndex, productIndex, direction, sections: newSections } = body;

    const catId = parseInt(categoryId, 10);

    if (action === "save-layout") {
      if (!newSections || !Array.isArray(newSections)) {
        return NextResponse.json({ error: "Missing or invalid sections array" }, { status: 400 });
      }

      let orderIndex = 0;
      const updates = [];

      for (const section of newSections) {
        const secTitle = section.sectionTitle.trim().toUpperCase();
        for (const prod of section.products) {
          updates.push(
            prisma.product.update({
              where: { id: prod.id },
              data: {
                sectionTitle: secTitle,
                orderIndex: orderIndex++
              }
            })
          );
        }
      }

      await prisma.$transaction(updates);
    } else {
      // Load all products in this category to do in-memory swap
      const dbProds = await prisma.product.findMany({
        where: { categoryId: catId },
        orderBy: { orderIndex: "asc" }
      });

      // Group into sections structure
      const sectionsMap: { sectionTitle: string; products: any[] }[] = [];
      dbProds.forEach(prod => {
        let sec = sectionsMap.find(s => s.sectionTitle === prod.sectionTitle);
        if (!sec) {
          sec = { sectionTitle: prod.sectionTitle, products: [] };
          sectionsMap.push(sec);
        }
        sec.products.push(prod);
      });

      if (action === "move-section") {
        if (typeof sectionIndex !== "number" || (direction !== "up" && direction !== "down")) {
          return NextResponse.json({ error: "Invalid parameters for section reorder" }, { status: 400 });
        }

        const targetIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
        if (targetIndex >= 0 && targetIndex < sectionsMap.length) {
          const temp = sectionsMap[sectionIndex];
          sectionsMap[sectionIndex] = sectionsMap[targetIndex];
          sectionsMap[targetIndex] = temp;
        }
      } else if (action === "move-product") {
        if (!sectionTitle || typeof productIndex !== "number" || (direction !== "up" && direction !== "down")) {
          return NextResponse.json({ error: "Invalid parameters for product reorder" }, { status: 400 });
        }

        const targetSection = sectionsMap.find(s => s.sectionTitle === sectionTitle);
        if (targetSection) {
          const products = targetSection.products;
          const targetIndex = direction === "up" ? productIndex - 1 : productIndex + 1;
          if (targetIndex >= 0 && targetIndex < products.length) {
            const temp = products[productIndex];
            products[productIndex] = products[targetIndex];
            products[targetIndex] = temp;
          }
        }
      }

      // Update indices
      let orderIndex = 0;
      const updates = [];
      for (const section of sectionsMap) {
        for (const prod of section.products) {
          updates.push(
            prisma.product.update({
              where: { id: prod.id },
              data: {
                sectionTitle: section.sectionTitle,
                orderIndex: orderIndex++
              }
            })
          );
        }
      }
      await prisma.$transaction(updates);
    }

    const catalog = await getCatalogFromDB();
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("PATCH /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId query param" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    const catalog = await getCatalogFromDB();
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Reset to factory default catalog
export async function PUT() {
  try {
    await prisma.product.deleteMany({});
    await seedDefaultCatalog();
    const catalog = await getCatalogFromDB();
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("PUT /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
