export interface WorkerRequest {
  buffer: Float32Array;
  sampleRate: number;
}

export interface WorkerResponse {
  cents: number;
  centsAngle: number;
  frequency: number;
  index: number;
  noteFrequency: number;
}
