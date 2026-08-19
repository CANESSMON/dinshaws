import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    let users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const seedFlagPath = path.join(process.cwd(), "src", "data", ".seeded_users");

    // Seed from users.json if database is empty and seeding flag doesn't exist
    if (users.length === 0 && !fs.existsSync(seedFlagPath)) {
      const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");
      if (fs.existsSync(usersFilePath)) {
        try {
          const fileData = fs.readFileSync(usersFilePath, "utf8");
          const jsonUsers = JSON.parse(fileData);
          if (Array.isArray(jsonUsers) && jsonUsers.length > 0) {
            console.log(`Seeding ${jsonUsers.length} users from users.json to Postgres...`);
            for (const u of jsonUsers) {
              await prisma.user.upsert({
                where: { userId: String(u.userId) },
                update: {},
                create: {
                  userId: String(u.userId),
                  name: String(u.name),
                  mobile: String(u.mobile),
                  faceData: String(u.faceData || ""),
                  isActive: u.isActive !== false,
                }
              });
            }
            // Create flag file to prevent re-seeding
            fs.writeFileSync(seedFlagPath, "true", "utf8");

            users = await prisma.user.findMany({
              orderBy: { createdAt: "desc" },
            });
          }
        } catch (err) {
          console.error("Failed to seed users from users.json:", err);
        }
      }
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function markAsSeeded() {
  const seedFlagPath = path.join(process.cwd(), "src", "data", ".seeded_users");
  if (!fs.existsSync(seedFlagPath)) {
    try {
      fs.writeFileSync(seedFlagPath, "true", "utf8");
    } catch (e) {
      console.error("Failed to write .seeded_users flag file:", e);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, mobile, faceData, faceDescriptor } = body;

    if (!userId || !name || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json({ error: "Employee Name should contain only alphabets." }, { status: 400 });
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json({ error: "Mobile number must contain exactly 10 digits." }, { status: 400 });
    }

    // Check duplication
    const exists = await prisma.user.findUnique({
      where: { userId: userId.trim() },
    });
    if (exists) {
      return NextResponse.json({ error: "User ID already exists" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        userId: userId.trim(),
        name: name.trim(),
        mobile: mobile.trim(),
        faceData: faceData || "",
        faceDescriptor: faceDescriptor ? JSON.stringify(faceDescriptor) : null,
        isActive: true,
      },
    });

    markAsSeeded();

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, mobile, faceData, faceDescriptor, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing required field: userId" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({
      where: { userId: userId.trim() },
    });
    
    if (!exists) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (name !== undefined) {
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!nameRegex.test(name)) {
        return NextResponse.json({ error: "Employee Name should contain only alphabets." }, { status: 400 });
      }
    }

    if (mobile !== undefined) {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(mobile)) {
        return NextResponse.json({ error: "Mobile number must contain exactly 10 digits." }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { userId: userId.trim() },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        mobile: mobile !== undefined ? mobile.trim() : undefined,
        faceData: faceData !== undefined ? faceData : undefined,
        faceDescriptor: faceDescriptor !== undefined ? (faceDescriptor ? JSON.stringify(faceDescriptor) : null) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    markAsSeeded();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId query param" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { userId: userId.trim() },
    });

    markAsSeeded();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
