import express, { type Express } from 'express';
import cors from 'cors';
import { applySimulation, simulationState } from './simulationControls.js';

export function createDeptCServer(): Express {
  const app: Express = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      department: 'Department of Business & Commerce (MCA/Municipal Registry)',
      port: 9003,
      mode: simulationState.deptC.mode,
      timestamp: new Date().toISOString(),
    });
  });

  // Business Incorporation & Approval filing endpoint
  // Expects Dept C specific schema: { enterpriseName, sectorType, directorIdentityToken, authorizedCapitalInr }
  app.post('/register', async (req, res) => {
    await applySimulation('deptC', res, () => {
      const { enterpriseName, sectorType, directorIdentityToken, authorizedCapitalInr } = req.body;

      if (!enterpriseName) {
        return res.status(400).json({
          registration_status: 'REJECTED',
          message: 'enterpriseName is mandatory for commercial filing',
        });
      }

      const registrationId = `MCA-INC-${Date.now()}`;
      const cin = `U${Math.floor(10000 + Math.random() * 90000)}DL2026PTC${Math.floor(100000 + Math.random() * 900000)}`;

      return res.status(200).json({
        filing_acknowledgement: registrationId,
        corporate_identification_number: cin,
        approved_trade_name: enterpriseName,
        industry_sector: sectorType || 'Information Technology & Software',
        registered_capital_amount: authorizedCapitalInr || 1000000,
        incorporation_status: 'STAGE_1_CLEARANCE_ACCEPTED',
        officer_desk_queue: 'NEW_DELHI_COMMERCE_DESK_4',
        filing_date_utc: new Date().toISOString(),
      });
    });
  });

  return app;
}
