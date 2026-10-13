/**
 * MathLens — Comprehensive Module Documentation Data (Modules 01 - 18)
 * 
 * Provides mathematically accurate, beginner-accessible structured documentation
 * for every interactive module in MathLens:
 *  - Concept (What Is This?)
 *  - Why We Need It
 *  - How It Works (Numbered steps)
 *  - Formula & Symbol Definitions
 *  - Worked Numerical Example
 *  - What to Observe
 *  - Real-World Applications
 *  - Key Takeaways
 */

export const MODULE_DOCUMENTATION = {
  1: {
    stepNumber: 1,
    code: '01',
    title: 'From Pixels to Matrices',
    category: 'Pixel & Matrix',
    oneLiner: 'Every digital image is stored as a 2D numerical matrix of pixel light intensities.',
    formula: 'I(x, y) \\in [0, 255] \\subset \\mathbb{Z}',
    formulaDisplay: 'I(x, y) ∈ [0, 255] ⊂ ℤ',
    whatIsThis:
      'Digital images are not continuous paintings; they are discrete 2D rectangular grids of numbers called matrices. In an 8-bit grayscale image, each matrix entry corresponds to a single picture element (pixel). Its integer value represents how much light is emitted or reflected at that exact spatial location.',
    whyNeedIt:
      'Computers and graphic processors cannot manipulate visual feelings or optical waves directly—they only understand numbers. Converting an image into a numerical matrix enables computers to store, analyze, compress, and alter visual information using linear algebra.',
    howItWorks: [
      {
        step: 1,
        title: 'Spatial Discretization',
        description: 'A physical scene is divided into a grid of tiny square picture elements (H rows by W columns).'
      },
      {
        step: 2,
        title: 'Intensity Quantization',
        description: 'The light intensity captured at each grid cell is converted into an 8-bit integer between 0 and 255.'
      },
      {
        step: 3,
        title: 'Matrix Storage',
        description: 'The numbers are stored in row-major order as a 2D array matrix A of size H × W.'
      },
      {
        step: 4,
        title: 'Display Reconstruction',
        description: 'Your screen reads matrix A and illuminates display sub-pixels proportionately to each numerical value.'
      }
    ],
    symbols: [
      { symbol: 'I(x, y)', name: 'Pixel Intensity', meaning: 'The brightness value at column x and row y.' },
      { symbol: '[0, 255]', name: 'Dynamic Range', meaning: 'Standard 8-bit unsigned integer depth (2⁸ = 256 discrete levels).' },
      { symbol: '0', name: 'Black Bound', meaning: 'Total absence of emitted light (pure black).' },
      { symbol: '255', name: 'White Bound', meaning: 'Maximum sensor saturation / full brightness (pure white).' },
      { symbol: 'ℤ', name: 'Integers', meaning: 'The mathematical set of discrete whole numbers.' }
    ],
    workedExample: {
      title: '2×2 Grayscale Image Matrix',
      input: 'A miniature 2×2 grayscale matrix A with four distinct tone values:',
      matrixDisplay: [
        [0, 85],
        [170, 255]
      ],
      calculation:
        'A[0,0] = 0 (Pure Black, 0% light)\nA[0,1] = 85 (Dark Charcoal, 33% light)\nA[1,0] = 170 (Medium Gray, 67% light)\nA[1,1] = 255 (Pure White, 100% light)',
      output: 'The monitor displays four square pixels transitioning smoothly from pitch black to brilliant white.'
    },
    observations: [
      'Hover over any number in the matrix to see the corresponding pixel light up on the digital canvas.',
      'Notice that 0 corresponds to pitch black, 255 corresponds to pure white, and intermediate values form smooth gray steps.',
      'A digital image is strictly a rectangular array of integers.'
    ],
    applications: [
      { name: 'Digital Camera Sensors (CMOS/CCD)', desc: 'Photodiodes collect photons and convert them into 2D voltage matrices.' },
      { name: 'Medical Radiography (DICOM)', desc: 'X-ray and CT scanners record tissue density matrices for diagnostic viewing.' },
      { name: 'Computer Vision & Deep Learning', desc: 'Convolutional neural networks consume images directly as 2D/3D numerical tensors.' }
    ],
    keyTakeaways: [
      'An image is mathematically identical to a 2D numerical matrix.',
      'In standard 8-bit images, intensity ranges from 0 (off / black) to 255 (maximum / white).',
      'All image processing operations (filters, edits, recognition) are linear algebraic computations on matrix elements.'
    ]
  },

  2: {
    stepNumber: 2,
    code: '02',
    title: 'Change Individual Matrix Elements',
    category: 'Pixel & Matrix',
    oneLiner: 'Directly modify matrix values to observe instant real-time changes in the image.',
    formula: 'A[i, j] \\leftarrow v, \\quad v \\in [0, 255]',
    formulaDisplay: 'A[i, j] ← v,  v ∈ [0, 255]',
    whatIsThis:
      'Matrix cell editing demonstrates that an image is mutable computational state. By modifying a single element A[i, j] at row i and column j, the pixel at that exact coordinate immediately updates its brightness on the screen.',
    whyNeedIt:
      'Understanding cell mutation is essential for pixel-level editing, targeted retouching, artifact removal, watermarking, and understanding how memory buffers work in graphics hardware.',
    howItWorks: [
      {
        step: 1,
        title: 'Coordinate Selection',
        description: 'Select row index i and column index j within the bounds 0 ≤ i < H and 0 ≤ j < W.'
      },
      {
        step: 2,
        title: 'Value Validation',
        description: 'Verify that the new value v satisfies the 8-bit constraint: 0 ≤ v ≤ 255.'
      },
      {
        step: 3,
        title: 'Memory Mutation',
        description: 'Update the memory address for matrix element A[i, j] to hold the new integer v.'
      },
      {
        step: 4,
        title: 'Canvas Re-render',
        description: 'The graphics pipeline reads the updated buffer and re-draws the corresponding pixel.'
      }
    ],
    symbols: [
      { symbol: 'A[i, j]', name: 'Matrix Element', meaning: 'Entry at row i and column j in matrix A.' },
      { symbol: '←', name: 'Assignment', meaning: 'Replaces the existing memory value with a new scalar value.' },
      { symbol: 'v', name: 'New Intensity', meaning: 'The new integer brightness level written to the cell.' }
    ],
    workedExample: {
      title: 'Changing the Center Pixel',
      input: 'A 3×3 matrix initialized completely to 0 (all black):',
      matrixDisplay: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
      calculation: 'Assign center coordinate A[1, 1] ← 255:\nResulting matrix has A[1, 1] = 255 while all other entries remain 0.',
      output: 'A single brilliant white pixel appears in the dead center of a pitch black canvas.'
    },
    observations: [
      'Type or click any cell to edit its value and watch the canvas respond instantaneously without lag.',
      'Values below 0 or above 255 are automatically clamped to maintain valid 8-bit pixel levels.',
      'Local edits only affect their respective coordinates—surrounding matrix entries stay untouched.'
    ],
    applications: [
      { name: 'Dead Pixel Correction', desc: 'Camera firmware replaces defective sensor pixels by interpolating neighbouring cell values.' },
      { name: 'Pixel Art & Digital Illustration', desc: 'Sprite editors and raster illustration tools mutate individual pixel coordinates.' },
      { name: 'Steganography & Watermarking', desc: 'Encoding secret binary data into the least significant bits of selected image matrix cells.' }
    ],
    keyTakeaways: [
      'Digital images are mutable 2D memory arrays.',
      'Changing one matrix number alters only one pixel on the screen.',
      'Any complex visual filter is simply a series of coordinated matrix element updates.'
    ]
  },

  3: {
    stepNumber: 3,
    code: '03',
    title: 'Scalar Multiplication & Brightness',
    category: 'Pixel & Matrix',
    oneLiner: 'Multiply every matrix element by a single scalar factor to brighten or darken the image.',
    formula: 'A\' = \\text{clamp}(k \\cdot A, 0, 255) = \\min(255, \\max(0, k \\cdot A))',
    formulaDisplay: 'A\' = clamp(k · A, 0, 255)',
    whatIsThis:
      'Scalar multiplication in linear algebra means multiplying every single element in a matrix by a single real number k. In image processing, this operation corresponds exactly to adjusting exposure and brightness: k > 1 brightens the image, 0 < k < 1 darkens it, and k = 0 turns the entire image black.',
    whyNeedIt:
      'Scalar multiplication is the fundamental mathematical tool for adjusting photographic exposure, digital camera ISO sensitivity, display backlighting, and contrast normalization.',
    howItWorks: [
      {
        step: 1,
        title: 'Choose Scalar Factor',
        description: 'Select a scalar multiplier k (e.g. k = 1.5 to brighten by 50%, or k = 0.5 to dim by 50%).'
      },
      {
        step: 2,
        title: 'Element-by-Element Multiplication',
        description: 'Compute a\'_{ij} = k × a_{ij} for every row i and column j across the entire matrix.'
      },
      {
        step: 3,
        title: 'Range Clamping',
        description: 'If a calculated value exceeds 255, clamp it to 255 to prevent integer overflow.'
      },
      {
        step: 4,
        title: 'Display New Image',
        description: 'Render the new matrix A\' with scaled brightness values.'
      }
    ],
    symbols: [
      { symbol: 'k', name: 'Scalar Multiplier', meaning: 'The scaling factor applied uniformly across all elements.' },
      { symbol: 'A', name: 'Original Matrix', meaning: 'The baseline image matrix before brightness adjustment.' },
      { symbol: 'A\'', name: 'Resulting Matrix', meaning: 'The scaled image matrix after scalar multiplication.' },
      { symbol: 'clamp(x, 0, 255)', name: 'Saturation Clamp', meaning: 'Restricts numerical results to valid 8-bit boundaries [0, 255].' }
    ],
    workedExample: {
      title: 'Scaling a 2×2 Matrix by k = 1.5',
      input: 'Matrix A with values [[40, 100], [180, 220]] scaled by k = 1.5:',
      matrixDisplay: [
        [40, 100],
        [180, 220]
      ],
      calculation:
        'A\'[0, 0] = round(1.5 × 40) = 60\n' +
        'A\'[0, 1] = round(1.5 × 100) = 150\n' +
        'A\'[1, 0] = round(1.5 × 180) = 270 → clamp to 255\n' +
        'A\'[1, 1] = round(1.5 × 220) = 330 → clamp to 255',
      output: 'Dark pixels become lighter, while bright pixels saturate cleanly at the maximum 255 boundary.'
    },
    observations: [
      'Dragging the slider k > 1.0 brightens all non-zero pixels proportionally.',
      'Dragging k < 1.0 dims the entire image toward black.',
      'When k = 0, every cell becomes 0 (complete darkness). When k · a_ij > 255, the pixel clamps to 255 (blown-out highlights).'
    ],
    applications: [
      { name: 'Exposure Compensation in Cameras', desc: 'Digital sensor gain adjustment when taking photos in low light.' },
      { name: 'Night-Vision Enhancement', desc: 'Amplifying faint infrared light signals by multiplying pixel matrices by a gain scalar.' },
      { name: 'Display Brightness Sliders', desc: 'Smartphones and monitors adjust brightness via hardware/software scalar scaling.' }
    ],
    keyTakeaways: [
      'Scalar multiplication scales every number in a matrix by the exact same multiplier k.',
      'k > 1 amplifies brightness; 0 < k < 1 diminishes brightness; k = 0 results in total darkness.',
      'Values exceeding 255 must be clamped to avoid integer overflow and highlight distortion.'
    ]
  },

  4: {
    stepNumber: 4,
    code: '04',
    title: 'Single RGB Pixel as a 3D Vector',
    category: 'Pixel & Matrix',
    oneLiner: 'Represent any color pixel as a 3D column vector [R, G, B]ᵀ in Euclidean color space.',
    formula: '\\vec{p} = [R, G, B]^T \\in [0, 255]^3 \\subset \\mathbb{R}^3',
    formulaDisplay: 'p = [R, G, B]ᵀ ∈ ℝ³',
    whatIsThis:
      'Human vision perceives color through three cone photoreceptors sensitive to red, green, and blue light. In computer science and linear algebra, every color pixel is modeled as a 3D vector p = [R, G, B]ᵀ located inside an RGB color cube ranging from [0, 0, 0]ᵀ (Black) to [255, 255, 255]ᵀ (White).',
    whyNeedIt:
      'Treating colors as vectors allows us to use vector addition (additive color mixing), vector distance (perceptual color differences), and dot products (color matching and chroma-keying).',
    howItWorks: [
      {
        step: 1,
        title: 'Decompose Light Channels',
        description: 'Measure the amount of Red, Green, and Blue light present at that point.'
      },
      {
        step: 2,
        title: 'Form Column Vector',
        description: 'Stack the three intensities into a 3×1 column vector p = [R, G, B]ᵀ.'
      },
      {
        step: 3,
        title: 'Position in Color Space',
        description: 'Plot the vector as a point inside the 3D RGB color cube [0, 255]³.'
      },
      {
        step: 4,
        title: 'Additive Synthesis',
        description: 'Physical display pixels turn on red, green, and blue LEDs to synthesize the perceived color.'
      }
    ],
    symbols: [
      { symbol: 'p', name: 'Color Vector', meaning: 'A 3-dimensional column vector representing one pixel\'s color.' },
      { symbol: 'R', name: 'Red Component', meaning: 'Red light intensity scalar ∈ [0, 255].' },
      { symbol: 'G', name: 'Green Component', meaning: 'Green light intensity scalar ∈ [0, 255].' },
      { symbol: 'B', name: 'Blue Component', meaning: 'Blue light intensity scalar ∈ [0, 255].' },
      { symbol: 'ℝ³', name: '3D Vector Space', meaning: 'Three-dimensional real Euclidean vector space.' }
    ],
    workedExample: {
      title: 'Mixing Primary Components to Form Yellow',
      input: 'Setting Red = 255, Green = 255, Blue = 0:',
      matrixDisplay: [
        [255],
        [255],
        [0]
      ],
      calculation:
        'p = 255 · [1, 0, 0]ᵀ (pure red basis) + 255 · [0, 1, 0]ᵀ (pure green basis) + 0 · [0, 0, 1]ᵀ\n' +
        'Vector addition: [255, 0, 0]ᵀ + [0, 255, 0]ᵀ = [255, 255, 0]ᵀ',
      output: 'The human eye perceives the additive combination of full red and full green light as pure vibrant yellow.'
    },
    observations: [
      'When R = G = B, the vector lies along the main diagonal of the color cube, producing pure grayscale tones.',
      '[255, 0, 0]ᵀ is pure red, [0, 255, 0]ᵀ is pure green, and [0, 0, 255]ᵀ is pure blue.',
      'Vector addition of lights is additive: Red + Green = Yellow, Green + Blue = Cyan, Red + Blue = Magenta.'
    ],
    applications: [
      { name: 'Chroma-Key Green Screen Subtraction', desc: 'Isolating studio actors by calculating vector distance from pure green [0, 255, 0]ᵀ.' },
      { name: 'Color Palette Quantization', desc: 'Grouping similar color vectors using k-means clustering in 3D Euclidean space.' },
      { name: 'OLED / Micro-LED Display Engineering', desc: 'Calibrating individual sub-pixel voltage to synthesize target color coordinates.' }
    ],
    keyTakeaways: [
      'A single color pixel is a 3-dimensional vector [R, G, B]ᵀ.',
      'The RGB color model is additive: combining lights increases intensity toward white [255, 255, 255]ᵀ.',
      'Color differences can be computed mathematically using the Euclidean distance between two vectors.'
    ]
  },

  5: {
    stepNumber: 5,
    code: '05',
    title: 'RGB Channel Matrices Decomposition',
    category: 'Pixel & Matrix',
    oneLiner: 'Decompose a full-color image into three independent 2D matrices: Red, Green, and Blue.',
    formula: '\\mathcal{I} = (M_R, M_G, M_B) \\in \\mathbb{R}^{H \\times W \\times 3}',
    formulaDisplay: 'I = {M_R, M_G, M_B} ∈ ℝᴴˣᵂˣ³',
    whatIsThis:
      'While humans see a single unified color photograph, computers store it as a 3D tensor consisting of three separate 2D matrices: M_R (the Red channel), M_G (the Green channel), and M_B (the Blue channel). Each channel matrix is an H × W grayscale array recording the intensity of that specific primary wavelength.',
    whyNeedIt:
      'Separating channels allows algorithms to process colors independently—such as enhancing red contrast in astronomy, reducing blue haze in landscape photography, or compressing green with higher precision because the human eye is most sensitive to green.',
    howItWorks: [
      {
        step: 1,
        title: 'Tensor Slicing',
        description: 'Slice the full 3D tensor I along its color depth dimension into three 2D slices.'
      },
      {
        step: 2,
        title: 'Channel Isolation',
        description: 'M_R isolates red photon counts, M_G isolates green, and M_B isolates blue.'
      },
      {
        step: 3,
        title: 'Independent Processing',
        description: 'Apply linear algebraic operations (filtering, contrast, thresholding) to any channel separately.'
      },
      {
        step: 4,
        title: 'Tensor Stacking',
        description: 'Re-combine the three modified 2D matrices back into an H × W × 3 tensor for display.'
      }
    ],
    symbols: [
      { symbol: 'I', name: 'Color Image Tensor', meaning: '3D numerical array of dimensions Height × Width × 3 Channels.' },
      { symbol: 'M_R', name: 'Red Channel Matrix', meaning: '2D matrix of red light intensities (H × W).' },
      { symbol: 'M_G', name: 'Green Channel Matrix', meaning: '2D matrix of green light intensities (H × W).' },
      { symbol: 'M_B', name: 'Blue Channel Matrix', meaning: '2D matrix of blue light intensities (H × W).' }
    ],
    workedExample: {
      title: 'Decomposing a 2×2 Cyan & Red Image',
      input: 'Top row is pure Cyan [0, 255, 255], Bottom row is pure Red [255, 0, 0]:',
      matrixDisplay: [
        ['Cyan', 'Cyan'],
        ['Red', 'Red']
      ],
      calculation:
        'Red Matrix M_R   = [[0, 0], [255, 255]]\n' +
        'Green Matrix M_G = [[255, 255], [0, 0]]\n' +
        'Blue Matrix M_B  = [[255, 255], [0, 0]]',
      output: 'Viewing M_R shows pure black on top and bright white on bottom, completely decoupling the color bands.'
    },
    observations: [
      'Inspecting any single channel reveals a pure monochrome grayscale image.',
      'A yellow object appears bright in both the Red matrix and the Green matrix, but completely dark in the Blue matrix.',
      'Stacking the three 2D matrices back together reconstructs the original full-color image.'
    ],
    applications: [
      { name: 'JPEG Image Compression', desc: 'Separating brightness from color channels to compress color data more aggressively without visual loss.' },
      { name: 'Satellite Multispectral Remote Sensing', desc: 'Landsat satellites capture Earth in 11 separate wavelength matrices (visible, near-infrared, thermal).' },
      { name: 'CMYK Printing Separation', desc: 'Splitting color files into Cyan, Magenta, Yellow, and Key plates for commercial printing presses.' }
    ],
    keyTakeaways: [
      'A color image is a 3D tensor composed of three 2D matrices (Red, Green, Blue).',
      'Each channel matrix is an independent 2D grayscale array of numbers.',
      'Modern image compression and computer vision process channels independently.'
    ]
  },

  6: {
    stepNumber: 6,
    code: '06',
    title: 'Multi-Channel Scalar Operations',
    category: 'Pixel & Matrix',
    oneLiner: 'Scale individual RGB channels with independent multipliers to perform color grading and white balance.',
    formula: 'R\' = \\text{clamp}(k_R R), \\quad G\' = \\text{clamp}(k_G G), \\quad B\' = \\text{clamp}(k_B B)',
    formulaDisplay: 'R\' = k_R · R,  G\' = k_G · G,  B\' = k_B · B',
    whatIsThis:
      'Rather than multiplying all pixels by the same scalar (which only affects overall brightness), multi-channel scalar operations apply distinct scalar multipliers k_R, k_G, and k_B to the respective Red, Green, and Blue matrices. This transforms the color balance, temperature, and tint of the image.',
    whyNeedIt:
      'Cameras take photos under varied lighting conditions (fluorescent light, tungsten light, sunlight, shade). Multi-channel scaling is the exact mathematical algorithm used to correct color casts (White Balance) and create artistic photographic filters.',
    howItWorks: [
      {
        step: 1,
        title: 'Specify Per-Channel Scalars',
        description: 'Choose scaling factors: k_R for red, k_G for green, and k_B for blue.'
      },
      {
        step: 2,
        title: 'Parallel Matrix Scaling',
        description: 'Multiply M_R by k_R, M_G by k_G, and M_B by k_B.'
      },
      {
        step: 3,
        title: 'Independent Clamping',
        description: 'Clamp each channel independently between 0 and 255.'
      },
      {
        step: 4,
        title: 'Recombine Tensors',
        description: 'Merge the transformed matrices back into a composite color image.'
      }
    ],
    symbols: [
      { symbol: 'k_R', name: 'Red Gain', meaning: 'Scalar multiplier applied to the red channel matrix.' },
      { symbol: 'k_G', name: 'Green Gain', meaning: 'Scalar multiplier applied to the green channel matrix.' },
      { symbol: 'k_B', name: 'Blue Gain', meaning: 'Scalar multiplier applied to the blue channel matrix.' }
    ],
    workedExample: {
      title: 'Warm Sunlight Filter (Golden Hour Tint)',
      input: 'Neutral gray pixel p = [100, 100, 100]ᵀ with gains k_R = 1.3, k_G = 1.1, k_B = 0.7:',
      matrixDisplay: [
        [100],
        [100],
        [100]
      ],
      calculation:
        'R\' = round(1.3 × 100) = 130\n' +
        'G\' = round(1.1 × 100) = 110\n' +
        'B\' = round(0.7 × 100) = 70\n' +
        'New pixel vector p\' = [130, 110, 70]ᵀ',
      output: 'The neutral gray pixel transforms into a warm, sunset golden-amber tone.'
    },
    observations: [
      'Boosting k_R while lowering k_B warms the entire image (sunset / candlelight effect).',
      'Boosting k_B while lowering k_R cools the image (twilight / winter effect).',
      'Setting any single scalar to 0 completely extinguishes that primary color across the entire image.'
    ],
    applications: [
      { name: 'Auto White Balance (AWB)', desc: 'Camera image signal processors adjust k_R and k_B so that neutral gray objects appear truly neutral.' },
      { name: 'Cinematic Color Grading (LUTs)', desc: 'Hollywood film colorists apply diagonal gain matrices to establish atmospheric mood.' },
      { name: 'Night Shift & Blue Light Filters', desc: 'Smartphones decrease k_B at night to reduce eye strain and melatonin disruption.' }
    ],
    keyTakeaways: [
      'Independent scalar multiplication across channels controls color tint and balance.',
      'Warm tones boost red/green while reducing blue; cool tones boost blue while attenuating red.',
      'Auto white balance is simply automated diagonal matrix scaling on image channels.'
    ]
  },

  7: {
    stepNumber: 7,
    code: '07',
    title: '2D Coordinate Geometric Transformations',
    category: 'Transformations',
    oneLiner: 'Transform pixel 2D coordinates using 2×2 linear matrices: rotation, scaling, reflection, and shear.',
    formula: '\\begin{bmatrix} x\' \\\\ y\' \\end{bmatrix} = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} \\begin{bmatrix} x \\\\ y \\end{bmatrix}',
    formulaDisplay: 'X\' = A · X  (A ∈ ℝ²ˣ²)',
    whatIsThis:
      'Geometric image transformations manipulate where pixels are located in space rather than altering their intensity. By multiplying every coordinate vector [x, y]ᵀ by a 2×2 transformation matrix A = [[a, b], [c, d]], we can rotate, stretch, compress, reflect, and shear the entire image on the 2D Cartesian plane.',
    whyNeedIt:
      'Computer graphics, autonomous vehicle vision systems, and aerial map alignments constantly need to rotate, reorient, and rectify camera perspectives using 2×2 and 3×3 transformation matrices.',
    howItWorks: [
      {
        step: 1,
        title: 'Extract Coordinate Vector',
        description: 'Represent each pixel location as a 2D column vector X = [x, y]ᵀ.'
      },
      {
        step: 2,
        title: 'Construct Matrix A',
        description: 'Choose matrix coefficients for the desired geometry (e.g. rotation matrix R(θ) = [[cos θ, -sin θ], [sin θ, cos θ]]).'
      },
      {
        step: 3,
        title: 'Matrix-Vector Product',
        description: 'Compute x\' = a·x + b·y and y\' = c·x + d·y.'
      },
      {
        step: 4,
        title: 'Resample Image Canvas',
        description: 'Place pixel colors at the calculated transformed coordinates [x\', y\']ᵀ.'
      }
    ],
    symbols: [
      { symbol: '[x, y]ᵀ', name: 'Input Coordinates', meaning: 'The original pixel coordinate vector.' },
      { symbol: '[x\', y\']ᵀ', name: 'Output Coordinates', meaning: 'The mapped coordinate vector after transformation.' },
      { symbol: 'A', name: 'Transformation Matrix', meaning: 'A 2×2 real matrix defining the linear spatial mapping.' }
    ],
    workedExample: {
      title: 'Rotating Point [2, 0]ᵀ by 90° Counter-Clockwise',
      input: 'Point X = [2, 0]ᵀ transformed by rotation matrix R(90°) = [[0, -1], [1, 0]]:',
      matrixDisplay: [
        [0, -1],
        [1, 0]
      ],
      calculation:
        'x\' = (0 × 2) + (-1 × 0) = 0\n' +
        'y\' = (1 × 2) + (0 × 0) = 2\n' +
        'New coordinates: X\' = [0, 2]ᵀ',
      output: 'The point along the positive horizontal axis rotates cleanly onto the positive vertical axis.'
    },
    observations: [
      'The origin [0, 0]ᵀ is always an invariant fixed point under any linear transformation.',
      'Parallel lines remain parallel after any linear transformation.',
      'Shearing shifts horizontal rows proportionally to their vertical distance, tilting square grids into parallelograms.'
    ],
    applications: [
      { name: 'Autonomous Driving Lane Detection', desc: 'Inverse perspective mapping transforms dashboard camera view into a bird’s-eye road view.' },
      { name: 'Video Stabilization & Gimbal Tracking', desc: 'Applying compensatory rotation and translation matrices to eliminate hand shake in video.' },
      { name: 'Augmented Reality (AR)', desc: 'Mapping virtual 3D models onto detected planar surfaces using homography matrices.' }
    ],
    keyTakeaways: [
      'A 2×2 matrix maps 2D coordinates to new 2D coordinates via linear multiplication.',
      'Specific matrices encode rotation, scaling, reflection, and shearing.',
      'All 2D linear transformations preserve straight lines and keep the origin stationary.'
    ]
  },

  8: {
    stepNumber: 8,
    code: '08',
    title: 'Matrix Blending',
    category: 'Visual Labs',
    oneLiner: 'Blend two image matrices using convex combination: C = αA + (1 − α)B.',
    formula: 'C = \\alpha A + (1 - \\alpha) B, \\quad \\alpha \\in [0, 1]',
    formulaDisplay: 'C = α · A + (1 − α) · B',
    whatIsThis:
      'Matrix blending combines two images of identical dimensions into a single composite image using weighted addition. The parameter α (alpha) controls the contribution of each image: when α = 1, only image A is visible; when α = 0, only image B is visible; when α = 0.5, both images contribute equally.',
    whyNeedIt:
      'Direct matrix addition (C = A + B) frequently produces pixel sums exceeding 255, resulting in severe highlight blowout. Convex combination guarantees that the blended result always stays strictly within the valid [0, 255] range without overflow.',
    howItWorks: [
      {
        step: 1,
        title: 'Ensure Dimension Match',
        description: 'Verify both matrices A and B have identical height H and width W.'
      },
      {
        step: 2,
        title: 'Choose Blending Factor',
        description: 'Select weight α between 0.0 and 1.0 (e.g. α = 0.7 gives 70% A and 30% B).'
      },
      {
        step: 3,
        title: 'Element-wise Convex Addition',
        description: 'Compute c_{ij} = α · a_{ij} + (1 - α) · b_{ij} for all rows i and columns j.'
      },
      {
        step: 4,
        title: 'Render Composite Image',
        description: 'Display the resulting matrix C smoothly without clamping artifacts.'
      }
    ],
    symbols: [
      { symbol: 'A', name: 'Image Matrix A', meaning: 'Primary input image matrix.' },
      { symbol: 'B', name: 'Image Matrix B', meaning: 'Secondary input image matrix.' },
      { symbol: 'α (alpha)', name: 'Blending Factor', meaning: 'Scalar weighting factor ∈ [0, 1].' },
      { symbol: 'C', name: 'Blended Matrix', meaning: 'The resulting composite image matrix.' }
    ],
    workedExample: {
      title: 'Blending Two Corresponding Pixels with α = 0.6',
      input: 'Pixel from Image A: a = 200; Pixel from Image B: b = 50. Alpha weight α = 0.6:',
      matrixDisplay: [
        [200, 50]
      ],
      calculation:
        'c = α · a + (1 - α) · b\n' +
        'c = (0.6 × 200) + (0.4 × 50)\n' +
        'c = 120 + 20 = 140',
      output: 'The resulting pixel intensity is 140, a balanced blend that never exceeds 255.'
    },
    observations: [
      'Dragging α from 0 to 1 produces a seamless cross-dissolve transition from image B to image A.',
      'Because α + (1 - α) = 1, the blended pixel value is always bounded between min(a, b) and max(a, b).',
      'This operation is mathematically known as a convex linear combination.'
    ],
    applications: [
      { name: 'Video Cross-Fade Transitions', desc: 'Smoothly transitioning between two scenes in video editing suites.' },
      { name: 'UI Transparency & Glassmorphism', desc: 'Compositing semi-transparent overlays on top of desktop backgrounds.' },
      { name: 'HDR Exposure Bracketing', desc: 'Fusing an under-exposed photograph with an over-exposed photograph to preserve full dynamic range.' }
    ],
    keyTakeaways: [
      'Convex matrix blending prevents numerical overflow by ensuring weights sum to 1.',
      'Alpha parameter α smoothly interpolates between two visual states.',
      'Every digital dissolve and translucent UI layer relies on this exact equation.'
    ]
  },

  9: {
    stepNumber: 9,
    code: '09',
    title: 'Background Detection',
    category: 'Visual Labs',
    oneLiner: 'Subtract a static background matrix from the active camera frame to isolate moving foreground objects.',
    formula: 'D(x, y) = |I(x, y) - B(x, y)| > \\theta',
    formulaDisplay: 'D = |I − B| > θ',
    whatIsThis:
      'Background detection subtracts a known static reference image matrix B from an incoming video frame matrix I element-by-element. Static background elements cancel out to zero (black), while moving objects that entered the frame produce large difference values that exceed a noise threshold θ.',
    whyNeedIt:
      'Security cameras, traffic monitors, and video analysis tools cannot process entire high-resolution video streams continuously. Background subtraction quickly isolates the active moving bounding boxes, reducing processing workloads by over 95%.',
    howItWorks: [
      {
        step: 1,
        title: 'Capture Background Model B',
        description: 'Record a baseline reference image of the empty scene without any objects.'
      },
      {
        step: 2,
        title: 'Capture Current Frame I',
        description: 'Capture the live frame containing moving subjects.'
      },
      {
        step: 3,
        title: 'Compute Absolute Difference',
        description: 'Calculate D(x, y) = |I(x, y) - B(x, y)| for every pixel.'
      },
      {
        step: 4,
        title: 'Threshold Segmentation',
        description: 'If D(x, y) > θ, mark pixel as foreground (1); otherwise mark as background (0).'
      }
    ],
    symbols: [
      { symbol: 'I', name: 'Current Frame Matrix', meaning: 'The live image containing moving objects.' },
      { symbol: 'B', name: 'Background Reference Matrix', meaning: 'The memorized empty scene baseline.' },
      { symbol: 'D', name: 'Delta Difference Matrix', meaning: 'Absolute pixel-wise subtraction |I − B|.' },
      { symbol: 'θ (theta)', name: 'Noise Threshold', meaning: 'Cutoff value to filter out subtle lighting and sensor noise.' }
    ],
    workedExample: {
      title: 'Detecting a Moving Object Pixel',
      input: 'Static wall background B[i, j] = 60. Moving person enters with jacket I[i, j] = 210. Threshold θ = 25:',
      matrixDisplay: [
        [60, 210]
      ],
      calculation:
        'Delta D[i, j] = |210 - 60| = 150\n' +
        'Compare against threshold: 150 > 25 (True)\n' +
        'Binary Foreground Mask M[i, j] = 1 (White / Detected)',
      output: 'The pixel is identified as active foreground motion and highlighted in the segmentation mask.'
    },
    observations: [
      'Areas of the room that did not change produce |I - B| ≈ 0 and appear pure black.',
      'Increasing the threshold θ removes camera sensor noise, but setting it too high might miss subtle motions.',
      'The absolute value operator |·| ensures that darker objects on bright backgrounds are detected just as effectively as bright objects on dark backgrounds.'
    ],
    applications: [
      { name: 'Smart Security Surveillance', desc: 'Triggering alarms only when human motion is detected in secure facilities.' },
      { name: 'Automated Traffic Speed & Count Cameras', desc: 'Detecting and counting vehicles crossing highway lanes in real time.' },
      { name: 'Virtual Web-Cam Background Replacement', desc: 'Separating the speaker from their home office background without requiring a green screen.' }
    ],
    keyTakeaways: [
      'Matrix subtraction isolates visual changes between two frames.',
      'Absolute value ensures all directional intensity shifts produce positive deltas.',
      'Thresholding filters camera noise to create clean binary motion masks.'
    ]
  },

  10: {
    stepNumber: 10,
    code: '10',
    title: 'Change Detection',
    category: 'Visual Labs',
    oneLiner: 'Compare an inspection image against a golden reference matrix to detect manufacturing defects.',
    formula: 'D = |A_{\\text{test}} - A_{\\text{ref}}|, \\quad M = (D \\ge \\tau)',
    formulaDisplay: 'D = |A_test − A_ref|',
    whatIsThis:
      'Change detection is a high-precision quality control technique. A newly manufactured item (such as a printed circuit board or silicon wafer) is photographed and compared against a golden CAD reference matrix. Any discrepancy above a strict tolerance threshold τ immediately exposes missing traces, cracks, or contaminants.',
    whyNeedIt:
      'Human quality inspectors get tired and miss micro-defects smaller than a hair. Automated optical inspection (AOI) uses matrix subtraction to inspect thousands of microchips per minute with mathematical precision.',
    howItWorks: [
      {
        step: 1,
        title: 'Calibrate Reference Template',
        description: 'Load the verified golden reference matrix A_ref.'
      },
      {
        step: 2,
        title: 'Align Test Sample',
        description: 'Capture test sample A_test and align it to sub-pixel accuracy.'
      },
      {
        step: 3,
        title: 'Matrix Difference Map',
        description: 'Calculate absolute matrix difference D = |A_test - A_ref|.'
      },
      {
        step: 4,
        title: 'Anomaly Highlighting',
        description: 'Generate a defect heatmap highlighting any coordinates where D exceeds tolerance τ.'
      }
    ],
    symbols: [
      { symbol: 'A_ref', name: 'Reference Matrix', meaning: 'The flawless gold-standard baseline image.' },
      { symbol: 'A_test', name: 'Inspection Matrix', meaning: 'The manufactured sample being tested.' },
      { symbol: 'D', name: 'Discrepancy Matrix', meaning: 'Pixel-wise difference map.' },
      { symbol: 'τ (tau)', name: 'Tolerance Threshold', meaning: 'Permissible variation margin before flagging a defect.' }
    ],
    workedExample: {
      title: 'Detecting a Broken PCB Circuit Trace',
      input: 'Reference PCB trace A_ref[2, 3] = 230 (Copper line present). Defective board A_test[2, 3] = 40 (Broken copper trace). Tolerance τ = 30:',
      matrixDisplay: [
        [230, 40]
      ],
      calculation:
        'D[2, 3] = |40 - 230| = 190\n' +
        'Inspection check: 190 ≥ 30 (DEFECT FLAGGED)\n' +
        'Heatmap marks coordinate (2, 3) in bright alert color.',
      output: 'The inspection pipeline instantly flags a severed electrical trace.'
    },
    observations: [
      'Matching areas between the two images cancel out completely to zero.',
      'Defects appear as bright, high-contrast anomalies on the delta heatmap.',
      'Toggle defect types in the controls to see how short circuits and missing components create distinct mathematical signatures.'
    ],
    applications: [
      { name: 'PCB & Semiconductor Inspection', desc: 'Automated microscopes verify millions of microchip transistors per hour.' },
      { name: 'Satellite Environmental Monitoring', desc: 'Comparing annual satellite matrices to measure deforestation and polar ice melting.' },
      { name: 'Medical Retinal Scanning', desc: 'Comparing annual eye scans to detect early micro-vascular changes in diabetes patients.' }
    ],
    keyTakeaways: [
      'Comparative matrix subtraction provides objective, automated anomaly inspection.',
      'Flawless regions produce zero difference; defective regions generate sharp peaks.',
      'Threshold tuning balances defect detection sensitivity against benign surface variations.'
    ]
  },

  11: {
    stepNumber: 11,
    code: '11',
    title: 'Image Inversion',
    category: 'Visual Labs',
    oneLiner: 'Invert image intensities via complement arithmetic: A\' = 255 − A.',
    formula: 'A\' = 255 - A',
    formulaDisplay: 'A\' = 255 − A',
    whatIsThis:
      'Image inversion reverses the tonal hierarchy of an image. Every pixel value a_{ij} is replaced by its 8-bit complement: a\'_{ij} = 255 - a_{ij}. Pure black (0) becomes pure white (255), pure white (255) becomes pure black (0), and mid-gray (128) maps back to 127.',
    whyNeedIt:
      'Human vision is more sensitive to subtle dark variations on a bright background than bright variations on a dark background. Radiologists frequently invert medical X-rays and CT scans to reveal hairline fractures and micro-calcifications.',
    howItWorks: [
      {
        step: 1,
        title: 'Dynamic Range Constant',
        description: 'Set the maximum dynamic range constant C = 255 (for 8-bit depth).'
      },
      {
        step: 2,
        title: 'Complement Subtraction',
        description: 'Subtract every matrix entry from 255: a\'_{ij} = 255 - a_{ij}.'
      },
      {
        step: 3,
        title: 'Involution Property',
        description: 'Inverting an inverted image returns the exact original matrix: 255 - (255 - A) = A.'
      },
      {
        step: 4,
        title: 'Render Negative Image',
        description: 'Display the inverted matrix.'
      }
    ],
    symbols: [
      { symbol: 'A', name: 'Original Matrix', meaning: 'The input grayscale image.' },
      { symbol: '255', name: 'Max Range Constant', meaning: 'Upper bound of 8-bit dynamic range.' },
      { symbol: 'A\'', name: 'Inverted Matrix', meaning: 'The photographic negative image matrix.' }
    ],
    workedExample: {
      title: 'Inverting a 2×2 Contrast Matrix',
      input: 'Matrix A containing black, dark gray, light gray, and white:',
      matrixDisplay: [
        [0, 60],
        [190, 255]
      ],
      calculation:
        'A\'[0, 0] = 255 - 0 = 255 (Black becomes White)\n' +
        'A\'[0, 1] = 255 - 60 = 195 (Dark becomes Light)\n' +
        'A\'[1, 0] = 255 - 190 = 65 (Light becomes Dark)\n' +
        'A\'[1, 1] = 255 - 255 = 0 (White becomes Black)',
      output: 'The inverted matrix displays reversed contrast with mirrored brightness levels.'
    },
    observations: [
      'Inversion is an involution: applying it twice returns the original matrix without any data loss.',
      'The sum of any original pixel and its inverted partner always equals exactly 255.',
      'Dense bone structures that appear bright in raw X-rays invert into dark silhouettes that are easier to trace.'
    ],
    applications: [
      { name: 'Medical Radiography & CT', desc: 'Doctors toggle between positive and negative views to spot fine hairline bone fractures.' },
      { name: 'Film Photography Darkrooms', desc: 'Traditional analog negative film is digitized and inverted into normal positive photographs.' },
      { name: 'Astronomical Astrophotography', desc: 'Faint distant stars and galaxies are easier to detect as black dots on a white sky background.' }
    ],
    keyTakeaways: [
      'Image inversion computes the 8-bit complement: A\' = 255 − A.',
      'Inversion preserves all fine edge information while flipping tonal contrast.',
      'It is an involution: inverting twice restores the original image perfectly.'
    ]
  },

  12: {
    stepNumber: 12,
    code: '12',
    title: 'Determinant Lab',
    category: 'Visual Labs',
    oneLiner: 'Understand the determinant of a 2×2 matrix as the geometric area scaling factor.',
    formula: '\\det(A) = ad - bc \\quad \\text{for} \\quad A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
    formulaDisplay: 'det(A) = ad − bc',
    whatIsThis:
      'The determinant of a 2×2 transformation matrix A = [[a, b], [c, d]] is the scalar value det(A) = ad - bc. Geometrically, it represents the exact factor by which any 2D area expands or shrinks under that transformation. If det(A) = 0, the 2D plane collapses into a flat 1D line or point.',
    whyNeedIt:
      'The determinant reveals critical geometric properties of a transformation: whether it preserves area (|det(A)| = 1), whether it flips orientation (det(A) < 0), and whether the transformation is invertible (det(A) ≠ 0).',
    howItWorks: [
      {
        step: 1,
        title: 'Extract Matrix Entries',
        description: 'Read the four entries of 2×2 matrix A: row 1 is [a, b], row 2 is [c, d].'
      },
      {
        step: 2,
        title: 'Calculate Cross Products',
        description: 'Multiply the main diagonal (a × d) and the off diagonal (b × c).'
      },
      {
        step: 3,
        title: 'Compute Difference',
        description: 'Subtract the off-diagonal product from the main diagonal: det(A) = ad - bc.'
      },
      {
        step: 4,
        title: 'Geometric Interpretation',
        description: 'Area of transformed shape = |det(A)| × original area.'
      }
    ],
    symbols: [
      { symbol: 'A', name: '2×2 Matrix', meaning: 'Linear transformation matrix [[a, b], [c, d]].' },
      { symbol: 'det(A)', name: 'Determinant', meaning: 'Signed area scaling factor ad − bc.' },
      { symbol: '|det(A)|', name: 'Absolute Area Scale', meaning: 'Magnitude of area scaling.' },
      { symbol: 'det(A) = 0', name: 'Singularity', meaning: 'Degenerate transformation that collapses 2D space into a 1D line.' }
    ],
    workedExample: {
      title: 'Scaling Matrix Area Expansion',
      input: 'Matrix A = [[2, 0], [0, 3]] acting on a unit square of area = 1:',
      matrixDisplay: [
        [2, 0],
        [0, 3]
      ],
      calculation:
        'det(A) = (a × d) - (b × c)\n' +
        'det(A) = (2 × 3) - (0 × 0) = 6 - 0 = 6\n' +
        'Transformed Area = |6| × 1 = 6',
      output: 'The original 1×1 unit square transforms into a 2×3 rectangle with an area of exactly 6 square units.'
    },
    observations: [
      'When det(A) = 1 (pure rotation), area is perfectly conserved.',
      'When det(A) < 0 (reflection), the shape is flipped like a mirror image.',
      'When det(A) = 0, the unit square collapses into a flat 1D line, losing one spatial dimension.'
    ],
    applications: [
      { name: 'Computer Graphics UV Mapping', desc: 'Measuring texture distortion and stretching when wrapping 2D textures onto 3D game models.' },
      { name: 'Robotics Kinematics', desc: 'Checking Jacobian determinants to identify singularities where robot arms lose mobility.' },
      { name: 'Calculus Change of Variables', desc: 'The Jacobian determinant scales the differential area element dx dy during double integrals.' }
    ],
    keyTakeaways: [
      'The determinant det(A) = ad − bc measures the area scaling factor of a 2D transformation.',
      'Negative determinants indicate spatial reflection (mirror reversal of orientation).',
      'det(A) = 0 indicates dimensional collapse; such matrices cannot be inverted.'
    ]
  },

  13: {
    stepNumber: 13,
    code: '13',
    title: 'Matrix Inverse',
    category: 'Visual Labs',
    oneLiner: 'Use the inverse matrix A⁻¹ to reverse transformations and restore original image coordinates.',
    formula: 'A^{-1} A = I \\implies X = A^{-1} X\', \\quad A^{-1} = \\frac{1}{ad - bc} \\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}',
    formulaDisplay: 'A⁻¹ · A = I,  X = A⁻¹ · X\'',
    whatIsThis:
      'The inverse of a square matrix A is a matrix denoted A⁻¹ that undoes the transformation performed by A. Multiplying A by A⁻¹ yields the identity matrix I (the matrix equivalent of the number 1). A matrix has an inverse if and only if its determinant is non-zero (det(A) ≠ 0).',
    whyNeedIt:
      'If an image is distorted, rotated, or sheared during transmission or optical capture, computing and applying A⁻¹ allows us to reconstruct the original geometry without distortion.',
    howItWorks: [
      {
        step: 1,
        title: 'Check Invertibility',
        description: 'Calculate determinant det(A) = ad - bc. If det(A) = 0, the matrix is singular and cannot be inverted.'
      },
      {
        step: 2,
        title: 'Construct Adjugate Matrix',
        description: 'Swap main diagonal entries (a and d) and negate off-diagonal entries (-b and -c).'
      },
      {
        step: 3,
        title: 'Scale by 1 / det(A)',
        description: 'Multiply every entry of the adjugate matrix by the scalar factor 1 / det(A).'
      },
      {
        step: 4,
        title: 'Reconstruction Multiplication',
        description: 'Multiply distorted coordinates by A⁻¹ to restore original coordinates: X = A⁻¹ X\'.'
      }
    ],
    symbols: [
      { symbol: 'A', name: 'Forward Matrix', meaning: 'The original transformation matrix.' },
      { symbol: 'A⁻¹', name: 'Inverse Matrix', meaning: 'The unique matrix satisfying A⁻¹ · A = I.' },
      { symbol: 'I', name: 'Identity Matrix', meaning: 'The neutral matrix [[1, 0], [0, 1]] that leaves coordinates unchanged.' }
    ],
    workedExample: {
      title: 'Inverting a 2×2 Scaling Matrix',
      input: 'Forward matrix A = [[2, 0], [0, 4]]:',
      matrixDisplay: [
        [2, 0],
        [0, 4]
      ],
      calculation:
        'det(A) = (2 × 4) - (0 × 0) = 8 (Non-zero, so invertible!)\n' +
        'Adjugate = [[4, 0], [0, 2]]\n' +
        'A⁻¹ = (1 / 8) · [[4, 0], [0, 2]] = [[0.5, 0], [0, 0.25]]\n' +
        'Verification: A⁻¹ · A = [[0.5×2, 0], [0, 0.25×4]] = [[1, 0], [0, 1]] = I',
      output: 'Applying A⁻¹ shrinks the enlarged coordinates back to their original size.'
    },
    observations: [
      'Applying A and then A⁻¹ returns all points to their starting coordinates.',
      'If you drag a slider such that det(A) = 0, the inverse matrix ceases to exist (division by zero).',
      'The inverse of a rotation by angle θ is simply a rotation by -θ.'
    ],
    applications: [
      { name: 'Camera Lens Distortion Correction', desc: 'Inverting fish-eye and barrel distortion matrices in action cameras.' },
      { name: 'Photogrammetry & 3D Scanning', desc: 'Inverting projection matrices to calculate real-world 3D coordinates from 2D photos.' },
      { name: 'Public Key Cryptography', desc: 'Matrix inversion forms the mathematical basis of Hill Cipher encryption and decryption.' }
    ],
    keyTakeaways: [
      'The inverse matrix A⁻¹ completely reverses the effect of transformation matrix A.',
      'A matrix can be inverted if and only if its determinant is non-zero (det(A) ≠ 0).',
      'Multiplying a matrix by its inverse always produces the Identity Matrix I.'
    ]
  },

  14: {
    stepNumber: 14,
    code: '14',
    title: 'Zoom & Scaling',
    category: 'Visual Labs',
    oneLiner: 'Resize images using diagonal scaling matrices and investigate sampling and interpolation.',
    formula: 'S = \\begin{bmatrix} k & 0 \\\\ 0 & k \\end{bmatrix}, \\quad S^{-1} = \\begin{bmatrix} 1/k & 0 \\\\ 0 & 1/k \\end{bmatrix}',
    formulaDisplay: 'S = diag(k, k),  X\' = S · X',
    whatIsThis:
      'Zooming and scaling expands or contracts an image spatially using a diagonal scaling matrix S = [[k, 0], [0, k]]. When k > 1, the image is enlarged (magnified); when 0 < k < 1, the image is minified. Because digital images are discrete grids, enlarging requires resampling and interpolation to fill in gaps between pixels.',
    whyNeedIt:
      'Screen resolutions vary from small smartwatch displays to massive 8K televisions. Digital scaling algorithms ensure images display correctly at any arbitrary target size.',
    howItWorks: [
      {
        step: 1,
        title: 'Choose Zoom Factor',
        description: 'Set uniform zoom factor k (e.g. k = 2 for 2× magnification).'
      },
      {
        step: 2,
        title: 'Backward Coordinate Mapping',
        description: 'For each output pixel (x\', y\'), compute original location via inverse: (x, y) = S⁻¹(x\', y\') = (x\'/k, y\'/k).'
      },
      {
        step: 3,
        title: 'Pixel Interpolation',
        description: 'Estimate pixel intensity using Nearest Neighbor (sharp blocks) or Bilinear Interpolation (smooth blending).'
      },
      {
        step: 4,
        title: 'Render Rescaled Canvas',
        description: 'Draw the resampled matrix on the display.'
      }
    ],
    symbols: [
      { symbol: 'k', name: 'Zoom Scale Factor', meaning: 'Spatial magnification factor (k > 1 enlarges, k < 1 shrinks).' },
      { symbol: 'S', name: 'Scaling Matrix', meaning: 'Diagonal matrix [[k, 0], [0, k]].' },
      { symbol: 'S⁻¹', name: 'Inverse Zoom Matrix', meaning: 'Diagonal matrix [[1/k, 0], [0, 1/k]].' },
      { symbol: 'k²', name: 'Area Factor', meaning: 'Total pixel count scales proportionately with k².' }
    ],
    workedExample: {
      title: '2× Magnification on a 2×2 Image',
      input: 'A 2×2 matrix enlarged by k = 2 produces a 4×4 matrix (4 times the area):',
      matrixDisplay: [
        [100, 200],
        [50, 150]
      ],
      calculation:
        'Original area: 2 × 2 = 4 pixels\n' +
        'Scaled area: (2 × 2) × k² = 4 × 2² = 16 pixels\n' +
        'Each original single pixel expands into a 2×2 block of identical values under nearest neighbor.',
      output: 'The image becomes twice as wide and twice as tall while preserving total energy.'
    },
    observations: [
      'Digital zoom (unlike physical optical lens zoom) cannot create new optical detail; it resamples existing pixels.',
      'Zooming in too far reveals individual square pixel blocks (pixelation).',
      'The total number of pixels in the image scales with the square of the zoom factor (k²).'
    ],
    applications: [
      { name: 'Smartphone Pinch-to-Zoom', desc: 'Real-time GPU texture scaling with bilinear/bicubic sampling filters.' },
      { name: 'Satellite Imagery Super-Resolution', desc: 'Deep learning models hallucinate fine street details when upscaling aerial photos.' },
      { name: 'Medical Endoscopy Zooming', desc: 'Surgeons zoom into high-definition camera feeds during laparoscopic surgery.' }
    ],
    keyTakeaways: [
      'Spatial zooming is governed by a diagonal scaling matrix S = diag(k, k).',
      'Image area scales with k² (e.g. 3× zoom yields 9× the pixel area).',
      'Digital upscaling requires interpolation to approximate pixel values between discrete grid coordinates.'
    ]
  },

  15: {
    stepNumber: 15,
    code: '15',
    title: 'Matrix Multiplication & Shadows',
    category: 'Visual Labs',
    oneLiner: 'Compare row-by-column matrix multiplication (C = A·B) against element-wise shadow masks (B = A ⊙ S).',
    formula: 'C = A \\cdot B \\quad \\text{vs} \\quad B = A \\odot S \\implies A = B \\oslash S',
    formulaDisplay: 'C = A · B,  c_ij = ∑ a_ik · b_kj',
    whatIsThis:
      'This module contrasts two fundamental forms of matrix multiplication in computer vision: standard matrix multiplication (row-column dot products, C = A·B, non-commutative) used for geometric and optical transformations, and Hadamard element-wise multiplication (B = A ⊙ S) used to model physical shadows cast across a photograph.',
    whyNeedIt:
      'Understanding the difference between standard matrix multiplication and element-wise Hadamard products is essential in machine learning, computer graphics shading, and photographic shadow removal.',
    howItWorks: [
      {
        step: 1,
        title: 'Standard Multiplication (A · B)',
        description: 'Entry c_{ij} is the dot product of row i of matrix A with column j of matrix B.'
      },
      {
        step: 2,
        title: 'Non-Commutativity Check',
        description: 'In general, A · B ≠ B · A. The order of operations matters.'
      },
      {
        step: 3,
        title: 'Hadamard Shadow Mask (A ⊙ S)',
        description: 'Each pixel b_{ij} = a_{ij} × s_{ij}, where shadow coefficient s_{ij} ∈ [0, 1] attenuates incoming light.'
      },
      {
        step: 4,
        title: 'Shadow Removal (B ⊘ S)',
        description: 'Recover the unshaded image by dividing the shadowed photograph by the shadow mask: a_{ij} = b_{ij} / s_{ij}.'
      }
    ],
    symbols: [
      { symbol: 'A · B', name: 'Matrix Product', meaning: 'Standard linear algebraic dot product of rows and columns.' },
      { symbol: '⊙', name: 'Hadamard Product', meaning: 'Element-by-element multiplication: c_{ij} = a_{ij} × b_{ij}.' },
      { symbol: 'S', name: 'Shadow Mask Matrix', meaning: 'Spatial attenuation matrix with values between 0.0 (full shadow) and 1.0 (unshaded).' },
      { symbol: '⊘', name: 'Hadamard Division', meaning: 'Element-wise division used to recover unshaded pixels.' }
    ],
    workedExample: {
      title: 'Casting and Removing a 50% Shadow',
      input: 'Unshaded flower petal pixel a = 200. Tree branch casts a shadow reducing light by half (s = 0.5):',
      matrixDisplay: [
        [200, 0.5]
      ],
      calculation:
        'Shadowed Pixel b = a × s = 200 × 0.5 = 100\n' +
        'Shadow Removal: a = b / s = 100 / 0.5 = 200\n' +
        'The unshaded petal brightness is perfectly recovered through element-wise division.',
      output: 'The original bright pixel value (200) is mathematically restored.'
    },
    observations: [
      'Standard matrix multiplication mixes rows and columns together, whereas Hadamard multiplication only interacts with corresponding cells.',
      'Multiplying by the Identity matrix I leaves any matrix unchanged (A · I = A).',
      'Shadowed regions can be restored by element-wise division as long as the shadow mask values are strictly greater than zero.'
    ],
    applications: [
      { name: 'Video Game Shading Pipelines', desc: 'Rendering engines multiply albedo texture matrices by dynamic ambient occlusion and shadow maps.' },
      { name: 'Satellite Terrain Shadow Normalization', desc: 'Removing mountain shadows in satellite imagery to accurately classify ground vegetation.' },
      { name: 'Deep Learning Convolution Layers', desc: 'Convolutional neural networks compute millions of dot products per frame.' }
    ],
    keyTakeaways: [
      'Standard matrix multiplication C = A · B computes dot products and is non-commutative (AB ≠ BA).',
      'Optical shadows are element-wise Hadamard products B = A ⊙ S.',
      'Shadowed images can be mathematically recovered by element-wise division: A = B ⊘ S.'
    ]
  },

  16: {
    stepNumber: 16,
    code: '16',
    title: 'My Image, My Matrix',
    category: 'Visual Labs',
    oneLiner: 'Upload your own custom image or capture from webcam to inspect its live pixel matrix and apply transformations.',
    formula: 'A\' = f(A), \\quad \\dim(A) = H \\times W \\times C',
    formulaDisplay: 'A\' = f(A),  dim(A) = H × W',
    whatIsThis:
      'This open laboratory bridges mathematical theory with real-world digital media. Upload any photo from your device or capture a live frame from your webcam. Inspect the raw numerical values of your own face or surroundings, select custom regions of interest (ROI), and apply every matrix operation learned throughout MathLens.',
    whyNeedIt:
      'Theoretical models are most powerful when applied to real-world data. Seeing your own photograph translated directly into rows and columns of numbers cements the core premise of visual linear algebra.',
    howItWorks: [
      {
        step: 1,
        title: 'Image Ingestion',
        description: 'Upload a PNG/JPEG file or stream live video from your webcam.'
      },
      {
        step: 2,
        title: 'Resolution Resampling',
        description: 'Resample the image to an interactive matrix grid (e.g. 4×4, 8×8, 16×16) to make individual numbers legible.'
      },
      {
        step: 3,
        title: 'ROI Pixel Inspection',
        description: 'Hover or click any region of your photo to inspect its exact numerical RGB tensor values.'
      },
      {
        step: 4,
        title: 'Execute Matrix Operations',
        description: 'Apply scalar brightness, inversion, channel decomposition, and geometric transformations to your own image.'
      }
    ],
    symbols: [
      { symbol: 'A', name: 'User Image Matrix', meaning: 'The 2D/3D matrix extracted directly from your file or webcam.' },
      { symbol: 'f(A)', name: 'Matrix Operator', meaning: 'Any linear algebraic transformation function applied to the array.' },
      { symbol: 'H × W', name: 'Array Dimensions', meaning: 'The height (rows) and width (columns) of your photo.' },
      { symbol: 'ROI', name: 'Region of Interest', meaning: 'A localized sub-matrix cropped for detailed mathematical analysis.' }
    ],
    workedExample: {
      title: 'Inverting a 2×2 User Photo Crop',
      input: 'User uploads a photo containing a 2×2 crop of a dark jacket and skin tone:',
      matrixDisplay: [
        [30, 45],
        [210, 195]
      ],
      calculation:
        'A\' = 255 - A\n' +
        'Row 1: [255 - 30, 255 - 45] = [225, 210]\n' +
        'Row 2: [255 - 210, 255 - 195] = [45, 60]',
      output: 'The dark jacket becomes brilliant white; the bright skin tone becomes deep charcoal.'
    },
    observations: [
      'Every photograph stored on your phone or computer is fundamentally a matrix of numbers.',
      'Switching between resolution levels shows how high-resolution continuous photos emerge from discrete pixel matrices.',
      'All professional image editing software (Photoshop, Lightroom) operates by running matrix algebra on your photos.'
    ],
    applications: [
      { name: 'Computer Vision Training Pipelines', desc: 'Loading diverse user photos as normalized NumPy / PyTorch tensors for neural network training.' },
      { name: 'Biometric Face Recognition', desc: 'Extracting landmark feature matrices from user webcam images to verify identity.' },
      { name: 'Forensic Image Analysis', desc: 'Examining subtle matrix quantization artifacts to detect photo tampering and AI deepfakes.' }
    ],
    keyTakeaways: [
      'Any photograph is a matrix of integers ready for mathematical analysis.',
      'Sub-matrices (ROIs) can be isolated and processed independently.',
      'All image processing tools are built upon the fundamental matrix operations explored here.'
    ]
  },

  17: {
    stepNumber: 17,
    code: '17',
    title: 'Exploring Ray Optics Through Matrices',
    category: 'Ray Optics',
    oneLiner: 'Model light rays as 2D direction vectors and optical reflections as 2×2 linear matrix transformations.',
    formula: '\\vec{d}\' = R \\cdot \\vec{d}, \\quad R_x = \\begin{bmatrix} 1 & 0 \\\\ 0 & -1 \\end{bmatrix}, \\quad R_y = \\begin{bmatrix} -1 & 0 \\\\ 0 & 1 \\end{bmatrix}, \\quad R_x R_y = -I',
    formulaDisplay: 'r\' = R · r,  R_x · R_y = −I',
    whatIsThis:
      'In classical ray optics, a light ray traveling in a 2D plane is represented as a direction vector d = [dx, dy]ᵀ. When a ray reflects off a plane mirror, the Law of Reflection (angle of incidence equals angle of reflection) is mathematically equivalent to multiplying the ray vector by a 2×2 reflection matrix R.',
    whyNeedIt:
      'Optical engineers designing telescope lenses, laser cavities, camera objectives, and retroreflectors use ray transfer matrix analysis (ABCD matrix formalism) to calculate the paths of millions of light rays through complex optical trains.',
    howItWorks: [
      {
        step: 1,
        title: 'Define Ray Vector',
        description: 'Express the propagating light ray as a vector d = [dx, dy]ᵀ where dx and dy represent directional velocity.'
      },
      {
        step: 2,
        title: 'Construct Mirror Matrix',
        description: 'A horizontal mirror (along the x-axis) reverses vertical velocity dy while preserving dx: R_x = [[1, 0], [0, -1]].'
      },
      {
        step: 3,
        title: 'Matrix Vector Product',
        description: 'Compute reflected direction: d\' = R_x · d = [dx, -dy]ᵀ.'
      },
      {
        step: 4,
        title: 'Successive Reflections',
        description: 'Reflecting off two perpendicular mirrors (x then y) multiplies matrices: R_y · R_x = -I, reversing the ray 180° back to its source!'
      }
    ],
    symbols: [
      { symbol: 'd = [dx, dy]ᵀ', name: 'Ray Vector', meaning: 'Direction vector of the propagating light beam.' },
      { symbol: 'R_x', name: 'Horizontal Mirror Matrix', meaning: '[[1, 0], [0, -1]] reflecting across the horizontal axis.' },
      { symbol: 'R_y', name: 'Vertical Mirror Matrix', meaning: '[[-1, 0], [0, 1]] reflecting across the vertical axis.' },
      { symbol: '-I', name: 'Retroreflector Matrix', meaning: '[[-1, 0], [0, -1]] reversing ray direction completely regardless of incidence angle.' }
    ],
    workedExample: {
      title: 'Ray Hitting a Perpendicular Corner Cube Reflector',
      input: 'Incident laser ray d = [3, -2]ᵀ reflecting off horizontal mirror R_x then vertical mirror R_y:',
      matrixDisplay: [
        [1, 0],
        [0, -1]
      ],
      calculation:
        'First reflection: d\' = R_x · d = [[1, 0], [0, -1]] · [3, -2]ᵀ = [3, 2]ᵀ\n' +
        'Second reflection: d\'\' = R_y · d\' = [[-1, 0], [0, 1]] · [3, 2]ᵀ = [-3, 2]ᵀ\n' +
        'Total transformation: R_y · R_x = [[-1, 0], [0, -1]] = -I\n' +
        '-I · [3, -2]ᵀ = [-3, 2]ᵀ = -[3, -2]ᵀ (Exact reverse direction!)',
      output: 'The light ray reflects back exactly parallel to its original incoming path.'
    },
    observations: [
      'A plane mirror is an involution: R² = I (reflecting twice across the same mirror returns the original direction).',
      'Two perpendicular mirrors form a retroreflector with matrix product R_x · R_y = -I.',
      'A retroreflector returns any light ray back toward its source regardless of the initial angle of incidence.'
    ],
    applications: [
      { name: 'Lunar Laser Ranging Retroreflectors', desc: 'Apollo astronauts placed corner-cube prism reflectors on the Moon to measure Earth-Moon distance with millimeter laser precision.' },
      { name: 'Bicycle & Highway Safety Reflectors', desc: 'Plastic corner reflectors bounce car headlight beams directly back to the driver’s eyes in the dark.' },
      { name: 'Laser Cavity Resonators', desc: 'ABCD optical matrices simulate photon bouncing inside helium-neon and fiber laser cavities.' }
    ],
    keyTakeaways: [
      'Light rays in 2D are vectors [dx, dy]ᵀ; optical reflections are matrix multiplications.',
      'A single mirror matrix has det(R) = -1 (orientation reversing reflection).',
      'Perpendicular mirrors multiply to -I, returning rays directly back toward their source.'
    ]
  },

  18: {
    stepNumber: 18,
    code: '18',
    title: 'Eigenvalues & Eigenvectors — Finding Special Directions',
    category: 'Advanced: Eigenvalues',
    oneLiner: 'Discover the invariant directions where a linear transformation acts as pure scalar stretching: Av = λv.',
    formula: 'A \\vec{v} = \\lambda \\vec{v}, \\quad \\det(A - \\lambda I) = 0',
    formulaDisplay: 'A · v = λ · v,  det(A − λI) = 0',
    whatIsThis:
      'When a matrix transforms space, it usually rotates and shears vectors onto completely new lines. However, for every transformation there exist special invariant directions called eigenvectors (v). When matrix A acts on an eigenvector v, it does not rotate it at all—it merely stretches or shrinks it by a scalar factor called the eigenvalue (λ): Av = λv.',
    whyNeedIt:
      'Eigenvalues and eigenvectors simplify complex matrix transformations by breaking them down into their natural, uncoupled axes. They form the foundation of Google’s PageRank algorithm, facial recognition (Eigenfaces), quantum mechanics (wavefunctions and energy levels), and vibration analysis in civil engineering.',
    howItWorks: [
      {
        step: 1,
        title: 'The Invariant Condition',
        description: 'Set up the fundamental equation: A v = λ v, which rearranges to (A - λ I) v = 0.'
      },
      {
        step: 2,
        title: 'Solve Characteristic Equation',
        description: 'For non-zero eigenvectors to exist, det(A - λ I) must equal 0. Solve this polynomial to find eigenvalues λ.'
      },
      {
        step: 3,
        title: 'Determine Eigenvectors',
        description: 'Substitute each eigenvalue λ back into (A - λ I) v = 0 to solve for the invariant direction vectors v.'
      },
      {
        step: 4,
        title: 'Geometric Interpretation',
        description: 'Input vectors along v maintain their exact angle, scaling in length by factor λ.'
      }
    ],
    symbols: [
      { symbol: 'A', name: 'Transformation Matrix', meaning: 'The n×n linear operator acting on vector space.' },
      { symbol: 'v', name: 'Eigenvector', meaning: 'A non-zero vector whose direction remains unchanged under A.' },
      { symbol: 'λ (lambda)', name: 'Eigenvalue', meaning: 'The scalar scaling factor by which eigenvector v is stretched or shrunk.' },
      { symbol: 'I', name: 'Identity Matrix', meaning: 'Square identity matrix matching the dimensions of A.' }
    ],
    workedExample: {
      title: 'Finding Eigenvalues of A = [[2, 0], [0, 1]]',
      input: 'Diagonal matrix A that doubles horizontal coordinates while preserving vertical coordinates:',
      matrixDisplay: [
        [2, 0],
        [0, 1]
      ],
      calculation:
        'det(A - λI) = (2 - λ)(1 - λ) - 0 = 0\n' +
        'Eigenvalues: λ₁ = 2,  λ₂ = 1\n' +
        'For λ₁ = 2: A · [1, 0]ᵀ = [2, 0]ᵀ = 2 · [1, 0]ᵀ → Eigenvector v₁ = [1, 0]ᵀ (x-axis)\n' +
        'For λ₂ = 1: A · [0, 1]ᵀ = [0, 1]ᵀ = 1 · [0, 1]ᵀ → Eigenvector v₂ = [0, 1]ᵀ (y-axis)',
      output: 'Vectors along the x-axis double in length without rotating; vectors along the y-axis stay completely unchanged.'
    },
    observations: [
      'Rotate the input vector X. When X and AX lie on the exact same straight line, you have found an eigenvector!',
      'When λ > 1, the eigenvector expands; when 0 < λ < 1, it contracts; when λ < 0, it flips direction 180° along the same line.',
      'For pure rotation matrices (by angles other than 0° or 180°), there are no real eigenvectors because all vectors rotate off their line.'
    ],
    applications: [
      { name: 'Google PageRank Algorithm', desc: 'Ranking billions of web pages by computing the dominant eigenvector of the global web link transition matrix.' },
      { name: 'Eigenfaces Facial Recognition', desc: 'Compressing facial databases by projecting photographs onto the principal eigenvectors of pixel covariance.' },
      { name: 'Bridge & Earthquake Resonance Analysis', desc: 'Civil engineers compute the lowest eigenvalues of structural stiffness matrices to avoid resonance collapses.' }
    ],
    keyTakeaways: [
      'Eigenvectors are special directions that do not rotate when transformed by matrix A.',
      'Eigenvalues λ are the scalar factors by which eigenvectors are stretched or shrunk: Av = λv.',
      'Eigen-decomposition reveals the fundamental axes of vibration, variance, and stability in physical and digital systems.'
    ]
  }
};
