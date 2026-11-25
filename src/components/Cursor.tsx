import { useEffect, useRef } from "react";

type State = "default" | "spine" | "btn" | "open";

/**
 * The large ring cursor. State is derived from whatever is under the
 * pointer, so no component has to tell it what is happening.
 */
export default function Cursor({ frozen }: { frozen: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<State>("default");
  const target = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });
  const frozenRef = useRef(frozen);

  useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const classify = (t: EventTarget | null): State => {
      const node = t as HTMLElement | null;
      if (!node || !node.closest) return "default";
      if (node.closest(".play-ring")) return "open";
      const tape = node.closest(".tape") as HTMLElement | null;
      if (tape) {
        if (node.closest(".cv") && tape.dataset.active === "1") return "open";
        return "spine";
      }
      if (node.closest("button, a, .field, .slider")) return "btn";
      return frozenRef.current ? "default" : "default";
    };

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const next = classify(e.target);
      if (next !== state.current) {
        state.current = next;
        el.className = `cursor ${next}`;
      }
    };

    const onLeave = () => {
      target.current.x = -200;
      target.current.y = -200;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-16 * dt);
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      el.style.transform = `translate3d(${pos.current.x.toFixed(2)}px, ${pos.current.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden>
      <span className="ring" />
      <span className="dot" />
      <span className="clabel">
        OPEN
      </span>
    </div>
  );
}
