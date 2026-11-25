import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getShelfBooks, importBook } from "@/lib/store";

/** Allow large body for EPUB cover images sent as base64 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getShelfBooks();
    return NextResponse.json({ books: list });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fileName = String(body.fileName ?? "").slice(0, 200);
    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const base = fileName.replace(/\.epub$/i, "").replace(/[_\-]+/g, " ").trim();
    const bookId = `epub-${base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40) || Date.now()}`;

    // ── Save cover image if provided as base64 data URL ──
    let coverPath: string | null = null;
    const coverData: string | undefined = body.coverData;
    if (coverData && coverData.startsWith("data:image/")) {
      try {
        const comma = coverData.indexOf(",");
        const header = comma > -1 ? coverData.slice(0, comma) : "";
        const b64 = comma > -1 ? coverData.slice(comma + 1) : "";
        const extMatch = header.match(/^data:image\/(\w+);base64$/);
        if (extMatch && b64) {
          const ext = extMatch[1] === "jpeg" ? "jpg" : extMatch[1];
          const buffer = Buffer.from(b64, "base64");
          const importsDir = join(process.cwd(), "public", "imports");
          await mkdir(importsDir, { recursive: true });
          const fname = `cover-${bookId}.${ext}`;
          await writeFile(join(importsDir, fname), buffer);
          coverPath = `imports/${fname}`;
        }
      } catch {
        // cover save failed — proceed without it
      }
    }

    /* ── chapters parsed in the browser ── */
    type Chapter = { title: string; paras: string[] };
    const rawChapters: unknown = Array.isArray(body.chapters) ? body.chapters : [];
    const chapters: Chapter[] = (rawChapters as unknown[])
      .slice(0, 400)
      .map((c, i) => {
        const obj = (c ?? {}) as { title?: unknown; paras?: unknown };
        const paras = Array.isArray(obj.paras)
          ? (obj.paras as unknown[])
              .slice(0, 800)
              .map((p) => String(p).slice(0, 12000))
              .filter((p) => p.trim().length > 0)
          : [];
        return {
          title: String(obj.title ?? `Section ${i + 1}`).slice(0, 200),
          paras,
        };
      })
      .filter((c) => c.paras.length > 0);

    const list = await importBook({
      id: bookId,
      title: String(body.title ?? (base || "Untitled")),
      author: String(body.author ?? "Unknown author"),
      year: body.year ? Number(body.year) : undefined,
      genre: body.genre ? String(body.genre) : undefined,
      synopsis: body.synopsis ? String(body.synopsis).slice(0, 1200) : undefined,
      cover: coverPath,
      chapters: chapters.length ? chapters : undefined,
      fileName,
      size: Number(body.size ?? 0),
    });

    return NextResponse.json({ books: list });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
