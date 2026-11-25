import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GENRES } from "../lib/library";
import { coverUrl, type ShelfBook } from "../lib/store";

const smooth = (x: number) => x * x * (3 - 2 * x);
const EASE = "cubic-bezier(.2,.8,.2,1)";

type St = {
  s: number;
  T: number;
  hover: number;
  active: number;
  activeV: number;
  dir: number;
  mx: number;
  my: number;
  tiltX: number;
  tiltY: number;
  isOpen: boolean;
  dragging: boolean;
  lift: Float32Array;
  liftT: Float32Array;
};

type Props = {
  books: ShelfBook[];
  frozen: boolean;
  importingLabel?: string | null;
  onOpen: (id: string, rect: DOMRect) => void;
  onImport: (files: File[]) => void;
  onBrowse: () => void;
  animationsOn: boolean;
  setAnimationsOn: (v: boolean) => void;
};

function swapMask(el: HTMLElement, text: string, dir: number, animate: boolean) {
  const prev = Array.from(el.children) as HTMLElement[];
  const span = document.createElement("span");
  span.textContent = text;
  el.appendChild(span);
  if (!animate) {
    prev.forEach((p) => p.remove());
    return;
  }
  span.animate(
    [{ transform: `translateY(${dir * 105}%)` }, { transform: "translateY(0)" }],
    { duration: 650, easing: EASE, fill: "both" },
  );
  prev.forEach((p) => {
    const from = getComputedStyle(p).transform || "translateY(0)";
    const a = p.animate(
      [{ transform: from }, { transform: `translateY(${-dir * 105}%)` }],
      { duration: 650, easing: EASE, fill: "both" },
    );
    a.onfinish = () => p.remove();
    a.oncancel = () => p.remove();
  });
}

const DICT: Record<string, Record<string, string>> = {
  English:  { import: "IMPORT EPUB",         auto: "Auto-Move",           anim: "Animations"      },
  Hindi:    { import: "EPUB आयात करें",       auto: "स्वतः-स्थानांतरण",    anim: "एनिमेशन"         },
  Marathi:  { import: "EPUB आयात करा",        auto: "स्वयंचलित-हलवा",       anim: "अॅनिमेशन"        },
  Russian:  { import: "ИМПОРТ EPUB",          auto: "Авто-движение",        anim: "Анимации"        },
  Japanese: { import: "EPUBをインポート",      auto: "自動移動",             anim: "アニメーション"   },
  Chinese:  { import: "导入EPUB",             auto: "自动移动",             anim: "动画"            }
};

export default function Shelf({ books, frozen, importingLabel, onOpen, onImport, onBrowse: _onBrowse, animationsOn, setAnimationsOn }: Props) {
  void _onBrowse;
  const N = Math.max(1, books.length);
  const COPIES = 3;
  const TOTAL = N * COPIES;

  const startIdx = (() => {
    const i = books.findIndex((b) => b.id === "moby");
    if (i >= 0) return i;
    const c = books.findIndex((b) => b.cover);
    return c >= 0 ? c : 0;
  })();

  const [active, setActiveState] = useState(startIdx);
  const [tab, setTab] = useState({ left: 0, width: 0 });
  const [lang, setLang] = useState("English");
  const [autoRotate, setAutoRotate] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const autoRotateRef = useRef(false);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  /* close settings on Escape */
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSettingsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  // yearRef removed
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cvRefs = useRef<(HTMLDivElement | null)[]>([]);

  const geom = useRef({ H: 300, ws: 50, d: 158, gap: 9 });
  const suppressRef = useRef(false);
  const frozenRef = useRef(frozen);
  const booksRef = useRef(books);
  const openRef = useRef(onOpen);
  const reduced = useRef(false);

  frozenRef.current = frozen;
  booksRef.current = books;
  openRef.current = onOpen;

  const stRef = useRef<St | null>(null);
  if (!stRef.current) {
    stRef.current = {
      s: startIdx + N,
      T: startIdx + N,
      hover: -1,
      active: startIdx,
      activeV: startIdx + N,
      dir: 1,
      mx: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
      my: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      tiltX: 0,
      tiltY: 0,
      isOpen: false,
      dragging: false,
      lift: new Float32Array(TOTAL),
      liftT: new Float32Array(TOTAL),
    };
  }
  const st = stRef.current;
  if (st.lift.length !== TOTAL) {
    st.lift = new Float32Array(TOTAL);
    st.liftT = new Float32Array(TOTAL);
  }

  const rel = useCallback((v: number) => {
    const t = stRef.current!;
    let r = v - t.s;
    r = (((r + TOTAL / 2) % TOTAL) + TOTAL) % TOTAL - TOTAL / 2;
    return r;
  }, [TOTAL]);

  const activeBook = books[Math.min(active, N - 1)];

  /* ---------------- caption ---------------- */
  const paintCaption = useCallback(
    (idx: number, dir: number, animate: boolean) => {
      const b = booksRef.current[idx];
      if (!b) return;
      if (titleRef.current) swapMask(titleRef.current, b.title, dir, animate);
      if (subRef.current) swapMask(subRef.current, b.author, dir, animate);
      /* year/edition caption removed */
    },
    [],
  );

  const paintedRef = useRef(startIdx);

  useEffect(() => {
    paintCaption(startIdx, 1, false);
    paintedRef.current = startIdx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paintedRef.current === active) return;
    paintedRef.current = active;
    paintCaption(active, st.dir, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* ---------------- tab indicator ---------------- */
  const measureTab = useCallback(() => {
    const gi = GENRES.findIndex((g) => g === activeBook?.genre);
    const btn = gi >= 0 ? tabRefs.current[gi + 1] : null;
    if (btn) setTab({ left: btn.offsetLeft, width: btn.offsetWidth });
    else setTab({ left: 0, width: 0 });
  }, [activeBook?.genre]);

  useLayoutEffect(() => {
    measureTab();
  }, [measureTab, books]);

  useEffect(() => {
    const doc = document as Document & { fonts?: FontFaceSet };
    doc.fonts?.ready.then(() => measureTab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- engine ---------------- */
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = () => {
      const H = probeRef.current?.getBoundingClientRect().height || 320;
      const ws = (H * 142) / 840;
      const d = (H * 474) / 900;
      const gap = H * 0.03;
      geom.current = { H, ws, d, gap };
      stageRef.current?.style.setProperty("--ws", `${ws}px`);
      stageRef.current?.style.setProperty("--d", `${d}px`);
    };
    measure();

    tapeRefs.current.length = TOTAL;
    spRefs.current.length = TOTAL;
    cvRefs.current.length = TOTAL;

    const st0 = stRef.current!;
    st0.s = Math.min(st0.s, 4 * TOTAL);
    st0.T = Math.min(st0.T, 4 * TOTAL);

    let raf = 0;
    let last = performance.now();
    let snapTimer: ReturnType<typeof setTimeout> | undefined;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { H, ws, d, gap } = geom.current;
      const W = window.innerWidth;
      const wrap = wrapRef.current;
      const shelfTop = wrap ? wrap.getBoundingClientRect().top : 0;
      const cy = shelfTop + (wrap ? wrap.offsetHeight : H + 80) / 2;

      st0.isOpen = frozenRef.current;

      /* spring */
      if (autoRotateRef.current && !st0.dragging && !st0.isOpen) {
        st0.T += 1.2 * dt;
      }
      const k = reduced.current ? 1 : st0.dragging ? 18 : 5.2;
      st0.s += (st0.T - st0.s) * (1 - Math.exp(-k * dt));
      if (Math.abs(st0.T - st0.s) < 1e-4) st0.s = st0.T;
      if (st0.s > 4 * TOTAL) {
        st0.s -= TOTAL;
        st0.T -= TOTAL;
      }
      if (st0.s < -4 * TOTAL) {
        st0.s += TOTAL;
        st0.T += TOTAL;
      }

      /* caption + tab */
      const na = ((Math.round(st0.s) % N) + N) % N;
      if (na !== st0.active) {
        st0.dir = st0.T - st0.s >= 0 ? 1 : -1;
        st0.active = na;
        setActiveState(na);
      }

      /* tilt towards cursor */
      const settled = Math.abs(st0.T - st0.s) < 0.3;
      const onCover =
        !st0.isOpen && settled && Math.abs(st0.mx - W / 2) < 0.55 * d && Math.abs(st0.my - cy) < 0.55 * H;
      const wantY = onCover
        ? ((st0.mx - W / 2) / (0.55 * d)) * 9
        : ((st0.mx - W / 2) / W) * 5;
      const wantX = onCover ? (-(st0.my - cy) / (H / 2)) * 6 : 0;
      const tk = reduced.current ? 1 : 1 - Math.exp(-7 * dt);
      st0.tiltY += (wantY - st0.tiltY) * tk;
      st0.tiltX += (wantX - st0.tiltX) * tk;

      /* tapes */
      for (let v = 0; v < TOTAL; v++) {
        const r = (() => {
          let rr = v - st0.s;
          rr = (((rr + TOTAL / 2) % TOTAL) + TOTAL) % TOTAL - TOTAL / 2;
          return rr;
        })();
        const x = r * (ws + gap) + (d - ws + 1.6 * gap) * (Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5);
        const tape = tapeRefs.current[v];
        if (!tape) continue;
        if (Math.abs(x) > W / 2 + 1.5 * d) {
          if (tape.style.visibility !== "hidden") tape.style.visibility = "hidden";
          continue;
        }
        if (tape.style.visibility !== "visible") tape.style.visibility = "visible";

        const o = smooth(Math.max(0, 1 - Math.abs(r)));
        if (Math.abs(r) < 0.5) st0.activeV = v;

        const liftTarget = st0.hover === v && Math.abs(r) > 0.5 ? 1 : 0;
        st0.liftT[v] = liftTarget;
        const lk = reduced.current ? 1 : 1 - Math.exp(-12 * dt);
        st0.lift[v] += (liftTarget - st0.lift[v]) * lk;

        const y = -o * 0.025 * H - st0.lift[v] * 0.045 * H;
        const z = o * 0.2 * H;
        const rotY = -90 * o + st0.tiltY * o;
        const rotX = st0.tiltX * o;
        const rotZ = -4.5 * o;

        tape.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(
          2,
        )}px) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        tape.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));

        const sp = spRefs.current[v];
        const cv = cvRefs.current[v];
        if (sp) sp.style.setProperty("--shade", (o * 0.55).toFixed(3));
        if (cv) cv.style.setProperty("--shade", ((1 - o) * 0.5).toFixed(3));
      }

      /* hover lift easing already applied above; play ring */
      const ring = ringRef.current;
      if (ring) {
        const scale = st0.isOpen ? 0 : smooth(Math.max(0, 1 - Math.abs(st0.T - st0.s) * 3));
        const left = W / 2 - 0.5 * d - 6;
        const top = cy + 0.36 * H;
        ring.style.left = "0px";
        ring.style.top = "0px";
        ring.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        ring.style.pointerEvents = scale > 0.5 ? "auto" : "none";
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* ---------- input ---------- */
    const onMove = (e: PointerEvent) => {
      st0.mx = e.clientX;
      st0.my = e.clientY;
      if (dragX0 !== null && !frozenRef.current) {
        const dx = e.clientX - dragX0;
        if (Math.abs(dx) > 5) {
          moved = true;
          st0.dragging = true;
        }
        if (moved) st0.T = dragT0 - dx / (geom.current.ws + geom.current.gap);
      }
    };

    let dragX0: number | null = null;
    let dragT0 = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (frozenRef.current) return;
      if ((e.target as HTMLElement).closest("button, a, .tabs")) return;
      dragX0 = e.clientX;
      dragT0 = st0.T;
      moved = false;
      st0.dragging = false;
    };

    const onUp = () => {
      if (dragX0 !== null && moved) {
        st0.dragging = false;
        st0.T = Math.round(st0.T);
        suppressRef.current = true;
        setTimeout(() => {
          suppressRef.current = false;
        }, 60);
      }
      st0.dragging = false;
      dragX0 = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (frozenRef.current) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      st0.T += (delta / (geom.current.ws + geom.current.gap)) * 0.5;
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        st0.T = Math.round(st0.T);
      }, 160);
    };

    const onKey = (e: KeyboardEvent) => {
      if (frozenRef.current) return;
      if (e.key === "ArrowLeft") {
        st0.T = Math.round(st0.T) - 1;
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        st0.T = Math.round(st0.T) + 1;
        e.preventDefault();
      } else if (e.key === "Enter") {
        openActive();
      }
    };

    const onResize = () => measure();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    const shelfEl = wrapRef.current;
    shelfEl?.addEventListener("pointerdown", onDown);

    const openActive = () => {
      if (frozenRef.current) return;
      const cv = cvRefs.current[st0.activeV];
      const book = booksRef.current[st0.active];
      if (!cv || !book) return;
      const rect = cv.getBoundingClientRect();
      openRef.current(book.id, rect);
    };

    return () => {
      cancelAnimationFrame(raf);
      if (snapTimer) clearTimeout(snapTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      shelfEl?.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TOTAL, N]);

  /* ---------------- tape handlers ---------------- */
  const tapeClick = (v: number) => {
    if (frozenRef.current) return;
    if (suppressRef.current) return;
    const r = rel(v);
    if (Math.abs(r) < 0.5) {
      const cv = cvRefs.current[st.activeV];
      const book = booksRef.current[st.active];
      if (cv && book) openRef.current(book.id, cv.getBoundingClientRect());
    } else {
      st.T = Math.round(st.T + r);
    }
  };

  const jumpToGenre = (genre: string) => {
    const list = booksRef.current;
    const idx = genre === "All" ? 0 : list.findIndex((b) => b.genre === genre);
    if (idx < 0) return;
    const t = stRef.current!;
    const base = Math.round(t.T);
    let best = idx;
    for (let m = -2; m <= 2; m++) {
      const cand = idx + Math.floor((base - idx) / N + 0.5 + m) * N;
      if (Math.abs(cand - t.T) < Math.abs(best - t.T)) best = cand;
    }
    t.T = best;
  };

  const step = (dir: number) => {
    const t = stRef.current!;
    if (frozenRef.current) return;
    t.T = Math.round(t.T) + dir;
  };

  const activeGenreIdx = books.findIndex((b) => b.genre === activeBook?.genre);

  return (
    <>
      {/* ---------- top bar ---------- */}
      <header className="topbar">
        <div style={{ justifySelf: "start", display: "flex", gap: 8, alignItems: "center" }}>
          <button className="box" onClick={() => fileRef.current?.click()}>
            {DICT[lang]?.import || "IMPORT EPUB"}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".epub,application/epub+zip"
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) onImport(files);
              e.target.value = "";
            }}
          />
          {importingLabel && (
            <span className="lbl" style={{ color: "var(--muted)" }}>{importingLabel.toUpperCase()}</span>
          )}
        </div>

        <div className="logo" aria-label="AReader">
          <span className="ja">アリーダー</span>
          <span className="en">AREADER</span>
        </div>

        {/* ---------- settings gear ---------- */}
        <div className="right" style={{ position: "relative" }}>
          <button
            className="shelf-gear"
            onClick={() => setSettingsOpen(o => !o)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {settingsOpen && (
            <>
              <div className="shelf-settings-back" onClick={() => setSettingsOpen(false)} />
              <div className="shelf-settings-menu" role="dialog" aria-label="Settings">
                <div className="shelf-settings-title">Settings</div>

                <div className="shelf-settings-row">
                  <span className="shelf-settings-label">Language</span>
                  <div className="shelf-settings-chips">
                    {["English","Hindi","Marathi","Russian","Japanese","Chinese"].map(l => (
                      <button
                        key={l}
                        className={`shelf-chip${lang === l ? " on" : ""}`}
                        onClick={() => setLang(l)}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                <div className="shelf-settings-row">
                  <span className="shelf-settings-label">Auto-Move</span>
                  <button
                    className={`shelf-toggle${autoRotate ? " on" : ""}`}
                    onClick={() => setAutoRotate(r => !r)}
                  >
                    <span className="shelf-toggle-knob" />
                  </button>
                </div>

                <div className="shelf-settings-row">
                  <span className="shelf-settings-label">Animations</span>
                  <button
                    className={`shelf-toggle${animationsOn ? " on" : ""}`}
                    onClick={() => setAnimationsOn(!animationsOn)}
                  >
                    <span className="shelf-toggle-knob" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ---------- genre tabs ---------- */}
      <nav className="tabs" aria-label="Genres">
        <span
          className="tab-ind"
          style={{ width: tab.width, transform: `translateX(${tab.left}px)` }}
          aria-hidden
        />
        {GENRES.map((g, i) => {
          const trans = g === "Science Fiction" ? "scifi" : g.toLowerCase();
          const label = DICT[lang]?.[trans] || g;
          return (
            <button
              key={g}
              ref={(el) => {
                tabRefs.current[i + 1] = el;
              }}
              className={`tab lbl${activeGenreIdx >= 0 && books[activeGenreIdx]?.genre === g ? " on" : ""}`}
              onClick={() => jumpToGenre(g)}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* ---------- shelf ---------- */}
      <section
        className="shelf"
        ref={wrapRef}
        aria-label="Bookshelf"
        style={{ cursor: "default" }}
      >
        <div className="stage" ref={stageRef}>
          <div
            ref={probeRef}
            style={{ position: "absolute", height: "var(--H)", visibility: "hidden" }}
            aria-hidden
          />
          {Array.from({ length: TOTAL }, (_, v) => {
            const i = ((v % N) + N) % N;
            const b = books[i];
            if (!b) return null;
            const isActive = i === active;
            return (
              <div
                key={v}
                className="tape"
                data-active={isActive ? "1" : "0"}
                ref={(el) => {
                  tapeRefs.current[v] = el;
                }}
                onPointerEnter={() => {
                  st.hover = v;
                }}
                onPointerLeave={() => {
                  if (st.hover === v) st.hover = -1;
                }}
                onClick={() => tapeClick(v)}
              >
                <div
                  className="face sp"
                  ref={(el) => {
                    spRefs.current[v] = el;
                  }}
                  style={
                    {
                      "--spine": b.spine,
                      "--spine-ink": b.spineInk,
                    } as React.CSSProperties
                  }
                >
                  <span className="ttl">{b.title}</span>
                  <span className="foot">
                    <span className="auth">{b.author.split(" ").slice(-1)[0]}</span>
                    <span className="badge">{b.genre.slice(0, 3).toUpperCase()}</span>
                  </span>
                </div>

                <div
                  className="face cv"
                  ref={(el) => {
                    cvRefs.current[v] = el;
                  }}
                >
                  <div className="in">
                    <div className="c-auth">{b.author}</div>
                    <div className="c-ttl">{b.title}</div>
                    <div className="c-rule" />
                    <div
                      className={`c-art${b.cover ? "" : " type"}`}
                      style={
                        b.cover
                          ? { backgroundImage: `url("${coverUrl(b.cover)}")` }
                          : ({
                              "--art-bg": `${b.spine}1f`,
                              "--art-ink": b.spine,
                            } as React.CSSProperties)
                      }
                    >
                      {!b.cover && <span>{b.title.charAt(0)}</span>}
                    </div>
                    <div className="c-foot">
                      <span>{b.edition}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="plank" aria-hidden />

      {/* ---------- play ring ---------- */}
      <button
        ref={ringRef}
        className="play-ring"
        aria-label="Open book"
        onClick={() => {
          const cv = cvRefs.current[st.activeV];
          const book = booksRef.current[st.active];
          if (cv && book) openRef.current(book.id, cv.getBoundingClientRect());
        }}
      />

      {/* ---------- caption ---------- */}
      <div className="caption" aria-live="polite">
        <div className="mask cap-title" ref={titleRef} />
        <div className="mask cap-sub" ref={subRef} />
{/* year/edition caption removed */}
      </div>

      {/* ---------- arrows ---------- */}
      <button className="arrow l" aria-label="Previous book" onClick={() => step(-1)}>
        <svg viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M5 1 L1 5 L5 9" />
          <path d="M1 5 H17" />
        </svg>
      </button>
      <button className="arrow r" aria-label="Next book" onClick={() => step(1)}>
        <svg viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M13 1 L17 5 L13 9" />
          <path d="M1 5 H17" />
        </svg>
      </button>

      {/* ---------- footer ---------- */}
      <footer className="footer">
        <span className="lbl">© AREADER. SAMPLE LIBRARY, {books.length} VOLUMES.</span>
        <span className="links">
          <span className="lbl">Made with ❤️ by Sanit</span>
        </span>
      </footer>
    </>
  );
}
