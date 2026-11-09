export type SourceType = 'bar' | 'horseshoe' | 'wire' | 'coil';

export interface BaseSource {
  id: string;
  type: SourceType;
  x: number;
  y: number;
  rotation: number; // in radians
  strength: number; // multiplier (positive, can be negative if inverted)
  flipped: boolean; // whether N and S poles are swapped
  label?: string;
}

export interface BarMagnetSource extends BaseSource {
  type: 'bar';
  width: number; // length along magnetic axis (e.g. 140)
  height: number; // thickness perpendicular to axis (e.g. 40)
}

export interface HorseshoeMagnetSource extends BaseSource {
  type: 'horseshoe';
  width: number; // overall width (e.g. 130)
  height: number; // overall height (e.g. 140)
  gap: number; // distance between N and S tips (e.g. 46)
  armThickness: number; // thickness of arms (e.g. 26)
}

export interface WireSource extends BaseSource {
  type: 'wire';
  radius: number; // visual radius (e.g. 18)
  currentDirection: 1 | -1; // 1 = out of page (dot), -1 = into page (cross)
}

export interface CoilSource extends BaseSource {
  type: 'coil';
  radius: number; // loop radius (e.g. 45)
  turns: number; // number of turns (e.g. 5)
}

export type MagneticSource = BarMagnetSource | HorseshoeMagnetSource | WireSource | CoilSource;

export type VectorDisplayMode = 'none' | 'needles' | 'arrows' | 'filings';

export interface VisualSettings {
  showFieldLines: boolean;
  fieldLineDensity: number; // multiplier for seeds (e.g. 12 to 32 per pole)
  fieldLineStepSize: number; // integration step in pixels (e.g. 4 to 8)
  maxLineSteps: number; // max integration steps per line (e.g. 280)
  animatedFlow: boolean; // animate dash flow along lines
  
  vectorMode: VectorDisplayMode;
  vectorGridSpacing: number; // spacing in pixels between grid points (e.g. 26 to 60)
  colorByMagnitude: boolean;
  
  showHeatmap: boolean;
  heatmapOpacity: number;
  
  showEquipotential: boolean;
  
  showProbe: boolean;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface FieldLinePoint {
  x: number;
  y: number;
  bx: number;
  by: number;
  magnitude: number;
}

export interface FieldLine {
  id: string;
  points: FieldLinePoint[];
}

export interface FieldProbe {
  x: number;
  y: number;
  active: boolean;
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  sources: MagneticSource[];
}
