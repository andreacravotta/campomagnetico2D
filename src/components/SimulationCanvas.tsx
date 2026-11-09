import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  MagneticSource,
  VisualSettings,
  Vector2D,
  FieldProbe,
  FieldLine,
} from '../types/physics';
import {
  calculateMagneticField,
  generateSeedPoints,
  traceFullFieldLine,
  generateIronFilings,
  IronFiling,
} from '../physics/magneticEngine';

interface SimulationCanvasProps {
  sources: MagneticSource[];
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onUpdateSource: (id: string, updates: Partial<MagneticSource>) => void;
  visualSettings: VisualSettings;
  probe: FieldProbe;
  onUpdateProbe: (probe: FieldProbe) => void;
  customSeeds: Vector2D[];
  onAddCustomSeed: (seed: Vector2D) => void;
  onClearCustomSeeds: () => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onUpdateSource,
  visualSettings,
  probe,
  onUpdateProbe,
  customSeeds,
  onAddCustomSeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dragging state
  const dragRef = useRef<{
    isDragging: boolean;
    dragType: 'magnet' | 'rotate' | 'probe' | 'pan';
    targetId: string | null;
    startX: number;
    startY: number;
    initialSourceX: number;
    initialSourceY: number;
    initialRotation: number;
    centerAngleOffset: number;
  }>({
    isDragging: false,
    dragType: 'magnet',
    targetId: null,
    startX: 0,
    startY: 0,
    initialSourceX: 0,
    initialSourceY: 0,
    initialRotation: 0,
    centerAngleOffset: 0,
  });

  // Pan and Zoom
  const [viewTransform, setViewTransform] = useState<{ panX: number; panY: number; zoom: number }>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  // Precomputed iron filings
  const filingsPool = useMemo(() => generateIronFilings(1400, 900, 2600), []);

  // Animation frame reference
  const animTimeRef = useRef<number>(0);
  const reqAnimRef = useRef<number | null>(null);

  // Resize canvas to match display size with DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Convert canvas pointer coordinate to simulation space
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Vector2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        x: (x - viewTransform.panX) / viewTransform.zoom,
        y: (y - viewTransform.panY) / viewTransform.zoom,
      };
    },
    [viewTransform]
  );

  // Check hit for magnet selection or rotate knob
  const getHitTarget = useCallback(
    (worldX: number, worldY: number) => {
      // 1. Check probe hit first
      if (visualSettings.showProbe && probe.active) {
        const dx = worldX - probe.x;
        const dy = worldY - probe.y;
        if (dx * dx + dy * dy < 28 * 28) {
          return { type: 'probe' as const, id: 'probe' };
        }
      }

      // 2. Check rotate handles on selected magnet
      if (selectedSourceId) {
        const sel = sources.find((s) => s.id === selectedSourceId);
        if (sel) {
          const cos = Math.cos(sel.rotation);
          const sin = Math.sin(sel.rotation);
          let armDistance = 80;
          if (sel.type === 'bar') armDistance = sel.width / 2 + 36;
          if (sel.type === 'horseshoe') armDistance = sel.height / 2 + 36;
          const knobX = sel.x + armDistance * cos;
          const knobY = sel.y + armDistance * sin;
          const dx = worldX - knobX;
          const dy = worldY - knobY;
          if (dx * dx + dy * dy < 18 * 18) {
            return { type: 'rotate' as const, id: sel.id };
          }
        }
      }

      // 3. Check magnet bodies (topmost first)
      for (let i = sources.length - 1; i >= 0; i--) {
        const src = sources[i];
        const cos = Math.cos(-src.rotation);
        const sin = Math.sin(-src.rotation);
        const dx = worldX - src.x;
        const dy = worldY - src.y;
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;

        if (src.type === 'bar') {
          if (Math.abs(lx) <= src.width / 2 + 8 && Math.abs(ly) <= src.height / 2 + 8) {
            return { type: 'magnet' as const, id: src.id };
          }
        } else if (src.type === 'horseshoe') {
          if (Math.abs(lx) <= src.width / 2 + 10 && Math.abs(ly) <= src.height / 2 + 10) {
            return { type: 'magnet' as const, id: src.id };
          }
        } else if (src.type === 'wire') {
          if (dx * dx + dy * dy <= (src.radius + 12) * (src.radius + 12)) {
            return { type: 'magnet' as const, id: src.id };
          }
        } else if (src.type === 'coil') {
          if (dx * dx + dy * dy <= (src.radius + 14) * (src.radius + 14)) {
            return { type: 'magnet' as const, id: src.id };
          }
        }
      }

      return null;
    },
    [sources, selectedSourceId, visualSettings.showProbe, probe]
  );

  // Main rendering routine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Clear background
    ctx.fillStyle = '#090D16'; // Deep cosmos slate
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply pan & zoom
    ctx.translate(viewTransform.panX, viewTransform.panY);
    ctx.scale(viewTransform.zoom, viewTransform.zoom);

    // 2. Subtle Coordinate Grid dots
    const gridStep = 40;
    const startX = Math.floor((-viewTransform.panX / viewTransform.zoom) / gridStep) * gridStep - gridStep;
    const endX = startX + width / viewTransform.zoom + gridStep * 2;
    const startY = Math.floor((-viewTransform.panY / viewTransform.zoom) / gridStep) * gridStep - gridStep;
    const endY = startY + height / viewTransform.zoom + gridStep * 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let gx = startX; gx < endX; gx += gridStep) {
      for (let gy = startY; gy < endY; gy += gridStep) {
        ctx.fillRect(gx - 1, gy - 1, 2, 2);
      }
    }

    // 3. Heatmap of |B| (if enabled)
    if (visualSettings.showHeatmap && sources.length > 0) {
      const step = 28;
      for (let hx = startX; hx < endX; hx += step) {
        for (let hy = startY; hy < endY; hy += step) {
          const field = calculateMagneticField(hx + step / 2, hy + step / 2, sources);
          const mag = Math.sqrt(field.x * field.x + field.y * field.y);
          const intensity = Math.min(1, Math.log10(1 + mag * 0.15));
          if (intensity > 0.05) {
            // Gradient from deep blue through cyan to amber
            const r = Math.floor(255 * Math.max(0, (intensity - 0.5) * 2));
            const g = Math.floor(200 * Math.sin(intensity * Math.PI));
            const b = Math.floor(255 * (1 - intensity));
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.22 * visualSettings.heatmapOpacity})`;
            ctx.fillRect(hx, hy, step, step);
          }
        }
      }
    }

    // 4. Vector Field Grid or Compass Needles or Iron Filings
    if (visualSettings.vectorMode === 'filings' && sources.length > 0) {
      // Iron Filings mode: thousands of micro needles oriented with B
      ctx.lineWidth = 1.3;
      for (const f of filingsPool) {
        const field = calculateMagneticField(f.x, f.y, sources);
        const mag = Math.sqrt(field.x * field.x + field.y * field.y);
        if (mag < 0.01) continue;

        const angle = Math.atan2(field.y, field.x);
        const len = Math.min(10, f.baseLength * (0.8 + Math.min(2, mag * 0.1)));
        const alpha = Math.min(0.85, 0.25 + mag * 0.12);

        ctx.strokeStyle = `rgba(180, 205, 235, ${alpha})`;
        ctx.beginPath();
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        ctx.moveTo(f.x - cosA * len * 0.5, f.y - sinA * len * 0.5);
        ctx.lineTo(f.x + cosA * len * 0.5, f.y + sinA * len * 0.5);
        ctx.stroke();
      }
    } else if (visualSettings.vectorMode === 'needles' && sources.length > 0) {
      // Compass needles grid
      const vSpacing = visualSettings.vectorGridSpacing || 36;
      const vStartX = Math.floor(startX / vSpacing) * vSpacing;
      const vStartY = Math.floor(startY / vSpacing) * vSpacing;
      const needleSize = Math.max(8, vSpacing * 0.38);

      for (let vx = vStartX; vx < endX; vx += vSpacing) {
        for (let vy = vStartY; vy < endY; vy += vSpacing) {
          const field = calculateMagneticField(vx, vy, sources);
          const mag = Math.sqrt(field.x * field.x + field.y * field.y);
          if (mag < 0.02) continue;

          const angle = Math.atan2(field.y, field.x);
          ctx.save();
          ctx.translate(vx, vy);
          ctx.rotate(angle);

          // Red pointer (points North along B)
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.moveTo(needleSize, 0);
          ctx.lineTo(0, -needleSize * 0.28);
          ctx.lineTo(0, needleSize * 0.28);
          ctx.closePath();
          ctx.fill();

          // Blue / Silver pointer (South)
          ctx.fillStyle = '#3B82F6';
          ctx.beginPath();
          ctx.moveTo(-needleSize, 0);
          ctx.lineTo(0, -needleSize * 0.28);
          ctx.lineTo(0, needleSize * 0.28);
          ctx.closePath();
          ctx.fill();

          // Pivot pin
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    } else if (visualSettings.vectorMode === 'arrows' && sources.length > 0) {
      // Field vector arrows
      const vSpacing = visualSettings.vectorGridSpacing || 36;
      const vStartX = Math.floor(startX / vSpacing) * vSpacing;
      const vStartY = Math.floor(startY / vSpacing) * vSpacing;

      for (let vx = vStartX; vx < endX; vx += vSpacing) {
        for (let vy = vStartY; vy < endY; vy += vSpacing) {
          const field = calculateMagneticField(vx, vy, sources);
          const mag = Math.sqrt(field.x * field.x + field.y * field.y);
          if (mag < 0.02) continue;

          const angle = Math.atan2(field.y, field.x);
          const intensity = Math.min(1, Math.log10(1 + mag * 0.2));
          const arrowLen = Math.min(vSpacing * 0.75, 8 + intensity * 18);

          ctx.save();
          ctx.translate(vx, vy);
          ctx.rotate(angle);

          // Color by magnitude
          if (visualSettings.colorByMagnitude) {
            const hue = Math.max(0, 210 - intensity * 210); // 210 (blue) to 0 (red)
            ctx.strokeStyle = `hsl(${hue}, 90%, 65%)`;
            ctx.fillStyle = `hsl(${hue}, 90%, 65%)`;
          } else {
            ctx.strokeStyle = 'rgba(147, 197, 253, 0.75)';
            ctx.fillStyle = 'rgba(147, 197, 253, 0.75)';
          }

          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-arrowLen * 0.4, 0);
          ctx.lineTo(arrowLen * 0.5, 0);
          ctx.stroke();

          // Arrowhead
          const headSize = Math.max(3.5, arrowLen * 0.28);
          ctx.beginPath();
          ctx.moveTo(arrowLen * 0.5 + 1, 0);
          ctx.lineTo(arrowLen * 0.5 - headSize, -headSize * 0.55);
          ctx.lineTo(arrowLen * 0.5 - headSize, headSize * 0.55);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // 5. Magnetic Field Lines (Linee di Forza)
    if (visualSettings.showFieldLines && sources.length > 0) {
      const seeds = generateSeedPoints(
        sources,
        visualSettings.fieldLineDensity,
        width / viewTransform.zoom,
        height / viewTransform.zoom
      );

      // Add user custom seeds
      for (const cs of customSeeds) {
        seeds.push(cs);
      }

      const lines: FieldLine[] = [];
      for (let idx = 0; idx < seeds.length; idx++) {
        const line = traceFullFieldLine(
          seeds[idx],
          sources,
          visualSettings,
          width / viewTransform.zoom,
          height / viewTransform.zoom,
          `line_${idx}`
        );
        if (line) lines.push(line);
      }

      // Draw lines
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const timeOffset = visualSettings.animatedFlow ? animTimeRef.current * 18 : 0;

      for (const line of lines) {
        const pts = line.points;
        if (pts.length < 2) continue;

        // Draw line with animated dash pattern or smooth line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }

        if (visualSettings.animatedFlow) {
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -timeOffset;
        } else {
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)'; // Electric Sky Cyan
        ctx.stroke();

        // Draw directional chevrons along the line
        const chevronSpacing = 38;
        let distAccum = 0;
        ctx.setLineDash([]); // Reset dash for chevrons
        ctx.fillStyle = '#38BDF8';

        for (let i = 1; i < pts.length - 1; i++) {
          const dx = pts[i].x - pts[i - 1].x;
          const dy = pts[i].y - pts[i - 1].y;
          const segLen = Math.sqrt(dx * dx + dy * dy);
          distAccum += segLen;

          if (distAccum >= chevronSpacing) {
            distAccum = 0;
            const angle = Math.atan2(pts[i].by, pts[i].bx);

            ctx.save();
            ctx.translate(pts[i].x, pts[i].y);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(4, 0);
            ctx.lineTo(-3.5, -3.2);
            ctx.lineTo(-1.5, 0);
            ctx.lineTo(-3.5, 3.2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }
        }
      }
      ctx.setLineDash([]);
    }

    // 6. Draw Magnets & Sources
    for (const source of sources) {
      const isSelected = source.id === selectedSourceId;

      ctx.save();
      ctx.translate(source.x, source.y);
      ctx.rotate(source.rotation);

      if (source.type === 'bar') {
        const w = source.width;
        const h = source.height;
        const halfW = w / 2;
        const halfH = h / 2;
        const radius = 6;
        const isFlipped = source.flipped;

        // Selection glow
        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-halfW - 5, -halfH - 5, w + 10, h + 10);
          ctx.shadowBlur = 0;
        }

        // Draw South half (Blue) & North half (Red)
        // If flipped, swap sides
        const leftIsNorth = isFlipped;
        const rightIsNorth = !isFlipped;

        // Left half
        ctx.fillStyle = leftIsNorth ? '#DC2626' : '#2563EB';
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, halfW, h, [radius, 0, 0, radius]);
        ctx.fill();

        // Right half
        ctx.fillStyle = rightIsNorth ? '#DC2626' : '#2563EB';
        ctx.beginPath();
        ctx.roundRect(0, -halfH, halfW, h, [0, radius, radius, 0]);
        ctx.fill();

        // Subtle bevel / highlight overlay
        const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, w, h, radius);
        ctx.fill();

        // Central divider seam
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, halfH);
        ctx.stroke();

        // Pole Labels (N and S)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(leftIsNorth ? 'N' : 'S', -halfW / 2, 1);
        ctx.fillText(rightIsNorth ? 'N' : 'S', halfW / 2, 1);

        // Magnet label (if set)
        if (source.label) {
          ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(source.label, 0, halfH + 16);
        }
      } else if (source.type === 'horseshoe') {
        const w = source.width;
        const h = source.height;
        const halfW = w / 2;
        const halfH = h / 2;
        const t = source.armThickness;
        const Ro = halfW;
        const Ri = Math.max(12, halfW - t);
        const yc = -halfH + Ro;
        const tipY = halfH;
        const isFlipped = source.flipped;

        // Selection highlight
        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 18;
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-halfW - 6, -halfH - 6, w + 12, h + 12);
          ctx.shadowBlur = 0;
        }

        // Draw Horseshoe Magnet
        ctx.save();

        // Helper path function tracing the exact U contour:
        // Left arm extends from x = -halfW to -Ri, from y = yc to tipY
        // Right arm extends from x = Ri to halfW, from y = yc to tipY
        // Semicircular arch connects them at the bottom (y <= yc)
        const traceUContour = () => {
          ctx.beginPath();
          // Start at outer corner of left tip
          ctx.moveTo(-halfW, tipY);
          // Down outer left edge to start of arch
          ctx.lineTo(-halfW, yc);
          // Outer semicircle arch from PI to 2*PI (through -halfH)
          ctx.arc(0, yc, Ro, Math.PI, 2 * Math.PI, false);
          // Down outer right edge to outer corner of right tip
          ctx.lineTo(halfW, tipY);
          // Flat right tip face
          ctx.lineTo(Ri, tipY);
          // Up inner right edge to arch start
          ctx.lineTo(Ri, yc);
          // Inner semicircle arch from 2*PI to PI (anticlockwise)
          ctx.arc(0, yc, Ri, 2 * Math.PI, Math.PI, true);
          // Down inner left edge to inner corner of left tip
          ctx.lineTo(-Ri, tipY);
          // Flat left tip face back to start
          ctx.closePath();
        };

        // 1. Clip inside the U-contour
        traceUContour();
        ctx.save();
        ctx.clip();

        // Left half (North by default, Red)
        const leftIsNorth = !isFlipped;
        ctx.fillStyle = leftIsNorth ? '#DC2626' : '#2563EB';
        ctx.fillRect(-halfW - 4, -halfH - 4, halfW + 4, h + 8);

        // Right half (South by default, Blue)
        const rightIsNorth = isFlipped;
        ctx.fillStyle = rightIsNorth ? '#DC2626' : '#2563EB';
        ctx.fillRect(0, -halfH - 4, halfW + 4, h + 8);

        // Polished silver/chrome pole tip caps (the top 20px)
        const tipCapH = 20;
        const chromeGrad = ctx.createLinearGradient(0, tipY - tipCapH, 0, tipY);
        chromeGrad.addColorStop(0, '#94A3B8');
        chromeGrad.addColorStop(0.3, '#F8FAFC');
        chromeGrad.addColorStop(0.7, '#E2E8F0');
        chromeGrad.addColorStop(1, '#64748B');

        ctx.fillStyle = chromeGrad;
        // Left silver tip cap
        ctx.fillRect(-halfW - 2, tipY - tipCapH, (halfW - Ri) + 4, tipCapH + 2);
        // Right silver tip cap
        ctx.fillRect(Ri - 2, tipY - tipCapH, (halfW - Ri) + 4, tipCapH + 2);

        // Tip seam lines
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-halfW, tipY - tipCapH);
        ctx.lineTo(-Ri, tipY - tipCapH);
        ctx.moveTo(Ri, tipY - tipCapH);
        ctx.lineTo(halfW, tipY - tipCapH);
        ctx.stroke();

        // 3D Cylindrical Volume Highlight along the left leg
        const leftShine = ctx.createLinearGradient(-halfW, 0, -Ri, 0);
        leftShine.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
        leftShine.addColorStop(0.3, 'rgba(255, 255, 255, 0.35)');
        leftShine.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
        leftShine.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = leftShine;
        ctx.fillRect(-halfW - 2, yc, (halfW - Ri) + 4, (tipY - yc) + 2);

        // 3D Cylindrical Volume Highlight along the right leg
        const rightShine = ctx.createLinearGradient(Ri, 0, halfW, 0);
        rightShine.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
        rightShine.addColorStop(0.3, 'rgba(255, 255, 255, 0.35)');
        rightShine.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
        rightShine.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = rightShine;
        ctx.fillRect(Ri - 2, yc, (halfW - Ri) + 4, (tipY - yc) + 2);

        // Arch bevel shading at base
        const archShine = ctx.createRadialGradient(0, yc, Ri, 0, yc, Ro);
        archShine.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
        archShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
        archShine.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = archShine;
        ctx.fillRect(-halfW - 2, -halfH - 2, w + 4, (yc - (-halfH)) + 4);

        // Central divider seam at base (x = 0)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, yc - Ri);
        ctx.stroke();

        ctx.restore(); // end clip

        // 2. Crisp outer boundary stroke
        traceUContour();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 3. Bold, crisp 'N' and 'S' lettering on the painted legs
        const leftCenterX = -(halfW + Ri) / 2;
        const rightCenterX = (halfW + Ri) / 2;
        const labelY = (yc + tipY - tipCapH) / 2;

        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow for legibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(leftIsNorth ? 'N' : 'S', leftCenterX, labelY);
        ctx.fillText(rightIsNorth ? 'N' : 'S', rightCenterX, labelY);
        ctx.shadowBlur = 0;

        ctx.restore();

        if (source.label) {
          ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(source.label, 0, -halfH - 12);
        }
      } else if (source.type === 'wire') {
        const r = source.radius;

        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 14;
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Copper wire body
        const copperGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
        copperGrad.addColorStop(0, '#FDBA74');
        copperGrad.addColorStop(1, '#C2410C');
        ctx.fillStyle = copperGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7C2D12';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Current direction symbol
        // 1 = Out of page (dot), -1 = into page (cross)
        const isOutOfPage = (source.currentDirection * (source.flipped ? -1 : 1)) > 0;
        ctx.fillStyle = '#1E1B4B';
        ctx.strokeStyle = '#1E1B4B';
        ctx.lineWidth = 2.5;

        if (isOutOfPage) {
          // Dot (punto centrale: corrente verso l'osservatore)
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Cross (X: corrente entrante)
          const s = r * 0.45;
          ctx.beginPath();
          ctx.moveTo(-s, -s);
          ctx.lineTo(s, s);
          ctx.moveTo(s, -s);
          ctx.lineTo(-s, s);
          ctx.stroke();
        }

        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(source.label || 'Filo I', 0, r + 15);
      } else if (source.type === 'coil') {
        const r = source.radius;
        if (isSelected) {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 14;
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Concentric coil rings
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Center axial indicator
        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(-r - 16, 0);
        ctx.lineTo(r + 16, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('Bobina', 0, r + 16);
      }

      // Draw Rotation Knob for Selected Magnet
      if (isSelected) {
        let armDist = 80;
        if (source.type === 'bar') armDist = source.width / 2 + 36;
        if (source.type === 'horseshoe') armDist = source.height / 2 + 36;
        if (source.type === 'wire') armDist = source.radius + 36;

        // Connecting stem
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armDist, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotate Knob circle
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#F0F9FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(armDist, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tiny rotation arrow inside knob
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(armDist, 0, 5, -Math.PI * 0.8, Math.PI * 0.6);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 7. Interactive Magnetic Probe (Sonda Bussola)
    if (visualSettings.showProbe && probe.active) {
      const probeField = calculateMagneticField(probe.x, probe.y, sources);
      const probeMag = Math.sqrt(probeField.x * probeField.x + probeField.y * probeField.y);
      const probeAngle = Math.atan2(probeField.y, probeField.x);

      ctx.save();
      ctx.translate(probe.x, probe.y);

      // Probe Outer Casing (Modern Brass / Scientific dial)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bezel
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Degree tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      for (let a = 0; a < 12; a++) {
        const rad = (a / 12) * Math.PI * 2;
        const outer = 23;
        const inner = a % 3 === 0 ? 17 : 20;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * inner, Math.sin(rad) * inner);
        ctx.lineTo(Math.cos(rad) * outer, Math.sin(rad) * outer);
        ctx.stroke();
      }

      // Compass needle inside probe
      ctx.save();
      ctx.rotate(probeAngle);

      // North needle (Red)
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();

      // South needle (Silver/Blue)
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();

      // Pivot
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Probe HUD Tag below
      const tagText = `${probeMag.toFixed(2)} mT`;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 12;
      const tagH = 18;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-tagW / 2, 32, tagW, tagH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, 0, 32 + tagH / 2);

      ctx.restore();
    }

    ctx.restore(); // viewTransform
    ctx.restore(); // dpr
  }, [
    sources,
    selectedSourceId,
    visualSettings,
    probe,
    customSeeds,
    viewTransform,
    filingsPool,
  ]);

  // Animation Loop for line flow
  useEffect(() => {
    let animId: number;
    const loop = (timestamp: number) => {
      animTimeRef.current = timestamp * 0.001;
      render();
      if (visualSettings.animatedFlow) {
        animId = requestAnimationFrame(loop);
      }
    };

    if (visualSettings.animatedFlow) {
      animId = requestAnimationFrame(loop);
    } else {
      render();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [visualSettings.animatedFlow, render]);

  // Pointer Handlers (Mouse & Touch unified)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const world = screenToWorld(e.clientX, e.clientY);
    const hit = getHitTarget(world.x, world.y);

    if (hit) {
      if (hit.type === 'probe') {
        dragRef.current = {
          isDragging: true,
          dragType: 'probe',
          targetId: 'probe',
          startX: world.x,
          startY: world.y,
          initialSourceX: probe.x,
          initialSourceY: probe.y,
          initialRotation: 0,
          centerAngleOffset: 0,
        };
      } else if (hit.type === 'rotate') {
        const source = sources.find((s) => s.id === hit.id);
        if (source) {
          const currentPointerAngle = Math.atan2(world.y - source.y, world.x - source.x);
          dragRef.current = {
            isDragging: true,
            dragType: 'rotate',
            targetId: source.id,
            startX: world.x,
            startY: world.y,
            initialSourceX: source.x,
            initialSourceY: source.y,
            initialRotation: source.rotation,
            centerAngleOffset: currentPointerAngle - source.rotation,
          };
        }
      } else if (hit.type === 'magnet') {
        onSelectSource(hit.id);
        const source = sources.find((s) => s.id === hit.id);
        if (source) {
          dragRef.current = {
            isDragging: true,
            dragType: 'magnet',
            targetId: source.id,
            startX: world.x,
            startY: world.y,
            initialSourceX: source.x,
            initialSourceY: source.y,
            initialRotation: source.rotation,
            centerAngleOffset: 0,
          };
        }
      }
    } else {
      // Clicked on empty canvas
      if (e.shiftKey) {
        // Shift+Click: Add a custom field line seed here!
        onAddCustomSeed(world);
      } else {
        // Pan the canvas
        onSelectSource(null);
        dragRef.current = {
          isDragging: true,
          dragType: 'pan',
          targetId: null,
          startX: e.clientX,
          startY: e.clientY,
          initialSourceX: viewTransform.panX,
          initialSourceY: viewTransform.panY,
          initialRotation: 0,
          centerAngleOffset: 0,
        };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.isDragging) return;

    if (dragRef.current.dragType === 'pan') {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setViewTransform((prev) => ({
        ...prev,
        panX: dragRef.current.initialSourceX + dx,
        panY: dragRef.current.initialSourceY + dy,
      }));
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);

    if (dragRef.current.dragType === 'magnet' && dragRef.current.targetId) {
      const dx = world.x - dragRef.current.startX;
      const dy = world.y - dragRef.current.startY;
      onUpdateSource(dragRef.current.targetId, {
        x: Math.round(dragRef.current.initialSourceX + dx),
        y: Math.round(dragRef.current.initialSourceY + dy),
      });
    } else if (dragRef.current.dragType === 'rotate' && dragRef.current.targetId) {
      const source = sources.find((s) => s.id === dragRef.current.targetId);
      if (source) {
        const pointerAngle = Math.atan2(world.y - source.y, world.x - source.x);
        let newRot = pointerAngle - dragRef.current.centerAngleOffset;
        // Snap to 15 degrees if Alt key held
        if (e.altKey) {
          const snap = Math.PI / 12;
          newRot = Math.round(newRot / snap) * snap;
        }
        onUpdateSource(source.id, { rotation: newRot });
      }
    } else if (dragRef.current.dragType === 'probe') {
      onUpdateProbe({
        ...probe,
        x: Math.round(world.x),
        y: Math.round(world.y),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setViewTransform((prev) => {
      const nextZoom = Math.min(2.5, Math.max(0.4, prev.zoom * zoomFactor));
      // Zoom toward cursor
      const newPanX = mouseX - (mouseX - prev.panX) * (nextZoom / prev.zoom);
      const newPanY = mouseY - (mouseY - prev.panY) * (nextZoom / prev.zoom);
      return {
        zoom: nextZoom,
        panX: newPanX,
        panY: newPanY,
      };
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* Canvas Viewport overlay helpers */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-lg">
        <span className="font-mono text-slate-400">Zoom: {(viewTransform.zoom * 100).toFixed(0)}%</span>
        <span className="text-slate-600">·</span>
        <button
          onClick={() => setViewTransform({ panX: 0, panY: 0, zoom: 1 })}
          className="hover:text-white transition-colors underline underline-offset-2"
        >
          Centra Vista
        </button>
        <span className="text-slate-600">·</span>
        <span className="text-slate-500 hidden sm:inline">Shift+Click: Aggiungi linea</span>
      </div>
    </div>
  );
};
