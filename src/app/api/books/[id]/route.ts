import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getProgress, saveProgress } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const row = await getProgress(id);
  return NextResponse.json({ progress: row });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  await saveProgress(id, Number(body.chapter ?? 0), Number(body.percent ?? 0));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    // Only allow deleting imported books, not library books
    const rows = await db.select({ origin: books.origin }).from(books).where(eq(books.id, id));
    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (rows[0].origin !== "imported") {
      return NextResponse.json({ error: "Cannot delete a library book" }, { status: 403 });
    }
    await db.delete(books).where(eq(books.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
