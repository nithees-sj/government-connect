import { describe, it, expect } from 'vitest';
import { AIService } from '../src/services/ai.service.js';

describe('AI & Semantic Reasoning Service', () => {
  it('should infer semantic schema mappings with confidence scores', () => {
    const sourceFields = ['aadhaar_no', 'full_name', 'mobile', 'dob'];
    const targetFields = ['citizen.aadhaarMasked', 'citizen.name', 'citizen.phone', 'citizen.dateOfBirth'];

    const suggestions = AIService.suggestSchemaMapping({
      sourceFields,
      targetFields,
      sourceSystem: 'UIDAI',
      targetSystem: 'CANONICAL',
    });

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);

    const aadhaarMapping = suggestions.find((s) => s.sourceField === 'aadhaar_no');
    expect(aadhaarMapping).toBeDefined();
    expect(aadhaarMapping?.suggestedTransformation).toBe('DIRECT');
  });

  it('should calculate smart routing recommendation and SLA estimation', () => {
    const routing = AIService.recommendRouting({
      type: 'BUSINESS_APPROVAL',
      hasIdentityProof: true,
      hasTaxCompliance: true,
      businessCapital: 10000000,
    });

    expect(routing).toBeDefined();
    expect(routing.priority).toBe('HIGH');
    expect(routing.slaHours).toBe(24);
    expect(routing.estimatedProcessingDays).toBe(1);
    expect(routing.rationale.length).toBeGreaterThan(0);
  });
});
