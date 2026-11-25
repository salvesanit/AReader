import { useCallback, useEffect, useRef, useState } from "react";
import { FALLBACK_PLUGINS, REPO_URL } from "../lib/library";
import {
  addRepository,
  listExtensions,
  listRepositories,
  searchNovels,
  setExtensionInstalled,
  type Ext,
  type NovelHit,
  type Repo,
} from "../lib/store";
import type { NovelOpen } from "./Reader";

export default function ExtensionsPanel({
  onOpenNovel,
}: {
  onOpenNovel: (n: NovelOpen) => void;
}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [exts, setExts] = useState<Ext[]>([]);
  const [url, setUrl] = useState(REPO_URL);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<(NovelHit & { installed: boolean })[]>([]);
  const seeded = useRef(false);

  const add = useCallback(async (target: string) => {
    setBusy(true);
    try {
      const data = await addRepository(target);
      setRepos(listRepositories());
      setExts(data.extensions);
      setNote(
        data.status === "live"
          ? `Fetched ${data.count} extensions from the repository.`
          : `Repository unreachable — showing the ${data.count} bundled extensions instead.`,
      );
    } catch {
      setNote("Repository could not be reached.");
    } finally {
      setBusy(false);
    }
  }, []);

  const load = useCallback(() => {
    const r = listRepositories();
    const e = listExtensions();
    setRepos(r);
    setExts(e);
    if (!seeded.current && !r.length) {
      seeded.current = true;
      void add(REPO_URL);
    }
  }, [add]);

  useEffect(() => {
    load();
    setHits(searchNovels("").map((n) => ({ ...n, installed: false })));
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      const installed = new Set(exts.filter((e) => e.installed).map((e) => e.id));
      setHits(
        searchNovels(q).map((n) => ({ ...n, installed: installed.has(n.sourceId) })),
      );
    }, 220);
    return () => clearTimeout(t);
  }, [q, exts]);

  const toggle = (e: Ext) => {
    setExts(setExtensionInstalled(e.id, !e.installed));
  };

  const sorted = [...exts].sort(
    (a, b) => Number(b.installed) - Number(a.installed) || a.name.localeCompare(b.name),
  );
  const installedCount = exts.filter((e) => e.installed).length;

  return (
    <div>
      {note && <p className="note">{note}</p>}

      <div className="pgroup">
        <div className="gh">
          <span>Repository</span>
          <span>{repos.length} added</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            spellCheck={false}
            aria-label="Repository URL"
            placeholder="https://…/plugins.min.json"
          />
          <button
            className="chip"
            style={{ height: 38 }}
            disabled={busy}
            onClick={() => add(url.trim())}
          >
            {busy ? "…" : "ADD"}
          </button>
        </div>
        {repos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {repos.map((r) => (
              <div className="rowline" key={r.url}>
                <span className="nm">{r.label}</span>
                <span className="sb">
                  {r.count} ext · {r.status === "live" ? "live" : "cached"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pgroup">
        <div className="gh">
          <span>Extensions</span>
          <span>
            {installedCount} / {exts.length} installed
          </span>
        </div>
        {sorted.length === 0 && <p className="empty">No extensions yet. Add a repository above.</p>}
        {sorted.map((e) => (
          <div className="ext" key={e.id}>
            <span className="ei">{e.name.charAt(0).toUpperCase()}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="en">{e.name}</span>
              <br />
              <span className="es">
                {e.site} · {e.lang.toUpperCase()}
              </span>
            </span>
            <button
              className={`tag${e.installed ? " on" : ""}`}
              onClick={() => toggle(e)}
              aria-pressed={e.installed}
            >
              {e.installed ? "Installed" : "Install"}
            </button>
          </div>
        ))}
        {exts.length === FALLBACK_PLUGINS.length && (
          <p className="empty" style={{ marginTop: 10 }}>
            Bundled catalogue — {FALLBACK_PLUGINS.length} sources, installed on this device only.
          </p>
        )}
      </div>

      <div className="pgroup">
        <div className="gh">
          <span>Search across installed sites</span>
          <span>{hits.length} results</span>
        </div>
        <input
          className="field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search web novels…"
          aria-label="Search web novels"
        />
        <div style={{ marginTop: 12 }}>
          {hits.length === 0 && (
            <p className="empty">
              Nothing found. Install an extension above, then search by title, author or tag — the
              query runs against the source site, never in your view.
            </p>
          )}
          {hits.map((n) => (
            <button className="novel" key={n.id} onClick={() => onOpenNovel(n)}>
              <div className="nt">{n.title}</div>
              <div className="nm">
                <span>{n.author}</span>
                <span>{n.sourceName}</span>
                <span>{n.chapters} ch.</span>
                <span style={{ color: n.installed ? "#1F3FB0" : undefined }}>
                  {n.installed ? "installed" : "not installed"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
