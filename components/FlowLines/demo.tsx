import React, { useMemo, useRef, useState } from "react";
import { FlowLines } from "./index";
import { FlowLinesProps } from "./types";
import { FLOWLINES_DEFAULTS, exportSvg, exportSvgToPng, normalizeFlowLinesProps } from "./utils";

const preset: FlowLinesProps = {
  width: 1440,
  height: 900,
  background: "#000000",
  lines: 9,
  strokeWidth: 4,
  strokeOpacity: 0.95,
  curvature: 0.55,
  bend: 0.35,
  valleyX: 0.38,
  valleyY: 0.62,
  jitter: 0.06,
  endLift: 140,
  leftMargin: 80,
  rightMargin: 140,
  topMargin: 60,
  bottomMargin: 120,
  glow: { enabled: true, radius: 35, intensity: 1.2, color: "#fddc82" },
  palette: ["#061f12", "#0a2c18", "#103b1f", "#154c26", "#1f622f", "#2d7e3d", "#3a9c50", "#55b46b", "#f6c255"],
  blendMode: "screen",
  exportScale: 2,
  animate: { enabled: true, speed: 0.45, amp: 0.35 },
};

const numberField = (
  label: string,
  value: number,
  onChange: (v: number) => void,
  options: { min: number; max: number; step?: number; type?: "range" | "number" }
) => (
  <label key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 12, textTransform: "uppercase", color: "#7b7f87" }}>
      {label}: {value.toFixed(Math.log10(options.step ?? 1) < 0 ? 2 : 0)}
    </span>
    <input
      type={options.type ?? "range"}
      min={options.min}
      max={options.max}
      step={options.step ?? 1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
);

export const FlowLinesDemo: React.FC = () => {
  const [config, setConfig] = useState<FlowLinesProps>(preset);
  const [paletteInputs, setPaletteInputs] = useState(preset.palette ?? []);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const updateConfig = (partial: Partial<FlowLinesProps>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handlePaletteChange = (index: number, color: string) => {
    setPaletteInputs((prev) => {
      const next = [...prev];
      next[index] = color;
      updateConfig({ palette: next });
      return next;
    });
  };

  const addPaletteStop = () => {
    setPaletteInputs((prev) => {
      const next = [...prev, "#ffffff"];
      updateConfig({ palette: next });
      return next;
    });
  };

  const removePaletteStop = (index: number) => {
    setPaletteInputs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      updateConfig({ palette: next });
      return next;
    });
  };

  const resolved = useMemo(() => normalizeFlowLinesProps(config), [config]);
  const propsPreview = useMemo(() => JSON.stringify(config, null, 2), [config]);

  const copyJson = () => {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(propsPreview);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, minHeight: "100vh", background: "#050505", color: "#f5f5f5", fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
      <aside style={{ display: "flex", flexDirection: "column", gap: 24, background: "#0a0a0e", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, letterSpacing: 0.08 }}>Canvas</h2>
          {numberField("Width", config.width ?? FLOWLINES_DEFAULTS.width, (value) => updateConfig({ width: value }), {
            min: 800,
            max: 3840,
            step: 10,
            type: "range",
          })}
          {numberField("Height", config.height ?? FLOWLINES_DEFAULTS.height, (value) => updateConfig({ height: value }), {
            min: 600,
            max: 2160,
            step: 10,
            type: "range",
          })}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", color: "#7b7f87" }}>Background</span>
            <input
              type="color"
              value={config.background ?? "#000000"}
              onChange={(event) => updateConfig({ background: event.target.value })}
            />
          </label>
        </section>

        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Geometry</h2>
          {numberField("Lines", config.lines ?? 9, (value) => updateConfig({ lines: value }), {
            min: 3,
            max: 16,
            step: 1,
          })}
          {numberField("Stroke Width", config.strokeWidth ?? 4, (value) => updateConfig({ strokeWidth: value }), {
            min: 1,
            max: 12,
            step: 0.5,
          })}
          {numberField("Curvature", config.curvature ?? 0.55, (value) => updateConfig({ curvature: value }), {
            min: 0,
            max: 1,
            step: 0.01,
          })}
          {numberField("Bend", config.bend ?? 0.35, (value) => updateConfig({ bend: value }), {
            min: 0,
            max: 1,
            step: 0.01,
          })}
          {numberField("Valley X", config.valleyX ?? 0.38, (value) => updateConfig({ valleyX: value }), {
            min: 0.1,
            max: 0.8,
            step: 0.01,
          })}
          {numberField("Valley Y", config.valleyY ?? 0.62, (value) => updateConfig({ valleyY: value }), {
            min: 0.2,
            max: 0.9,
            step: 0.01,
          })}
          {numberField("Jitter", config.jitter ?? 0.06, (value) => updateConfig({ jitter: value }), {
            min: 0,
            max: 0.3,
            step: 0.005,
          })}
          {numberField("End Lift", config.endLift ?? 140, (value) => updateConfig({ endLift: value }), {
            min: 0,
            max: 300,
            step: 5,
          })}
        </section>

        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Styling</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", color: "#7b7f87" }}>Palette</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {paletteInputs.map((color, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="color" value={color} onChange={(event) => handlePaletteChange(index, event.target.value)} />
                  <button type="button" onClick={() => removePaletteStop(index)} style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer" }}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={addPaletteStop} style={{ padding: "4px 8px", borderRadius: 6, background: "#1b1f28", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>
                +
              </button>
            </div>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", color: "#7b7f87" }}>Blend Mode</span>
            <select
              value={config.blendMode ?? "screen"}
              onChange={(event) => updateConfig({ blendMode: event.target.value as FlowLinesProps["blendMode"] })}
              style={{ padding: 8, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#050505", color: "#fff" }}
            >
              {["normal", "screen", "lighten", "overlay"].map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={config.glow?.enabled ?? false}
              onChange={(event) =>
                updateConfig({
                  glow: { ...(config.glow ?? { radius: 30, intensity: 1, color: "#fcd682" }), enabled: event.target.checked },
                })
              }
            />
            <span>Glow</span>
          </label>
          {config.glow?.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {numberField("Glow Radius", config.glow.radius, (value) => updateConfig({ glow: { ...(config.glow ?? {}), radius: value } }), {
                min: 5,
                max: 120,
                step: 1,
              })}
              {numberField(
                "Glow Intensity",
                config.glow.intensity,
                (value) => updateConfig({ glow: { ...(config.glow ?? {}), intensity: value } }),
                { min: 0, max: 2, step: 0.05 }
              )}
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", color: "#7b7f87" }}>Glow Color</span>
                <input
                  type="color"
                  value={config.glow.color ?? "#f6c255"}
                  onChange={(event) => updateConfig({ glow: { ...(config.glow ?? {}), color: event.target.value } })}
                />
              </label>
            </div>
          )}
        </section>

        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Animation</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={config.animate?.enabled ?? false}
              onChange={(event) =>
                updateConfig({
                  animate: { ...(config.animate ?? { speed: 0.4, amp: 0.3 }), enabled: event.target.checked },
                })
              }
            />
            <span>Animate</span>
          </label>
          {config.animate?.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {numberField(
                "Speed",
                config.animate.speed,
                (value) => updateConfig({ animate: { ...(config.animate ?? {}), speed: value } }),
                { min: 0.1, max: 1, step: 0.05 }
              )}
              {numberField(
                "Amplitude",
                config.animate.amp,
                (value) => updateConfig({ animate: { ...(config.animate ?? {}), amp: value } }),
                { min: 0.15, max: 1, step: 0.05 }
              )}
            </div>
          )}
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={() => exportSvg(svgRef.current, "flow-lines.svg")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#1d7c4b",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Export SVG
          </button>
          <button
            type="button"
            onClick={() => exportSvgToPng(svgRef.current, config.exportScale ?? 2, "flow-lines.png")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#f6c255",
              color: "#0f1013",
              border: "none",
              cursor: "pointer",
            }}
          >
            Export PNG ×{config.exportScale ?? 2}
          </button>
          {numberField(
            "Export Scale",
            config.exportScale ?? 2,
            (value) => updateConfig({ exportScale: value }),
            { min: 1, max: 6, step: 1, type: "range" }
          )}
        </section>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            background: "#000",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: 24,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 420,
          }}
        >
          <FlowLines ref={svgRef} {...config} />
        </div>
        <section style={{ background: "#0b0f14", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Props JSON</h3>
            <button
              type="button"
              onClick={copyJson}
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
            >
              Copy JSON
            </button>
          </header>
          <pre style={{ maxHeight: 240, overflow: "auto", marginTop: 12 }}>{propsPreview}</pre>
        </section>
        <section style={{ background: "#0b0f14", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ marginTop: 0 }}>Resolved Metrics</h3>
          <p style={{ fontSize: 13, color: "#c0c5d0" }}>
            Spacing: {resolved.spacing.toFixed(2)}px · Glow: {resolved.glow.enabled ? "on" : "off"} · Blend Mode:{" "}
            {resolved.blendMode}
          </p>
        </section>
      </main>
    </div>
  );
};

export default FlowLinesDemo;
