import { functions, materials, product, type Run } from "./catalog";
import { allocated, layout, reserve, type Kitchen } from "./domain";
export default function Elevation({
  data,
  run,
  selected,
  onSelect,
}: {
  data: Kitchen;
  run: Run;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const items = layout(data).filter((p) => p.zone.run === run);
  const length = Math.max(data.runs[run], allocated(data, run) + reserve(data));
  let cursor = reserve(data);
  return (
    <svg
      className="elevation"
      viewBox={`-180 -180 ${length + 360} 2980`}
      role="img"
      aria-label={`Bản vẽ trực diện nhánh ${run}, đơn vị mm`}
    >
      <defs>
        <pattern
          id="corner-hatch"
          patternUnits="userSpaceOnUse"
          width="65"
          height="65"
        >
          <path d="M0 65L65 0" stroke="#c1b8a5" strokeWidth="7" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={data.runs[run]} height="2300" fill="#f7f7f3" />
      <line
        x1="0"
        y1="2300"
        x2={length}
        y2="2300"
        stroke="#a8afa5"
        strokeWidth="7"
      />
      <line
        x1={data.runs[run]}
        y1="0"
        x2={data.runs[run]}
        y2="2430"
        stroke="#b87661"
        strokeDasharray="30 20"
        strokeWidth="6"
      />
      {reserve(data) > 0 && (
        <g>
          <rect width="650" height="2300" fill="url(#corner-hatch)" />
          <text
            x="325"
            y="1200"
            textAnchor="middle"
            fontSize="75"
            fill="#6f6655"
            transform="rotate(-90 325 1200)"
          >
            DÀNH GÓC · 650 mm
          </text>
        </g>
      )}
      {data.zones
        .filter((z) => z.run === run)
        .map((z) => {
          const x = cursor;
          cursor += z.width;
          return (
            <g
              key={z.id}
              role="button"
              tabIndex={0}
              aria-label={`Bản vẽ vùng ${functions[z.kind].name}`}
              onClick={() => onSelect(z.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(z.id);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x + 5}
                y="0"
                width={z.width - 10}
                height="2300"
                fill={functions[z.kind].color}
                opacity={selected === z.id ? 0.2 : 0.07}
              />
              <rect
                x={x + 5}
                y="2360"
                width={z.width - 10}
                height="185"
                rx="15"
                fill={functions[z.kind].color}
                stroke={selected === z.id ? "#284c40" : "transparent"}
                strokeWidth="10"
              />
              <text
                x={x + z.width / 2}
                y="2478"
                fontSize={Math.min(65, z.width / 8)}
                textAnchor="middle"
                fill="#263d35"
              >
                {functions[z.kind].name}
              </text>
              <text
                x={x + z.width / 2}
                y="2660"
                fontSize="65"
                textAnchor="middle"
                fill="#69756d"
              >
                {z.width} mm
              </text>
            </g>
          );
        })}
      {items.map((p) => {
        const x = p.start,
          y = 2300 - p.y - p.height,
          w = p.width,
          h = p.height;
        const invalid =
          p.start + p.width > data.runs[run] || p.width > p.zone.width;
        return (
          <g
            key={p.module.id}
            onClick={() => onSelect(p.zone.id)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={x + 6}
              y={y}
              width={w - 12}
              height={h}
              fill={materials[p.module.finish].color}
              stroke={invalid ? "#b65337" : "#746e62"}
              strokeWidth="5"
            />
            {p.layer !== "wall" && (
              <rect
                x={x + 12}
                y={2300 - 95}
                width={w - 24}
                height="90"
                fill="#514f47"
              />
            )}
            {p.module.productId === "drawer" ? (
              [1, 2].map((n) => (
                <line
                  key={n}
                  x1={x + 12}
                  x2={x + w - 12}
                  y1={y + ((h - 95) * n) / 3}
                  y2={y + ((h - 95) * n) / 3}
                  stroke="#746e62"
                  strokeWidth="5"
                />
              ))
            ) : (
              <line
                x1={x + w / 2}
                x2={x + w / 2}
                y1={y + 10}
                y2={y + h - (p.layer === "wall" ? 10 : 100)}
                stroke="#746e62"
                strokeWidth="5"
              />
            )}
            <rect
              x={x + w / 2 - 70}
              y={y + 100}
              width="45"
              height="12"
              fill="#494b42"
            />
            <rect
              x={x + w / 2 + 25}
              y={y + 100}
              width="45"
              height="12"
              fill="#494b42"
            />
            <title>
              {product(p.module.productId)?.name} · {w} × {h} × {p.depth} mm
            </title>
          </g>
        );
      })}
      {!items.length && (
        <g pointerEvents="none">
          <text
            x={reserve(data) + (data.runs[run] - reserve(data)) / 2}
            y="1070"
            textAnchor="middle"
            fontSize="90"
            fill="#7a857b"
          >
            Chọn vùng, rồi thêm module
          </text>
          <text
            x={reserve(data) + (data.runs[run] - reserve(data)) / 2}
            y="1220"
            textAnchor="middle"
            fontSize="60"
            fill="#7a857b"
          >
            Tủ dưới và tủ trên được xếp độc lập
          </text>
        </g>
      )}
    </svg>
  );
}
