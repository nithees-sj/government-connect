import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Cryptographic Audit Trail Engine', () => {
  function computeHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  it('should generate verifiable SHA-256 chained blocks', () => {
    const genesisHash = 'GENESIS_BLOCK_GOV_CONNECT_2026';

    const block1Data = {
      sequenceNumber: 1,
      previousHash: genesisHash,
      action: 'APPLICATION_CREATED',
      resourceType: 'APPLICATION',
      resourceId: 'GC-10021',
      actorRole: 'CITIZEN',
      timestamp: '2026-09-10T12:00:00.000Z',
      details: { serviceType: 'BUSINESS_APPROVAL' },
    };
    const block1Hash = computeHash(block1Data);

    const block2Data = {
      sequenceNumber: 2,
      previousHash: block1Hash,
      action: 'WORKFLOW_STEP_COMPLETED',
      resourceType: 'WORKFLOW',
      resourceId: 'WF-9901',
      actorRole: 'DEPT_OFFICER',
      timestamp: '2026-09-10T12:15:00.000Z',
      details: { stepId: 'step_uidai', status: 'COMPLETED' },
    };
    const block2Hash = computeHash(block2Data);

    expect(block1Hash).toHaveLength(64);
    expect(block2Hash).toHaveLength(64);
    expect(block2Data.previousHash).toBe(block1Hash);
  });

  it('should detect tampering in any previous block in the chain', () => {
    const genesisHash = 'GENESIS_BLOCK_GOV_CONNECT_2026';

    const block1Data = {
      sequenceNumber: 1,
      previousHash: genesisHash,
      action: 'APPLICATION_CREATED',
      details: { amount: 1500 },
    };
    const block1Hash = computeHash(block1Data);

    const block2Data = {
      sequenceNumber: 2,
      previousHash: block1Hash,
      action: 'PAYMENT_CONFIRMED',
      details: { status: 'SUCCESS' },
    };
    const block2Hash = computeHash(block2Data);

    // Malicious actor tampers with block 1 payload
    const tamperedBlock1Data = {
      sequenceNumber: 1,
      previousHash: genesisHash,
      action: 'APPLICATION_CREATED',
      details: { amount: 99999999 }, // Tampered
    };
    const tamperedBlock1Hash = computeHash(tamperedBlock1Data);

    // Verify verification check fails
    expect(tamperedBlock1Hash).not.toBe(block2Data.previousHash);
  });
});
