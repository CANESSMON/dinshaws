import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_SETTINGS = {
  id: "default",
  showLogo: true,
  showUser: true,
  showTimestamp: true
};

export async function GET() {
  try {
    let settings = await prisma.receiptSetting.findUnique({
      where: { id: "default" }
    });
    if (!settings) {
      settings = await prisma.receiptSetting.create({
        data: DEFAULT_SETTINGS
      });
    }
    return NextResponse.json(settings);
  } catch (e) {
    console.error("Fetch receipt settings error:", e);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await prisma.receiptSetting.upsert({
      where: { id: "default" },
      update: {
        showLogo: body.showLogo ?? true,
        showUser: body.showUser ?? true,
        showTimestamp: body.showTimestamp ?? true
      },
      create: {
        id: "default",
        showLogo: body.showLogo ?? true,
        showUser: body.showUser ?? true,
        showTimestamp: body.showTimestamp ?? true
      }
    });
    return NextResponse.json({ success: true, settings });
  } catch (e) {
    console.error("Save receipt settings error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
