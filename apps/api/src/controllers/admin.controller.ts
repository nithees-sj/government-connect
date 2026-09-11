import { Request, Response, NextFunction } from 'express';
import { Connector, type IConnectorDocument } from '../models/Connector.js';
import { SchemaMapping } from '../models/SchemaMapping.js';
import { ConnectorRegistry } from '../services/connectors/ConnectorRegistry.js';
import { CircuitBreakerService } from '../services/circuitBreaker.service.js';
import { TransformationService } from '../services/transformation.service.js';
import { AuditService } from '../services/audit.service.js';
import { MonitoringService } from '../services/monitoring.service.js';
import { ApiError } from '../middleware/errorHandler.js';
import { AuditAction } from '@govconnect/shared-types';
import { config } from '../config/index.js';

/**
 * ─── Connectors & Circuit Breaker ────────────────────────
 */
export async function getConnectors(_req: Request, res: Response, next: NextFunction) {
  try {
    const connectors = (await Connector.find().lean()) as unknown as IConnectorDocument[];
    const breakerStatuses = CircuitBreakerService.getAllStatuses();

    const result = connectors.map((c) => {
      const memory = breakerStatuses[c.code];
      return {
        ...c,
        circuitState: memory?.state || c.circuitState || 'CLOSED',
        consecutiveFailures: memory?.consecutiveFailures || 0,
        consecutiveSuccesses: memory?.consecutiveSuccesses || 0,
        nextAttemptTime: memory?.nextAttemptTime || 0,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function testConnector(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code as string;
    const connector = ConnectorRegistry.getConnector(code);
    const health = await connector.checkHealth();

    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorName: req.user?.name || 'Admin',
      action: AuditAction.CONNECTOR_TESTED,
      resourceType: 'Connector',
      resourceId: code,
      details: { health },
    });

    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
}

export async function resetCircuitBreaker(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code as string;
    await CircuitBreakerService.reset(code);

    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorName: req.user?.name || 'Admin',
      action: AuditAction.CIRCUIT_BREAKER_RESET,
      resourceType: 'Connector',
      resourceId: code,
      details: { manualReset: true },
    });

    res.json({ success: true, message: `Circuit breaker for connector '${code}' reset to CLOSED` });
  } catch (error) {
    next(error);
  }
}

/**
 * ─── Schema Mappings & Transformation ─────────────────────
 */
export async function getSchemaMappings(_req: Request, res: Response, next: NextFunction) {
  try {
    const mappings = await SchemaMapping.find().sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: mappings });
  } catch (error) {
    next(error);
  }
}

export async function createSchemaMapping(req: Request, res: Response, next: NextFunction) {
  try {
    const mapping = await SchemaMapping.create(req.body);

    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorName: req.user?.name || 'Admin',
      action: AuditAction.SCHEMA_MAPPING_CREATED,
      resourceType: 'SchemaMapping',
      resourceId: mapping._id.toString(),
      details: { source: mapping.sourceSystem, target: mapping.targetSystem, version: mapping.version },
    });

    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    next(error);
  }
}

export async function testTransformation(req: Request, res: Response, next: NextFunction) {
  try {
    const { rules, samplePayload } = req.body;
    const start = Date.now();
    const result = TransformationService.transformObject(samplePayload, rules);
    const durationMs = Date.now() - start;

    res.json({
      success: true,
      data: {
        output: result,
        durationMs,
        rulesEvaluated: rules.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ─── Audit Trail & Hash Chain Integrity ──────────────────
 */
export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = {
      actorId: req.query.actorId as string,
      action: req.query.action as any,
      resourceType: req.query.resourceType as string,
      resourceId: req.query.resourceId as string,
      correlationId: req.query.correlationId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await AuditService.queryLogs(filter);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function verifyAuditIntegrity(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AuditService.verifyChainIntegrity(500);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * ─── Telemetry & Monitoring Overview ─────────────────────
 */
export async function getMonitoringOverview(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await MonitoringService.getSystemOverview();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * ─── Simulation Controls (Demo Failure Mode Toggles) ──────
 */
export async function getSimulationStatus(_req: Request, res: Response, _next: NextFunction) {
  try {
    const simBase = config.departments.simulationUrl || 'http://localhost:9000';
    const simUrl = `${simBase}/simulation/status`;
    const response = await fetch(simUrl, { signal: AbortSignal.timeout(3000) });
    const data = (await response.json()) as any;
    const simState = data.data || data;

    // Return unified state with both deptA/B/C and institutional department codes
    res.json({
      success: true,
      data: {
        ...simState,
        DEPT_UIDAI: simState.deptA,
        DEPT_CBDT: simState.deptB,
        DEPT_MCA: simState.deptC,
      },
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        status: 'STANDALONE',
        deptA: { mode: 'NORMAL', slowDelayMs: 2000, consecutiveFailures: 0 },
        deptB: { mode: 'NORMAL', slowDelayMs: 2500, consecutiveFailures: 0 },
        deptC: { mode: 'NORMAL', slowDelayMs: 2000, consecutiveFailures: 0 },
        DEPT_UIDAI: { mode: 'NORMAL', slowDelayMs: 2000, consecutiveFailures: 0 },
        DEPT_CBDT: { mode: 'NORMAL', slowDelayMs: 2500, consecutiveFailures: 0 },
        DEPT_MCA: { mode: 'NORMAL', slowDelayMs: 2000, consecutiveFailures: 0 },
      },
    });
  }
}

export async function setSimulationMode(req: Request, res: Response, next: NextFunction) {
  try {
    const { department, dept, mode, latencyMs, slowDelayMs } = req.body;
    const rawDept = department || dept || '';
    
    // Map department code to deptA, deptB, deptC
    let deptKey = 'deptA';
    const upper = String(rawDept).toUpperCase();
    if (upper.includes('UIDAI') || upper.includes('IDENTITY') || upper === 'DEPT_A' || upper === 'A' || rawDept === 'deptA') {
      deptKey = 'deptA';
    } else if (upper.includes('CBDT') || upper.includes('TAX') || upper === 'DEPT_B' || upper === 'B' || rawDept === 'deptB') {
      deptKey = 'deptB';
    } else if (upper.includes('MCA') || upper.includes('COMMERCE') || upper.includes('BUSINESS') || upper === 'DEPT_C' || upper === 'C' || rawDept === 'deptC') {
      deptKey = 'deptC';
    }

    const simBase = config.departments.simulationUrl || 'http://localhost:9000';
    const simUrl = `${simBase}/simulation/configure`;

    const response = await fetch(simUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dept: deptKey,
        mode,
        slowDelayMs: latencyMs || slowDelayMs || (mode === 'SLOW' ? 2500 : 0),
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Simulation service on ${simBase} responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();

    await AuditService.logEvent({
      actorId: req.user?.userId,
      actorName: req.user?.name || 'Admin',
      action: AuditAction.SYSTEM_CONFIG_UPDATED,
      resourceType: 'SimulationController',
      resourceId: rawDept || deptKey,
      details: { mode, latencyMs: latencyMs || slowDelayMs, resolvedDept: deptKey },
    });

    res.json({ success: true, data });
  } catch (error: any) {
    next(new ApiError(502, `Failed to update simulation controls: ${error.message}`));
  }
}
