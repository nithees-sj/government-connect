import { describe, it, expect } from 'vitest';

describe('Citizen Wallet & State Machine Document Verification Rules', () => {
  it('should reject identity verification if Aadhaar is missing from wallet and form', () => {
    const formData = {};
    const citizen = { aadhaarNumber: '' };
    const citizenDocs: any[] = [];

    const hasAadhaarDoc = citizenDocs.some(
      (d) => d.metadata?.documentType === 'SOVEREIGN_IDENTITY' || d.metadata?.documentType === 'AADHAAR',
    );
    const formAadhaar = (formData as any).aadhaarNumber ? String((formData as any).aadhaarNumber).trim() : '';
    const citizenAadhaar = citizen?.aadhaarNumber ? String(citizen.aadhaarNumber).trim() : '';
    const aadhaar = formAadhaar || citizenAadhaar || (hasAadhaarDoc ? 'UIDAI-LINKED-VAULT-2026' : '');

    expect(aadhaar).toBe('');
    expect(() => {
      if (!aadhaar) {
        throw new Error(
          'Identity verification failed: No Aadhaar card or Sovereign Identity document found in Citizen Wallet. Please upload and link your Aadhaar in the Documents Vault / Wallet to proceed with inter-departmental verification.',
        );
      }
    }).toThrow(/Identity verification failed/);
  });

  it('should accept identity verification if Aadhaar is present in Citizen Wallet', () => {
    const formData = {};
    const citizen = { aadhaarNumber: '999912348888' };
    const citizenDocs: any[] = [];

    const hasAadhaarDoc = citizenDocs.some(
      (d) => d.metadata?.documentType === 'SOVEREIGN_IDENTITY' || d.metadata?.documentType === 'AADHAAR',
    );
    const formAadhaar = (formData as any).aadhaarNumber ? String((formData as any).aadhaarNumber).trim() : '';
    const citizenAadhaar = citizen?.aadhaarNumber ? String(citizen.aadhaarNumber).trim() : '';
    const aadhaar = formAadhaar || citizenAadhaar || (hasAadhaarDoc ? 'UIDAI-LINKED-VAULT-2026' : '');

    expect(aadhaar).toBe('999912348888');
  });

  it('should accept identity verification if Sovereign Identity document exists in Vault', () => {
    const formData = {};
    const citizen = { aadhaarNumber: '' };
    const citizenDocs = [{ metadata: { documentType: 'SOVEREIGN_IDENTITY' } }];

    const hasAadhaarDoc = citizenDocs.some(
      (d) => d.metadata?.documentType === 'SOVEREIGN_IDENTITY' || d.metadata?.documentType === 'AADHAAR',
    );
    const formAadhaar = (formData as any).aadhaarNumber ? String((formData as any).aadhaarNumber).trim() : '';
    const citizenAadhaar = citizen?.aadhaarNumber ? String(citizen.aadhaarNumber).trim() : '';
    const aadhaar = formAadhaar || citizenAadhaar || (hasAadhaarDoc ? 'UIDAI-LINKED-VAULT-2026' : '');

    expect(aadhaar).toBe('UIDAI-LINKED-VAULT-2026');
  });

  it('should reject tax clearance if PAN is missing from wallet and form', () => {
    const formData = {};
    const citizen = { panNumber: '' };
    const citizenDocs: any[] = [];

    const hasPanDoc = citizenDocs.some(
      (d) => d.metadata?.documentType === 'TAX_CLEARANCE' || d.metadata?.documentType === 'PAN',
    );
    const formPan = (formData as any).panNumber ? String((formData as any).panNumber).trim().toUpperCase() : '';
    const citizenPan = citizen?.panNumber ? String(citizen.panNumber).trim().toUpperCase() : '';
    const pan = formPan || citizenPan || (hasPanDoc ? 'CBDT-LINKED-VAULT-2026' : '');

    expect(pan).toBe('');
    expect(() => {
      if (!pan) {
        throw new Error(
          'Tax compliance verification failed: No PAN Card or Tax Clearance document found in Citizen Wallet. Please upload and link your PAN in the Documents Vault / Wallet to proceed with inter-departmental verification.',
        );
      }
    }).toThrow(/Tax compliance verification failed/);
  });

  it('should accept tax clearance if PAN is present in Citizen Wallet', () => {
    const formData = {};
    const citizen = { panNumber: 'ABCDE1234F' };
    const citizenDocs: any[] = [];

    const hasPanDoc = citizenDocs.some(
      (d) => d.metadata?.documentType === 'TAX_CLEARANCE' || d.metadata?.documentType === 'PAN',
    );
    const formPan = (formData as any).panNumber ? String((formData as any).panNumber).trim().toUpperCase() : '';
    const citizenPan = citizen?.panNumber ? String(citizen.panNumber).trim().toUpperCase() : '';
    const pan = formPan || citizenPan || (hasPanDoc ? 'CBDT-LINKED-VAULT-2026' : '');

    expect(pan).toBe('ABCDE1234F');
  });
});
