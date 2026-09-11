import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Binary,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  RefreshCw,
  ArrowRight,
  Database,
  Layers,
  FileCode,
} from 'lucide-react';
import './AdminSchemaMappingPage.css';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformationType?: string;
  defaultValue?: any;
  isRequired?: boolean;
}

export interface SchemaMappingItem {
  _id?: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  version?: string;
  fieldMappings: FieldMapping[];
  isActive?: boolean;
}

const DEFAULT_SAMPLE_PAYLOADS: Record<string, any> = {
  UIDAI_DEPT_A: {
    citizen_full_name: 'ravi kumar',
    date_of_birth_iso: '1990-05-15',
    phone_contact: '+91 98765 43210',
    aadhaar_sha256: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  CBDT_DEPT_B: {
    taxpayer_id: 'aaacr8821k',
    legal_entity_name: 'Ravi Kumar Enterprises',
    clearance_certificate_number: 'CBDT-NOC-2026-991201',
    clearance_status: 'cleared',
  },
  DEFAULT: {
    aadhaar_no: '999912348888',
    full_name: 'ravi kumar',
    mobile: '+91 98765 43210',
    dob: '1990-05-15',
    pan_number: 'aaacr8821k',
    address: {
      line1: 'Flat 402, Green Heights',
      city: 'Bengaluru',
      pincode: '560100',
    },
  },
};

const DEFAULT_FALLBACK_MAPPINGS: SchemaMappingItem[] = [
  {
    _id: 'seed-map-1',
    name: 'UIDAI Legacy to Canonical Citizen Schema',
    sourceSystem: 'UIDAI_DEPT_A',
    targetSystem: 'GOVCONNECT_CANONICAL',
    version: 'v1.0.0',
    isActive: true,
    fieldMappings: [
      { sourceField: 'citizen_full_name', targetField: 'personal.fullName', transformationType: 'UPPERCASE', isRequired: true },
      { sourceField: 'date_of_birth_iso', targetField: 'personal.dob', transformationType: 'DATE_FORMAT', isRequired: true },
      { sourceField: 'phone_contact', targetField: 'contact.mobileNumber', transformationType: 'PHONE_NORMALIZE', isRequired: true },
      { sourceField: 'aadhaar_sha256', targetField: 'identity.aadhaarHash', transformationType: 'DIRECT', isRequired: false },
    ],
  },
  {
    _id: 'seed-map-2',
    name: 'CBDT Tax Clearance to Canonical Schema',
    sourceSystem: 'CBDT_DEPT_B',
    targetSystem: 'GOVCONNECT_CANONICAL',
    version: 'v1.0.0',
    isActive: true,
    fieldMappings: [
      { sourceField: 'taxpayer_id', targetField: 'tax.panNumber', transformationType: 'UPPERCASE', isRequired: true },
      { sourceField: 'legal_entity_name', targetField: 'tax.taxpayerName', transformationType: 'DIRECT', isRequired: true },
      { sourceField: 'clearance_certificate_number', targetField: 'tax.clearanceCertificateNumber', transformationType: 'DIRECT', isRequired: true },
      { sourceField: 'clearance_status', targetField: 'tax.status', transformationType: 'UPPERCASE', isRequired: true },
    ],
  },
];

export function AdminSchemaMappingPage() {
  const [mappings, setMappings] = useState<SchemaMappingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMapping, setSelectedMapping] = useState<SchemaMappingItem | null>(null);

  // Playground state
  const [sourceJson, setSourceJson] = useState<string>(
    JSON.stringify(DEFAULT_SAMPLE_PAYLOADS.UIDAI_DEPT_A, null, 2)
  );
  const [playgroundRules, setPlaygroundRules] = useState<FieldMapping[]>(
    DEFAULT_FALLBACK_MAPPINGS[0].fieldMappings
  );

  const [transformedOutput, setTransformedOutput] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const normalizeMapping = (raw: any): SchemaMappingItem => {
    return {
      _id: raw._id || raw.mappingId || `map-${Math.random().toString(36).slice(2, 7)}`,
      name: raw.name || 'Unnamed Mapping',
      sourceSystem: raw.sourceSystem || raw.sourceDepartment || 'SOURCE',
      targetSystem: raw.targetSystem || raw.targetDepartment || 'CANONICAL',
      version: raw.version ? String(raw.version) : 'v1.0.0',
      isActive: raw.isActive !== undefined ? raw.isActive : true,
      fieldMappings: Array.isArray(raw.fieldMappings)
        ? raw.fieldMappings
        : Array.isArray(raw.fields)
        ? raw.fields.map((f: any) => ({
            sourceField: f.sourceField || f.sourcePath || '',
            targetField: f.targetField || f.targetPath || '',
            transformationType: f.transformationType || f.transformFunction || 'DIRECT',
            defaultValue: f.defaultValue,
            isRequired: f.isRequired || f.required || false,
          }))
        : [],
    };
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/schema-mappings');
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const normalized = res.data.data.map(normalizeMapping);
        setMappings(normalized);
        setSelectedMapping(normalized[0]);
        setPlaygroundRules(normalized[0].fieldMappings);
        const sample = DEFAULT_SAMPLE_PAYLOADS[normalized[0].sourceSystem] || DEFAULT_SAMPLE_PAYLOADS.DEFAULT;
        setSourceJson(JSON.stringify(sample, null, 2));
      } else {
        setMappings(DEFAULT_FALLBACK_MAPPINGS);
        setSelectedMapping(DEFAULT_FALLBACK_MAPPINGS[0]);
        setPlaygroundRules(DEFAULT_FALLBACK_MAPPINGS[0].fieldMappings);
        setSourceJson(JSON.stringify(DEFAULT_SAMPLE_PAYLOADS.UIDAI_DEPT_A, null, 2));
      }
    } catch {
      setMappings(DEFAULT_FALLBACK_MAPPINGS);
      setSelectedMapping(DEFAULT_FALLBACK_MAPPINGS[0]);
      setPlaygroundRules(DEFAULT_FALLBACK_MAPPINGS[0].fieldMappings);
      setSourceJson(JSON.stringify(DEFAULT_SAMPLE_PAYLOADS.UIDAI_DEPT_A, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleSelectMapping = (mapping: SchemaMappingItem) => {
    setSelectedMapping(mapping);
    setPlaygroundRules(mapping.fieldMappings || []);
    setTransformedOutput(null);
    setTestError(null);
    const sample = DEFAULT_SAMPLE_PAYLOADS[mapping.sourceSystem] || DEFAULT_SAMPLE_PAYLOADS.DEFAULT;
    setSourceJson(JSON.stringify(sample, null, 2));
  };

  const handleRunTransformation = async () => {
    setTesting(true);
    setTestError(null);
    setTransformedOutput(null);

    const startTime = performance.now();
    try {
      let parsedSource: any;
      try {
        parsedSource = JSON.parse(sourceJson);
      } catch {
        throw new Error('Invalid JSON format in Source Inbound JSON window.');
      }

      const payload = {
        rules: playgroundRules.map((r) => ({
          sourceField: r.sourceField,
          targetField: r.targetField,
          transformationType: r.transformationType || 'DIRECT',
          defaultValue: r.defaultValue,
          required: Boolean(r.isRequired),
        })),
        samplePayload: parsedSource,
      };

      const res = await api.post('/admin/schema-mappings/test', payload);
      const elapsed = Math.round(performance.now() - startTime);
      setTestLatency(elapsed);

      if (res.data.success && res.data.data) {
        const out = res.data.data.output !== undefined ? res.data.data.output : res.data.data;
        setTransformedOutput(JSON.stringify(out, null, 2));
      } else {
        throw new Error(res.data.message || 'Transformation failed');
      }
    } catch (err: any) {
      setTestError(err.response?.data?.message || err.message || 'Transformation engine error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="admin-schemas">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="admin-schemas__header">
        <div>
          <div className="admin-badge">
            <Binary size={14} />
            <span>Semantic Interoperability Engine</span>
          </div>
          <h1 className="admin-title">Schema Mappings & Transformation Engine</h1>
          <p className="admin-desc">
            Define dot-path extraction rules, field transforms (Aadhaar masking, phone normalization, date formatting), and execute live canonical payload translations.
          </p>
        </div>

        <button className="btn-outline" onClick={fetchMappings} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Sync Mappings</span>
        </button>
      </div>

      {/* ─── Main 2-Column Layout ───────────────────────────── */}
      <div className="admin-schemas__grid">
        {/* Left Column: Active Schema Mappings Catalog */}
        <div className="gov-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="#1d4ed8" />
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Configured Mappings ({mappings.length})</h3>
            </div>
            <span className="badge badge-success">✓ Active Registry</span>
          </div>

          <div className="mappings-list">
            {mappings.map((m, idx) => {
              const isSelected = (selectedMapping?._id && selectedMapping._id === m._id) || (!selectedMapping && idx === 0);
              return (
                <div
                  key={m._id || idx}
                  className={`mapping-card ${isSelected ? 'mapping-card--active' : ''}`}
                  onClick={() => handleSelectMapping(m)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="badge badge-teal" style={{ fontSize: '0.6875rem' }}>{m.sourceSystem}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.version || 'v1.0.0'}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '6px 0 4px', color: '#0f172a' }}>{m.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#475569' }}>
                    <span>{m.sourceSystem}</span>
                    <ArrowRight size={12} />
                    <span>{m.targetSystem}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
                    Fields mapped: <strong>{m.fieldMappings?.length || 0} rules</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Mapping Field Table */}
          {selectedMapping && (
            <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FileCode size={16} color="#1d4ed8" />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Active Rules: {selectedMapping.name}
                </h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="rules-mini-table">
                  <thead>
                    <tr>
                      <th>Source Field</th>
                      <th>Target Field</th>
                      <th>Transformer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedMapping.fieldMappings || []).map((f, idx) => (
                      <tr key={idx}>
                        <td><code>{f.sourceField}</code></td>
                        <td><code>{f.targetField}</code></td>
                        <td>
                          {f.transformationType && f.transformationType !== 'DIRECT' ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                              {f.transformationType}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>DIRECT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Transformation Playground */}
        <div className="gov-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={18} color="#0d9488" />
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Live Transformation Playground</h3>
            </div>
            {testLatency !== null && (
              <span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>
                ⚡ {testLatency} ms
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Test JSON payload transformation in real-time. The server applies dot-path resolvers and functional transforms in-memory.
          </p>

          {testError && (
            <div className="alert-banner alert-banner--error">
              <AlertTriangle size={16} />
              <span>{testError}</span>
            </div>
          )}

          {/* Editors Grid */}
          <div className="playground-editors-grid">
            {/* Input Window */}
            <div>
              <label className="editor-label">Source Inbound JSON</label>
              <textarea
                className="code-editor"
                rows={12}
                value={sourceJson}
                onChange={(e) => setSourceJson(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Output Window */}
            <div>
              <label className="editor-label">Target Canonical JSON Output</label>
              <textarea
                className="code-editor code-editor--output"
                rows={12}
                readOnly
                value={transformedOutput || '// Click "Execute Transform" to view output canonical JSON'}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              className="btn-primary"
              onClick={handleRunTransformation}
              disabled={testing}
              style={{ minWidth: 180, justifyContent: 'center' }}
            >
              <Play size={15} />
              <span>{testing ? 'Transforming...' : 'Execute Transform'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
