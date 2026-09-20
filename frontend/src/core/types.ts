export type LearningLevel = 'basic' | 'advanced';

export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][]; // 2D array of values (e.g. 0-255 for grayscale)
}

export interface RGBPixel {
  r: number;
  g: number;
  b: number;
}

export interface RGBMatrixData {
  rMatrix: number[][];
  gMatrix: number[][];
  bMatrix: number[][];
}

export interface StepInfo {
  id: number;
  title: string;
  subtitle: string;
  description: string;
}

export interface Matrix2x2 {
  a: number;
  b: number;
  c: number;
  d: number;
}
