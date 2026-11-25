import JSZip from "jszip";

export type ParsedChapter = { title: string; paras: string[] };

export type ParsedEpub = {
  title: string;
  author: string;
  synopsis: string;
  coverData: string;
  chapters: ParsedChapter[];
};

const clean = (s: string) =>
  s
    .replace(/\u00a0/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

/** Elements by localName — immune to XML namespaces. */
function byTag(root: Document | Element, tag: string): Element[] {
  return Array.from(root.getElementsByTagName("*")).filter(
    (el) => el.localName.toLowerCase() === tag.toLowerCase(),
  );
}

const attr = (el: Element | undefined, name: string) =>
  el ? (el.getAttribute(name) ?? "") : "";

function dirOf(path: string) {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
}

function resolve(base: string, href: string) {
  if (!href) return "";
  const stripped = href.split("#")[0];
  if (!stripped) return "";
  if (stripped.startsWith("/")) return stripped.slice(1);
  return base + stripped;
}

/** Extract all readable text from one XHTML/HTML spine document. */
function extractSpineDoc(
  html: string,
  fallbackTitle: string,
): ParsedChapter | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove noise
  doc
    .querySelectorAll(
      "script, style, noscript, nav, aside, svg, [epub\\:type='toc'], [role='doc-toc']",
    )
    .forEach((n) => n.remove());

  // ── Title ──
  const headings = Array.from(
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  )
    .map((h) => clean(h.textContent ?? ""))
    .filter((t) => t.length > 1 && t.length < 160);

  let title = headings[0] ?? "";
  if (!title) {
    const docTitle = clean(doc.querySelector("title")?.textContent ?? "");
    if (docTitle && docTitle.length < 160) title = docTitle;
  }
  if (!title) title = fallbackTitle;

  // ── Text blocks ──
  const blocks: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const text = clean(raw);
    if (text.length < 3) return;
    // Skip duplicate first heading as paragraph
    const norm = text.slice(0, 100);
    if (seen.has(norm)) return;
    seen.add(norm);
    blocks.push(text);
  };

  // Walk every element that *directly* holds text (no child blocks)
  const isBlock = (tag: string) =>
    /^(div|section|article|blockquote|figure|table|ul|ol|dl|aside|figure|main|header|footer|address|fieldset|form|details)$/i.test(
      tag,
    );

  const walk = (el: Element) => {
    if (el.children.length === 0) {
      push(el.textContent ?? "");
      return;
    }
    let hasBlockChild = false;
    for (const child of el.children) {
      if (isBlock(child.tagName)) {
        hasBlockChild = true;
        break;
      }
    }
    if (!hasBlockChild) {
      push(el.textContent ?? "");
    } else {
      for (const child of el.children) walk(child);
    }
  };

  const body = doc.body;
  if (body) {
    for (const child of body.children) walk(child);
  }

  // Fallback: if still empty, grab the entire body text as one block
  if (!blocks.length) {
    const bodyText = clean(body?.textContent ?? "");
    if (bodyText.length > 10) blocks.push(bodyText);
  }

  if (!blocks.length) return null;
  return { title, paras: blocks.slice(0, 800) };
}

/**
 * Parse an EPUB file in the browser.
 * Returns a full ParsedEpub with real chapters extracted from every spine document.
 */
export async function parseEpubFile(file: File): Promise<ParsedEpub> {
  const fallbackTitle = file.name
    .replace(/\.epub$/i, "")
    .replace(/[_\-]+/g, " ")
    .trim();

  const result: ParsedEpub = {
    title: fallbackTitle,
    author: "",
    synopsis: "",
    coverData: "",
    chapters: [],
  };

  // ── Open ZIP ──
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return result;
  }

  // ── Locate OPF ──
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) return result;
  const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) return result;

  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) return result;

  const opf = new DOMParser().parseFromString(opfXml, "text/xml");
  const opfDir = dirOf(opfPath);

  // ── Metadata ──
  const titles = byTag(opf, "title");
  const creators = byTag(opf, "creator");
  const descriptions = byTag(opf, "description");
  if (titles.length) result.title = clean(titles[0].textContent ?? "") || result.title;
  if (creators.length) result.author = clean(creators[0].textContent ?? "");
  if (descriptions.length) result.synopsis = clean(descriptions[0].textContent ?? "");

  if (!result.synopsis) {
    const metaDesc = byTag(opf, "meta").find((m) => {
      const name = (attr(m, "name") || attr(m, "property")).toLowerCase();
      return name === "description" || name.includes("description");
    });
    if (metaDesc) {
      result.synopsis =
        clean(metaDesc.textContent ?? "") || clean(attr(metaDesc, "content"));
    }
  }

  // ── Manifest ──
  type Item = { id: string; href: string; mediaType: string; properties: string };
  const items: Item[] = byTag(opf, "item").map((el) => ({
    id: attr(el, "id"),
    href: attr(el, "href"),
    mediaType: attr(el, "media-type"),
    properties: attr(el, "properties"),
  }));
  const byId = new Map(items.map((i) => [i.id, i]));

  // ── Cover image ──
  let coverHref = "";

  // EPUB3: properties="cover-image"
  coverHref = items.find((i) => i.properties.includes("cover-image"))?.href ?? "";

  // EPUB2: <meta name="cover" content="itemId">
  if (!coverHref) {
    const metaCoverId = attr(
      byTag(opf, "meta").find((m) => attr(m, "name").toLowerCase() === "cover"),
      "content",
    );
    if (metaCoverId) coverHref = byId.get(metaCoverId)?.href ?? "";
  }

  // Guess by id or href
  if (!coverHref) {
    const guess = items.find(
      (i) =>
        i.mediaType.startsWith("image/") &&
        (i.id.toLowerCase().includes("cover") || i.href.toLowerCase().includes("cover")),
    );
    coverHref = guess?.href ?? "";
  }

  // First image in zip named like a cover
  if (!coverHref) {
    const names = Object.keys(zip.files).filter((n) => {
      const l = n.toLowerCase();
      return (
        !zip.files[n].dir &&
        (l.includes("cover") || l.includes("thumbnail")) &&
        (l.endsWith(".jpg") || l.endsWith(".jpeg") || l.endsWith(".png") || l.endsWith(".webp"))
      );
    });
    if (names.length) {
      const b64 = await zip.file(names[0])!.async("base64");
      const ext = names[0].split(".").pop()?.toLowerCase() ?? "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      result.coverData = `data:${mime};base64,${b64}`;
    }
  }

  if (coverHref && !result.coverData) {
    const path = resolve(opfDir, coverHref);
    const found = zip.file(path) ?? zip.file(coverHref) ?? zip.file(decodeURIComponent(path));
    if (found) {
      const b64 = await found.async("base64");
      const ext = path.split(".").pop()?.toLowerCase() ?? "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      result.coverData = `data:${mime};base64,${b64}`;
    }
  }

  // ── Spine order ──
  const spineHrefs: string[] = [];
  byTag(opf, "itemref").forEach((ref) => {
    const item = byId.get(attr(ref, "idref"));
    if (!item) return;
    // Accept any XHTML/HTML document
    if (!/xhtml|html|xml/i.test(item.mediaType) && !item.href.match(/\.(xhtml|html|htm|xml)$/i))
      return;
    const resolved = resolve(opfDir, item.href);
    if (resolved) spineHrefs.push(resolved);
  });

  // Build TOC-to-spine map so we can assign proper titles from TOC
  // Key: normalized href (no fragment) → title from TOC
  const tocTitleMap = new Map<string, string>();

  const navItem = items.find((i) => i.properties.includes("nav"));
  if (navItem) {
    const href = resolve(opfDir, navItem.href);
    const html = await zip.file(href)?.async("text");
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      Array.from(doc.querySelectorAll("a[href]")).forEach((a) => {
        const label = clean(a.textContent ?? "");
        const target = resolve(dirOf(href), a.getAttribute("href") ?? "");
        if (label && target) tocTitleMap.set(target, label);
      });
    }
  }

  if (!tocTitleMap.size) {
    const ncx = items.find((i) => i.mediaType.includes("dtbncx"));
    if (ncx) {
      const href = resolve(opfDir, ncx.href);
      const xml = await zip.file(href)?.async("text");
      if (xml) {
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        byTag(doc, "navpoint").forEach((point) => {
          const label = clean(byTag(point, "text")[0]?.textContent ?? "");
          const src = attr(byTag(point, "content")[0], "src");
          const target = resolve(dirOf(href), src);
          if (label && target) tocTitleMap.set(target, label);
        });
      }
    }
  }

  // ── Extract chapters from every spine doc ──
  const MAX_CHARS = 3_000_000;
  let usedChars = 0;

  for (let i = 0; i < Math.min(spineHrefs.length, 500); i++) {
    const href = spineHrefs[i];

    // Try multiple path forms
    const paths = [href, decodeURIComponent(href)];
    let raw = "";
    for (const p of paths) {
      const f = zip.file(p);
      if (f) {
        raw = await f.async("text");
        break;
      }
    }
    if (!raw) continue;

    const spineTitle = tocTitleMap.get(href) ?? `Section ${i + 1}`;
    const chapter = extractSpineDoc(raw, spineTitle);
    if (!chapter) continue;

    // If TOC had a title for this doc, prefer it over the extracted heading
    if (tocTitleMap.has(href)) chapter.title = tocTitleMap.get(href)!;

    const charsInChapter = chapter.paras.reduce((n, p) => n + p.length, 0);
    if (usedChars + charsInChapter > MAX_CHARS) break;
    usedChars += charsInChapter;
    result.chapters.push(chapter);
  }

  // ── Synopsis fallback ──
  if (!result.synopsis && result.chapters.length) {
    const good = result.chapters
      .flatMap((c) => c.paras)
      .filter(
        (p) =>
          p.length > 80 &&
          !/^(copyright|\u00a9|isbn|table of contents|contents|all rights reserved|published|printed)/i.test(
            p,
          ),
      )
      .slice(0, 3)
      .join(" ");
    if (good) {
      result.synopsis = good.length > 420 ? `${good.slice(0, 417).trim()}\u2026` : good;
    }
  }

  // ── Fallback chapter if nothing was parsed ──
  if (!result.chapters.length) {
    result.chapters = [
      {
        title: "Could not parse EPUB",
        paras: [
          `${result.title} opened as a zip file, but no readable XHTML spine documents were found inside the container.`,
          "Try a different EPUB — some DRM-protected files cannot be decoded in the browser.",
        ],
      },
    ];
  }

  return result;
}

/** Read an image's natural aspect ratio. */
export function coverRatioOf(src: string): Promise<number> {
  return new Promise((res) => {
    const img = new window.Image();
    img.onload = () => res(img.naturalHeight ? img.naturalWidth / img.naturalHeight : 474 / 900);
    img.onerror = () => res(474 / 900);
    img.src = src;
  });
}
