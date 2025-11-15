import { FlowLinePath, FlowLinesProps, GradientStop, NormalizedFlowLinesProps } from "./types";

const DEFAULT_PALETTE = [
  "#0c2316",
  "#0f361c",
  "#124820",
  "#1a5b28",
  "#1f6d30",
  "#2d8a3e",
  "#3ea251",
  "#5cb26a",
  "#f6c255",
];

const GOLD_HEX = "#f7cc69";

export const FLOWLINES_DEFAULTS: Required<Omit<FlowLinesProps, "palette" | "gradient" | "glow" | "animate">> = {
  width: 2560,
  height: 1440,
  background: "#000000",
  lines: 9,
  strokeWidth: 4,
  strokeCap: "round",
  strokeOpacity: 1,
  spacing: 0,
  curvature: 0.55,
  bend: 0.35,
  valleyX: 0.38,
  valleyY: 0.62,
  endLift: 120,
  leftMargin: 120,
  rightMargin: 160,
  topMargin: 80,
  bottomMargin: 120,
  jitter: 0.06,
  seed: 1,
  goldIndex: -1,
  blendMode: "screen",
  exportScale: 2,
};

const DEFAULT_GLOW = {
  enabled: true,
  radius: 45,
  intensity: 1.1,
  color: GOLD_HEX,
};

const DEFAULT_ANIMATION = {
  enabled: false,
  speed: 0.4,
  amp: 0.45,
};

type Point = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const seededRandom = (seed: number) => {
  let s = Math.imul(seed ^ 0x45d9f3b, 0x45d9f3b);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const jitterValue = (rand: () => number, amplitude: number) => (rand() * 2 - 1) * amplitude;

const normalizeStops = (stops: GradientStop[]): GradientStop[] =>
  stops
    .map((stop) => ({
      position: clamp(stop.position, 0, 1),
      color: stop.color,
      opacity: stop.opacity,
    }))
    .sort((a, b) => a.position - b.position);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (![3, 6].includes(normalized.length)) return null;
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const intVal = parseInt(value, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((c) => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;

const interpolateColor = (a: string, b: string, t: number) => {
  const start = hexToRgb(a);
  const end = hexToRgb(b);
  if (!start || !end) {
    return t < 0.5 ? a : b;
  }
  return rgbToHex(lerp(start.r, end.r, t), lerp(start.g, end.g, t), lerp(start.b, end.b, t));
};

const sampleGradient = (stops: GradientStop[], t: number) => {
  if (stops.length === 0) return null;
  if (stops.length === 1) return stops[0].color;
  const ratio = clamp(t, 0, 1);
  const lower = stops.reduce((prev, curr) => (curr.position <= ratio ? curr : prev));
  const upper = stops.find((stop) => stop.position >= ratio) ?? stops[stops.length - 1];
  if (!lower) return upper.color;
  if (lower === upper) return lower.color;
  const segmentT = (ratio - lower.position) / (upper.position - lower.position || 1);
  return interpolateColor(lower.color, upper.color, segmentT);
};

const deriveSpacing = (height: number, lines: number, top: number, bottom: number, spacing?: number) => {
  const usable = Math.max(40, height - top - bottom);
  if (spacing && spacing > 0) return spacing;
  return lines > 1 ? usable / (lines - 1) : usable;
};

const toPath = (points: Point[]) => {
  if (points.length < 2) return "";
  const segments: string[] = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    segments.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }
  return segments.join(" ");
};

const createLinePoints = (
  index: number,
  context: NormalizedFlowLinesProps,
  rand: () => number,
  spacing: number,
  viewWidth: number,
  viewHeight: number
) => {
  const { lines, topMargin, bottomMargin, height, leftMargin, rightMargin, curvature, bend, valleyX, valleyY, endLift, jitter } =
    context;
  const baseLine = topMargin + valleyY * viewHeight;
  const centerOffset = (index - (lines - 1) / 2) * spacing;
  const baseY = clamp(baseLine + centerOffset, topMargin, height - bottomMargin);
  const jitterY = jitterValue(rand, spacing * jitter);
  const depth = curvature * viewHeight * (0.25 + 0.12 * (index / Math.max(lines - 1, 1)));
  const valleyPosY = clamp(baseY + depth + jitterY, topMargin, height - bottomMargin);
  const lift = bend * viewHeight * (0.18 + 0.12 * (1 - index / Math.max(lines - 1, 1)));
  const valleySpread = clamp(0.18 + bend * 0.12, 0.12, 0.4);
  const x0 = leftMargin;
  const x1 = leftMargin + viewWidth * clamp(valleyX * 0.6, 0.05, 0.35);
  const x2 = leftMargin + viewWidth * clamp(valleyX + jitterValue(rand, 0.02), 0.1, 0.9);
  const x3 = leftMargin + viewWidth * clamp(valleyX + valleySpread, 0.25, 0.85);
  const x4 = leftMargin + viewWidth * clamp(valleyX + valleySpread + bend * 0.25, 0.4, 0.95);
  const x5 = context.width - rightMargin;
  const crestY = clamp(baseY - lift * 0.65 - endLift * 0.35 + jitterY * 0.2, topMargin, height - bottomMargin);
  const endLiftY = clamp(baseY - lift - endLift - jitterY * 0.15, topMargin, height - bottomMargin);
  const preEndY = clamp(baseY - lift * 0.4 - endLift * 0.4 + jitterY * 0.1, topMargin, height - bottomMargin);
  return [
    { x: x0, y: clamp(baseY - lift * 0.25 + jitterY * 0.4, topMargin, height - bottomMargin) },
    { x: x1, y: lerp(baseY, valleyPosY, 0.3) + jitterY * 0.25 },
    { x: x2, y: valleyPosY },
    { x: x3, y: lerp(valleyPosY, preEndY, 0.35) },
    { x: x4, y: crestY },
    { x: x5, y: endLiftY },
  ];
};

const deriveLineColor = (index: number, props: NormalizedFlowLinesProps) => {
  const ratio = props.lines > 1 ? index / (props.lines - 1) : 0;
  const goldLine = props.goldIndex ?? props.lines - 1;
  if (props.gradient.length >= 2) {
    const colorFromStops = sampleGradient(props.gradient, ratio);
    if (index === goldLine) {
      return props.gradient[props.gradient.length - 1].color;
    }
    return colorFromStops ?? props.palette[props.palette.length - 1];
  }
  if (index === goldLine) {
    return props.palette[props.palette.length - 1] ?? GOLD_HEX;
  }
  if (props.palette.length <= 1) {
    return props.palette[0] ?? GOLD_HEX;
  }
  const scaled = ratio * (props.palette.length - 1);
  const aIndex = Math.floor(scaled);
  const bIndex = Math.min(props.palette.length - 1, aIndex + 1);
  const t = scaled - aIndex;
  return interpolateColor(props.palette[aIndex], props.palette[bIndex], t);
};

export const normalizeFlowLinesProps = (props: FlowLinesProps = {}): NormalizedFlowLinesProps => {
  const base = { ...FLOWLINES_DEFAULTS, ...props };
  const palette = props.palette && props.palette.length ? props.palette : DEFAULT_PALETTE;
  const gradient = normalizeStops(props.gradient ?? []);
  const glow = { ...DEFAULT_GLOW, ...(props.glow ?? {}) };
  const animate = { ...DEFAULT_ANIMATION, ...(props.animate ?? {}) };
  const spacing = deriveSpacing(base.height, base.lines, base.topMargin, base.bottomMargin, props.spacing);
  const goldIndex = typeof props.goldIndex === "number" ? props.goldIndex : base.lines - 1;
  return {
    ...base,
    spacing,
    goldIndex,
    palette,
    gradient,
    glow,
    animate,
  };
};

export const buildFlowLinePathsFromNormalized = (normalized: NormalizedFlowLinesProps): FlowLinePath[] => {
  const rand = seededRandom(Math.round(normalized.seed));
  const viewWidth = Math.max(10, normalized.width - normalized.leftMargin - normalized.rightMargin);
  const viewHeight = Math.max(10, normalized.height - normalized.topMargin - normalized.bottomMargin);
  return Array.from({ length: normalized.lines }, (_, idx) => {
    const points = createLinePoints(idx, normalized, rand, normalized.spacing, viewWidth, viewHeight);
    return {
      d: toPath(points),
      stroke: deriveLineColor(idx, normalized),
      strokeOpacity: normalized.strokeOpacity,
    };
  });
};

export const buildFlowLinePaths = (props: FlowLinesProps): FlowLinePath[] =>
  buildFlowLinePathsFromNormalized(normalizeFlowLinesProps(props));

const serializeSvg = (svg: SVGSVGElement) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("width") && svg.clientWidth) {
    clone.setAttribute("width", String(svg.clientWidth));
  }
  if (!clone.getAttribute("height") && svg.clientHeight) {
    clone.setAttribute("height", String(svg.clientHeight));
  }
  return new XMLSerializer().serializeToString(clone);
};

const triggerDownload = (data: BlobPart, mime: string, filename: string) => {
  if (typeof window === "undefined") return;
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportSvg = (svg: SVGSVGElement | null, filename = "flow-lines.svg") => {
  if (!svg || typeof window === "undefined") return;
  const data = serializeSvg(svg);
  triggerDownload(data, "image/svg+xml;charset=utf-8", filename);
};

export const exportSvgToPng = (svg: SVGSVGElement | null, scale = 2, filename = "flow-lines.png") =>
  new Promise<void>((resolve, reject) => {
    if (!svg || typeof window === "undefined") {
      reject(new Error("SVG element not available"));
      return;
    }
    const data = serializeSvg(svg);
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    const viewBox = svg.viewBox.baseVal;
    const width = (svg.getAttribute("width") ? Number(svg.getAttribute("width")) : viewBox?.width || svg.clientWidth || 1024) * scale;
    const height =
      (svg.getAttribute("height") ? Number(svg.getAttribute("height")) : viewBox?.height || svg.clientHeight || 768) * scale;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(blob, "image/png", filename);
          resolve();
        } else {
          reject(new Error("PNG export failed"));
        }
      });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG for export"));
    };
    image.src = url;
  });
