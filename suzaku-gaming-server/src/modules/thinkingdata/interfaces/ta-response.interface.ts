// src/modules/thinkingdata/interfaces/ta-response.interface.ts

export interface TAQueryResponse {
  return_code: number;
  return_message: string;
  result?: {
    columns: string[];
    rows: (string | number | null)[][];
  };
}

export interface TAUserBehavior {
  userId: string;
  eventName: string;
  eventCount: number;
  eventDate: string;
  lastEventTime: string;
}

export interface TASyncResult {
  success: boolean;
  syncDate: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  duration: number;
  error?: string;
}
