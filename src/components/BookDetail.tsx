import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverRatioOf } from "../lib/epub";
import { coverUrl, type ShelfBook } from "../lib/store";

const BLOBS: [number, number, number][] = [
  [150, 330, 0],
  [340, 600, 120],
  [250, 120, 220],
  [90, 760, 300],
  [400, 250, 360],
  [260, 860, 420],
  [230, 470, 180],
];

function wrapTitle(title: string, limit = 13) {
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (`${cur} ${w}`.length <= limit) cur += ` ${w}`;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

type Props = {
  book: ShelfBook;
  rect: DOMRect;
  onClose: () => void;
  onRead: () => void;
  onDelete?: (id: string) => void; // kept for type compat
};

export default function BookDetail({ book, rect, onClose, onRead, onDelete: _onDelete }: Props) {
  void _onDelete; // suppress unused warning
  const dlgRef = useRef<HTMLDivElement>(null);
  const circles = useRef<(SVGCircleElement | null)[]>([]);
  // closing is NOT a ref — it's local to each mount so re-opening always works
  const closingGuard = useRef(false);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const inset = `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round 3px)`;
  const origin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;

  // For SVG text-only poster (no cover image)
  const lines = wrapTitle(book.title);
  const artY = 150 + (lines.length - 1) * 60 + 40;
  const artH = 776 - artY - 16;
  const posterId = `p-${book.id}`;

  /* ── cover geometry: keep the artwork's real proportions ── */
  const [ratio, setRatio] = useState(474 / 900);
  const radiusRef = useRef(900);
  const posterW = 474;
  const posterH = Math.round(posterW / (ratio || 474 / 900));
  const scaleY = posterH / 900;

  useEffect(() => {
    if (!book.cover) return;
    let alive = true;
    coverRatioOf(coverUrl(book.cover)).then((r) => {
      if (!alive) return;
      setRatio(r);
      radiusRef.current = Math.max(900, 474 / r) * 1.05;
    });
    return () => {
      alive = false;
    };
  }, [book.cover]);

  // Is the author just the placeholder?
  const displayAuthor =
    book.author === "Imported author" || book.author === "Unknown author"
      ? book.origin === "imported"
        ? "Author"
        : book.author
      : book.author;

  useLayoutEffect(() => {
    // Reset guard on every fresh mount
    closingGuard.current = false;

    const dlg = dlgRef.current;
    if (!dlg) return;
    const node: HTMLDivElement = dlg;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── 1. Sheet grows out of the cover — starts before first paint ── */
    const sheetAnim = node.animate(
      [
        { clipPath: inset, transform: "rotate(-4.5deg)" },
        { clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" },
      ],
      { duration: reduced ? 1 : 1050, easing: "cubic-bezier(.76,0,.18,1)", fill: "both" },
    );

    /* ── 2. Text rises ── */
    const risers = Array.from(node.querySelectorAll<HTMLElement>(".rise > *"));
    risers.forEach((el, i) => {
      el.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
        duration: reduced ? 1 : 900,
        delay: reduced ? 0 : 620 + i * 75,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "both",
      });
    });

    /* ── 3. Ink blots ── */
    const setR = (v: number) =>
      circles.current.forEach((c) => c?.setAttribute("r", String(v)));

    let raf = 0;
    if (reduced) {
      setR(radiusRef.current);
    } else {
      setR(0);
      const start = performance.now() + 520;
      const loop = (now: number) => {
        let done = true;
        BLOBS.forEach(([, , delay], i) => {
          const p = Math.min(1, Math.max(0, (now - start - delay) / 1250));
          if (p < 1) done = false;
          const e = 1 - Math.pow(1 - p, 3);
          circles.current[i]?.setAttribute("r", String(radiusRef.current * e));
        });
        if (!done && now - start < 2600) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    /* ── 4. Escape key ── */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    function close() {
      if (closingGuard.current) return;
      closingGuard.current = true;
      const back = node.animate(
        [
          { clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" },
          { clipPath: inset, transform: "rotate(-4.5deg)" },
        ],
        { duration: reduced ? 1 : 850, easing: "cubic-bezier(.76,0,.18,1)", fill: "both" },
      );
      back.onfinish = () => {
        sheetAnim.cancel();
        onClose();
      };
      if (reduced) onClose();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      sheetAnim.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // useLayoutEffect — fires sync before browser paints

  return (
    <div
      className="detail vis"
      ref={dlgRef}
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
      style={{ clipPath: inset, transform: "rotate(-4.5deg)", transformOrigin: origin }}
    >
      <button
        className="box dclose"
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))}
      >
        CLOSE
      </button>

      <div className="logo dlogo" aria-hidden>
        <span className="ja">アリーダー</span>
          <span className="en">AREADER</span>
          {/* logo mark kept */}
      </div>

      {/* ── LEFT column ── */}
      <div className="dcol left">
        <div className="rise">
          <div className="lbl dsub">
            {displayAuthor}
          </div>
        </div>
        <div className="rise">
          <h1 className="dtitle">{book.title}</h1>
        </div>
        <div className="rise">
          <div className="lbl dmeta">
            {book.year} / {book.genre} / {book.chapters.length}{" "}
            {book.chapters.length === 1 ? "chapter" : "chapters"}
          </div>
        </div>
        <div className="rise">
          <p className="dsyn">{book.synopsis}</p>
        </div>
        <div className="rise">
          <p className="dcredit">{book.credit}</p>
        </div>
        <div className="rise">
          <button className="dread lbl" onClick={onRead}>
            READ THE BOOK
          </button>
        </div>
{/* remove-from-shelf button removed */}
      </div>

      {/* ── RIGHT column — poster ── */}
      <div className="dcol right">
        {book.cover ? (
          /*
           * When the book has a real cover image, show it full-bleed inside
           * the ink-blot mask — no SVG text header, just the artwork.
           */
          <svg
            className="poster"
            viewBox={`0 0 ${posterW} ${posterH}`}
            aria-hidden
            preserveAspectRatio="xMidYMid meet"
            style={{ aspectRatio: `${posterW} / ${posterH}` }}
          >
            <defs>
              <filter
                id={`bleed-${posterId}`}
                filterUnits="userSpaceOnUse"
                x="-500"
                y="-500"
                width={posterW + 1200}
                height={posterH + 1200}
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.011"
                  numOctaves="3"
                  seed="7"
                  result="t"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="t"
                  scale="120"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <mask
                id={`ink-${posterId}`}
                maskUnits="userSpaceOnUse"
                x="-200"
                y="-200"
                width={posterW + 400}
                height={posterH + 400}
              >
                <g filter={`url(#bleed-${posterId})`} fill="#fff">
                  {BLOBS.map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy * scaleY}
                      r={0}
                      ref={(el) => {
                        circles.current[i] = el;
                      }}
                    />
                  ))}
                </g>
              </mask>
            </defs>
            {/* The whole cover, at its own proportions — never cropped or stretched */}
            <image
              href={book.cover ? coverUrl(book.cover) : undefined}
              x="0"
              y="0"
              width={posterW}
              height={posterH}
              preserveAspectRatio="xMidYMid meet"
              mask={`url(#ink-${posterId})`}
            />
          </svg>
        ) : (
          /*
           * No cover image → clean typographic poster in the AReader style.
           * For imported books the author line uses the real name parsed from OPF.
           */
          <svg
            className="poster"
            viewBox="0 0 474 900"
            aria-hidden
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter
                id={`bleed-${posterId}`}
                filterUnits="userSpaceOnUse"
                x="-500"
                y="-500"
                width="1700"
                height="2000"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.011"
                  numOctaves="3"
                  seed="7"
                  result="t"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="t"
                  scale="120"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <mask
                id={`ink-${posterId}`}
                maskUnits="userSpaceOnUse"
                x="-200"
                y="-200"
                width="874"
                height="1300"
              >
                <g filter={`url(#bleed-${posterId})`} fill="#fff">
                  {BLOBS.map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={0}
                      ref={(el) => {
                        circles.current[i] = el;
                      }}
                    />
                  ))}
                </g>
              </mask>
              <pattern
                id={`hatch-${posterId}`}
                width="10"
                height="10"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <rect width="10" height="10" fill="#E6E2D9" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke={book.spine}
                  strokeWidth="3"
                  opacity="0.25"
                />
              </pattern>
            </defs>

            <g mask={`url(#ink-${posterId})`}>
              <rect width="474" height="900" fill="#F4F2ED" />

              {/* Only show author line if it's real */}
              {displayAuthor !== "Author" && (
                <text className="p-auth" x="237" y="62" textAnchor="middle">
                  {displayAuthor.toUpperCase()}
                </text>
              )}
              <line
                x1="40"
                y1="84"
                x2="434"
                y2="84"
                stroke="rgba(20,20,20,.9)"
                strokeWidth="1"
              />

              {lines.map((l, i) => (
                <text
                  key={i}
                  className="p-title"
                  x="237"
                  y={150 + i * 60}
                  textAnchor="middle"
                  fill="#141414"
                >
                  {l}
                </text>
              ))}

              {/* Large decorative initial */}
              <g clipPath={`url(#clip-${posterId})`}>
                <rect x="40" y={artY} width="394" height={artH} fill={`url(#hatch-${posterId})`} />
                <text
                  x="237"
                  y={artY + artH / 2 + 62}
                  textAnchor="middle"
                  fill={book.spine}
                  style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 190 }}
                >
                  {book.title.charAt(0)}
                </text>
              </g>

              <line
                x1="40"
                y1="790"
                x2="434"
                y2="790"
                stroke="rgba(20,20,20,.9)"
                strokeWidth="1"
              />
              <text className="p-meta" x="40" y="824">
                {book.edition.toUpperCase().slice(0, 36)}
              </text>
              <rect x="352" y="800" width="82" height="28" fill="none" stroke="#141414" />
              <text className="p-meta" x="393" y="819" textAnchor="middle" fill="#141414">
                AR · {book.year}
              </text>
            </g>

            {/* clip path needed for the hatch box */}
            <defs>
              <clipPath id={`clip-${posterId}`}>
                <rect x="40" y={artY} width="394" height={artH} />
              </clipPath>
            </defs>
          </svg>
        )}
      </div>
    </div>
  );
}
