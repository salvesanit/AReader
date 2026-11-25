import { NextResponse } from "next/server";
import { searchNovels } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const novels = await searchNovels(q);
  return NextResponse.json({ novels });
}
