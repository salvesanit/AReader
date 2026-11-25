import { NextResponse } from "next/server";
import { listExtensions, seedExtensions, setExtensionInstalled } from "@/lib/store";

export async function GET() {
  await seedExtensions();
  return NextResponse.json({ extensions: await listExtensions() });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const installed = Boolean(body.installed);
  await setExtensionInstalled(id, installed);
  return NextResponse.json({ extensions: await listExtensions() });
}
