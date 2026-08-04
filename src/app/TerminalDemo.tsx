"use client";

import { useEffect, useState } from "react";

const LINES = [
  { t: '<span class="term-prompt">$</span> vozniPark check --sve-vozile', d: 0 },
  { t: '<span class="term-muted">Provjera 4 vozila...</span>', d: 400 },
  {
    t: '<span class="term-ok">✓</span> Renault Kangoo (ZD 118-DP) — 7.0 l/100km, u redu',
    d: 900,
  },
  {
    t: '<span class="term-ok">✓</span> Dacia Dokker (ZD 233-MZ) — 6.6 l/100km, u redu',
    d: 1400,
  },
  {
    t: '<span class="term-warn">⚠</span> Ford Transit (ZD 421-KL) — potrošnja +18% iznad referentne',
    d: 1950,
  },
  {
    t: '<span class="term-crit">✗</span> Iveco Daily (ZD 902-BT) — servis za 330 km',
    d: 2500,
  },
  {
    t: '<span class="term-muted">2 upozorenja pronađena. Pregled: /upozorenja</span>',
    d: 3100,
  },
];

export default function TerminalDemo() {
  const [visible, setVisible] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisible(i + 1), line.d),
    );
    const cursorTimer = setTimeout(() => setShowCursor(true), 3600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(cursorTimer);
    };
  }, []);

  return (
    <div className="terminal">
      <div className="term-bar">
        <div className="term-dot" style={{ background: "#F85149" }} />
        <div className="term-dot" style={{ background: "#E3A008" }} />
        <div className="term-dot" style={{ background: "#2FBF71" }} />
        <span
          className="mono"
          style={{ color: "var(--muted)", fontSize: 11.5, marginLeft: 8 }}
        >
          vozniPark — dnevna provjera
        </span>
      </div>
      <div className="term-body">
        {LINES.slice(0, visible).map((line, i) => (
          <div
            key={i}
            className="term-line"
            style={{ opacity: 1 }}
            dangerouslySetInnerHTML={{ __html: line.t }}
          />
        ))}
        {showCursor && (
          <div className="term-line" style={{ opacity: 1 }}>
            <span className="term-prompt">$</span> <span className="cursor" />
          </div>
        )}
      </div>
    </div>
  );
}
