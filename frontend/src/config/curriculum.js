/**
 * Curriculum Configuration
 * Contains step metadata, learning objectives, and basic vs. advanced educational content.
 */

export const CURRICULUM = {
  id: 'pixels-to-matrices',
  title: 'Module 1: From Pixels to Matrices',
  subtitle: 'Understanding the Mathematical Foundation of Digital Images',
  steps: [
    {
      id: 1,
      slug: 'grayscale-basics',
      title: 'Step 1: Begin with a Small Grayscale Image',
      shortTitle: 'Grayscale Basics',
      summary: 'Explore 4×4 and 8×8 pixel grids side-by-side with numerical matrices.',
      concepts: ['Pixels as Numbers', '0 = Black', '255 = White', 'Grayscale Gradient'],
      basicHint: 'Think of an image like a grid of tiny light bulbs. 0 means completely OFF (black), and 255 means fully ON (white).',
      advancedFormula: 'I(x, y) \\in [0, 255] \\subset \\mathbb{Z}'
    },
    {
      id: 2,
      slug: 'interactive-elements',
      title: 'Step 2: Change Individual Matrix Elements',
      shortTitle: 'Editing Elements',
      summary: 'Adjust matrix values using sliders or inputs to see instant pixel transitions (0 → 50 → 100 → 150 → 200 → 255).',
      concepts: ['Numerical Array', 'Interactive State', 'Real-time Rendering'],
      basicHint: 'Try moving the slider for a single cell and watch how only that specific pixel changes shade.',
      advancedFormula: 'A_{i,j} \\leftarrow v, \\quad v \\in [0, 255]'
    },
    {
      id: 3,
      slug: 'scalar-brightness',
      title: 'Step 3: Connect Matrix Operations with Image Brightness',
      shortTitle: 'Scalar Multiplication',
      summary: 'Multiply an image matrix by a scalar k (A\' = kA). Brighten (k > 1), darken (k < 1), and clip at 255.',
      concepts: ['Scalar Multiplication', 'Brightness Scaling', 'Threshold Clipping'],
      basicHint: 'Multiplying by 1.5 makes the whole picture 50% brighter. Multiplying by 0.5 cuts the brightness in half.',
      advancedFormula: "A' = \\min(255, \\max(0, k \\cdot A))"
    },
    {
      id: 4,
      slug: 'colour-pixel-rgb',
      title: 'Step 4: Move from Grayscale to Colour Images',
      shortTitle: 'RGB Pixel',
      summary: 'Understand a color pixel as a 3-component vector [R, G, B] with interactive color sliders.',
      concepts: ['RGB Channels', 'Color Vector', 'Additive Color Mixing'],
      basicHint: 'Red + Blue makes Purple [128, 0, 128]. Red + Green makes Yellow [255, 255, 0].',
      advancedFormula: '\\vec{p} = [R, G, B]^T \\in \\mathbb{R}^3, \\quad 0 \\le R,G,B \\le 255'
    },
    {
      id: 5,
      slug: 'rgb-matrices',
      title: 'Step 5: Introduce the RGB Matrices of a Colour Image',
      shortTitle: 'RGB Channel Matrices',
      summary: 'An entire color image is composed of 3 separate matrices (R, G, and B) layered together.',
      concepts: ['3D Tensor Decomposition', 'Red/Green/Blue Planes', 'Image Reconstruction'],
      basicHint: 'A color picture is actually three transparent sheets stacked on top of each other: one red, one green, one blue.',
      advancedFormula: '\\mathcal{I} = (M_R, M_G, M_B) \\in \\mathbb{R}^{H \\times W \\times 3}'
    },
    {
      id: 6,
      slug: 'colour-scalar-ops',
      title: 'Step 6: Apply Scalar Multiplication to Colour Images',
      shortTitle: 'Color Scalar Ops',
      summary: 'Scale all three RGB channels simultaneously (R\'=kR, G\'=kG, B\'=kB) to control brightness.',
      concepts: ['Multi-channel Scaling', 'Color Saturation & Brightness', 'Clipping across channels'],
      basicHint: 'Scaling all 3 channels together keeps the tint the same while increasing or decreasing brightness.',
      advancedFormula: "R' = kR, \\; G' = kG, \\; B' = kB \\quad \\text{clipped to } [0, 255]"
    },
    {
      id: 7,
      slug: 'image-transformations',
      title: 'Step 7: Image Transformations - See What a Matrix Can Do',
      shortTitle: 'Coordinate Transforms',
      summary: 'Transform 2D image coordinates using transformation matrices: X\' = AX (scaling, rotation, shearing).',
      concepts: ['Linear Transformations', 'Coordinate Mapping X\'=AX', 'Rotation & Shear Matrices'],
      basicHint: 'Moving pixels around according to a math formula allows you to rotate, stretch, and tilt images!',
    },
    {
      id: 8,
      slug: 'matrix-addition-blend',
      title: 'Step 8: Matrix Addition & Image Blending',
      shortTitle: 'Matrix Addition',
      summary: 'Select two images of the same size and combine them using matrix addition C = αA + (1-α)B and direct addition C = A + B.',
      concepts: ['Element-by-Element Addition', 'Alpha Blending', 'Convex Combination', 'Pixel Intensity Saturation & Overflow'],
      basicHint: 'Moving the α slider gradually blends Image A into Image B. Every pixel in the result is the weighted sum of corresponding pixels.',
      advancedFormula: 'C_{i,j} = \\text{clamp}\\left(\\alpha A_{i,j} + (1-\\alpha) B_{i,j}\\right), \\quad 0 \\le \\alpha \\le 1'
    },
    {
      id: 9,
      slug: 'matrix-subtraction-background-removal',
      title: 'Step 8.2: Matrix Subtraction & Background Removal',
      shortTitle: 'Matrix Subtraction',
      summary: 'Subtract an empty background B from scene with object I to compute difference D = |I - B| and extract a foreground mask M with threshold T.',
      concepts: ['Matrix Subtraction', 'Difference Matrix D = |I - B|', 'Thresholding Mask M(x,y)', 'Camera Sensor Noise vs Foreground Detection'],
      basicHint: 'Subtracting the empty background leaves near-zero for unchanged spots and large numbers where the new object appeared. The threshold ignores small camera noise.',
      advancedFormula: 'D(x, y) = |I(x, y) - B(x, y)|, \\quad M(x, y) = \\begin{cases} 1, & D(x, y) > T \\\\ 0, & D(x, y) \\le T \\end{cases}'
    }
  ],
  upcomingModules: [
    {
      id: 'convolutions',
      title: 'Module 2: Convolutions & Image Filters',
      summary: 'Sobel edge detection, Gaussian blur, sharpening kernels using matrix convolution.',
      status: 'planned'
    },
    {
      id: 'svd-compression',
      title: 'Module 3: SVD & Image Compression',
      summary: 'Singular Value Decomposition (A = U \\Sigma V^T) for low-rank image approximation.',
      status: 'planned'
    },
    {
      id: 'eigenfaces',
      title: 'Module 4: Eigenfaces & PCA',
      summary: 'Principal Component Analysis and eigenvectors for facial feature recognition.',
      status: 'planned'
    }
  ]
};
