/**
 * Core Linear Algebra & Matrix Processing Engine
 */

export function createEmptyMatrix(rows, cols, initialValue = 0) {
  return Array.from({ length: rows }, () => Array(cols).fill(initialValue));
}

export function clampPixel(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function scaleMatrix(matrix, scalar) {
  return matrix.map(row =>
    row.map(val => clampPixel(val * scalar))
  );
}

export function splitRGBChannels(colorGrid) {
  const rows = colorGrid.length;
  const cols = colorGrid[0].length;
  const rMatrix = createEmptyMatrix(rows, cols);
  const gMatrix = createEmptyMatrix(rows, cols);
  const bMatrix = createEmptyMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rMatrix[i][j] = colorGrid[i][j].r;
      gMatrix[i][j] = colorGrid[i][j].g;
      bMatrix[i][j] = colorGrid[i][j].b;
    }
  }

  return { rMatrix, gMatrix, bMatrix };
}

export function combineRGBChannels(rMatrix, gMatrix, bMatrix) {
  const rows = rMatrix.length;
  const cols = rMatrix[0].length;
  const colorGrid = [];

  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        r: clampPixel(rMatrix[i][j]),
        g: clampPixel(gMatrix[i][j]),
        b: clampPixel(bMatrix[i][j]),
      });
    }
    colorGrid.push(row);
  }

  return colorGrid;
}
