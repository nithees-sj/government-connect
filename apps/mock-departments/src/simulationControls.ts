export interface DeptSimulationConfig {
  mode: 'NORMAL' | 'SLOW' | 'TIMEOUT' | 'FAILURE' | 'MALFORMED_RESPONSE' | 'DUPLICATE_EVENT';
  slowDelayMs: number;
  failureRate: number; // 0 to 1
  consecutiveFailures: number;
}

export const simulationState: Record<'deptA' | 'deptB' | 'deptC', DeptSimulationConfig> = {
  deptA: {
    mode: 'NORMAL',
    slowDelayMs: 2000,
    failureRate: 0,
    consecutiveFailures: 0,
  },
  deptB: {
    mode: 'NORMAL',
    slowDelayMs: 2500,
    failureRate: 0,
    consecutiveFailures: 0,
  },
  deptC: {
    mode: 'NORMAL',
    slowDelayMs: 2000,
    failureRate: 0,
    consecutiveFailures: 0,
  },
};

export async function applySimulation(
  dept: 'deptA' | 'deptB' | 'deptC',
  res: any,
  next: () => any,
): Promise<void> {
  const config = simulationState[dept];

  if (config.mode === 'SLOW') {
    await new Promise((resolve) => setTimeout(resolve, config.slowDelayMs));
    await next();
    return;
  }

  if (config.mode === 'TIMEOUT') {
    // Hold connection indefinitely or until client timeout
    await new Promise((resolve) => setTimeout(resolve, 15000));
    await next();
    return;
  }

  if (config.mode === 'FAILURE') {
    config.consecutiveFailures++;
    res.status(500).json({
      error: 'Simulated Internal Server Error from Department Gateway',
      dept,
      status: 500,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (config.mode === 'MALFORMED_RESPONSE') {
    res.status(200).send('<<<MALFORMED XML/JSON CORRUPTED DATA STREAM>>>');
    return;
  }

  await next();
}
