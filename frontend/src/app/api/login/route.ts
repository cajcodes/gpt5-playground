import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    const expectedPassword =
      process.env.AUTH_PASSWORD || process.env.NEXT_PUBLIC_AUTH_PASSWORD || "password";

    if (password !== expectedPassword) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: "auth",
      value: "1",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}


