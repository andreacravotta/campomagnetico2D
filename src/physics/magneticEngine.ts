import {
  MagneticSource,
  Vector2D,
  VisualSettings,
  FieldLine,
  FieldLinePoint,
} from '../types/physics';

const EPSILON_SQ = 64; // softening parameter squared to avoid division by zero near poles
const FIELD_SCALE = 8000;

export interface PoleCharge {
  x: number;
  y: number;
  charge: number; // positive = North, negative = South
}

/**
 * Returns the effective pole charges representing the magnetic source
 */
export function getSourcePoleCharges(source: MagneticSource): PoleCharge[] {
  const charges: PoleCharge[] = [];
  const cos = Math.cos(source.rotation);
  const sin = Math.sin(source.rotation);

  if (source.type === 'bar') {
    const halfW = source.width / 2;
    const halfH = source.height / 2;
    const numPoints = 7;
    const baseStrength = source.strength * (source.flipped ? -1 : 1);

    // North pole face (along +X local) and South pole face (along -X local)
    for (let i = 0; i < numPoints; i++) {
      const t = (i / (numPoints - 1) - 0.5) * 2; // -1 to 1
      const localY = t * (halfH - 2);

      // North pole (positive charge)
      const nxLocal = halfW;
      const nxGlobal = source.x + nxLocal * cos - localY * sin;
      const nyGlobal = source.y + nxLocal * sin + localY * cos;
      charges.push({
        x: nxGlobal,
        y: nyGlobal,
        charge: (baseStrength * 1.0) / numPoints,
      });

      // South pole (negative charge)
      const sxLocal = -halfW;
      const sxGlobal = source.x + sxLocal * cos - localY * sin;
      const syGlobal = source.y + sxLocal * sin + localY * cos;
      charges.push({
        x: sxGlobal,
        y: syGlobal,
        charge: (-baseStrength * 1.0) / numPoints,
      });
    }
  } else if (source.type === 'horseshoe') {
    const baseStrength = source.strength * (source.flipped ? -1 : 1);
    const halfH = source.height / 2;
    const halfW = source.width / 2;
    const Ro = halfW;
    const armThickness = source.armThickness;
    const Ri = Math.max(10, halfW - armThickness);
    const yc = -halfH + Ro;
    const numPoints = 6;

    // Tips of the U-magnet:
    // Left tip: North pole (when not flipped)
    // Right tip: South pole (when not flipped)
    const leftArmCenterX = -(halfW + Ri) / 2;
    const rightArmCenterX = (halfW + Ri) / 2;
    const tipY = halfH;
    const tipWidth = halfW - Ri;

    for (let i = 0; i < numPoints; i++) {
      const t = (i / (numPoints - 1) - 0.5); // -0.5 to 0.5
      const localOffsetX = t * tipWidth * 0.85;

      // Left tip (North)
      const lx = leftArmCenterX + localOffsetX;
      const ly = tipY;
      const lGlobalX = source.x + lx * cos - ly * sin;
      const lGlobalY = source.y + lx * sin + ly * cos;
      charges.push({
        x: lGlobalX,
        y: lGlobalY,
        charge: (baseStrength * 1.2) / numPoints,
      });

      // Right tip (South)
      const rx = rightArmCenterX + localOffsetX;
      const ry = tipY;
      const rGlobalX = source.x + rx * cos - ry * sin;
      const rGlobalY = source.y + rx * sin + ry * cos;
      charges.push({
        x: rGlobalX,
        y: rGlobalY,
        charge: (-baseStrength * 1.2) / numPoints,
      });
    }

    // Add mild continuous polarization along the U-bend arch
    const bendPoints = 5;
    const rMid = (Ro + Ri) / 2;
    for (let j = 0; j < bendPoints; j++) {
      const angle = Math.PI + (j / (bendPoints - 1)) * Math.PI; // pi to 2pi (negative y)
      const bx = Math.cos(angle) * rMid;
      const by = yc + Math.sin(angle) * rMid;
      const bGlobalX = source.x + bx * cos - by * sin;
      const bGlobalY = source.y + bx * sin + by * cos;
      // Slight dipole return field along the ferromagnetic yoke
      charges.push({
        x: bGlobalX,
        y: bGlobalY,
        charge: (baseStrength * -0.06) / bendPoints,
      });
    }
  }

  return charges;
}

/**
 * Calculates total magnetic field B = (Bx, By) at (x, y)
 */
export function calculateMagneticField(
  x: number,
  y: number,
  sources: MagneticSource[]
): Vector2D {
  let bx = 0;
  let by = 0;

  for (const source of sources) {
    if (source.type === 'bar' || source.type === 'horseshoe') {
      const charges = getSourcePoleCharges(source);
      for (const p of charges) {
        const dx = x - p.x;
        const dy = y - p.y;
        const distSq = dx * dx + dy * dy + EPSILON_SQ;
        const dist = Math.sqrt(distSq);
        const invDist3 = (p.charge * FIELD_SCALE) / (distSq * dist);
        bx += dx * invDist3;
        by += dy * invDist3;
      }
    } else if (source.type === 'wire') {
      const current = source.strength * source.currentDirection * (source.flipped ? -1 : 1);
      const dx = x - source.x;
      const dy = y - source.y;
      const distSq = dx * dx + dy * dy + 40;
      // B = (mu0 * I / (2 * pi * r)) in direction z x r = (-dy, dx)
      const factor = (current * FIELD_SCALE * 0.45) / distSq;
      bx += -dy * factor;
      by += dx * factor;
    } else if (source.type === 'coil') {
      // Coil represented as two opposing wires separated along the axis
      const cos = Math.cos(source.rotation);
      const sin = Math.sin(source.rotation);
      const r = source.radius;
      const current = source.strength * source.turns * (source.flipped ? -1 : 1);

      // Top wire (current out) and bottom wire (current in)
      const w1x = source.x - r * sin;
      const w1y = source.y + r * cos;
      const w2x = source.x + r * sin;
      const w2y = source.y - r * cos;

      const d1x = x - w1x;
      const d1y = y - w1y;
      const distSq1 = d1x * d1x + d1y * d1y + 36;
      const factor1 = (current * FIELD_SCALE * 0.28) / distSq1;
      bx += -d1y * factor1;
      by += d1x * factor1;

      const d2x = x - w2x;
      const d2y = y - w2y;
      const distSq2 = d2x * d2x + d2y * d2y + 36;
      const factor2 = (-current * FIELD_SCALE * 0.28) / distSq2;
      bx += -d2y * factor2;
      by += d2x * factor2;
    }
  }

  return { x: bx, y: by };
}

/**
 * Checks if a point is inside any solid magnet body
 */
export function isPointInsideMagnet(x: number, y: number, source: MagneticSource): boolean {
  const cos = Math.cos(-source.rotation);
  const sin = Math.sin(-source.rotation);
  const dx = x - source.x;
  const dy = y - source.y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;

  if (source.type === 'bar') {
    return Math.abs(lx) <= source.width / 2 + 2 && Math.abs(ly) <= source.height / 2 + 2;
  }
  if (source.type === 'horseshoe') {
    const halfW = source.width / 2;
    const halfH = source.height / 2;
    const Ro = halfW;
    const armThickness = source.armThickness;
    const Ri = Math.max(10, halfW - armThickness);
    const yc = -halfH + Ro;

    // Check overall bounding box first
    if (Math.abs(lx) > halfW + 2 || ly > halfH + 2 || ly < -halfH - 2) return false;

    // Straight legs region (yc <= ly <= halfH)
    if (ly >= yc) {
      const inLeftLeg = lx >= -halfW - 2 && lx <= -Ri + 2;
      const inRightLeg = lx >= Ri - 2 && lx <= halfW + 2;
      return inLeftLeg || inRightLeg;
    }

    // Curved bottom arch region (ly < yc)
    const distSq = lx * lx + (ly - yc) * (ly - yc);
    const dist = Math.sqrt(distSq);
    return dist >= Ri - 2 && dist <= Ro + 2;
  }
  if (source.type === 'wire') {
    return dx * dx + dy * dy < source.radius * source.radius;
  }
  if (source.type === 'coil') {
    return false; // open loop
  }
  return false;
}

/**
 * Generates seed coordinates for field lines around sources
 */
export function generateSeedPoints(
  sources: MagneticSource[],
  density: number,
  canvasWidth: number,
  canvasHeight: number
): Vector2D[] {
  const seeds: Vector2D[] = [];
  const countPerPole = Math.max(8, Math.round(14 * (density / 100)));

  for (const source of sources) {
    const cos = Math.cos(source.rotation);
    const sin = Math.sin(source.rotation);

    if (source.type === 'bar') {
      const halfW = source.width / 2;
      const halfH = source.height / 2;
      const forwardDir = source.flipped ? -1 : 1;

      // Seeds from North pole face
      const nFaceX = halfW * forwardDir;
      for (let i = 0; i < countPerPole; i++) {
        const t = (i / (countPerPole - 1) - 0.5) * 2;
        const ly = t * (halfH - 2);
        const lx = nFaceX + 4 * forwardDir;
        const gx = source.x + lx * cos - ly * sin;
        const gy = source.y + lx * sin + ly * cos;
        seeds.push({ x: gx, y: gy });
      }

      // Lateral edge seeds near North pole for wider loops
      const sideCount = Math.floor(countPerPole / 3);
      for (let i = 0; i < sideCount; i++) {
        const offset = (i + 1) * (halfW * 0.4 / (sideCount + 1));
        const lx = (halfW - offset) * forwardDir;
        // Top edge
        const gxTop = source.x + lx * cos - (halfH + 3) * sin;
        const gyTop = source.y + lx * sin + (halfH + 3) * cos;
        seeds.push({ x: gxTop, y: gyTop });

        // Bottom edge
        const gxBot = source.x + lx * cos - (-halfH - 3) * sin;
        const gyBot = source.y + lx * sin + (-halfH - 3) * cos;
        seeds.push({ x: gxBot, y: gyBot });
      }
    } else if (source.type === 'horseshoe') {
      const halfH = source.height / 2;
      const halfW = source.width / 2;
      const Ro = halfW;
      const armThickness = source.armThickness;
      const Ri = Math.max(10, halfW - armThickness);
      const isFlipped = source.flipped;

      const nArmX = isFlipped ? (halfW + Ri) / 2 : -(halfW + Ri) / 2;
      const sArmX = isFlipped ? -(halfW + Ri) / 2 : (halfW + Ri) / 2;

      // Seeds across North tip face
      for (let i = 0; i < countPerPole; i++) {
        const t = (i / (countPerPole - 1) - 0.5);
        const lx = nArmX + t * (armThickness * 0.85);
        const ly = halfH + 4;
        const gx = source.x + lx * cos - ly * sin;
        const gy = source.y + lx * sin + ly * cos;
        seeds.push({ x: gx, y: gy });
      }

      // Gap seeds directly bridging N to S
      const gapCount = Math.floor(countPerPole * 0.7);
      for (let i = 0; i < gapCount; i++) {
        const t = (i + 1) / (gapCount + 1);
        const lx = nArmX * (1 - t) + sArmX * t;
        const ly = halfH - 12;
        const gx = source.x + lx * cos - ly * sin;
        const gy = source.y + lx * sin + ly * cos;
        seeds.push({ x: gx, y: gy });
      }

      // Seeds along the outer curve for magnetic return loop
      const bendSeeds = 6;
      const yc = -halfH + Ro;
      for (let i = 0; i < bendSeeds; i++) {
        const ang = Math.PI + ((i + 1) / (bendSeeds + 1)) * Math.PI;
        const lx = Math.cos(ang) * (Ro + 4);
        const ly = yc + Math.sin(ang) * (Ro + 4);
        const gx = source.x + lx * cos - ly * sin;
        const gy = source.y + lx * sin + ly * cos;
        seeds.push({ x: gx, y: gy });
      }
    } else if (source.type === 'wire') {
      // Concentric circles of seeds
      const ringRadii = [28, 48, 75, 115, 170];
      for (const r of ringRadii) {
        const numSeedsInRing = Math.max(4, Math.round(8 * (r / 50)));
        for (let i = 0; i < numSeedsInRing; i++) {
          const ang = (i / numSeedsInRing) * Math.PI * 2;
          seeds.push({
            x: source.x + Math.cos(ang) * r,
            y: source.y + Math.sin(ang) * r,
          });
        }
      }
    } else if (source.type === 'coil') {
      const ringRadii = [25, 45, 75, 120];
      for (const r of ringRadii) {
        const numSeeds = 6;
        for (let i = 0; i < numSeeds; i++) {
          const ang = (i / numSeeds) * Math.PI * 2;
          seeds.push({
            x: source.x + Math.cos(ang) * r,
            y: source.y + Math.sin(ang) * r,
          });
        }
      }
    }
  }

  // Filter seeds that fall inside solid magnets or outside canvas
  return seeds.filter((s) => {
    if (s.x < -100 || s.x > canvasWidth + 100 || s.y < -100 || s.y > canvasHeight + 100) return false;
    for (const src of sources) {
      if (isPointInsideMagnet(s.x, s.y, src)) return false;
    }
    return true;
  });
}

/**
 * Traces a magnetic field line from a seed point using 4th-order Runge-Kutta (RK4)
 */
export function traceFieldLine(
  seed: Vector2D,
  sources: MagneticSource[],
  settings: VisualSettings,
  canvasWidth: number,
  canvasHeight: number,
  direction: 1 | -1 = 1 // 1 = forward (along B), -1 = backward
): FieldLinePoint[] {
  const points: FieldLinePoint[] = [];
  let currX = seed.x;
  let currY = seed.y;
  const stepSize = settings.fieldLineStepSize || 5;
  const maxSteps = settings.maxLineSteps || 250;
  const margin = 120;

  for (let step = 0; step < maxSteps; step++) {
    const field = calculateMagneticField(currX, currY, sources);
    const magSq = field.x * field.x + field.y * field.y;
    if (magSq < 1e-7) break; // negligible field

    const mag = Math.sqrt(magSq);
    points.push({
      x: currX,
      y: currY,
      bx: field.x,
      by: field.y,
      magnitude: mag,
    });

    // RK4 integration step
    const getUnitVector = (x: number, y: number): Vector2D => {
      const f = calculateMagneticField(x, y, sources);
      const m = Math.sqrt(f.x * f.x + f.y * f.y);
      if (m < 1e-7) return { x: 0, y: 0 };
      return {
        x: (f.x / m) * direction,
        y: (f.y / m) * direction,
      };
    };

    const h = stepSize;
    const k1 = getUnitVector(currX, currY);
    const k2 = getUnitVector(currX + 0.5 * h * k1.x, currY + 0.5 * h * k1.y);
    const k3 = getUnitVector(currX + 0.5 * h * k2.x, currY + 0.5 * h * k2.y);
    const k4 = getUnitVector(currX + h * k3.x, currY + h * k3.y);

    const nextX = currX + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
    const nextY = currY + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);

    // Bounds check
    if (
      nextX < -margin ||
      nextX > canvasWidth + margin ||
      nextY < -margin ||
      nextY > canvasHeight + margin
    ) {
      break;
    }

    // Magnet collision check: stop if line enters magnet body
    let collided = false;
    for (const src of sources) {
      if (isPointInsideMagnet(nextX, nextY, src)) {
        collided = true;
        break;
      }
    }
    if (collided) break;

    currX = nextX;
    currY = nextY;
  }

  return points;
}

/**
 * Traces both forward and backward to form a complete continuous field line
 */
export function traceFullFieldLine(
  seed: Vector2D,
  sources: MagneticSource[],
  settings: VisualSettings,
  canvasWidth: number,
  canvasHeight: number,
  id: string
): FieldLine | null {
  const forwardPts = traceFieldLine(seed, sources, settings, canvasWidth, canvasHeight, 1);
  const backwardPts = traceFieldLine(seed, sources, settings, canvasWidth, canvasHeight, -1);

  if (forwardPts.length + backwardPts.length < 4) return null;

  // Combine: reversed backward points + seed + forward points
  const combined: FieldLinePoint[] = [];
  for (let i = backwardPts.length - 1; i > 0; i--) {
    combined.push(backwardPts[i]);
  }
  combined.push(...forwardPts);

  return {
    id,
    points: combined,
  };
}

export interface IronFiling {
  x: number;
  y: number;
  length: number;
  angle: number;
  opacity: number;
}

/**
 * Generates microscopic iron filings distributed randomly across canvas
 */
export function generateIronFilings(
  width: number,
  height: number,
  count: number = 3200
): { x: number; y: number; baseLength: number }[] {
  const filings: { x: number; y: number; baseLength: number }[] = [];
  for (let i = 0; i < count; i++) {
    filings.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseLength: 4 + Math.random() * 5,
    });
  }
  return filings;
}
