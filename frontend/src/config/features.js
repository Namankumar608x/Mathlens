import {
  Eye,
  Grid,
  Sun,
  Box,
  Layers,
  Sliders,
  Compass,
  Blend,
  Scissors,
  Scan,
  Activity,
  Maximize2,
  Undo2,
  ZoomIn,
  BookOpen,
  Info,
  Sparkles,
  Lock,
  FlaskConical,
  Binary,
  Cpu,
  Variable,
  FunctionSquare,
  Network
} from 'lucide-react';

export const CATEGORIES = [
  {
    id: 'pixel-matrix',
    label: 'Pixel & Matrix',
    shortLabel: 'Pixels',
    description: 'Foundations of 2D arrays, pixel values, and RGB color tensors',
    icon: Grid,
    color: '#22D3EE' // Electric Cyan
  },
  {
    id: 'transformations',
    label: 'Transformations',
    shortLabel: 'Transforms',
    description: '2D linear coordinate mapping, rotation, shearing, and reflection',
    icon: Compass,
    color: '#8B5CF6' // Purple
  },
  {
    id: 'visual-labs',
    label: 'Visual Labs',
    shortLabel: 'Visual Labs',
    description: 'Interactive visual experiments: blending, detection, inversion, determinants, and scaling',
    icon: Blend,
    color: '#06B6D4' // Cyan / Teal
  }
];

export const FEATURES = [
  // Category 1: Pixel & Matrix (Steps 01 - 06)
  {
    id: 'small-grayscale',
    stepNumber: 1,
    slug: 'small-grayscale',
    title: 'From Pixels to Matrices',
    shortTitle: 'Small Grayscale',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Eye,
    formula: 'I(x, y) \\in [0, 255] \\subset \\mathbb{Z}',
    summary: 'A digital image is fundamentally a 2D numerical array. Explore 4×4 and 8×8 pixel grids side-by-side with numerical matrices.',
    concepts: ['Numerical Array', 'Pixel Intensity', '0 = Black', '255 = White'],
    keywords: ['grayscale', 'pixels', 'matrix', 'intensity', 'black', 'white', 'array']
  },
  {
    id: 'cell-editing',
    stepNumber: 2,
    slug: 'cell-editing',
    title: 'Change Individual Matrix Elements',
    shortTitle: 'Cell Editing',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Grid,
    formula: 'A_{i,j} \\leftarrow v, \\quad v \\in [0, 255]',
    summary: 'Directly modify numerical matrix entries to witness instantaneous real-time pixel transitions on the rendered canvas.',
    concepts: ['Real-Time Rendering', 'Array Mutation', 'Interactive State'],
    keywords: ['cell editing', 'modify', 'matrix elements', 'interactive', 'input']
  },
  {
    id: 'scalar-brightness',
    stepNumber: 3,
    slug: 'scalar-brightness',
    title: 'Scalar Multiplication & Brightness',
    shortTitle: 'Scalar Brightness',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Sun,
    formula: "A' = \\min(255, \\max(0, k \\cdot A))",
    summary: 'Multiplying an image matrix by a scalar k brightens (k > 1) or darkens (k < 1) every pixel simultaneously, clipping at 255.',
    concepts: ['Scalar Multiplication', 'Brightness Scaling', 'Threshold Clamping'],
    keywords: ['scalar', 'brightness', 'multiply', 'darken', 'clipping', 'gain']
  },
  {
    id: 'rgb-pixel',
    stepNumber: 4,
    slug: 'rgb-pixel',
    title: 'Single RGB Pixel as a 3D Vector',
    shortTitle: 'RGB Pixel',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Box,
    formula: '\\vec{p} = [R, G, B]^T \\in \\mathbb{R}^3, \\quad 0 \\le R,G,B \\le 255',
    summary: 'A color pixel is a 3-component mathematical vector. Mix pure Red, Green, and Blue channels to construct any composite color.',
    concepts: ['3D Vector Space', 'Additive Color Mixing', 'RGB Triplet'],
    keywords: ['rgb', 'color pixel', 'vector', 'red', 'green', 'blue', 'additive']
  },
  {
    id: 'rgb-channels',
    stepNumber: 5,
    slug: 'rgb-channels',
    title: 'RGB Channel Matrices Decomposition',
    shortTitle: 'RGB Channels',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Layers,
    formula: '\\mathcal{I} = (M_R, M_G, M_B) \\in \\mathbb{R}^{H \\times W \\times 3}',
    summary: 'A digital color image is three stacked 2D matrices (Red, Green, Blue planes). Decompose and inspect each channel individually.',
    concepts: ['3D Tensor Decomposition', 'Color Planes', 'Image Synthesis'],
    keywords: ['channels', 'rgb matrices', 'planes', 'red matrix', 'green matrix', 'blue matrix']
  },
  {
    id: 'rgb-brightness',
    stepNumber: 6,
    slug: 'rgb-brightness',
    title: 'Multi-Channel Scalar Operations',
    shortTitle: 'RGB Brightness',
    category: 'pixel-matrix',
    categoryLabel: 'Pixel & Matrix',
    icon: Sliders,
    formula: "R' = kR, \\quad G' = kG, \\quad B' = kB",
    summary: 'Apply scalar multiplication across all three color channels simultaneously in a complete image processing pipeline.',
    concepts: ['Multi-channel Scaling', 'Color Saturation', 'Pipeline Processing'],
    keywords: ['rgb brightness', 'multi channel', 'pipeline', 'color scaling']
  },

  // Category 2: Transformations (Step 07)
  {
    id: '2d-transforms',
    stepNumber: 7,
    slug: '2d-transforms',
    title: '2D Coordinate Geometric Transformations',
    shortTitle: '2D Transformations',
    category: 'transformations',
    categoryLabel: 'Transformations',
    icon: Compass,
    formula: "X' = A \\cdot X, \\quad \\begin{bmatrix} x' \\\\ y' \\end{bmatrix} = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} \\begin{bmatrix} x \\\\ y \\end{bmatrix}",
    summary: 'Transform 2D geometric shapes and images using 2×2 linear matrices: Rotation, Uniform Scaling, Reflection, and Shearing.',
    concepts: ['Linear Mapping', 'Coordinate Transformation', 'Rotation & Shear'],
    keywords: ['transforms', '2d matrix', 'rotation', 'shear', 'scale', 'reflection', 'geometry']
  },

  // Category 3: Visual Labs (Steps 08 - 14)
  {
    id: 'matrix-blending',
    stepNumber: 8,
    slug: 'matrix-blending',
    title: 'Matrix Blending',
    shortTitle: 'Matrix Blending',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Blend,
    formula: 'C = \\alpha A + (1 - \\alpha) B',
    summary: 'Combine two images of identical dimensions using matrix addition: explore direct summation, alpha blending, and saturation overflow.',
    concepts: ['Element-wise Addition', 'Alpha Blending', 'Double Exposure', 'Convex Combination'],
    keywords: ['matrix blending', 'addition', 'blend', 'alpha', 'superposition', 'combine']
  },
  {
    id: 'background-detection',
    stepNumber: 9,
    slug: 'background-detection',
    title: 'Background Detection',
    shortTitle: 'Background Detection',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Scissors,
    formula: 'D = |I - B|',
    summary: 'Subtract a static background matrix B from a live video frame I: isolate moving subjects and extract foreground motion masks.',
    concepts: ['Matrix Subtraction', 'Motion Detection', 'Foreground Extraction', 'Delta Segmentation'],
    keywords: ['background detection', 'subtraction', 'motion', 'surveillance', 'foreground', 'delta']
  },
  {
    id: 'change-detection',
    stepNumber: 10,
    slug: 'change-detection',
    title: 'Change Detection',
    shortTitle: 'Change Detection',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Scan,
    formula: 'D = |A_{test} - A_{ref}|',
    summary: 'Automated manufacturing quality inspection: subtract test parts from a golden reference template to reveal microscopic fabrication anomalies.',
    concepts: ['Anomaly Detection', 'Difference Heatmap', 'Industrial Inspection', 'Tolerancing'],
    keywords: ['change detection', 'defect', 'quality control', 'anomaly', 'difference', 'chip']
  },
  {
    id: 'image-inversion',
    stepNumber: 11,
    slug: 'image-inversion',
    title: 'Image Inversion',
    shortTitle: 'Image Inversion',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Activity,
    formula: "A' = 255 - A",
    summary: 'Matrix complementation: subtract every pixel value from 255 to create negative film transformations and enhance medical radiography contrast.',
    concepts: ['Matrix Negation', 'Complement Arithmetic', 'Medical Radiography', 'Inversion Curve'],
    keywords: ['image inversion', 'negative', 'xray', 'complement', 'contrast', 'invert']
  },
  {
    id: 'determinant-lab',
    stepNumber: 12,
    slug: 'determinant-lab',
    title: 'Determinant Lab',
    shortTitle: 'Determinant Lab',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Maximize2,
    formula: '\\det(A) = ad - bc',
    summary: 'The determinant measures 2D signed area scaling. Explore expansion, contraction, orientation inversion, and 2D singularity into a 1D line.',
    concepts: ['Area Scaling Factor', 'Orientation Flipping', 'Singularity & Degeneracy', 'Volume Factor'],
    keywords: ['determinant lab', 'area scaling', 'singularity', 'collapse', 'orientation', 'det']
  },
  {
    id: 'matrix-inverse',
    stepNumber: 13,
    slug: 'matrix-inverse',
    title: 'Matrix Inverse',
    shortTitle: 'Matrix Inverse',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: Undo2,
    formula: 'X = A^{-1} X\', \\quad A \\cdot A^{-1} = I',
    summary: 'The matrix inverse reverses a forward linear map. Understand how original coordinates are reconstructed and when matrices are non-invertible.',
    concepts: ['Inverse Matrix', 'Identity Preservation', 'Non-Invertibility Condition', 'Linear Reconstruction'],
    keywords: ['matrix inverse', 'undo', 'identity matrix', 'reconstruction', 'invertible', 'solve']
  },
  {
    id: 'zoom-scaling',
    stepNumber: 14,
    slug: 'zoom-scaling',
    title: 'Zoom & Scaling',
    shortTitle: 'Zoom & Scaling',
    category: 'visual-labs',
    categoryLabel: 'Visual Labs',
    icon: ZoomIn,
    formula: 'S = \\begin{bmatrix} k & 0 \\\\ 0 & k \\end{bmatrix}, \\quad S^{-1} = \\begin{bmatrix} 1/k & 0 \\\\ 0 & 1/k \\end{bmatrix}',
    summary: 'Digital vs optical scaling: zoom in by factor k then zoom out by 1/k. Observe resolution limits, spatial aliasing, and interpolation artifacts.',
    concepts: ['Scaling Matrix', 'Inverse Zoom', 'Sampling & Interpolation', 'Area Scaling k²'],
    keywords: ['zoom scaling', 'scale', 'resolution', 'pixelation', 'interpolation', 'magnification']
  }
];

export const COMING_SOON_TOPICS = [
  {
    id: 'eigen',
    title: 'Eigenvalues & Eigenvectors',
    formula: 'A\\vec{v} = \\lambda\\vec{v}',
    category: 'Advanced Vector Spaces',
    description: 'Find invariant axes that only stretch under linear maps without rotating.',
    icon: Variable
  },
  {
    id: 'svd',
    title: 'Singular Value Decomposition (SVD)',
    formula: 'A = U \\Sigma V^T',
    category: 'Low-Rank Approximations',
    description: 'Decompose any image matrix into orthogonal basis vectors for optimal lossy compression.',
    icon: Layers
  },
  {
    id: 'pca',
    title: 'Principal Component Analysis (PCA)',
    formula: '\\text{Cov}(X) = \\frac{1}{N} X^T X',
    category: 'Dimensionality Reduction',
    description: 'Project high-dimensional image manifolds (Eigenfaces) onto dominant variance axes.',
    icon: Sparkles
  },
  {
    id: 'solver',
    title: 'Linear Algebra Solver',
    formula: 'A\\vec{x} = \\vec{b} \\implies \\vec{x} = A^{-1}\\vec{b}',
    category: 'Systems of Equations',
    description: 'Interactive Gaussian elimination and row-reduction visualizer step-by-step.',
    icon: Binary
  },
  {
    id: 'fourier',
    title: '2D Discrete Fourier Transform',
    formula: 'F(u, v) = \\sum_{x} \\sum_{y} f(x, y) e^{-i 2\\pi (ux/M + vy/N)}',
    category: 'Frequency Domain Analysis',
    description: 'Decompose images into spatial sinusoids to filter high-frequency noise and edges.',
    icon: Activity
  },
  {
    id: 'optimization',
    title: 'Matrix Optimization & Gradients',
    formula: '\\nabla f(W) = \\frac{\\partial \\mathcal{L}}{\\partial W}',
    category: 'Calculus on Manifolds',
    description: 'Visualize gradient descent across high-dimensional matrix loss landscapes.',
    icon: FunctionSquare
  },
  {
    id: 'probability',
    title: 'Probability & Covariance Visualizer',
    formula: '\\Sigma = E[(\\vec{X} - \\vec{\\mu})(\\vec{X} - \\vec{\\mu})^T]',
    category: 'Multivariate Statistics',
    description: 'Interactive covariance ellipses and multidimensional Gaussian distributions.',
    icon: Cpu
  },
  {
    id: 'neural',
    title: 'AI Math Tutor & Neural Tensors',
    formula: 'Y = \\text{ReLU}(W X + B)',
    category: 'Deep Learning Tensors',
    description: 'Step inside neural network weight matrices with real-time interactive attention maps.',
    icon: Network
  }
];

export const STATIC_PAGES = [
  { id: 'home', label: 'Home', icon: Sparkles, path: '/' },
  { id: 'roadmap', label: 'Coming Soon', icon: Lock, path: '/roadmap' },
  { id: 'learn', label: 'Learn', icon: BookOpen, path: '/learn' },
  { id: 'about', label: 'About', icon: Info, path: '/about' }
];

export function getFeatureById(id) {
  return FEATURES.find(f => f.id === id || f.slug === id) || FEATURES[0];
}

export function getFeatureByStep(stepNum) {
  return FEATURES.find(f => f.stepNumber === stepNum) || FEATURES[0];
}
