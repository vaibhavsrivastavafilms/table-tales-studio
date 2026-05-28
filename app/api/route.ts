import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Lightweight health probe — no secrets, no stack traces. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
