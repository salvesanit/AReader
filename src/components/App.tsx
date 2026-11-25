import { useCallback, useEffect, useState } from "react";
import BookDetail from "./BookDetail";
import BookOpening from "./BookOpening";
import Cursor from "./Cursor";
import ExtensionsPanel from "./ExtensionsPanel";
import Reader, { type NovelOpen } from "./Reader";
import Shelf from "./Shelf";
import TitleBar from "./TitleBar";
import { parseEpubFile } from "../lib/epub";
import { getShelfBooks, importBook as storeImport, removeBook, type ShelfBook } from "../lib/store";

type Reading = { kind: "book"; id: string } | { kind: "novel"; novel: NovelOpen } | null;

export default function App() {
  const [books, setBooks] = useState<ShelfBook[]>(() => getShelfBooks());
  const [openId, setOpenId] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [reading, setReading] = useState<Reading>(null);
  const [browse, setBrowse] = useState(false);

  const openBook = useCallback((id: string, r: DOMRect) => {
    setRect(r);
    setOpenId(String(id));
  }, []);

  /* "Read the book" plays the opening animation first; the reader mounts
     underneath it mid-zoom, so the hand-off is hidden behind the page. */
  const [opening, setOpening] = useState<ShelfBook | null>(null);

  const enterReader = useCallback((id: string) => {
    setOpenId(null);
    setReading({ kind: "book", id });
  }, []);

  const openNovel = useCallback((novel: NovelOpen) => {
    setBrowse(false);
    setReading({ kind: "novel", novel });
  }, []);

  const [importing, setImporting] = useState<string | null>(null);
  const [animationsOn, setAnimationsOn] = useState(true);

  const importBook = useCallback(async (files: File[]) => {
    if (!files.length) return;
    
    // If it's many files, we process them one by one
    let updatedBooks = books;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setImporting(`Reading ${i + 1}/${files.length}: ${file.name}…`);
      
      try {
        const parsed = await parseEpubFile(file).catch(() => null);

        const payload = {
          fileName: file.name,
          title:
            parsed?.title ||
            file.name.replace(/\.epub$/i, "").replace(/[_\-]+/g, " ").trim(),
          author: parsed?.author || "Unknown author",
          synopsis: parsed?.synopsis || "",
          coverData: parsed?.coverData || undefined,
          chapters: parsed?.chapters ?? [],
          size: file.size,
        };

        const id =
          "i-" +
          payload.fileName
            .replace(/\.epub$/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48);
            
        updatedBooks = storeImport({
          id,
          title: payload.title,
          author: payload.author,
          synopsis: payload.synopsis,
          cover: payload.coverData || null,
          chapters: payload.chapters,
          fileName: payload.fileName,
          size: payload.size,
        });
        
        // We update the state at each step or at the end. 
        // Updating at each step allows visual feedback for many imports.
        setBooks([...updatedBooks]);
      } catch (err) {
        console.error("Failed to import", file.name, err);
      }
    }
    
    setImporting(null);
  }, [books]);

  useEffect(() => {
    if (!browse) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBrowse(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [browse]);

  const activeBook = books.find((b) => b.id === openId) ?? null;
  const readingBook =
    reading?.kind === "book" ? (books.find((b) => b.id === reading.id) ?? null) : null;
  const frozen = openId !== null || reading !== null || browse || opening !== null;

  return (
    <>
      <TitleBar />
      <Shelf
        books={books}
        frozen={frozen}
        importingLabel={importing}
        onOpen={openBook}
        onImport={importBook}
        onBrowse={() => setBrowse(true)}
        animationsOn={animationsOn}
        setAnimationsOn={setAnimationsOn}
      />

      {activeBook && rect && (
        <BookDetail
          book={activeBook}
          rect={rect}
          onClose={() => setOpenId(null)}
          onRead={() => {
            if (animationsOn) setOpening(activeBook);
            else enterReader(activeBook.id);
          }}
            onDelete={(id) => {
              removeBook(id);
              setBooks(getShelfBooks());
            }}
        />
      )}

      {browse && (
        <div className="browse" role="dialog" aria-modal="true" aria-label="Browse extensions">
          <div className="grain" aria-hidden />
          <div className="card">
            <button
              className="box"
              onClick={() => setBrowse(false)}
              style={{ position: "absolute", left: 34, top: 30 }}
            >
              CLOSE
            </button>
            <div className="logo" style={{ position: "absolute", right: 34, top: 26 }}>
              <span className="ja">アリーダー</span>
              <span className="en">AREADER</span>
              {/* logo kept */}
            </div>
            <div style={{ height: 46 }} />
            <div className="lbl" style={{ color: "var(--cobalt)" }}>
              BROWSE
            </div>
            <h2>Sources, not bookmarks</h2>
            <p className="sub">
              Add a repository URL and AReader imports the whole catalogue of site extensions it
              declares. Install the ones you read, then search from here — the query is executed
              against each source behind the interface, and the chapters come back laid out in
              your reader settings.
            </p>
            <ExtensionsPanel onOpenNovel={openNovel} />
          </div>
        </div>
      )}

      {(readingBook || reading?.kind === "novel") && (
        <Reader
          key={reading?.kind === "novel" ? `n-${reading.novel.id}` : `b-${readingBook?.id}`}
          book={readingBook}
          novel={reading?.kind === "novel" ? reading.novel : null}
          onClose={() => setReading(null)}
          onOpenNovel={openNovel}
        />
      )}

      {opening && (
        <BookOpening
          key={opening.id}
          book={opening}
          onMidway={() => enterReader(opening.id)}
          onDone={() => setOpening(null)}
        />
      )}

      <Cursor frozen={frozen} />
      <div className="grain" />
    </>
  );
}
