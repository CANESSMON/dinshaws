import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const requirements = await prisma.requirement.findMany({
      orderBy: { pushedAt: "desc" },
    });
    return NextResponse.json(requirements);
  } catch (error) {
    console.error("GET /api/requirements error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date } = body;

    // Use provided date or fallback to today in local time (YYYY-MM-DD)
    const targetDate =
      date ||
      new Date().toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD

    // Build day boundaries in local time
    const startOfDay = new Date(`${targetDate}T00:00:00`);
    const endOfDay = new Date(`${targetDate}T23:59:59.999`);

    // Fetch all purchases that fall within the target date
    const purchases = await prisma.purchase.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (purchases.length === 0) {
      return NextResponse.json(
        { error: "No purchases found for this date." },
        { status: 400 }
      );
    }

    // Aggregate items by product name
    const itemMap: Record<string, number> = {};
    let grandTotal = 0;

    for (const purchase of purchases) {
      const items = purchase.items as { id?: string; name: string; quantity: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          const name = item.name || "Unknown Item";
          const qty = item.quantity || 1;
          itemMap[name] = (itemMap[name] || 0) + qty;
          grandTotal += qty;
        }
      }
    }

    const aggregatedItems = Object.entries(itemMap)
      .map(([name, totalQuantity]) => ({ name, totalQuantity }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Create requirement record
    const requirement = await prisma.requirement.create({
      data: {
        date: targetDate,
        items: aggregatedItems,
        totalItems: grandTotal,
        totalPurchases: purchases.length,
        pushedBy: "superadmin",
      },
    });

    return NextResponse.json({ success: true, requirement });
  } catch (error) {
    console.error("POST /api/requirements error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
