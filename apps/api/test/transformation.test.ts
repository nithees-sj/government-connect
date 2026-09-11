import { describe, it, expect } from 'vitest';
import { TransformationService, type FieldTransformationRule } from '../src/services/transformation.service.js';

describe('Transformation Engine (Semantic Schema Translation)', () => {
  it('should extract dot-path nested properties correctly', () => {
    const obj = {
      user: {
        profile: {
          first_name: 'Aarav',
          contact: {
            mobile: '9876543210',
          },
        },
      },
    };

    const val1 = TransformationService.getNestedValue(obj, 'user.profile.first_name');
    const val2 = TransformationService.getNestedValue(obj, 'user.profile.contact.mobile');
    const val3 = TransformationService.getNestedValue(obj, 'user.profile.non_existent');

    expect(val1).toBe('Aarav');
    expect(val2).toBe('9876543210');
    expect(val3).toBeUndefined();
  });

  it('should set dot-path nested properties on target object', () => {
    const target: any = {};
    TransformationService.setNestedValue(target, 'citizen.name', 'AARAV SHARMA');
    TransformationService.setNestedValue(target, 'citizen.contact.phone', '9876543210');

    expect(target.citizen.name).toBe('AARAV SHARMA');
    expect(target.citizen.contact.phone).toBe('9876543210');
  });

  it('should execute built-in transformation functions properly', () => {
    // Aadhaar Masking
    const aadhaarRule: FieldTransformationRule = { sourceField: 'aadhaar', targetField: 'masked', transformationType: 'MASK_AADHAAR' };
    const masked = TransformationService.transformFieldValue('999912348888', aadhaarRule);
    expect(masked).toBe('XXXXXXXX8888');

    // Phone Normalization
    const phoneRule: FieldTransformationRule = { sourceField: 'phone', targetField: 'normalized', transformationType: 'PHONE_NORMALIZE' };
    const phoneNorm = TransformationService.transformFieldValue('+919876543210', phoneRule);
    expect(phoneNorm).toBe('9876543210');

    // Uppercase
    const upperRule: FieldTransformationRule = { sourceField: 'name', targetField: 'name', transformationType: 'UPPERCASE' };
    const upper = TransformationService.transformFieldValue('nova tech systems pvt ltd', upperRule);
    expect(upper).toBe('NOVA TECH SYSTEMS PVT LTD');

    // Date formatting
    const dateRule: FieldTransformationRule = { sourceField: 'dob', targetField: 'dob', transformationType: 'DATE_FORMAT' };
    const dateFormatted = TransformationService.transformFieldValue('1992-08-24T00:00:00.000Z', dateRule);
    expect(dateFormatted).toBe('1992-08-24');
  });

  it('should transform full inbound department payload to canonical schema', () => {
    const sourcePayload = {
      aadhaar_number: '123456789012',
      full_name: 'sunita verma',
      contact_number: '919123456780',
      birth_date: '1988-11-04',
      residential_address: {
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postal_code: '560001',
      },
    };

    const mappingFields: FieldTransformationRule[] = [
      { sourceField: 'aadhaar_number', targetField: 'citizen.aadhaarMasked', transformationType: 'MASK_AADHAAR' },
      { sourceField: 'full_name', targetField: 'citizen.name', transformationType: 'UPPERCASE' },
      { sourceField: 'contact_number', targetField: 'citizen.phone', transformationType: 'PHONE_NORMALIZE' },
      { sourceField: 'birth_date', targetField: 'citizen.dateOfBirth', transformationType: 'DATE_FORMAT' },
      { sourceField: 'residential_address.state', targetField: 'citizen.address.state' },
      { sourceField: 'residential_address.postal_code', targetField: 'citizen.address.pincode' },
    ];

    const result = TransformationService.transformObject(sourcePayload, mappingFields);

    expect(result).toEqual({
      citizen: {
        aadhaarMasked: 'XXXXXXXX9012',
        name: 'SUNITA VERMA',
        phone: '9123456780',
        dateOfBirth: '1988-11-04',
        address: {
          state: 'Karnataka',
          pincode: '560001',
        },
      },
    });
  });
});
