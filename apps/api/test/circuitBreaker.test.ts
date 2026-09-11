import { describe, it, expect } from 'vitest';
import { CircuitBreakerService } from '../src/services/circuitBreaker.service.js';
import { CircuitBreakerState } from '@govconnect/shared-types';

describe('Circuit Breaker Resilience Engine', () => {
  it('should remain healthy on successful executions', async () => {
    const result = await CircuitBreakerService.execute(
      'CONN_TEST_SUCCESS',
      'test_ping',
      async () => 'OK_SUCCESS',
      { failureThreshold: 3, resetTimeoutMs: 1000 },
    );

    expect(result).toBe('OK_SUCCESS');
  });

  it('should trip to OPEN after crossing failureThreshold and fast-fail subsequent requests', async () => {
    const connectorCode = 'CONN_TEST_FAILING';
    const config = { failureThreshold: 3, resetTimeoutMs: 15000 };

    // 3 consecutive failures to trigger threshold
    for (let i = 0; i < 3; i++) {
      try {
        await CircuitBreakerService.execute(
          connectorCode,
          'failing_action',
          async () => {
            throw new Error('503 Service Unavailable from Mock Dept');
          },
          config,
        );
      } catch {
        // Expected downstream failure
      }
    }

    // 4th call should immediately throw 503 Circuit Breaker OPEN fast-fail error
    let fastFailed = false;
    try {
      await CircuitBreakerService.execute(
        connectorCode,
        'fast_fail_check',
        async () => 'SHOULD_NOT_EXECUTE',
        config,
      );
    } catch (err: any) {
      fastFailed = true;
      expect(err.statusCode).toBe(503);
      expect(err.message).toContain('Circuit Breaker OPEN');
    }

    expect(fastFailed).toBe(true);

    // Reset circuit breaker
    await CircuitBreakerService.reset(connectorCode);

    // Should now succeed after manual reset
    const recovered = await CircuitBreakerService.execute(
      connectorCode,
      'recovered_action',
      async () => 'RECOVERED_OK',
      config,
    );
    expect(recovered).toBe('RECOVERED_OK');
  });
});
