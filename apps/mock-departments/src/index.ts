import express from 'express';
import cors from 'cors';
import { createDeptAServer } from './deptA-identity.js';
import { createDeptBServer } from './deptB-tax.js';
import { createDeptCServer } from './deptC-business.js';
import { simulationState } from './simulationControls.js';

const PORT_A = parseInt(process.env.DEPT_A_PORT || '9001', 10);
const PORT_B = parseInt(process.env.DEPT_B_PORT || '9002', 10);
const PORT_C = parseInt(process.env.DEPT_C_PORT || '9003', 10);
const PORT_SIM = parseInt(process.env.SIM_PORT || '9000', 10);

// 1. Start Dept A Server (9001)
const appA = createDeptAServer();
appA.listen(PORT_A, () => {
  console.log(`🏛️ Department A (Identity/UIDAI) running on http://localhost:${PORT_A}`);
});

// 2. Start Dept B Server (9002)
const appB = createDeptBServer();
appB.listen(PORT_B, () => {
  console.log(`💰 Department B (Revenue/Tax) running on http://localhost:${PORT_B}`);
});

// 3. Start Dept C Server (9003)
const appC = createDeptCServer();
appC.listen(PORT_C, () => {
  console.log(`🏢 Department C (Business/MCA) running on http://localhost:${PORT_C}`);
});

// 4. Start Simulation Control API (9000)
const simApp = express();
simApp.use(cors());
simApp.use(express.json());

simApp.get('/simulation/status', (_req, res) => {
  res.json({
    success: true,
    data: simulationState,
  });
});

const resolveDeptKey = (raw: string): 'deptA' | 'deptB' | 'deptC' | null => {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === 'DEPTA' || upper === 'DEPT_A' || upper.includes('UIDAI') || upper.includes('IDENTITY') || upper === 'A') {
    return 'deptA';
  }
  if (upper === 'DEPTB' || upper === 'DEPT_B' || upper.includes('CBDT') || upper.includes('TAX') || upper === 'B') {
    return 'deptB';
  }
  if (upper === 'DEPTC' || upper === 'DEPT_C' || upper.includes('MCA') || upper.includes('COMMERCE') || upper.includes('BUSINESS') || upper === 'C') {
    return 'deptC';
  }
  if (raw === 'deptA' || raw === 'deptB' || raw === 'deptC') {
    return raw;
  }
  return null;
};

const handleConfigureSimulation = (req: express.Request, res: express.Response) => {
  const rawDept = req.body.dept || req.body.department || '';
  const deptKey = resolveDeptKey(rawDept);

  if (!deptKey || !simulationState[deptKey]) {
    return res.status(400).json({
      success: false,
      error: `Invalid department '${rawDept}'. Must resolve to deptA (UIDAI), deptB (CBDT), or deptC (MCA).`,
    });
  }

  const { mode, slowDelayMs, latencyMs } = req.body;
  const target = simulationState[deptKey];
  if (mode) target.mode = mode;
  if (slowDelayMs || latencyMs) target.slowDelayMs = Number(slowDelayMs || latencyMs);

  console.log(`⚙️ Simulation state updated for ${deptKey} (${rawDept}): Mode=${target.mode}, Latency=${target.slowDelayMs}ms`);

  res.json({
    success: true,
    message: `Updated simulation state for ${deptKey}`,
    data: simulationState,
  });
};

simApp.post('/simulation/configure', handleConfigureSimulation);
simApp.post('/simulation/set-mode', handleConfigureSimulation);
simApp.post('/simulation/mode', handleConfigureSimulation);

simApp.listen(PORT_SIM, () => {
  console.log(`🎛️ Simulation Control Gateway running on http://localhost:${PORT_SIM}`);
});
