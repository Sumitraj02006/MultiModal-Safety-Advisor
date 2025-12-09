export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  safetyScore: number; // 0-100
  summary: string;
  risks: string[];
  safeHavens: string[];
  sources: Array<{ title: string; uri: string }>;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANALYZE = 'ANALYZE',
  CHAT = 'CHAT',
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}