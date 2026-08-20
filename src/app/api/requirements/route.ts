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

    // Fetch existing pushed requirements for this date to calculate what was already pushed
    const existingRequirements = await prisma.requirement.findMany({
      where: { date: targetDate },
      orderBy: { pushedAt: "asc" }
    });

    const alreadyPushedItems: Record<string, number> = {};
    let totalAlreadyPushedPurchases = 0;
    let lastPushedAt: Date | null = null;

    for (const reqRecord of existingRequirements) {
      const items = reqRecord.items as { name: string; totalQuantity: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          alreadyPushedItems[item.name] = (alreadyPushedItems[item.name] || 0) + item.totalQuantity;
        }
      }
      totalAlreadyPushedPurchases += reqRecord.totalPurchases || 0;
      if (!lastPushedAt || reqRecord.pushedAt > lastPushedAt) {
        lastPushedAt = reqRecord.pushedAt;
      }
    }

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

    // Aggregate today's total purchases by product name
    const todayPurchasesItems: Record<string, number> = {};
    for (const purchase of purchases) {
      const items = purchase.items as { id?: string; name: string; quantity: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          const name = item.name || "Unknown Item";
          const qty = item.quantity || 1;
          todayPurchasesItems[name] = (todayPurchasesItems[name] || 0) + qty;
        }
      }
    }

    // Calculate the delta (new items / quantities not yet pushed today)
    const deltaItemsMap: Record<string, number> = {};
    let deltaGrandTotal = 0;

    for (const [name, qty] of Object.entries(todayPurchasesItems)) {
      const alreadyPushed = alreadyPushedItems[name] || 0;
      const delta = qty - alreadyPushed;
      if (delta > 0) {
        deltaItemsMap[name] = delta;
        deltaGrandTotal += delta;
      }
    }

    // If there is no delta, all current purchases have already been pushed
    if (deltaGrandTotal === 0) {
      return NextResponse.json(
        { error: "All current requirements have already been pushed today." },
        { status: 400 }
      );
    }

    // Calculate the number of new purchases since the last push
    let deltaPurchasesCount = 0;
    if (lastPushedAt) {
      const newPurchases = purchases.filter(p => new Date(p.timestamp).getTime() > new Date(lastPushedAt!).getTime());
      deltaPurchasesCount = newPurchases.length;
    } else {
      deltaPurchasesCount = purchases.length;
    }

    // Fallback: If there is a delta but count is zero, ensure it's at least 1
    if (deltaPurchasesCount === 0) {
      deltaPurchasesCount = Math.max(1, purchases.length - totalAlreadyPushedPurchases);
    }

    const aggregatedItems = Object.entries(deltaItemsMap)
      .map(([name, totalQuantity]) => ({ name, totalQuantity }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Create a new requirement record for the delta
    const requirement = await prisma.requirement.create({
      data: {
        date: targetDate,
        items: aggregatedItems,
        totalItems: deltaGrandTotal,
        totalPurchases: deltaPurchasesCount,
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
