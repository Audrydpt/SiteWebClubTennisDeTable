/* eslint-disable */
export interface ForensicResult {
  id: string;
  imageData: string;
  timestamp: string;
  score: number;
  progress?: number;
  cameraId: string;
  type?: string;
  source?: string;
  camera?: string;
  attributes?: {
    color?: Record<string, number>;
    type?: Record<string, number>;
    [key: string]: any;
  };
}
