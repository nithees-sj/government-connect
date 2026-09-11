import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Sliders,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Flame,
  Bug,
  Clock,
  Zap,
  Activity,
  Play,
} from 'lucide-react';
import './AdminDemoControlsPage.css';

type SimMode = 'NORMAL' | 'SLOW' | 'TIMEOUT' | 'FAILURE' | 'MALFORMED_RESPONSE';

interface DeptSimState {
  code: string;
  name: string;
  port: number;
  mode: SimMode;
  latencyMs: number;
  workflowStepName: string;
}

const INITIAL_DEPTS: Record<string, DeptSimState> = {
  DEPT_UIDAI: {
    code: 'DEPT_UIDAI',
    name: 'Dept A: UIDAI Aadhaar Gateway',
    port: 9001,
    mode: 'NORMAL',
    latencyMs: 40,
    workflowStepName: 'Step 1: Identity & DigiLocker Pre-Validation',
  },
  DEPT_CBDT: {
    code: 'DEPT_CBDT',
    name: 'Dept B: CBDT Commercial Tax API',
    port: 9002,
    mode: 'NORMAL',
    latencyMs: 65,
    workflowStepName: 'Step 2: Tax Clearance & Compliance Verification',
  },
  DEPT_MCA: {
    code: 'DEPT_MCA',
    name: 'Dept C: MCA Corporate Registry',
    port: 9003,
    mode: 'NORMAL',
    latencyMs: 50,
    workflowStepName: 'Step 3: Commercial Filing & Entity Registration',
  },
};

export function AdminDemoControlsPage() {
  const [deptStates, setDeptStates] = useState<Record<string, DeptSimState>>(INITIAL_DEPTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testingDept, setTestingDept] = useState<string | null>(null);

  const fetchSimulationStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/simulation/status');
      if (res.data?.success && res.data?.data) {
        const raw = res.data.data;
        setDeptStates((prev) => {
          const next = { ...prev };
          if (raw.deptA || raw.DEPT_UIDAI) {
            const dataA = raw.DEPT_UIDAI || raw.deptA;
            next.DEPT_UIDAI = {
              ...next.DEPT_UIDAI,
              mode: dataA.mode || 'NORMAL',
              latencyMs: dataA.slowDelayMs || (dataA.mode === 'SLOW' ? 2500 : 40),
            };
          }
          if (raw.deptB || raw.DEPT_CBDT) {
            const dataB = raw.DEPT_CBDT || raw.deptB;
            next.DEPT_CBDT = {
              ...next.DEPT_CBDT,
              mode: dataB.mode || 'NORMAL',
              latencyMs: dataB.slowDelayMs || (dataB.mode === 'SLOW' ? 2500 : 65),
            };
          }
          if (raw.deptC || raw.DEPT_MCA) {
            const dataC = raw.DEPT_MCA || raw.deptC;
            next.DEPT_MCA = {
              ...next.DEPT_MCA,
              mode: dataC.mode || 'NORMAL',
              latencyMs: dataC.slowDelayMs || (dataC.mode === 'SLOW' ? 2500 : 50),
            };
          }
          return next;
        });
      }
    } catch {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulationStatus();
  }, []);

  const handleSetMode = async (deptCode: string, mode: SimMode) => {
    const prevMode = deptStates[deptCode]?.mode;
    try {
      setDeptStates((prev) => ({
        ...prev,
        [deptCode]: {
          ...prev[deptCode],
          mode,
          latencyMs: mode === 'SLOW' ? 2500 : mode === 'TIMEOUT' ? 10000 : 50,
        },
      }));

      const res = await api.post('/admin/simulation/mode', {
        department: deptCode,
        mode,
        latencyMs: mode === 'SLOW' ? 2500 : 0,
      });

      if (res.data?.success) {
        setActionNotice({
          type: 'success',
          message: `Fault injection updated: ${deptCode} set to ${mode}. Inbound citizen workflows will experience this behavior live.`,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to update simulation');
      }
    } catch (err: any) {
      // Revert on error
      if (prevMode) {
        setDeptStates((prev) => ({
          ...prev,
          [deptCode]: {
            ...prev[deptCode],
            mode: prevMode,
          },
        }));
      }
      setActionNotice({
        type: 'error',
        message: `Failed to set simulation mode: ${err.response?.data?.message || err.message}`,
      });
    }
  };

  const handleResetAllToNormal = async () => {
    try {
      setLoading(true);
      for (const code of Object.keys(deptStates)) {
        await api.post('/admin/simulation/mode', {
          department: code,
          mode: 'NORMAL',
          latencyMs: 0,
        });
      }
      await fetchSimulationStatus();
      setActionNotice({
        type: 'success',
        message: 'All federated mock department microservices restored to NORMAL (200 OK) healthy operating state.',
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: `Error resetting simulation modes: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPing = async (deptCode: string) => {
    try {
      setTestingDept(deptCode);
      const res = await api.post(`/admin/connectors/${deptCode}/test`);
      if (res.data?.success) {
        const health = res.data.data;
        setActionNotice({
          type: 'success',
          message: `Live Gateway Ping for ${deptCode}: Status is ${health.status} (${health.latencyMs}ms).`,
        });
      } else {
        throw new Error(res.data?.message || 'Ping failed');
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: `Live Gateway Ping for ${deptCode} returned error: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setTestingDept(null);
    }
  };

  return (
    <div className="admin-demo-controls">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="admin-demo-controls__header">
        <div>
          <div className="admin-badge">
            <Sliders size={14} />
            <span>SIH Live Demo Resilience Controller</span>
          </div>
          <h1 className="admin-title">Fault Injection & Simulation Controls</h1>
          <p className="admin-desc">
            Interactively inject network latency, timeouts, 500 server errors, and malformed schemas into mock department microservices. When a citizen submits a new service application, observe the automated retries, circuit breaker tripping, and granular failure diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={fetchSimulationStatus} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Status</span>
          </button>
          <button className="btn-primary" onClick={handleResetAllToNormal} style={{ background: '#16a34a' }}>
            <RotateCcw size={15} />
            <span>Reset All to NORMAL</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className={`alert-banner alert-banner--${actionNotice.type}`}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* ─── Department Cards Grid ─────────────────────────── */}
      <div className="sim-depts-grid">
        {Object.values(deptStates).map((dept) => (
          <div key={dept.code} className="gov-card sim-dept-card">
            <div className="sim-dept-card__header">
              <div>
                <span className="badge badge-teal" style={{ fontSize: '0.6875rem' }}>Port {dept.port}</span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '4px 0 2px' }}>{dept.name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Impacts: <strong>{dept.workflowStepName}</strong></span>
              </div>

              <div className={`sim-status-pill sim-status-pill--${dept.mode.toLowerCase()}`}>
                {dept.mode}
              </div>
            </div>

            <div className="sim-modes-selector">
              <label className="sim-mode-label">Select Fault Injection Mode:</label>

              <div className="sim-mode-options">
                <button
                  className={`sim-mode-btn ${dept.mode === 'NORMAL' ? 'sim-mode-btn--active-normal' : ''}`}
                  onClick={() => handleSetMode(dept.code, 'NORMAL')}
                >
                  <CheckCircle2 size={14} />
                  <span>NORMAL (200 OK)</span>
                </button>

                <button
                  className={`sim-mode-btn ${dept.mode === 'SLOW' ? 'sim-mode-btn--active-warning' : ''}`}
                  onClick={() => handleSetMode(dept.code, 'SLOW')}
                >
                  <Clock size={14} />
                  <span>SLOW (2500ms Delay)</span>
                </button>

                <button
                  className={`sim-mode-btn ${dept.mode === 'TIMEOUT' ? 'sim-mode-btn--active-warning' : ''}`}
                  onClick={() => handleSetMode(dept.code, 'TIMEOUT')}
                >
                  <Flame size={14} />
                  <span>TIMEOUT (Socket Drop)</span>
                </button>

                <button
                  className={`sim-mode-btn ${dept.mode === 'FAILURE' ? 'sim-mode-btn--active-danger' : ''}`}
                  onClick={() => handleSetMode(dept.code, 'FAILURE')}
                >
                  <AlertTriangle size={14} />
                  <span>FAILURE (500 Error → Step Fail)</span>
                </button>

                <button
                  className={`sim-mode-btn ${dept.mode === 'MALFORMED_RESPONSE' ? 'sim-mode-btn--active-warning' : ''}`}
                  onClick={() => handleSetMode(dept.code, 'MALFORMED_RESPONSE')}
                >
                  <Bug size={14} />
                  <span>MALFORMED SCHEMA</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Mode: <strong style={{ color: dept.mode === 'FAILURE' ? '#dc2626' : dept.mode === 'NORMAL' ? '#16a34a' : '#d97706' }}>{dept.mode}</strong>
              </span>
              <button
                className="btn-outline btn-sm"
                onClick={() => handleTestPing(dept.code)}
                disabled={testingDept === dept.code}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <Play size={12} />
                <span>{testingDept === dept.code ? 'Pinging...' : 'Test Gateway Ping'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
