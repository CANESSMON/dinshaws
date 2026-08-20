import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    let purchases = await prisma.purchase.findMany({
      orderBy: { timestamp: "desc" },
    });

    const seedFlagPath = path.join(process.cwd(), "src", "data", ".seeded_purchases");

    // Seed from purchases.json if database is empty and seeding flag doesn't exist
    if (purchases.length === 0 && !fs.existsSync(seedFlagPath)) {
      const purchasesFilePath = path.join(process.cwd(), "src", "data", "purchases.json");
      if (fs.existsSync(purchasesFilePath)) {
        try {
          const fileData = fs.readFileSync(purchasesFilePath, "utf8");
          const jsonPurchases = JSON.parse(fileData);
          if (Array.isArray(jsonPurchases) && jsonPurchases.length > 0) {
            console.log(`Seeding ${jsonPurchases.length} purchases from purchases.json to Postgres...`);
            for (const p of jsonPurchases) {
              const uId = String(p.userId).trim();

              // Ensure the referenced User exists to satisfy foreign key constraint
              await prisma.user.upsert({
                where: { userId: uId },
                update: {},
                create: {
                  userId: uId,
                  name: String(p.userName || "Unknown Employee").trim(),
                  mobile: "0000000000",
                  faceData: "",
                  isActive: true,
                }
              });

              // Create the Purchase
              await prisma.purchase.create({
                data: {
                  id: String(p.id),
                  userId: uId,
                  userName: String(p.userName || "Unknown Employee").trim(),
                  totalItems: Number(p.totalItems || 0),
                  timestamp: new Date(p.timestamp || Date.now()),
                  items: p.items || [],
                }
              });
            }
            // Create flag file to prevent re-seeding
            fs.writeFileSync(seedFlagPath, "true", "utf8");

            purchases = await prisma.purchase.findMany({
              orderBy: { timestamp: "desc" },
            });
          }
        } catch (err) {
          console.error("Failed to seed purchases from purchases.json:", err);
        }
      }
    }

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("GET /api/purchases error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, items, totalItems } = body;

    if (!userId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uId = userId.trim();

    // Verify user exists in Postgres database
    const user = await prisma.user.findUnique({
      where: { userId: uId },
    });

    if (!user) {
      return NextResponse.json({ error: `User with ID ${uId} does not exist.` }, { status: 400 });
    }

    const formattedItems = items.map((item: any) => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity
    }));

    const finalTotalItems = totalItems || items.reduce((sum: number, i: any) => sum + i.quantity, 0);

    // Get the latest purchase to increment the ID
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { timestamp: "desc" }
    });

    let nextNum = 1;
    if (lastPurchase) {
      const match = lastPurchase.id.match(/^DS-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      } else {
        const count = await prisma.purchase.count();
        nextNum = count + 1;
      }
    }

    const nextId = `DS-${String(nextNum).padStart(4, "0")}`;

    const newPurchase = await prisma.purchase.create({
      data: {
        id: nextId,
        userId: uId,
        userName: user.name, // Use the actual name stored in database
        items: formattedItems,
        totalItems: finalTotalItems,
      }
    });

    return NextResponse.json({ success: true, purchase: newPurchase });
  } catch (error) {
    console.error("POST /api/purchases error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
