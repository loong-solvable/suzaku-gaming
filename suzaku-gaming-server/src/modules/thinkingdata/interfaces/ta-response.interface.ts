// src/modules/thinkingdata/interfaces/ta-response.interface.ts

/**
 * ThinkingData /querySql API 响应格式
 * 文档: https://docs.thinkingdata.jp/ta-manual/latest/en/technical_document/open_api/data_api.html
 * 
 * JSON 格式返回时：
 * - 第一行包含状态和元数据
 * - data.headers 包含列名
 * - 后续行是数据行
 */
export interface TAQueryResponse {
  return_code: number;
  return_message: string;
  // 兼容两种可能的响应格式
  data?: {
    headers?: string[];
    rows?: (string | number | null)[][];
  };
  // 旧格式兼容
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
