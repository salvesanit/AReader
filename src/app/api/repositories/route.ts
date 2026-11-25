import { NextResponse } from "next/server";
import { addRepository, listExtensions, listRepositories } from "@/lib/store";

export async function GET() {
  const [repos, exts] = await Promise.all([listRepositories(), listExtensions()]);
  return NextResponse.json({ repositories: repos, extensions: exts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await addRepository(String(body.url ?? ""));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
