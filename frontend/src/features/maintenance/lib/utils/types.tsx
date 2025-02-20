export enum HealthStatus {
  OK = 'ok',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Item {
  id: string;
  name: string;
  status: HealthStatus;
  message?: string;
  source?: string;
  application?: string;
  reason?: string;
  [key: string]: string | undefined;
}

export interface HealthResult {
  status: HealthStatus;
  details?: Item[];
}

export interface HealthState {
  progress: number;
  running: boolean;
  statuses: Record<string, HealthResult>;
}

export enum ServiceType {
  AI_SERVICE = 'ai-service',
  CAMERA_ACTIVITY = 'camera-activity',
  CAMERA_ANOMALY = 'camera-anomaly',
  IMAGE_IN_STREAMS = 'image-in-streams',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  [ServiceType.AI_SERVICE]: 'AI Service',
  [ServiceType.CAMERA_ACTIVITY]: 'Camera Activity',
  [ServiceType.CAMERA_ANOMALY]: 'Camera Configuration',
  [ServiceType.IMAGE_IN_STREAMS]: 'Snapshot Configuration',
};
