/**
 * 2D Coordinate Transformation Engine (X' = AX)
 */

export function transformPoint(matrix2x2, point) {
  const a = matrix2x2 && typeof matrix2x2.a === 'number' && !isNaN(matrix2x2.a) ? matrix2x2.a : 1;
  const b = matrix2x2 && typeof matrix2x2.b === 'number' && !isNaN(matrix2x2.b) ? matrix2x2.b : 0;
  const c = matrix2x2 && typeof matrix2x2.c === 'number' && !isNaN(matrix2x2.c) ? matrix2x2.c : 0;
  const d = matrix2x2 && typeof matrix2x2.d === 'number' && !isNaN(matrix2x2.d) ? matrix2x2.d : 1;
  
  const { x, y } = point;
  return {
    x: a * x + b * y,
    y: c * x + d * y,
  };
}

export function getRotationMatrix(angleInDegrees) {
  const rad = (angleInDegrees * Math.PI) / 180;
  return {
    a: Math.cos(rad),
    b: -Math.sin(rad),
    c: Math.sin(rad),
    d: Math.cos(rad),
  };
}

export function getScalingMatrix(sx, sy) {
  return { a: sx, b: 0, c: 0, d: sy };
}

export function getShearMatrix(kx, ky) {
  return { a: 1, b: kx, c: ky, d: 1 };
}
