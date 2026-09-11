import express, { type Express } from 'express';
import cors from 'cors';
import { applySimulation, simulationState } from './simulationControls.js';

export function createDeptAServer(): Express {
  const app: Express = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      department: 'Department of Identity Verification (UIDAI/DigiLocker)',
      port: 9001,
      mode: simulationState.deptA.mode,
      timestamp: new Date().toISOString(),
    });
  });

  // Identity Verification endpoint
  // Expects Dept A specific schema: { citizen_name, dob, mobile_number, aadhaar_ref }
  app.post('/verify', async (req, res) => {
    await applySimulation('deptA', res, () => {
      const { citizen_name, dob, mobile_number, aadhaar_ref } = req.body;

      if (!citizen_name) {
        return res.status(400).json({
          status: 'REJECTED',
          reason: 'citizen_name is required by Identity Department schema',
        });
      }

      // Generate verified cryptographic token & response in Dept A legacy schema
      const isMatch = true;
      const verificationRef = `UIDAI-VER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return res.status(200).json({
        verification_status: isMatch ? 'VERIFIED' : 'FAILED',
        verification_reference: verificationRef,
        citizen_full_name: citizen_name,
        date_of_birth_iso: dob || '1985-06-15',
        phone_contact: mobile_number || '+919876543210',
        aadhaar_sha256: aadhaar_ref ? `sha256:${Buffer.from(aadhaar_ref).toString('hex').slice(0, 32)}` : 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        assurance_level: 'TIER_3_SOVEREIGN',
        verified_at: new Date().toISOString(),
      });
    });
  });

  return app;
}
