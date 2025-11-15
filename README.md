# FlowLines SVG Module

FlowLines is a reusable React + TypeScript module for generating flowing parallel spline lines across a black canvas. It recreates the popular deep-green-to-gold "flowing line" aesthetic while remaining completely customizable through typed props and utility helpers.

## Features

- Cubic Bézier spline generation with deterministic, seeded jitter
- Fully configurable geometry: curvature, bend, spacing, valley placement, margins, lift
- Rich color control via palettes or gradient stops, with a dedicated gold accent line
- Optional glow filter, blend modes, and lightweight stroke animation
- Export helpers for SVG and PNG outputs
- Interactive demo with live controls, JSON inspector, and copy-to-clipboard support

## File Structure

```
components/FlowLines/
├── index.tsx      # React component (forwardRef)
├── types.ts       # Shared TypeScript interfaces
├── utils.ts       # Curve math, palette helpers, export utilities
└── demo.tsx       # Control panel + exporter demo
```

## Usage

```tsx
import { FlowLines } from "./components/FlowLines";

export const HeroBackground = () => (
  <FlowLines
    width={1920}
    height={1080}
    lines={9}
    palette={["#061f12", "#0f361c", "#1f6d30", "#3ea251", "#f6c255"]}
    glow={{ enabled: true, radius: 32, intensity: 1.1, color: "#f8d67d" }}
  />
);
```

All props are optional; the component ships with defaults that mirror the reference artwork:

| Prop | Default | Notes |
| --- | --- | --- |
| `width` / `height` | 2560 × 1440 | Canvas size (also used by export helpers) |
| `background` | `#000000` | Fills the `<rect>` behind the lines |
| `lines` | `9` | Recommended range 7–10 |
| `strokeWidth` | `4` | Anti-aliased with `strokeLinecap="round"` |
| `curvature` | `0.55` | 0–1 dip depth at the valley |
| `bend` | `0.35` | 0–1 rightward arc strength |
| `valleyX` / `valleyY` | `0.38` / `0.62` | Valley position (percent of width/height) |
| `jitter` | `0.06` | Micro noise amplitude (seeded) |
| `endLift` | `120` | Extra upward arc (pixels) on the right edge |
| `palette` | Dark green → gold ramp | Each line interpolates across the palette |
| `goldIndex` | `lines - 1` | Index that locks to the final gold tone |
| `glow` | Enabled, radius `45`, intensity `1.1` | Adds a soft highlight using SVG filters |
| `blendMode` | `"screen"` | Applied to the `<g>` that holds all paths |
| `animate` | Disabled | When enabled, strokes animate via dash-offset |

### Export Helpers

```ts
import { exportSvg, exportSvgToPng } from "./components/FlowLines/utils";

const svgRef = useRef<SVGSVGElement>(null);
exportSvg(svgRef.current, "flow-lines.svg");
await exportSvgToPng(svgRef.current, 3, "flow-lines@3x.png");
```

Both helpers clone the SVG, serialize it, and trigger client-side downloads (PNG export rasterizes via an offscreen canvas).

## Demo Panel

Mount `FlowLinesDemo` anywhere inside your app to get sliders, color pickers, animation toggles, and export buttons:

```tsx
import FlowLinesDemo from "./components/FlowLines/demo";

export default function Playground() {
  return <FlowLinesDemo />;
}
```

The demo exposes every prop, maintains palette editors, and shows the exact JSON for the current configuration alongside quick export actions.

### Default Preset (matches reference)

```json
{
  "lines": 9,
  "width": 1440,
  "height": 900,
  "background": "#000000",
  "palette": ["#061f12", "#0a2c18", "#103b1f", "#154c26", "#1f622f", "#2d7e3d", "#3a9c50", "#55b46b", "#f6c255"],
  "curvature": 0.55,
  "bend": 0.35,
  "valleyX": 0.38,
  "valleyY": 0.62,
  "jitter": 0.06,
  "strokeWidth": 4,
  "glow": { "enabled": true, "radius": 35, "intensity": 1.2, "color": "#fddc82" },
  "animate": { "enabled": true, "speed": 0.45, "amp": 0.35 }
}
```

## Development Notes

- All randomness is deterministic when a `seed` is provided.
- Lines are generated via Catmull-Rom–to–Bézier conversion to ensure smooth, non-intersecting splines.
- Margins, spacing, and clamps keep strokes clear of the canvas edges.
- The module is pure React/TS and does not depend on any design system—you can drop it into any app and style the wrapper however you like.