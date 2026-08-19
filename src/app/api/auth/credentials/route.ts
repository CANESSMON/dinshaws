import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_DEV = { username: "admin", password: "dinshaws" };
const DEFAULT_SUPER = { username: "superadmin", password: "super123" };
const DEFAULT_VENDOR = { username: "vendor", password: "vendor123" };

export async function GET() {
  try {
    const dbCredentials = await prisma.adminCredential.findMany();
    
    const devDb = dbCredentials.find(c => c.role === "dev");
    const superDb = dbCredentials.find(c => c.role === "super");
    const vendorDb = dbCredentials.find(c => c.role === "vendor");

    return NextResponse.json({
      dev: {
        username: devDb?.username || DEFAULT_DEV.username,
        password: devDb?.password || DEFAULT_DEV.password,
      },
      super: {
        username: superDb?.username || DEFAULT_SUPER.username,
        password: superDb?.password || DEFAULT_SUPER.password,
      },
      vendor: {
        username: vendorDb?.username || DEFAULT_VENDOR.username,
        password: vendorDb?.password || DEFAULT_VENDOR.password,
      }
    });
  } catch (e) {
    console.error("Fetch credentials error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dev, super: superCreds, vendor } = await request.json();

    if (dev) {
      await prisma.adminCredential.upsert({
        where: { role: "dev" },
        update: { username: dev.username.trim().toLowerCase(), password: dev.password },
        create: { role: "dev", username: dev.username.trim().toLowerCase(), password: dev.password },
      });
    }

    if (superCreds) {
      await prisma.adminCredential.upsert({
        where: { role: "super" },
        update: { username: superCreds.username.trim().toLowerCase(), password: superCreds.password },
        create: { role: "super", username: superCreds.username.trim().toLowerCase(), password: superCreds.password },
      });
    }

    if (vendor) {
      await prisma.adminCredential.upsert({
        where: { role: "vendor" },
        update: { username: vendor.username.trim().toLowerCase(), password: vendor.password },
        create: { role: "vendor", username: vendor.username.trim().toLowerCase(), password: vendor.password },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update credentials error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
