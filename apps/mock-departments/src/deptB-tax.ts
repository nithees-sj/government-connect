import express, { type Express } from 'express';
import cors from 'cors';
import { applySimulation, simulationState } from './simulationControls.js';

export function createDeptBServer(): Express {
  const app: Express = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      department: 'Department of Revenue & Tax (CBDT/GSTN)',
      port: 9002,
      mode: simulationState.deptB.mode,
      timestamp: new Date().toISOString(),
    });
  });

  // Tax Verification endpoint
  // Expects Dept B specific schema: { applicantName, panNumber, assessmentYear }
  app.post('/verify', async (req, res) => {
    await applySimulation('deptB', res, () => {
      const { applicantName, panNumber, assessmentYear } = req.body;

      if (!applicantName && !panNumber) {
        return res.status(400).json({
          tax_clearance_status: 'INVALID_REQUEST',
          error: 'Either applicantName or panNumber must be supplied to CBDT endpoint',
        });
      }

      const certId = `CBDT-NOC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Return Dept B specific schema
      return res.status(200).json({
        taxpayer_id: panNumber || 'AAACR8821K',
        legal_entity_name: applicantName || 'Ravi Kumar',
        assessment_cycle: assessmentYear || '2025-2026',
        tax_compliance_rating: 'A_PLUS',
        outstanding_dues_amount: 0.0,
        clearance_certificate_number: certId,
        clearance_status: 'CLEARED',
        is_filing_defaulter: false,
        issued_timestamp: new Date().toISOString(),
      });
    });
  });

  return app;
}
