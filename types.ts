export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: string;
  label: string;
  coordinate: Coordinate;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number; // Physical distance in meters
  safetyWeight: number; // Multiplier: 1 = Safe, 5+ = Dangerous
}

export interface RouteResult {
  path: string[]; // Array of Node IDs
  totalDistance: number;
  averageSafetyScore: number;
}

export interface DangerZone {
  id: string;
  name: string;
  polygon: Coordinate[];
  riskLevel: number; // 1-10
  description: string;
}

export enum RouteType {
  SHORTEST = 'shortest',
  SAFEST = 'safest'
}

export interface GeminiAdvice {
  summary: string;
  tips: string[];
}