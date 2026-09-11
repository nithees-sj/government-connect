import { CircuitBreakerService } from '../circuitBreaker.service.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../middleware/errorHandler.js';

export interface ConnectorRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  correlationId?: string;
}

export abstract class BaseConnector {
  abstract readonly code: string;
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  protected defaultTimeoutMs: number = 8000;

  /**
   * Protected HTTP dispatcher through Circuit Breaker
   */
  protected async request<T = any>(
    path: string,
    options: ConnectorRequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    return CircuitBreakerService.execute<T>(this.code, `${method} ${path}`, async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        logger.debug(`[Connector:${this.code}] ${method} ${url}`);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Correlation-ID': options.correlationId || `req-${Date.now()}`,
            'X-Caller-Service': 'GovConnect-Core-Engine',
            ...(options.headers || {}),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        const responseText = await response.text();
        let responseData: any;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        if (!response.ok) {
          const errMsg =
            (typeof responseData === 'object' && (responseData.message || responseData.error || responseData.reason)) ||
            `Connector ${this.code} responded with status ${response.status}`;
          throw new ApiError(response.status, errMsg, responseData);
        }

        return responseData as T;
      } catch (err: any) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          throw new ApiError(504, `Gateway Timeout: Connector ${this.code} timed out after ${timeoutMs}ms`);
        }
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError(502, `Bad Gateway: Connector ${this.code} communication failed: ${err.message}`);
      }
    });
  }

  /**
   * Universal health check
   */
  async checkHealth(): Promise<{ status: string; latencyMs: number; details?: any }> {
    const start = Date.now();
    try {
      const data = await this.request('/health', { timeoutMs: 3000 });
      return {
        status: 'HEALTHY',
        latencyMs: Date.now() - start,
        details: data,
      };
    } catch (error: any) {
      return {
        status: 'UNHEALTHY',
        latencyMs: Date.now() - start,
        details: error.message,
      };
    }
  }
}
