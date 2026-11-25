/**
 * Custom frameless window title bar.
 * Only renders inside the Electron desktop app (window.AReaderDesktop).
 * Provides drag region + minimize / maximize / close buttons.
 */

declare global {
  interface Window {
    AReaderDesktop?: {
      platform: string;
      desktop: boolean;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}

export default function TitleBar() {
  const d = window.AReaderDesktop;
  if (!d?.desktop) return null;

  return (
    <div className="title-bar">
      {/* The drag region fills most of the bar so you can move the window */}
      <div className="title-bar-drag" />

      <div className="title-bar-controls">
        <button className="title-btn" onClick={d.minimize} aria-label="Minimize">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
        </button>
        <button className="title-btn" onClick={d.maximize} aria-label="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x=".5" y=".5" width="9" height="9" />
          </svg>
        </button>
        <button className="title-btn title-btn-close" onClick={d.close} aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
