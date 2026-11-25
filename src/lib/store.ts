/* ============================================================
   AReader — browser store
   The original app persists to Postgres through Drizzle. This
   port runs entirely in the window, so the same records live in
   localStorage and every "API call" below is synchronous.
   ============================================================ */

import {
  BOOKS,
  FALLBACK_PLUGINS,
  NOVELS,
  REPO_URL,
  type BookSeed,
  type Chapter,
  type PluginSeed,
} from "./library";

export type ShelfBook = {
  id: string;
  title: string;
  titleJa: string;
  author: string;
  authorJa: string;
  year: number;
  genre: string;
  edition: string;
  spine: string;
  spineInk: string;
  cover: string | null;
  synopsis: string;
  credit: string;
  chapters: Chapter[];
  origin: "library" | "imported";
};

export type Ext = {
  id: string;
  name: string;
  site: string;
  url: string;
  lang: string;
  nsfw: boolean;
  installed: boolean;
};

export type Repo = { url: string; label: string; count: number; status: string };

const K = {
  books: "ar.books",
  removed: "ar.removed",
  progress: "ar.progress",
  repos: "ar.repos",
  exts: "ar.exts",
  fetched: "ar.fetched",
};

/**
 * localStorage is capped around 5 MB, and a large EPUB can blow past it on
 * import. Everything is therefore mirrored in memory first, so a rejected
 * write degrades to "kept for this session" instead of silently vanishing.
 */
const mem = new Map<string, string>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }
  if (raw == null) raw = mem.get(key) ?? null;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  let serialised = "";
  try {
    serialised = JSON.stringify(value);
  } catch {
    return;
  }
  mem.set(key, serialised);
  try {
    localStorage.setItem(key, serialised);
  } catch {
    /* private mode / quota — the session keeps working from memory */
  }
}

/** Cover paths are relative so the build works from any sub-path; data: URLs pass through. */
export function coverUrl(cover: string | null | undefined): string {
  if (!cover) return "";
  return cover;
}

/* ---------------- books ---------------- */

function seedFrom(b: BookSeed): ShelfBook {
  return {
    id: b.id,
    title: b.title,
    titleJa: b.title,   // Japanese subtitle suppressed — use English title
    author: b.author,
    authorJa: b.author, // Japanese author name suppressed — use English
    year: b.year,
    genre: b.genre,
    edition: b.edition,
    spine: b.spine,
    spineInk: "#EDEBE6",
    cover: b.cover,
    synopsis: b.synopsis,
    credit: b.credit,
    chapters: b.chapters,
    origin: "library",
  };
}

export function getShelfBooks(): ShelfBook[] {
  const removed = read<string[]>(K.removed, []);
  const imported = read<ShelfBook[]>(K.books, []);
  const seeds = BOOKS.filter((b) => !removed.includes(b.id)).map(seedFrom);
  const all = [...seeds, ...imported.filter((b) => !removed.includes(b.id))];
  return all.sort((a, b) => a.year - b.year);
}

export function saveBooks(list: ShelfBook[]) {
  write(
    K.books,
    list.filter((b) => b.origin === "imported"),
  );
}

export function removeBook(id: string) {
  const removed = read<string[]>(K.removed, []);
  if (!removed.includes(id)) write(K.removed, [...removed, id]);
  const imported = read<ShelfBook[]>(K.books, []).filter((b) => b.id !== id);
  write(K.books, imported);
  const p = read<Record<string, unknown>>(K.progress, {});
  delete p[id];
  write(K.progress, p);
}

export function importBook(input: {
  id: string;
  title: string;
  author: string;
  year?: number;
  genre?: string;
  synopsis?: string;
  cover?: string | null;
  chapters?: Chapter[];
  fileName: string;
  size: number;
}): ShelfBook[] {
  const synopsis =
    input.synopsis?.trim() ||
    `${input.title} by ${input.author}. Imported from ${input.fileName}. Open the book to begin reading — your position, notes and bookmarks are saved automatically.`;

  const chapters: Chapter[] =
    input.chapters && input.chapters.length
      ? input.chapters
      : [
          {
            title: "Front matter",
            paras: [
              `${input.title} by ${input.author}.`,
              `Imported from ${input.fileName}. The EPUB opened, but no readable chapter text was found inside the container.`,
            ],
          },
        ];

  const book: ShelfBook = {
    id: input.id,
    title: input.title,
    titleJa: input.title,   // keep same as English
    author: input.author,
    authorJa: input.author, // keep same as English
    year: input.year ?? new Date().getFullYear(),
    genre: input.genre || "Fiction",
    edition: `${input.fileName} · ${(input.size / 1024).toFixed(0)} KB`,
    spine: "#1F3FB0",
    spineInk: "#EDEBE6",
    cover: input.cover ?? null,
    synopsis,
    credit: `Imported file · ${input.fileName}. AR library.`,
    chapters,
    origin: "imported",
  };

  // Always upsert — re-importing the same file refreshes metadata
  const rest = read<ShelfBook[]>(K.books, []).filter((b) => b.id !== book.id);
  write(K.books, [...rest, book]);

  const removed = read<string[]>(K.removed, []).filter((r) => r !== book.id);
  write(K.removed, removed);

  return getShelfBooks();
}

/* ---------------- reading position ---------------- */

export type Progress = { chapter: number; percent: number; updatedAt: number };

export function saveProgress(bookId: string, chapter: number, percent: number) {
  const all = read<Record<string, Progress>>(K.progress, {});
  all[bookId] = { chapter, percent, updatedAt: Date.now() };
  write(K.progress, all);
}

export function getProgress(bookId: string): Progress | null {
  return read<Record<string, Progress>>(K.progress, {})[bookId] ?? null;
}

/* ---------------- repositories & extensions ---------------- */

function normalisePlugin(raw: Record<string, unknown>, index: number): PluginSeed {
  const id = String(raw.id ?? raw.pluginId ?? raw.key ?? raw.name ?? `ext-${index}`);
  const name = String(raw.name ?? raw.title ?? raw.id ?? `Extension ${index + 1}`);
  const url = String(raw.url ?? raw.site ?? raw.baseUrl ?? raw.home ?? "");
  const site =
    String(raw.site ?? raw.domain ?? raw.host ?? "")
      .replace(/^https?:\/\//, "")
      .split("/")[0] ||
    url.replace(/^https?:\/\//, "").split("/")[0] ||
    name.toLowerCase().replace(/\s+/g, "") + ".example";
  return {
    id: id.slice(0, 96),
    name: name.slice(0, 160),
    site: site.slice(0, 160),
    url: (url || `https://${site}`).slice(0, 400),
    lang: String(raw.lang ?? raw.language ?? "en").slice(0, 16),
    nsfw: Boolean(raw.nsfw ?? false),
  };
}

function parsePluginPayload(data: unknown): PluginSeed[] {
  let list: unknown = data;
  if (!Array.isArray(list) && list && typeof list === "object") {
    const obj = list as Record<string, unknown>;
    list = (obj.plugins ?? obj.items ?? obj.data ?? obj.extensions ?? obj) as unknown;
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item, i) =>
      typeof item === "string"
        ? normalisePlugin({ id: item, name: item }, i)
        : normalisePlugin((item ?? {}) as Record<string, unknown>, i),
    )
    .filter((p) => p.name && p.id);
}

export function listRepositories(): Repo[] {
  return read<Repo[]>(K.repos, []);
}

export function listExtensions(): Ext[] {
  const stored = read<Record<string, boolean>>(K.exts, {});
  const catalogue = read<PluginSeed[] | null>(K.fetched, null);
  const source = catalogue && catalogue.length ? catalogue : FALLBACK_PLUGINS;
  return source.map((p) => ({
    ...p,
    nsfw: Boolean(p.nsfw),
    installed: Boolean(stored[p.id]),
  }));
}

export function setExtensionInstalled(id: string, installed: boolean): Ext[] {
  const stored = read<Record<string, boolean>>(K.exts, {});
  stored[id] = installed;
  write(K.exts, stored);
  return listExtensions();
}

export async function addRepository(url: string): Promise<{
  url: string;
  label: string;
  status: string;
  count: number;
  extensions: Ext[];
}> {
  const clean = url.trim();
  if (!clean) throw new Error("Repository URL is required");

  let payload: unknown = null;
  let status = "live";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(clean, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    payload = await res.json();
  } catch {
    status = "cached";
    payload = FALLBACK_PLUGINS;
  }

  const parsed = parsePluginPayload(payload);
  const list = parsed.length ? parsed : FALLBACK_PLUGINS;
  if (parsed.length) write(K.fetched, list);
  const label =
    clean === REPO_URL
      ? "LNReader plugins v3"
      : clean.replace(/^https?:\/\//, "").slice(0, 60);

  const repos = read<Repo[]>(K.repos, []).filter((r) => r.url !== clean);
  write(K.repos, [{ url: clean, label, count: list.length, status }, ...repos]);

  return { url: clean, label, status, count: list.length, extensions: listExtensions() };
}

/* ---------------- novels ---------------- */

export type NovelHit = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  author: string;
  tags: string;
  chapters: number;
  synopsis: string;
  content: string[];
};

export function searchNovels(term: string): NovelHit[] {
  const q = term.trim().toLowerCase();
  if (!q) return NOVELS;
  return NOVELS.filter((n) =>
    [n.title, n.author, n.tags, n.sourceName, n.synopsis].join(" ").toLowerCase().includes(q),
  );
}
