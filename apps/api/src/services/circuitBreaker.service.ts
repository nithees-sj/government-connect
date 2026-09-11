import mongoose from 'mongoose';
import { CircuitBreakerState } from '@govconnect/shared-types';
import { Connector, type IConnectorDocument } from '../models/Connector.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  resetTimeoutMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  successThreshold: 2,
  resetTimeoutMs: 15000, // 15 seconds
};

// In-memory cache to avoid DB roundtrips on every sub-millisecond call
interface CircuitMemoryState {
  state: CircuitBreakerState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextAttemptTime: number;
}

const memoryState = new Map<string, CircuitMemoryState>();

export class CircuitBreakerService {
  private static getState(connectorCode: string): CircuitMemoryState {
    if (!memoryState.has(connectorCode)) {
      memoryState.set(connectorCode, {
        state: CircuitBreakerState.CLOSED,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        nextAttemptTime: 0,
      });
    }
    return memoryState.get(connectorCode)!;
  }

  /**
   * Execute an async connector call through the Circuit Breaker
   */
  static async execute<T>(
    connectorCode: string,
    actionName: string,
    fn: () => Promise<T>,
    customConfig?: Partial<CircuitBreakerConfig>,
  ): Promise<T> {
    const config = { ...DEFAULT_CONFIG, ...customConfig };
    const tracker = this.getState(connectorCode);
    const now = Date.now();

    // Check state transitions from OPEN -> HALF_OPEN
    if (tracker.state === CircuitBreakerState.OPEN) {
      if (now >= tracker.nextAttemptTime) {
        logger.warn(
          `⚡ Circuit Breaker [${connectorCode}]: Reset timeout elapsed. Transitioning from OPEN to HALF_OPEN for trial request.`,
        );
        tracker.state = CircuitBreakerState.HALF_OPEN;
        tracker.consecutiveSuccesses = 0;
        await this.persistState(connectorCode, CircuitBreakerState.HALF_OPEN);
      } else {
        const waitSec = Math.ceil((tracker.nextAttemptTime - now) / 1000);
        logger.warn(
          `⛔ Circuit Breaker [${connectorCode}]: Fast-failing call to '${actionName}'. Circuit is OPEN (retry in ${waitSec}s).`,
        );
        throw new ApiError(
          503,
          `Downstream department connector '${connectorCode}' is currently unavailable (Circuit Breaker OPEN). Retry in ${waitSec}s.`,
        );
      }
    }

    // Execute the protected function
    const startTime = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      await this.recordSuccess(connectorCode, durationMs, config);
      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.recordFailure(connectorCode, error, durationMs, config);
      throw error;
    }
  }

  private static async recordSuccess(
    connectorCode: string,
    durationMs: number,
    config: CircuitBreakerConfig,
  ) {
    const tracker = this.getState(connectorCode);
    tracker.lastSuccessTime = Date.now();
    tracker.consecutiveFailures = 0;
    tracker.consecutiveSuccesses += 1;

    if (tracker.state === CircuitBreakerState.HALF_OPEN) {
      if (tracker.consecutiveSuccesses >= config.successThreshold) {
        logger.info(
          `✅ Circuit Breaker [${connectorCode}]: Recovered after ${tracker.consecutiveSuccesses} successful trial calls. Transitioning to CLOSED.`,
        );
        tracker.state = CircuitBreakerState.CLOSED;
        tracker.consecutiveSuccesses = 0;
        await this.persistState(connectorCode, CircuitBreakerState.CLOSED);
      }
    }

    // Update connector stats in DB asynchronously
    if (mongoose.connection?.readyState === 1) {
      Connector.updateOne(
        { code: connectorCode },
        {
          $inc: { 'metrics.totalRequests': 1, 'metrics.successfulRequests': 1 },
          $set: {
            'metrics.lastSuccess': new Date(),
            'metrics.averageLatencyMs': durationMs,
            circuitState: tracker.state,
            isActive: true,
          },
        },
      ).catch((err) =>
        logger.error(`Failed to update connector metrics for ${connectorCode}:`, err),
      );
    }
  }

  private static async recordFailure(
    connectorCode: string,
    error: any,
    durationMs: number,
    config: CircuitBreakerConfig,
  ) {
    const tracker = this.getState(connectorCode);
    const now = Date.now();
    tracker.lastFailureTime = now;
    tracker.consecutiveFailures += 1;
    tracker.consecutiveSuccesses = 0;

    logger.warn(
      `⚠️ Circuit Breaker [${connectorCode}]: Failure recorded (#${tracker.consecutiveFailures}): ${error.message}`,
    );

    if (
      tracker.state === CircuitBreakerState.CLOSED &&
      tracker.consecutiveFailures >= config.failureThreshold
    ) {
      tracker.state = CircuitBreakerState.OPEN;
      tracker.nextAttemptTime = now + config.resetTimeoutMs;
      logger.error(
        `🚨 Circuit Breaker [${connectorCode}]: Threshold reached (${tracker.consecutiveFailures} consecutive failures). Tripping circuit to OPEN for ${config.resetTimeoutMs / 1000}s!`,
      );
      await this.persistState(connectorCode, CircuitBreakerState.OPEN);
    } else if (tracker.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately trips back to OPEN
      tracker.state = CircuitBreakerState.OPEN;
      tracker.nextAttemptTime = now + config.resetTimeoutMs;
      logger.error(
        `🚨 Circuit Breaker [${connectorCode}]: Trial call failed during HALF_OPEN. Tripping back to OPEN for ${config.resetTimeoutMs / 1000}s!`,
      );
      await this.persistState(connectorCode, CircuitBreakerState.OPEN);
    }

    // Update DB stats asynchronously
    if (mongoose.connection?.readyState === 1) {
      Connector.updateOne(
        { code: connectorCode },
        {
          $inc: { 'metrics.totalRequests': 1, 'metrics.failedRequests': 1 },
          $set: {
            'metrics.lastFailure': new Date(),
            'metrics.lastErrorMessage': error.message || 'Unknown error',
            circuitState: tracker.state,
          },
        },
      ).catch((err) =>
        logger.error(`Failed to update connector failure metrics for ${connectorCode}:`, err),
      );
    }
  }

  private static async persistState(connectorCode: string, state: CircuitBreakerState) {
    try {
      if (mongoose.connection?.readyState === 1) {
        await Connector.updateOne({ code: connectorCode }, { $set: { circuitState: state } });
      }
    } catch (err) {
      logger.error(`Failed to persist circuit state for ${connectorCode}:`, err);
    }
  }

  /**
   * Manually reset circuit breaker state (e.g. from Admin Dashboard)
   */
  static async reset(connectorCode: string): Promise<void> {
    const tracker = this.getState(connectorCode);
    tracker.state = CircuitBreakerState.CLOSED;
    tracker.consecutiveFailures = 0;
    tracker.consecutiveSuccesses = 0;
    tracker.nextAttemptTime = 0;
    await this.persistState(connectorCode, CircuitBreakerState.CLOSED);
    logger.info(`🔄 Circuit Breaker for ${connectorCode} manually reset to CLOSED.`);
  }

  /**
   * Get all circuit breaker statuses
   */
  static getAllStatuses(): Record<string, CircuitMemoryState> {
    const result: Record<string, CircuitMemoryState> = {};
    memoryState.forEach((val, key) => {
      result[key] = { ...val };
    });
    return result;
  }
}
