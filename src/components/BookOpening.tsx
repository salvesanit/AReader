import { useLayoutEffect, useMemo, useRef } from "react";
import { FONTS, THEMES, loadSettings } from "./Reader";
import { coverUrl, getProgress, type ShelfBook } from "../lib/store";
import "./BookOpening.css";

type Props = {
  book: ShelfBook;
  /** Fired mid-zoom, while the overlay still hides everything — mount the reader here. */
  onMidway: () => void;
  /** Fired once the overlay has faded out completely. */
  onDone: () => void;
};

const E_OUT = "cubic-bezier(.2,.8,.2,1)";
const E_IO = "cubic-bezier(.65,0,.25,1)";
const E_FLIP = "cubic-bezier(.5,.02,.25,1)";
const E_LEAF = "cubic-bezier(.45,.05,.3,1)";
const E_ZOOM = "cubic-bezier(.7,0,.2,1)";

/* timeline, in ms */
const T = {
  rise: 650, // book rises into view
  hold: 750, // …a beat, then the cover starts to open
  open: 1150, // cover swings 180°
  leaf1: 1350,
  leaf2: 1550,
  leaf: 750, // each leaf's turn
  zoom: 1950, // camera dives into the page
  zoomD: 850,
  midway: 2150,
  fade: 2680, // overlay dissolves into the reader
  fadeD: 400,
};
const OPEN_END = T.hold + T.open;

export default function BookOpening({ book, onMidway, onDone }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const perspRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const leaf1Ref = useRef<HTMLDivElement>(null);
  const leaf2Ref = useRef<HTMLDivElement>(null);
  const gutRef = useRef<HTMLSpanElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  const midRef = useRef(onMidway);
  const doneRef = useRef(onDone);
  midRef.current = onMidway;
  doneRef.current = onDone;
  const midFired = useRef(false);
  const skipRef = useRef<() => void>(() => {});

  /* ---------- geometry: the book, and the zoom that lands on a reader-sized page ---------- */
  const g = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = Math.max(150, Math.min(vh * 0.6 * 0.7, vw * 0.42, 430));
    const bh = bw / 0.7;
    const bt = Math.max(14, bw * 0.075);
    const pw = bw * 0.978; // page block is inset from the boards
    const ph = bh * 0.976;
    const s = Math.max(vw / pw, vh / ph) * 1.025; // scale at which the page fills the screen
    const inL = (pw - vw / s) / 2; // page-space offset that centres a viewport-wide layout
    return { vw, vh, bw, bh, bt, pw, ph, s, inL };
  }, []);

  /* ---------- page content: the chapter the reader will open on ---------- */
  const settings = useMemo(() => loadSettings(), []);
  const theme = THEMES[settings.theme] ?? THEMES.paper;
  const chapters = book.chapters;
  const saved = getProgress(book.id);
  const chapter = chapters[Math.min(Math.max(0, saved?.chapter ?? 0), Math.max(0, chapters.length - 1))];
  const narrow = g.vw < 768;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fireMidway = () => {
      if (midFired.current) return;
      midFired.current = true;
      midRef.current();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fireMidway();
      doneRef.current();
      return;
    }

    const anims: Animation[] = [];
    const A = (
      el: Element | null,
      keyframes: Keyframe[],
      opts: KeyframeAnimationOptions,
    ): Animation | null => {
      if (!el) return null;
      const a = el.animate(keyframes, { fill: "both", ...opts });
      anims.push(a);
      return a;
    };

    const o1 = T.rise / OPEN_END;
    const o2 = T.hold / OPEN_END;

    /* backdrop + caption */
    A(bgRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
    A(perspRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
    A(
      capRef.current,
      [
        { opacity: 0, offset: 0 },
        { opacity: 0.75, offset: 0.18 },
        { opacity: 0.75, offset: 0.72 },
        { opacity: 0, offset: 1 },
      ],
      { duration: T.zoom + 200, easing: "linear" },
    );

    /* the book: rises angled (spine visible), straightens as the cover opens */
    A(
      bookRef.current,
      [
        { transform: "translate3d(0,46px,0) scale(.82) rotateY(-46deg)", easing: E_OUT, offset: 0 },
        { transform: "translate3d(0,0,0) scale(1) rotateY(-26deg)", easing: "linear", offset: o1 },
        { transform: "translate3d(0,0,0) scale(1) rotateY(-26deg)", easing: E_IO, offset: o2 },
        { transform: "translate3d(0,0,0) scale(1) rotateY(0deg)", offset: 1 },
      ],
      { duration: OPEN_END },
    );

    /* closed it's centred; open, the spine is the centre line */
    const x0 = -g.bw * 0.46;
    A(
      centerRef.current,
      [
        { transform: `translate3d(${x0}px,0,0)`, easing: "linear", offset: 0 },
        { transform: `translate3d(${x0}px,0,0)`, easing: E_IO, offset: o2 },
        { transform: "translate3d(0px,0,0)", offset: 1 },
      ],
      { duration: OPEN_END },
    );

    /* floor shadow grows to cover the spread */
    const sy = g.bh * 0.045;
    const sz = -(g.bt + 5);
    const sh0 = `translate3d(0,${sy}px,${sz}px) scaleX(.5)`;
    A(
      shadowRef.current,
      [
        { transform: sh0, opacity: 0, easing: "linear", offset: 0 },
        { transform: sh0, opacity: 0.6, easing: "linear", offset: o1 },
        { transform: sh0, opacity: 0.6, easing: E_IO, offset: o2 },
        { transform: `translate3d(0,${sy}px,${sz}px) scaleX(1)`, opacity: 0.6, offset: 1 },
      ],
      { duration: OPEN_END },
    );

    /* turning surfaces dim as they face away, brighten as they settle */
    const shades = (el: HTMLElement | null, delay: number, dur: number) => {
      if (!el) return;
      const front = el.querySelector<HTMLElement>(":scope > .front > .ob-sh");
      const back = el.querySelector<HTMLElement>(":scope > .back > .ob-sh");
      A(front, [{ opacity: 0 }, { opacity: 0.34 }], { delay, duration: dur / 2, easing: "ease-in" });
      A(back, [{ opacity: 0.34 }, { opacity: 0 }], {
        delay: delay + dur / 2,
        duration: dur / 2,
        easing: "ease-out",
      });
    };

    /* cover swings open on the spine; leaves follow. Z offsets keep each stack in order. */
    A(
      coverRef.current,
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }],
      { delay: T.hold, duration: T.open, easing: E_FLIP, fill: "forwards" },
    );
    shades(coverRef.current, T.hold, T.open);

    A(
      leaf1Ref.current,
      [
        { transform: "translateZ(-2px) rotateY(0deg)" },
        { transform: "translateZ(2px) rotateY(-180deg)" },
      ],
      { delay: T.leaf1, duration: T.leaf, easing: E_LEAF, fill: "forwards" },
    );
    shades(leaf1Ref.current, T.leaf1, T.leaf);

    A(
      leaf2Ref.current,
      [
        { transform: "translateZ(-4px) rotateY(0deg)" },
        { transform: "translateZ(4px) rotateY(-180deg)" },
      ],
      { delay: T.leaf2, duration: T.leaf, easing: E_LEAF, fill: "forwards" },
    );
    shades(leaf2Ref.current, T.leaf2, T.leaf);

    /* the dive: scale up until the first page fills the screen, top-aligned like the reader */
    const tx = (-g.s * g.pw) / 2;
    const ty = -g.vh / 2 + (g.s * g.ph) / 2;
    A(
      zoomRef.current,
      [
        { transform: "translate3d(0px,0px,0px) scale(1)" },
        { transform: `translate3d(${tx}px,${ty}px,0px) scale(${g.s})` },
      ],
      { delay: T.zoom, duration: T.zoomD, easing: E_ZOOM, fill: "forwards" },
    );
    A(gutRef.current, [{ opacity: 1 }, { opacity: 0 }], {
      delay: T.zoom + 80,
      duration: 600,
      easing: "ease-out",
    });

    /* The page text is a small layer scaled up, so it is a touch soft. Fade it in step
       with the overlay so the reader's crisp text takes over instead of ghosting. */
    A(articleRef.current, [{ opacity: 1 }, { opacity: 0 }], {
      delay: T.fade,
      duration: T.fadeD,
      easing: "ease-in-out",
    });

    /* dissolve into the reader, which has been mounted underneath */
    const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], {
      delay: T.fade,
      duration: T.fadeD,
      easing: "ease-in-out",
      fill: "forwards",
    });
    fade.onfinish = () => doneRef.current();

    const midTimer = window.setTimeout(fireMidway, T.midway);

    /* skip: jump everything to its end state and dissolve quickly */
    const born = performance.now();
    let skipped = false;
    let quick: Animation | null = null;
    const skip = () => {
      // ignore accidental double-clicks on the button that started this
      if (skipped || performance.now() - born < 700) return;
      skipped = true;
      window.clearTimeout(midTimer);
      fade.onfinish = null;
      fade.cancel();
      anims.forEach((a) => a.finish());
      fireMidway();
      quick = root.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 280,
        easing: "ease-out",
        fill: "forwards",
      });
      quick.onfinish = () => doneRef.current();
    };
    skipRef.current = skip;

    // capture phase: swallow Esc so the detail sheet underneath doesn't start closing
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.stopImmediatePropagation();
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.clearTimeout(midTimer);
      fade.onfinish = null;
      fade.cancel();
      quick?.cancel();
      anims.forEach((a) => a.cancel());
      skipRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- markup ---------- */
  const art: React.CSSProperties = book.cover
    ? { backgroundImage: `url("${coverUrl(book.cover)}")` }
    : ({ "--art-bg": `${book.spine}1f`, "--art-ink": book.spine } as React.CSSProperties);

  const bookVars = {
    "--bw": `${g.bw}px`,
    "--bh": `${g.bh}px`,
    "--bt": `${g.bt}px`,
    "--spine": book.spine,
    "--spine-ink": book.spineInk,
    "--pg": theme.bg,
    "--pg-ink": theme.ink,
  } as React.CSSProperties;

  const pageVars = {
    "--r-bg": theme.bg,
    "--r-ink": theme.ink,
    "--r-font": FONTS[settings.font],
    "--r-size": `${settings.size}px`,
    "--r-lh": String(settings.lh),
    "--r-width": `${settings.width}px`,
    "--r-align": settings.align,
    left: g.inL,
    width: g.vw,
    height: g.ph * g.s,
    transform: `scale(${1 / g.s})`,
    padding: narrow ? "82px 16px 0" : "100px 20px 0",
  } as React.CSSProperties;

  const sub = "";

  return (
    <div
      className="ob"
      ref={rootRef}
      onClick={() => skipRef.current()}
      aria-hidden="true"
      data-testid="book-opening"
    >
      <div className="ob-bg" ref={bgRef} />
      <div className="grain" />

      <div className="ob-persp" ref={perspRef}>
        <div className="ob-center" ref={centerRef} style={{ transform: `translate3d(${-g.bw * 0.46}px,0,0)` }}>
          <div className="ob-zoom" ref={zoomRef}>
            <div className="ob-book" ref={bookRef} style={bookVars}>
              <div className="ob-shadow" ref={shadowRef} />
              <div className="ob-back" />
              <div className="ob-edge" />
              <div className="ob-spine">
                <span>{book.title}</span>
              </div>

              {/* right-hand page: the chapter the reader opens on */}
              <div className="ob-page">
                <div className="ob-pi" style={pageVars}>
                  <article className="rtext" ref={articleRef}>
                    <div className="ch-sub">
                      {book.title} — {book.author}
                    </div>
                    <h1 className="ch-h">{chapter?.title}</h1>
                    <div className="ch-sub" style={{ marginBottom: 28 }}>
                      {sub}
                    </div>
                    {chapter?.paras.slice(0, 14).map((p, i) => (
                      <p key={i} className={settings.indent ? "indent" : ""}>
                        {p}
                      </p>
                    ))}
                  </article>
                </div>
                <span className="ob-gut" ref={gutRef} />
              </div>

              {/* leaf 2 — half-title on the front, title page on the back */}
              <div className="ob-flip leaf l2" ref={leaf2Ref}>
                <div className="ob-face front ob-pg">
                  <div className="ob-center-text">
                    <div className="t small">{book.title}</div>
                  </div>
                  <span className="ob-gut" />
                  <span className="ob-sh" />
                </div>
                <div className="ob-face back ob-pg">
                  <div className="ob-center-text">
                    <div className="a">{book.author}</div>
                    <div className="t">{book.title}</div>
                    <div className="r" />
                    <div className="e">
                      {book.year} · {book.genre}
                    </div>
                    <div className="e">{book.edition}</div>
                  </div>
                  <span className="ob-gut" />
                  <span className="ob-sh" />
                </div>
              </div>

              {/* leaf 1 — blank flyleaf */}
              <div className="ob-flip leaf l1" ref={leaf1Ref}>
                <div className="ob-face front ob-pg">
                  <span className="ob-gut" />
                  <span className="ob-sh" />
                </div>
                <div className="ob-face back ob-pg">
                  <span className="ob-gut" />
                  <span className="ob-sh" />
                </div>
              </div>

              {/* front cover — outside is the shelf artwork, inside is the pasted endpaper */}
              <div className="ob-flip cover" ref={coverRef}>
                <div className="ob-face front ob-cv">
                  <div className="ob-in">
                    <div className="ob-auth">{book.author}</div>
                    <div className="ob-ttl">{book.title}</div>
                    <div className="ob-rule" />
                    <div className={`ob-art${book.cover ? "" : " type"}`} style={art}>
                      {!book.cover && <span>{book.title.charAt(0)}</span>}
                    </div>
                    <div className="ob-foot">
                      <span>{book.edition}</span>
                    </div>
                  </div>
                  <span className="ob-hinge" />
                  <span className="ob-sh" />
                </div>
                <div className="ob-face back ob-end">
                  <span className="ob-gut" />
                  <span className="ob-sh" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ob-cap lbl" ref={capRef}>
        OPENING
      </div>
    </div>
  );
}
