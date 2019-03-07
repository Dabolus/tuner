export interface Locale {
  dialect: string;
  loading: string;
  start: string;
  waitingMic: string;
  warmingUp: string;
  initError(message: string): string;
  [key: string]: any;
}

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
