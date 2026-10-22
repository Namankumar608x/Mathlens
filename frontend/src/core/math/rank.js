/**
 * Matrix Rank & Linear Independence Utilities
 * Computes Gaussian elimination (RREF), column spaces, singular values (SVD),
 * collinearity, and linear combination reconstruction for MathLens.
 */

/**
 * Computes Reduced Row Echelon Form (RREF) and Rank of any m x n matrix.
 * @param {number[][]} matrix - 2D numerical array of order m x n
 * @param {number} tol - Numerical zero tolerance
 * @returns {{ rank: number, rref: number[][], pivotCols: number[], steps: string[], isLinearlyDependent: boolean }}
 */
export function computeRREFAndRank(matrix, tol = 1e-5) {
  if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
    return { rank: 0, rref: [], pivotCols: [], steps: [], isLinearlyDependent: false };
  }

  const m = matrix.length;
  const n = matrix[0].length;
  const A = matrix.map(row => [...row]);
  const steps = [];
  const pivotCols = [];

  let lead = 0;
  for (let r = 0; r < m; r++) {
    if (lead >= n) break;

    // Find pivot row
    let pivotRow = r;
    let maxVal = Math.abs(A[r][lead]);
    for (let i = r + 1; i < m; i++) {
      if (Math.abs(A[i][lead]) > maxVal) {
        maxVal = Math.abs(A[i][lead]);
        pivotRow = i;
      }
    }

    if (maxVal < tol) {
      lead++;
      r--; // retry this row with next column
      continue;
    }

    // Swap rows if necessary
    if (pivotRow !== r) {
      const temp = A[r];
      A[r] = A[pivotRow];
      A[pivotRow] = temp;
      steps.push(`Swap Row ${r + 1} with Row ${pivotRow + 1}`);
    }

    // Normalize pivot row
    const pivotVal = A[r][lead];
    for (let c = 0; c < n; c++) {
      A[r][c] = A[r][c] / pivotVal;
      if (Math.abs(A[r][c]) < tol) A[r][c] = 0;
    }
    steps.push(`Scale Row ${r + 1} by 1 / (${pivotVal.toFixed(2)})`);

    // Eliminate other rows
    for (let i = 0; i < m; i++) {
      if (i !== r) {
        const factor = A[i][lead];
        if (Math.abs(factor) > tol) {
          for (let c = 0; c < n; c++) {
            A[i][c] = A[i][c] - factor * A[r][c];
            if (Math.abs(A[i][c]) < tol) A[i][c] = 0;
          }
          steps.push(`Row ${i + 1} ← Row ${i + 1} - (${factor.toFixed(2)}) × Row ${r + 1}`);
        }
      }
    }

    pivotCols.push(lead);
    lead++;
  }

  const rank = pivotCols.length;
  const isLinearlyDependent = rank < n;

  return {
    rank,
    rref: A,
    pivotCols,
    steps,
    isLinearlyDependent
  };
}

/**
 * Computes the SVD and principal singular values for an m x 3 image matrix M.
 * Uses the 3x3 Gram matrix G = M^T * M and solves for eigenvalues of G.
 * @param {number[][]} M - m x 3 matrix (3 column vectors of length m)
 * @returns {{
 *   singularValues: number[],
 *   energyPercentages: number[],
 *   conditionNumber: number,
 *   cosineSimilarity: number[][],
 *   effectiveRank: number,
 *   gramMatrix: number[][]
 * }}
 */
export function computeSVD3Columns(M) {
  if (!M || M.length === 0) {
    return {
      singularValues: [0, 0, 0],
      energyPercentages: [100, 0, 0],
      conditionNumber: 1,
      cosineSimilarity: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      effectiveRank: 0,
      gramMatrix: [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    };
  }

  const m = M.length;
  // Compute G = M^T * M (3x3)
  const G = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let r = 0; r < m; r++) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        G[i][j] += (M[r][i] || 0) * (M[r][j] || 0);
      }
    }
  }

  // Compute Cosine Similarity Matrix S_ij = G_ij / (||v_i|| * ||v_j||)
  const norms = [
    Math.sqrt(Math.max(1e-12, G[0][0])),
    Math.sqrt(Math.max(1e-12, G[1][1])),
    Math.sqrt(Math.max(1e-12, G[2][2]))
  ];

  const cosineSimilarity = [
    [1, G[0][1] / (norms[0] * norms[1]), G[0][2] / (norms[0] * norms[2])],
    [G[1][0] / (norms[1] * norms[0]), 1, G[1][2] / (norms[1] * norms[2])],
    [G[2][0] / (norms[2] * norms[0]), G[2][1] / (norms[2] * norms[1]), 1]
  ];

  // Solve eigenvalues of 3x3 symmetric matrix G using Jacobi rotations
  const eigen = jacobiEigenvalues3x3(G);
  // Sort descending
  const sortedLambdas = [...eigen].sort((a, b) => b - a).map(l => Math.max(0, l));
  const singularValues = sortedLambdas.map(l => Math.sqrt(l));

  const totalVariance = sortedLambdas.reduce((acc, v) => acc + v, 0);
  const energyPercentages = totalVariance > 1e-12
    ? sortedLambdas.map(l => (l / totalVariance) * 100)
    : [100, 0, 0];

  const sMax = singularValues[0] || 1e-12;
  const sMin = singularValues[2] || 0;
  const conditionNumber = sMin > 1e-5 ? sMax / sMin : Infinity;

  // Effective rank with 1% relative threshold
  let effectiveRank = 0;
  for (const s of singularValues) {
    if (s > 0.02 * sMax && s > 1e-3) effectiveRank++;
  }

  return {
    singularValues,
    energyPercentages,
    conditionNumber,
    cosineSimilarity,
    effectiveRank: Math.max(1, effectiveRank),
    gramMatrix: G
  };
}

/**
 * Computes eigenvalues of a 3x3 symmetric real matrix via classical Jacobi eigenvalue algorithm.
 * @param {number[][]} A_in
 * @returns {number[]} 3 real eigenvalues
 */
function jacobiEigenvalues3x3(A_in) {
  // Clone
  const A = [
    [A_in[0][0], A_in[0][1], A_in[0][2]],
    [A_in[1][0], A_in[1][1], A_in[1][2]],
    [A_in[2][0], A_in[2][1], A_in[2][2]]
  ];

  const maxIter = 50;
  for (let iter = 0; iter < maxIter; iter++) {
    // Find largest off-diagonal element
    let p = 0, q = 1;
    let maxOff = Math.abs(A[0][1]);
    if (Math.abs(A[0][2]) > maxOff) {
      maxOff = Math.abs(A[0][2]);
      p = 0; q = 2;
    }
    if (Math.abs(A[1][2]) > maxOff) {
      maxOff = Math.abs(A[1][2]);
      p = 1; q = 2;
    }

    if (maxOff < 1e-9) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    // Perform Givens rotation: A' = J^T * A * J
    const newApp = c * c * app - 2 * s * c * apq + s * s * aqq;
    const newAqq = s * s * app + 2 * s * c * apq + c * c * aqq;
    A[p][p] = newApp;
    A[q][q] = newAqq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let r = 0; r < 3; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p];
        const arq = A[r][q];
        A[r][p] = c * arp - s * arq;
        A[p][r] = A[r][p];
        A[r][q] = s * arp + c * arq;
        A[q][r] = A[r][q];
      }
    }
  }

  return [A[0][0], A[1][1], A[2][2]];
}

/**
 * Checks collinearity of two 2D vectors [x1, y1] and [x2, y2].
 * Returns determinant (cross-product), proportionality factor k if collinear, and boolean.
 */
export function check2DCollinearity(v1, v2, tol = 1e-4) {
  const det = v1[0] * v2[1] - v1[1] * v2[0];
  const mag1Sq = v1[0] * v1[0] + v1[1] * v1[1];
  const mag2Sq = v2[0] * v2[0] + v2[1] * v2[1];

  if (mag1Sq < 1e-8 || mag2Sq < 1e-8) {
    return { isCollinear: true, det: 0, ratio: 0 };
  }

  const isCollinear = Math.abs(det) / Math.sqrt(mag1Sq * mag2Sq) < tol;
  let ratio = null;
  if (isCollinear) {
    ratio = Math.abs(v1[0]) > 0.05 ? v2[0] / v1[0] : v2[1] / v1[1];
  }

  return { isCollinear, det, ratio };
}

/**
 * Solves least-squares weights c1, c2 for linear combination: c1*A + c2*B ≈ C
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @param {number[]} vecC 
 * @returns {{ c1: number, c2: number, errorNorm: number, maxError: number, fidelity: number }}
 */
export function fitLinearCombination2D(vecA, vecB, vecC) {
  let a_dot_a = 0, b_dot_b = 0, a_dot_b = 0;
  let a_dot_c = 0, b_dot_c = 0, c_dot_c = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i], b = vecB[i], c = vecC[i];
    a_dot_a += a * a;
    b_dot_b += b * b;
    a_dot_b += a * b;
    a_dot_c += a * c;
    b_dot_c += b * c;
    c_dot_c += c * c;
  }

  const det = a_dot_a * b_dot_b - a_dot_b * a_dot_b;
  if (Math.abs(det) < 1e-8) {
    return { c1: 0, c2: 0, errorNorm: 1, maxError: 1, fidelity: 0 };
  }

  const c1 = (b_dot_b * a_dot_c - a_dot_b * b_dot_c) / det;
  const c2 = (a_dot_a * b_dot_c - a_dot_b * a_dot_c) / det;

  let sumSqErr = 0;
  let maxError = 0;
  for (let i = 0; i < vecA.length; i++) {
    const recon = c1 * vecA[i] + c2 * vecB[i];
    const diff = Math.abs(vecC[i] - recon);
    sumSqErr += diff * diff;
    if (diff > maxError) maxError = diff;
  }

  const cNorm = Math.sqrt(Math.max(1e-8, c_dot_c));
  const errorNorm = Math.sqrt(sumSqErr) / cNorm;
  const fidelity = Math.max(0, Math.min(100, (1 - errorNorm) * 100));

  return { c1, c2, errorNorm, maxError, fidelity };
}
