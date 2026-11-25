import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExtensionsPanel from "./ExtensionsPanel";
import { getProgress, saveProgress, type ShelfBook } from "../lib/store";

export type NovelOpen = {
  id: string;
  title: string;
  author: string;
  sourceName: string;
  synopsis: string;
  chapters: number;
  content: string[];
};

export type Settings = {
  font: "serif" | "sans" | "mono";
  size: number;
  lh: number;
  width: number;
  theme: "paper" | "sepia" | "night" | "cobalt";
  align: "left" | "justify";
  indent: boolean;
};

export const DEFAULTS: Settings = {
  font: "serif",
  size: 19,
  lh: 1.62,
  width: 620,
  theme: "paper",
  align: "left",
  indent: false,
};

export const THEMES: Record<Settings["theme"], { bg: string; ink: string; label: string }> = {
  paper: { bg: "#EDEBE6", ink: "#141414", label: "Paper" },
  sepia: { bg: "#E9DCC3", ink: "#3A2E1E", label: "Sepia" },
  night: { bg: "#141414", ink: "#C9C6BF", label: "Night" },
  cobalt: { bg: "#101C42", ink: "#DCE3F8", label: "Cobalt" },
};

export const FONTS: Record<Settings["font"], string> = {
  serif: '"Newsreader", Georgia, serif',
  sans: '"Inter Tight", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

/** Saved reading settings — also used by the book-opening animation so the page it opens to matches. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("ar.settings");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* defaults */
  }
  return DEFAULTS;
}

/** Neural voices — the ElevenLabs-style picker. Server unlocks them with a key. */
const NEURAL = [
  { id: "rachel", name: "Rachel", lang: "en-US", style: "Warm · narration" },
  { id: "adam", name: "Adam", lang: "en-US", style: "Deep · non-fiction" },
  { id: "bella", name: "Bella", lang: "en-US", style: "Soft · fiction" },
  { id: "domi", name: "Domi", lang: "en-US", style: "Bold · drama" },
  { id: "elli", name: "Elli", lang: "en-US", style: "Young · light" },
  { id: "josh", name: "Josh", lang: "en-US", style: "Clear · essay" },
  { id: "arni", name: "Antoni", lang: "en-US", style: "Even · audiobook" },
];

type Props = {
  book: ShelfBook | null;
  novel: NovelOpen | null;
  onClose: () => void;
  onOpenNovel: (n: NovelOpen) => void;
};

type Panel = null | "type" | "voice" | "chapters" | "ext";

export default function Reader({ book, novel, onClose, onOpenNovel }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [panel, setPanel] = useState<Panel>(null);
  const [menu, setMenu] = useState(false);
  const [chIdx, setChIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [defaultFolderOn, setDefaultFolderOn] = useState(() => localStorage.getItem("ar.defaultFolderOn") === "true");

  /* ---------------- content ---------------- */
  const chapters = useMemo(() => {
    if (book?.chapters?.length) return book.chapters;
    if (novel)
      return [
        {
          title: `Chapter 1 · cached from ${novel.sourceName}`,
          paras: novel.content,
        },
      ];
    return [{ title: "Empty", paras: [] }];
  }, [book, novel]);

  const chapter = chapters[Math.min(chIdx, chapters.length - 1)];
  const title = book?.title ?? novel?.title ?? "Reading";
  const byline = book?.author ?? novel?.author ?? "";
  const sub = "";

  /* ---------------- settings persistence ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ar.settings");
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* defaults */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ar.settings", JSON.stringify(settings));
    } catch {
      /* private mode */
    }
  }, [settings]);

  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
    setPct(p);
    if (!book) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(book.id, chIdx, p);
    }, 700);
  }, [book, chIdx]);

  /* restore saved position */
  useEffect(() => {
    if (!book) return;
    const saved = getProgress(book.id);
    if (saved && typeof saved.chapter === "number") setChIdx(saved.chapter);
  }, [book]);

  /* ---------------- TTS ---------------- */
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speakIdx, setSpeakIdx] = useState(-1);
  const [neuralNote, setNeuralNote] = useState<string | null>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const stateRef = useRef({ speaking: false, stopped: false });

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      const sorted = [...list].sort((a, b) => {
        const en = (v: SpeechSynthesisVoice) => (v.lang.toLowerCase().startsWith("en") ? 0 : 1);
        return en(a) - en(b) || a.name.localeCompare(b.name);
      });
      setVoices(sorted);
      setVoiceURI((cur) => cur || sorted[0]?.voiceURI || "");
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeak = useCallback(() => {
    stateRef.current.stopped = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setSpeakIdx(-1);
  }, []);

  const startSpeak = useCallback(
    (from = 0) => {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const paras = chapter?.paras ?? [];
      if (!paras.length) return;
      stateRef.current = { speaking: true, stopped: false };
      setSpeaking(true);
      setPaused(false);

      let i = from;
      const next = () => {
        if (stateRef.current.stopped || i >= paras.length) {
          setSpeaking(false);
          setSpeakIdx(-1);
          return;
        }
        setSpeakIdx(i);
        const u = new SpeechSynthesisUtterance(paras[i]);
        const v = voices.find((x) => x.voiceURI === voiceURI);
        if (v) u.voice = v;
        u.rate = rate;
        u.pitch = pitch;
        u.onend = () => {
          i += 1;
          next();
        };
        u.onerror = () => {
          setSpeaking(false);
          setSpeakIdx(-1);
        };
        synth.speak(u);
      };
      next();
    },
    [chapter, rate, pitch, voices, voiceURI],
  );

  const toggleSpeak = () => {
    if (!speaking) {
      startSpeak(speakIdx >= 0 ? speakIdx : 0);
      return;
    }
    const synth = window.speechSynthesis;
    if (paused) {
      synth.resume();
      setPaused(false);
    } else {
      synth.pause();
      setPaused(true);
    }
  };

  useEffect(() => {
    if (speakIdx >= 0) {
      paraRefs.current[speakIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [speakIdx]);

  useEffect(() => stopSpeak, [stopSpeak, chIdx]);

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (menu) setMenu(false);
        else if (panel) setPanel(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, menu, onClose]);

  const theme = THEMES[settings.theme];
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div
      className="reader"
      style={
        {
          "--r-bg": theme.bg,
          "--r-ink": theme.ink,
          "--r-font": FONTS[settings.font],
          "--r-size": `${settings.size}px`,
          "--r-lh": String(settings.lh),
          "--r-width": `${settings.width}px`,
          "--r-align": settings.align,
        } as React.CSSProperties
      }
    >
      <div className="grain" aria-hidden />

      {/* ---------- bar ---------- */}
      <header className="rbar">
        <div style={{ justifySelf: "start" }}>
          <button className="box" onClick={onClose}>
            BACK
          </button>
        </div>

        <button
          className="mid"
          onClick={() => setPanel(panel === "chapters" ? null : "chapters")}
          aria-label="Chapter list"
        >
          <div className="bt">{title}</div>
          <div className="ch">
            {chapter?.title}
          </div>
        </button>

        <div className="right">
          <div className="rmenu-wrap">
            <button
              className={`box${menu ? " cobalt" : ""}`}
              onClick={() => setMenu((m) => !m)}
              aria-label="Reader settings"
              aria-expanded={menu}
            >
              Aa
            </button>
            {menu && (
              <>
                <div className="rmenu-back" onClick={() => setMenu(false)} aria-hidden />
                <div className="rmenu" role="menu" aria-label="Reader settings">
                  <div className="rmenu-h">Reading settings</div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Theme</span>
                    <div className="rmenu-swatches">
                      {(Object.keys(THEMES) as Settings["theme"][]).map((t) => (
                        <button
                          key={t}
                          className={`rmenu-sw${settings.theme === t ? " on" : ""}`}
                          style={{ background: THEMES[t].bg, color: THEMES[t].ink }}
                          onClick={() => set("theme", t)}
                          title={THEMES[t].label}
                          aria-label={THEMES[t].label}
                        >
                          Aa
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Typeface</span>
                    <div className="rmenu-chips">
                      {(["serif", "sans", "mono"] as const).map((f) => (
                        <button
                          key={f}
                          className={`chip${settings.font === f ? " on" : ""}`}
                          onClick={() => set("font", f)}
                        >
                          {f === "serif" ? "Serif" : f === "sans" ? "Sans" : "Mono"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Text size</span>
                    <div className="rmenu-step">
                      <button onClick={() => set("size", Math.max(15, settings.size - 1))}>−</button>
                      <span>{settings.size}px</span>
                      <button onClick={() => set("size", Math.min(30, settings.size + 1))}>+</button>
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Line height</span>
                    <div className="rmenu-step">
                      <button onClick={() => set("lh", Math.max(1.3, +(settings.lh - 0.05).toFixed(2)))}>−</button>
                      <span>{settings.lh.toFixed(2)}</span>
                      <button onClick={() => set("lh", Math.min(2.2, +(settings.lh + 0.05).toFixed(2)))}>+</button>
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Margins</span>
                    <div className="rmenu-step">
                      <button onClick={() => set("width", Math.max(380, settings.width - 40))}>−</button>
                      <span>{settings.width}px</span>
                      <button onClick={() => set("width", Math.min(900, settings.width + 40))}>+</button>
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Paragraphs</span>
                    <div className="rmenu-chips">
                      <button
                        className={`chip${settings.align === "left" ? " on" : ""}`}
                        onClick={() => set("align", "left")}
                      >
                        Ragged
                      </button>
                      <button
                        className={`chip${settings.align === "justify" ? " on" : ""}`}
                        onClick={() => set("align", "justify")}
                      >
                        Justified
                      </button>
                      <button
                        className={`chip${settings.indent ? " on" : ""}`}
                        onClick={() => set("indent", !settings.indent)}
                      >
                        Indent
                      </button>
                    </div>
                  </div>

                  <div className="rmenu-row">
                    <span className="rmenu-l">Library</span>
                    <div className="rmenu-chips">
                      <button
                        className={`chip ${defaultFolderOn ? "on" : ""}`}
                        onClick={() => {
                          const newVal = !defaultFolderOn;
                          setDefaultFolderOn(newVal);
                          localStorage.setItem("ar.defaultFolderOn", String(newVal));
                          window.dispatchEvent(new Event("storage"));
                        }}
                      >
                        Default Folder: {defaultFolderOn ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>

                  <div className="rmenu-foot">
                    <button
                      className="chip"
                      onClick={() => {
                        setSettings(DEFAULTS);
                      }}
                    >
                      Reset
                    </button>
                    <button
                      className="chip"
                      onClick={() => {
                        setMenu(false);
                        setPanel("type");
                      }}
                    >
                      All settings
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            className={`box${panel === "chapters" ? " cobalt" : ""}`}
            onClick={() => setPanel(panel === "chapters" ? null : "chapters")}
            aria-label="Table of contents"
          >
            CONTENTS
          </button>

          <button
            className={`box${panel === "voice" ? " cobalt" : ""}`}
            onClick={() => setPanel(panel === "voice" ? null : "voice")}
          >
            VOICE
          </button>

          <button
            className={`box${panel === "ext" ? " cobalt" : ""}`}
            onClick={() => setPanel(panel === "ext" ? null : "ext")}
          >
            EXT
          </button>
        </div>
      </header>

      {/* ---------- text ---------- */}
      <div className="rbody" ref={bodyRef} onScroll={onScroll}>
        <article className="rtext">
          <div className="ch-sub">
            {title} — {byline}
          </div>
          <h1 className="ch-h">{chapter?.title}</h1>
          {sub && <div className="ch-sub" style={{ marginBottom: 28 }}>{sub}</div>}
          {chapter?.paras.map((p, i) => (
            <p
              key={i}
              ref={(el) => {
                paraRefs.current[i] = el;
              }}
              className={`${settings.indent ? "indent" : ""}${speakIdx === i ? " speaking" : ""}`}
              onClick={() => {
                if (speaking) stopSpeak();
              }}
            >
              {p}
            </p>
          ))}
          <div className="ch-sub" style={{ marginTop: 44, opacity: 0.55 }}>
            End of chapter · {pct}% read
          </div>
        </article>
      </div>

      {/* ---------- footer ---------- */}
      <div className="rfoot">
        <button
          className="box"
          disabled={chIdx <= 0}
          onClick={() => {
            stopSpeak();
            setChIdx((c) => Math.max(0, c - 1));
            bodyRef.current?.scrollTo({ top: 0 });
          }}
          aria-label="Previous chapter"
        >
          ←
        </button>
        <div className="rtrack" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="rnum">
          {chIdx + 1}/{chapters.length} · {pct}%
        </span>
        <button
          className="box"
          disabled={chIdx >= chapters.length - 1}
          onClick={() => {
            stopSpeak();
            setChIdx((c) => Math.min(chapters.length - 1, c + 1));
            bodyRef.current?.scrollTo({ top: 0 });
          }}
          aria-label="Next chapter"
        >
          →
        </button>
      </div>

      {/* ---------- panels ---------- */}
      <aside className={`panel${panel === "type" ? " on" : ""}`} aria-hidden={panel !== "type"}>
        <div className="ph">
          <span className="t">Typography</span>
          <button className="box" onClick={() => setPanel(null)}>
            CLOSE
          </button>
        </div>
        <div className="pb">
          <div className="pgroup">
            <div className="gh">Typeface</div>
            <div className="chips">
              {(["serif", "sans", "mono"] as const).map((f) => (
                <button
                  key={f}
                  className={`chip${settings.font === f ? " on" : ""}`}
                  onClick={() => set("font", f)}
                >
                  {f === "serif" ? "Serif" : f === "sans" ? "Sans" : "Mono"}
                </button>
              ))}
            </div>
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Size</span>
              <span>{settings.size}px</span>
            </div>
            <input
              className="slider"
              type="range"
              min={15}
              max={28}
              value={settings.size}
              onChange={(e) => set("size", Number(e.target.value))}
            />
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Line height</span>
              <span>{settings.lh.toFixed(2)}</span>
            </div>
            <input
              className="slider"
              type="range"
              min={1.3}
              max={2}
              step={0.02}
              value={settings.lh}
              onChange={(e) => set("lh", Number(e.target.value))}
            />
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Margins</span>
              <span>{settings.width}px</span>
            </div>
            <input
              className="slider"
              type="range"
              min={380}
              max={900}
              step={10}
              value={settings.width}
              onChange={(e) => set("width", Number(e.target.value))}
            />
          </div>

          <div className="pgroup">
            <div className="gh">Theme</div>
            <div className="chips">
              {(Object.keys(THEMES) as Settings["theme"][]).map((t) => (
                <button
                  key={t}
                  className={`chip${settings.theme === t ? " on" : ""}`}
                  onClick={() => set("theme", t)}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      background: THEMES[t].bg,
                      border: "1px solid rgba(20,20,20,.5)",
                      display: "inline-block",
                    }}
                  />
                  {THEMES[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="pgroup">
            <div className="gh">Paragraphs</div>
            <div className="chips">
              <button
                className={`chip${settings.align === "left" ? " on" : ""}`}
                onClick={() => set("align", "left")}
              >
                Ragged right
              </button>
              <button
                className={`chip${settings.align === "justify" ? " on" : ""}`}
                onClick={() => set("align", "justify")}
              >
                Justified
              </button>
              <button
                className={`chip${settings.indent ? " on" : ""}`}
                onClick={() => set("indent", !settings.indent)}
              >
                First-line indent
              </button>
            </div>
          </div>

          <div className="pgroup">
            <button
              className="chip"
              onClick={() => setSettings(DEFAULTS)}
              style={{ height: 30 }}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </aside>

      <aside className={`panel${panel === "voice" ? " on" : ""}`} aria-hidden={panel !== "voice"}>
        <div className="ph">
          <span className="t">Read aloud</span>
          <button className="box" onClick={() => setPanel(null)}>
            CLOSE
          </button>
        </div>
        <div className="pb">
          <div className="ttsbar">
            <button className={`pbtn${speaking && !paused ? " on" : ""}`} onClick={toggleSpeak}>
              {!speaking ? "Play" : paused ? "Resume" : "Pause"}
            </button>
            <button className="pbtn" onClick={stopSpeak}>
              Stop
            </button>
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Device voices</span>
              <span>{voices.length}</span>
            </div>
            {voices.length === 0 && (
              <p className="empty">
                No system voices reported. On Android these come from the installed speech engine;
                on desktop from the OS.
              </p>
            )}
            {voices.map((v) => (
              <button
                key={v.voiceURI}
                className={`voice${voiceURI === v.voiceURI ? " on" : ""}`}
                onClick={() => {
                  setVoiceURI(v.voiceURI);
                  if (speaking) startSpeak(Math.max(0, speakIdx));
                }}
              >
                <span className="vdot">{v.name.charAt(0)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="vn">{v.name}</span>
                  <br />
                  <span className="vl">
                    {v.lang} · {v.localService ? "local" : "network"}
                  </span>
                </span>
                <span className="tag">System</span>
              </button>
            ))}
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Neural voices</span>
              <span>ElevenLabs</span>
            </div>
            {NEURAL.map((n) => (
              <button
                key={n.id}
                className="voice"
                onClick={() =>
                  setNeuralNote(
                    `${n.name} is a neural voice. Set ELEVENLABS_API_KEY in .env and AReader will proxy the request server-side — the key never reaches the device, and free-tier quotas are respected.`,
                  )
                }
              >
                <span className="vdot">{n.name.charAt(0)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="vn">{n.name}</span>
                  <br />
                  <span className="vl">
                    {n.lang} · {n.style}
                  </span>
                </span>
                <span className="tag pro">Pro</span>
              </button>
            ))}
            {neuralNote && <p className="note" style={{ marginTop: 12 }}>{neuralNote}</p>}
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Rate</span>
              <span>{rate.toFixed(2)}×</span>
            </div>
            <input
              className="slider"
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>

          <div className="pgroup">
            <div className="gh">
              <span>Pitch</span>
              <span>{pitch.toFixed(2)}</span>
            </div>
            <input
              className="slider"
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
            />
          </div>
        </div>
      </aside>

      <aside
        className={`panel${panel === "chapters" ? " on" : ""}`}
        aria-hidden={panel !== "chapters"}
      >
        <div className="ph">
          <span className="t">Contents</span>
          <span className="lbl" style={{ opacity: 0.6 }}>
            {chapters.length} sections
          </span>
          <button className="box" onClick={() => setPanel(null)}>
            CLOSE
          </button>
        </div>
        <div className="pb chlist">
          {chapters.map((c, i) => (
            <button
              key={c.title}
              className={i === chIdx ? "on" : ""}
              onClick={() => {
                stopSpeak();
                setChIdx(i);
                setPanel(null);
                bodyRef.current?.scrollTo({ top: 0 });
              }}
            >
              <span className="cn">{String(i + 1).padStart(2, "0")}</span>
              <span className="ct">{c.title}</span>
            </button>
          ))}
          {novel && (
            <p className="empty" style={{ marginTop: 16 }}>
              {novel.chapters - 1} further chapters stay on {novel.sourceName} — they are fetched
              when you open them, then laid out with these same typography settings.
            </p>
          )}
        </div>
      </aside>

      <aside className={`panel${panel === "ext" ? " on" : ""}`} aria-hidden={panel !== "ext"}>
        <div className="ph">
          <span className="t">Extensions</span>
          <button className="box" onClick={() => setPanel(null)}>
            CLOSE
          </button>
        </div>
        <div className="pb">
          <ExtensionsPanel onOpenNovel={onOpenNovel} />
        </div>
      </aside>
    </div>
  );
}
