/**
 * Mathematical utilities for Vector Norms and Image Distance Metrics
 */

export function l1Norm(vec) {
  return vec.reduce((sum, val) => sum + Math.abs(val), 0);
}

export function l2Norm(vec) {
  const sumSq = vec.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumSq);
}

export function lInfNorm(vec) {
  return vec.reduce((max, val) => Math.max(max, Math.abs(val)), 0);
}

export function lpNorm(vec, p) {
  if (p === 1) return l1Norm(vec);
  if (p === 2) return l2Norm(vec);
  if (p === Infinity) return lInfNorm(vec);
  const sum = vec.reduce((acc, val) => acc + Math.pow(Math.abs(val), p), 0);
  return Math.pow(sum, 1 / p);
}

/**
 * 6 Candidate Functions from the curriculum:
 * 1. l2: N(x, y) = sqrt(x^2 + y^2) (Valid Norm)
 * 2. l1: N(x, y) = |x| + |y| (Valid Norm)
 * 3. linf: N(x, y) = max(|x|, |y|) (Valid Norm)
 * 4. sumSq: N(x, y) = x^2 + y^2 (Not a norm: fails homogeneity)
 * 5. absSum: N(x, y) = |x + y| (Not a norm: fails positive definiteness)
 * 6. prod: N(x, y) = |x * y| (Not a norm: fails positive definiteness & triangle inequality)
 */
export const CANDIDATE_FUNCTIONS = [
  {
    id: 'l2',
    name: 'Euclidean Norm (L₂)',
    formula: 'N(x, y) = \\sqrt{x^2 + y^2}',
    formulaDisplay: 'N(x, y) = √(x² + y²)',
    shape: 'Circle',
    isValidNorm: true,
    eval: (x, y) => Math.sqrt(x * x + y * y),
    axioms: {
      posDef: {
        satisfied: true,
        summary: 'N(x, y) ≥ 0, and N(x, y) = 0 only when x = y = 0.',
        explanation: 'x² + y² is a sum of squares. It is strictly positive for any non-zero coordinate and equals 0 if and only if both x = 0 and y = 0.'
      },
      homogeneity: {
        satisfied: true,
        summary: 'N(c·X) = |c| · N(X) for all scalars c.',
        explanation: '√( (cx)² + (cy)² ) = √( c²(x² + y²) ) = |c| · √(x² + y²). Scales linearly with the magnitude of c.'
      },
      triangle: {
        satisfied: true,
        summary: 'N(X + Y) ≤ N(X) + N(Y) (Triangle Inequality).',
        explanation: 'Follows from the Cauchy-Schwarz inequality. The shortest distance between two points in Euclidean space is a straight line.'
      }
    }
  },
  {
    id: 'l1',
    name: 'Manhattan Norm (L₁)',
    formula: 'N(x, y) = |x| + |y|',
    formulaDisplay: 'N(x, y) = |x| + |y|',
    shape: 'Diamond',
    isValidNorm: true,
    eval: (x, y) => Math.abs(x) + Math.abs(y),
    axioms: {
      posDef: {
        satisfied: true,
        summary: 'N(x, y) ≥ 0, and N(x, y) = 0 only when x = y = 0.',
        explanation: 'Absolute values are always ≥ 0. The sum |x| + |y| = 0 requires both |x| = 0 and |y| = 0, so (x, y) = (0, 0).'
      },
      homogeneity: {
        satisfied: true,
        summary: 'N(c·X) = |c| · N(X) for all scalars c.',
        explanation: '|c·x| + |c·y| = |c|·|x| + |c|·|y| = |c|(|x| + |y|). Scalar multiplication factors out in absolute magnitude.'
      },
      triangle: {
        satisfied: true,
        summary: 'N(X + Y) ≤ N(X) + N(Y) (Triangle Inequality).',
        explanation: 'By standard real absolute value inequality: |x₁ + x₂| ≤ |x₁| + |x₂| and |y₁ + y₂| ≤ |y₁| + |y₂|. Adding both preserves the inequality.'
      }
    }
  },
  {
    id: 'linf',
    name: 'Chebyshev / Max Norm (L_∞)',
    formula: 'N(x, y) = \\max(|x|, |y|)',
    formulaDisplay: 'N(x, y) = max(|x|, |y|)',
    shape: 'Square',
    isValidNorm: true,
    eval: (x, y) => Math.max(Math.abs(x), Math.abs(y)),
    axioms: {
      posDef: {
        satisfied: true,
        summary: 'N(x, y) ≥ 0, and N(x, y) = 0 only when x = y = 0.',
        explanation: 'If max(|x|, |y|) = 0, neither coordinate can be greater than zero, meaning |x| = 0 and |y| = 0.'
      },
      homogeneity: {
        satisfied: true,
        summary: 'N(c·X) = |c| · N(X) for all scalars c.',
        explanation: 'max(|cx|, |cy|) = max(|c||x|, |c||y|) = |c| · max(|x|, |y|).'
      },
      triangle: {
        satisfied: true,
        summary: 'N(X + Y) ≤ N(X) + N(Y) (Triangle Inequality).',
        explanation: 'max(|x₁ + x₂|, |y₁ + y₂|) ≤ max(|x₁| + |x₂|, |y₁| + |y₂|) ≤ max(|x₁|, |y₁|) + max(|x₂|, |y₂|).'
      }
    }
  },
  {
    id: 'sumSq',
    name: 'Sum of Squares',
    formula: 'N(x, y) = x^2 + y^2',
    formulaDisplay: 'N(x, y) = x² + y²',
    shape: 'Circle of radius 1',
    isValidNorm: false,
    eval: (x, y) => x * x + y * y,
    axioms: {
      posDef: {
        satisfied: true,
        summary: 'N(x, y) ≥ 0, and N(x, y) = 0 only for (0, 0).',
        explanation: 'Sum of real squares is non-negative and zero only at the origin.'
      },
      homogeneity: {
        satisfied: false,
        summary: 'FAILS: N(c·X) = c² · N(X) ≠ |c| · N(X).',
        explanation: 'N(c·X) = (cx)² + (cy)² = c²(x² + y²) = c² · N(X). For c = 2, N(2X) = 4·N(X) instead of 2·N(X). Scaling is quadratic rather than linear!',
        counterExample: {
          scalar: 2,
          vector: [1, 0],
          lhs: 4, // N([2, 0]) = 4
          rhs: 2  // |2| * N([1, 0]) = 2
        }
      },
      triangle: {
        satisfied: false,
        summary: 'FAILS: Triangle inequality fails for large vectors.',
        explanation: 'For X = [2, 0] and Y = [2, 0]: N(X + Y) = N([4, 0]) = 16. But N(X) + N(Y) = 4 + 4 = 8. Since 16 > 8, N(X + Y) > N(X) + N(Y)!',
        counterExample: {
          X: [2, 0],
          Y: [2, 0],
          lhs: 16, // N([4, 0])
          rhs: 8   // N(X) + N(Y)
        }
      }
    }
  },
  {
    id: 'absSum',
    name: 'Absolute Sum',
    formula: 'N(x, y) = |x + y|',
    formulaDisplay: 'N(x, y) = |x + y|',
    shape: 'Parallel Lines (x + y = ±1)',
    isValidNorm: false,
    eval: (x, y) => Math.abs(x + y),
    axioms: {
      posDef: {
        satisfied: false,
        summary: 'FAILS: N(X) = 0 for non-zero vectors!',
        explanation: 'For any vector along the line y = -x, such as X = [1, -1]ᵀ, N(1, -1) = |1 + (-1)| = 0. Even though X is a non-zero vector, its candidate "norm" is zero!',
        counterExample: {
          vector: [1, -1],
          result: 0
        }
      },
      homogeneity: {
        satisfied: true,
        summary: 'N(c·X) = |c(x + y)| = |c|·|x + y| = |c|·N(X).',
        explanation: 'Scalar factoring holds, but fails positive definiteness.'
      },
      triangle: {
        satisfied: true,
        summary: '| (x₁ + x₂) + (y₁ + y₂) | ≤ |x₁ + y₁| + |x₂ + y₂|.',
        explanation: 'Triangle inequality holds (this function is a seminorm, not a norm).'
      }
    }
  },
  {
    id: 'prod',
    name: 'Absolute Coordinate Product',
    formula: 'N(x, y) = |xy|',
    formulaDisplay: 'N(x, y) = |x · y|',
    shape: 'Hyperbolas (|xy| = 1)',
    isValidNorm: false,
    eval: (x, y) => Math.abs(x * y),
    axioms: {
      posDef: {
        satisfied: false,
        summary: 'FAILS: N(X) = 0 on entire coordinate axes!',
        explanation: 'For any point on the x-axis or y-axis (e.g. X = [1, 0]ᵀ or [0, 5]ᵀ), N(x, y) = |x · 0| = 0. Non-zero vectors have zero length!',
        counterExample: {
          vector: [1, 0],
          result: 0
        }
      },
      homogeneity: {
        satisfied: false,
        summary: 'FAILS: N(c·X) = c²·|xy| ≠ |c|·|xy|.',
        explanation: 'N(cx, cy) = |(cx)(cy)| = c²|xy| = c²·N(X). Quadratic scaling violates absolute homogeneity!',
        counterExample: {
          scalar: 2,
          vector: [1, 1],
          lhs: 4, // N([2, 2]) = 4
          rhs: 2  // 2 * N([1, 1]) = 2
        }
      },
      triangle: {
        satisfied: false,
        summary: 'FAILS: N(X + Y) can exceed N(X) + N(Y).',
        explanation: 'For X = [1, 0] and Y = [0, 1]: N(X) = 0 and N(Y) = 0. But X + Y = [1, 1], so N(X + Y) = 1. Since 1 > 0 + 0, triangle inequality is broken!',
        counterExample: {
          X: [1, 0],
          Y: [0, 1],
          lhs: 1, // N([1, 1])
          rhs: 0  // 0 + 0
        }
      }
    }
  }
];

/**
 * 3x3 Image Difference Matrix Calculation
 */
export function computeImageDiff(origMat, modMat) {
  const rows = origMat.length;
  const cols = origMat[0].length;
  const diff = [];
  const flatDiff = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const d = Math.abs(modMat[r][c] - origMat[r][c]);
      row.push(d);
      flatDiff.push(d);
    }
    diff.push(row);
  }

  const norm1 = l1Norm(flatDiff);
  const norm2 = l2Norm(flatDiff);
  const normInf = lInfNorm(flatDiff);

  return {
    diff,
    flatDiff,
    norm1,
    norm2,
    normInf
  };
}

/**
 * Presets for the 3x3 Image Exercise
 */
export const IMAGE_ERROR_PRESETS = [
  {
    id: 'large',
    label: '1. One Large Change',
    badge: 'Concentrated Error',
    description: 'Increase the central pixel intensity by +80 (from 40 to 120). All other 8 pixels remain unchanged.',
    apply: () => [
      [40, 40, 40],
      [40, 120, 40],
      [40, 40, 40]
    ],
    expected: {
      l1: 80,
      l2: 80,
      linf: 80,
      relation: 'L₁ = L₂ = L_∞ = 80',
      insight: 'When exactly one pixel changes, all p-norms yield the exact same value. The Euclidean norm and max norm equal the single absolute change.'
    }
  },
  {
    id: 'four-small',
    label: '2. Four Small Changes',
    badge: 'Distributed (Cross)',
    description: 'Increase 4 cross pixels by +20 each (from 40 to 60). Central and corner pixels remain 40.',
    apply: () => [
      [40, 60, 40],
      [60, 40, 60],
      [40, 60, 40]
    ],
    expected: {
      l1: 80,
      l2: 40,
      linf: 20,
      relation: 'L₁ > L₂ > L_∞ (80 > 40 > 20)',
      insight: 'Notice L₁ = 80 is identical to Case 1! However, L₂ drops from 80 to 40, and L_∞ drops to 20. Distributing error across multiple pixels dramatically reduces peak distortion.'
    }
  },
  {
    id: 'all-pixels',
    label: '3. All Pixels Change',
    badge: 'Uniform Shift',
    description: 'Increase all 9 pixels by +10 each (from 40 to 50). Represents mild global ambient brightening.',
    apply: () => [
      [50, 50, 50],
      [50, 50, 50],
      [50, 50, 50]
    ],
    expected: {
      l1: 90,
      l2: 30,
      linf: 10,
      relation: 'L₁ > L₂ > L_∞ (90 > 30 > 10)',
      insight: 'L₁ is highest (90), but L_∞ is very small (10). A global shift produces high cumulative L₁ error, but negligible peak deviation.'
    }
  },
  {
    id: 'none',
    label: '4. No Change',
    badge: 'Identity / Zero Difference',
    description: 'Original image is unchanged. Difference matrix is entirely zero.',
    apply: () => [
      [40, 40, 40],
      [40, 40, 40],
      [40, 40, 40]
    ],
    expected: {
      l1: 0,
      l2: 0,
      linf: 0,
      relation: 'L₁ = L₂ = L_∞ = 0',
      insight: 'By positive definiteness of all norms, ||D|| = 0 if and only if the difference matrix is identically zero.'
    }
  }
];
