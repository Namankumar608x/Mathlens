/**
 * 2x2 Linear Systems & Image Layer Unmixing Utilities
 * Solves AX = B, computes 2x2 matrix inverses, determinants, condition numbers,
 * and handles linear layer blending and separation.
 */

/**
 * Computes the determinant of a 2x2 matrix [[a11, a12], [a21, a22]].
 * @param {number[][]} A 
 * @returns {number}
 */
export function det2x2(A) {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

/**
 * Computes the analytical inverse of a 2x2 matrix.
 * Returns null if the matrix is singular (det ≈ 0).
 * @param {number[][]} A 
 * @param {number} tol 
 * @returns {number[][]|null}
 */
export function invert2x2(A, tol = 1e-6) {
  const d = det2x2(A);
  if (Math.abs(d) < tol) return null;

  return [
    [A[1][1] / d, -A[0][1] / d],
    [-A[1][0] / d, A[0][0] / d]
  ];
}

/**
 * Computes condition number κ(A) for a 2x2 matrix.
 * Large condition numbers indicate near-singularity where inversion amplifies noise.
 * @param {number[][]} A 
 * @returns {number}
 */
export function conditionNumber2x2(A) {
  const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
  // Gram matrix A^T * A
  const g11 = a * a + c * c;
  const g12 = a * b + c * d;
  const g22 = b * b + d * d;

  const trace = g11 + g22;
  const det = g11 * g22 - g12 * g12;
  const disc = Math.max(0, trace * trace - 4 * det);
  const sqrtDisc = Math.sqrt(disc);

  const lambdaMax = (trace + sqrtDisc) / 2;
  const lambdaMin = Math.max(0, (trace - sqrtDisc) / 2);

  const sMax = Math.sqrt(lambdaMax);
  const sMin = Math.sqrt(lambdaMin);

  if (sMin < 1e-7) return Infinity;
  return sMax / sMin;
}

/**
 * Mixes two 2D grayscale image matrices X1 and X2 using mixing matrix A.
 * B1 = a11 * X1 + a12 * X2
 * B2 = a21 * X1 + a22 * X2
 * @param {number[][]} X1 
 * @param {number[][]} X2 
 * @param {number[][]} A 
 * @param {boolean} clampTo8Bit 
 * @returns {{ B1: number[][], B2: number[][] }}
 */
export function mixImageLayers(X1, X2, A, clampTo8Bit = true) {
  const rows = X1.length;
  const cols = X1[0].length;
  const a11 = A[0][0], a12 = A[0][1];
  const a21 = A[1][0], a22 = A[1][1];

  const B1 = Array.from({ length: rows }, () => new Float32Array(cols));
  const B2 = Array.from({ length: rows }, () => new Float32Array(cols));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x1 = X1[r][c];
      const x2 = X2[r][c];
      let b1 = a11 * x1 + a12 * x2;
      let b2 = a21 * x1 + a22 * x2;

      if (clampTo8Bit) {
        b1 = Math.max(0, Math.min(255, Math.round(b1)));
        b2 = Math.max(0, Math.min(255, Math.round(b2)));
      }
      B1[r][c] = b1;
      B2[r][c] = b2;
    }
  }

  return { B1, B2 };
}

/**
 * Solves AX = B for each pixel by applying X = A^(-1) * B.
 * Returns recovered images X1_rec and X2_rec, or null if singular.
 * @param {number[][]} B1 
 * @param {number[][]} B2 
 * @param {number[][]} A 
 * @param {boolean} clampTo8Bit 
 * @returns {{ X1_rec: number[][], X2_rec: number[][], invA: number[][], isSingular: boolean, det: number } | null}
 */
export function unmixImageLayers(B1, B2, A, clampTo8Bit = true) {
  const d = det2x2(A);
  const invA = invert2x2(A);

  if (!invA) {
    return {
      X1_rec: null,
      X2_rec: null,
      invA: null,
      isSingular: true,
      det: d
    };
  }

  const rows = B1.length;
  const cols = B1[0].length;
  const inv11 = invA[0][0], inv12 = invA[0][1];
  const inv21 = invA[1][0], inv22 = invA[1][1];

  const X1_rec = Array.from({ length: rows }, () => new Float32Array(cols));
  const X2_rec = Array.from({ length: rows }, () => new Float32Array(cols));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const b1 = B1[r][c];
      const b2 = B2[r][c];
      let x1 = inv11 * b1 + inv12 * b2;
      let x2 = inv21 * b1 + inv22 * b2;

      if (clampTo8Bit) {
        x1 = Math.max(0, Math.min(255, Math.round(x1)));
        x2 = Math.max(0, Math.min(255, Math.round(x2)));
      }
      X1_rec[r][c] = x1;
      X2_rec[r][c] = x2;
    }
  }

  return {
    X1_rec,
    X2_rec,
    invA,
    isSingular: false,
    det: d
  };
}

/**
 * Computes reconstruction fidelity percentage and mean squared error.
 * @param {number[][]} original 
 * @param {number[][]} recovered 
 * @returns {{ mse: number, fidelity: number }}
 */
export function computeFidelity(original, recovered) {
  if (!original || !recovered) return { mse: 9999, fidelity: 0 };
  const rows = original.length;
  const cols = original[0].length;
  let sumSqErr = 0;
  let maxSq = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const orig = original[r][c];
      const rec = recovered[r][c];
      const diff = orig - rec;
      sumSqErr += diff * diff;
      maxSq += orig * orig;
    }
  }

  const mse = sumSqErr / (rows * cols);
  const relErr = maxSq > 0 ? Math.sqrt(sumSqErr) / Math.sqrt(maxSq) : 0;
  const fidelity = Math.max(0, Math.min(100, Math.round((1 - relErr) * 100)));

  return { mse, fidelity };
}
