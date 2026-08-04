import type { Interval } from "@/lib/potrosnja";

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

export default function PotrosnjaChart({
  intervali,
  referentna,
}: {
  intervali: Interval[];
  referentna: number | null;
}) {
  if (intervali.length < 2) return null;

  const vrijednosti = intervali.map((i) => i.potrosnja);
  const sve = referentna != null ? [...vrijednosti, referentna] : vrijednosti;
  const min = Math.max(0, Math.min(...sve) - 1);
  const max = Math.max(...sve) + 1;

  const x = (i: number) =>
    PAD.left + (i / (intervali.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const tocke = intervali
    .map((interval, i) => `${x(i)},${y(interval.potrosnja)}`)
    .join(" ");

  const yOznake = [min, (min + max) / 2, max];

  return (
    <div className="card p-4" style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Graf potrošnje kroz vrijeme"
        style={{ width: "100%", minWidth: 420, height: "auto", display: "block" }}
      >
        {yOznake.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={y(v)}
              x2={W - PAD.right}
              y2={y(v)}
              stroke="var(--border-soft)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--muted)"
              fontFamily="var(--font-mono), monospace"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {referentna != null && (
          <line
            x1={PAD.left}
            y1={y(referentna)}
            x2={W - PAD.right}
            y2={y(referentna)}
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        )}

        <polyline
          points={tocke}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {intervali.map((interval, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(interval.potrosnja)}
            r="4"
            fill="var(--blue)"
          />
        ))}

        {intervali.map((interval, i) => {
          const prikazi =
            intervali.length <= 6 ||
            i === 0 ||
            i === intervali.length - 1 ||
            i % Math.ceil(intervali.length / 6) === 0;
          if (!prikazi) return null;
          return (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
              fontFamily="var(--font-mono), monospace"
            >
              {interval.datum.toLocaleDateString("hr-HR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--muted)" }}>
        <span>
          <span style={{ color: "var(--blue)" }}>●</span> potrošnja (L/100km)
        </span>
        {referentna != null && (
          <span>
            <span style={{ color: "var(--amber)" }}>┄</span> referentna (
            {referentna.toFixed(1)})
          </span>
        )}
      </div>
    </div>
  );
}
