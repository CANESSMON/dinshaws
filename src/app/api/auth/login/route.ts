import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_DEV = { username: "admin", password: "dinshaws" };
const DEFAULT_SUPER = { username: "superadmin", password: "super123" };
const DEFAULT_VENDOR = { username: "vendor", password: "vendor123" };

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const cleanUsername = username?.trim().toLowerCase();

    // 1. Check database for saved credentials
    const dbCredentials = await prisma.adminCredential.findMany();
    
    const devDb = dbCredentials.find(c => c.role === "dev");
    const superDb = dbCredentials.find(c => c.role === "super");
    const vendorDb = dbCredentials.find(c => c.role === "vendor");

    const devUser = devDb?.username || DEFAULT_DEV.username;
    const devPass = devDb?.password || DEFAULT_DEV.password;

    const superUser = superDb?.username || DEFAULT_SUPER.username;
    const superPass = superDb?.password || DEFAULT_SUPER.password;

    const vendorUser = vendorDb?.username || DEFAULT_VENDOR.username;
    const vendorPass = vendorDb?.password || DEFAULT_VENDOR.password;

    // 2. Perform credential match
    // Check Developer Credentials (support database value or hardcoded fallbacks)
    const isDevMatch = 
      (cleanUsername === devUser && password === devPass) ||
      ((cleanUsername === "admin" || cleanUsername === "dev") && 
       (password === "admin" || password === "dev123" || password === "dinshaws"));

    if (isDevMatch) {
      return NextResponse.json({ success: true, role: "dev" });
    }

    // Check Super Admin Credentials (support database value or hardcoded fallbacks)
    const isSuperMatch = 
      (cleanUsername === superUser && password === superPass) ||
      ((cleanUsername === "superadmin" || cleanUsername === "supervisor") && 
       (password === "superadmin" || password === "super123" || password === "supervisor123"));

    if (isSuperMatch) {
      return NextResponse.json({ success: true, role: "super" });
    }

    // Check Vendor Credentials (support database value or hardcoded fallbacks)
    const isVendorMatch = 
      (cleanUsername === vendorUser && password === vendorPass) ||
      (cleanUsername === "vendor" && (password === "vendor123" || password === "dinshaws"));

    if (isVendorMatch) {
      return NextResponse.json({ success: true, role: "vendor" });
    }

    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  } catch (e) {
    console.error("Auth login error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
