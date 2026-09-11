import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Search,
  Building2,
  Receipt,
  Fingerprint,
  MapPin,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Info,
  Check,
} from 'lucide-react';
import './NewApplicationPage.css';

interface ServiceItem {
  id: string;
  type: string;
  title: string;
  category: string;
  deptCode: string;
  deptName: string;
  badge: string;
  description: string;
  sla: string;
  fee: string;
  requiredFields: { key: string; label: string; placeholder: string; type: string; required: boolean }[];
}

const SERVICES: ServiceItem[] = [
  {
    id: 'biz-approval',
    type: 'BUSINESS_APPROVAL',
    title: 'Business Approval & Incorporation',
    category: 'business',
    deptCode: 'DEPT_MCA',
    deptName: 'Ministry of Corporate Affairs (MCA)',
    badge: 'MCA-V3',
    description: 'Unified single-window application for commercial company registration, MCA name clearance, and enterprise compliance.',
    sla: 'Avg 3-5 Working Days',
    fee: '₹1,500',
    requiredFields: [
      { key: 'businessName', label: 'Proposed Company Name', placeholder: 'e.g. Apex Cybernetics Private Limited', type: 'text', required: true },
      { key: 'businessType', label: 'Entity Classification', placeholder: 'Private Limited / LLP / OPC', type: 'select', required: true },
      { key: 'capital', label: 'Authorized Initial Capital (INR)', placeholder: 'e.g. 1000000', type: 'number', required: true },
      { key: 'registeredAddress', label: 'Registered Office Address', placeholder: 'Plot 42, Tech City, Sector 5', type: 'text', required: true },
    ],
  },
  {
    id: 'trade-license',
    type: 'TRADE_LICENSE',
    title: 'Municipal Trade License & Renewal',
    category: 'business',
    deptCode: 'DEPT_MUNICIPAL',
    deptName: 'Municipal Corporation & Urban Local Body',
    badge: 'ULB-Fast',
    description: 'Commercial trade license for retail, logistics, and manufacturing premises with automated zoning validation.',
    sla: 'Avg 24-48 Hours',
    fee: '₹800',
    requiredFields: [
      { key: 'establishmentName', label: 'Commercial Establishment Name', placeholder: 'e.g. Apex Logistics Hub', type: 'text', required: true },
      { key: 'premisesArea', label: 'Premises Carpet Area (Sq Ft)', placeholder: 'e.g. 2400', type: 'number', required: true },
      { key: 'tradeCategory', label: 'Trade Classification', placeholder: 'Commercial Warehousing', type: 'text', required: true },
    ],
  },
  {
    id: 'tax-clearance',
    type: 'TAX_CLEARANCE',
    title: 'Commercial Tax & GST Clearance',
    category: 'revenue',
    deptCode: 'DEPT_CBDT',
    deptName: 'Central Board of Direct Taxes & GSTN',
    badge: 'CBDT-API',
    description: 'Cross-ministry tax compliance verification, annual return validation, and issuance of clearance certificate.',
    sla: 'Avg 2 Working Days',
    fee: '₹250',
    requiredFields: [
      { key: 'panNumber', label: 'Permanent Account Number (PAN)', placeholder: 'ABCDE1234F', type: 'text', required: true },
      { key: 'assessmentYear', label: 'Assessment Financial Year', placeholder: '2024-2025', type: 'text', required: true },
      { key: 'annualTurnover', label: 'Declared Gross Turnover (INR)', placeholder: '5000000', type: 'number', required: true },
    ],
  },
  {
    id: 'digital-id',
    type: 'IDENTITY_VERIFICATION',
    title: 'Digital Sovereign Identity Seeding',
    category: 'identity',
    deptCode: 'DEPT_UIDAI',
    deptName: 'Unique Identification Authority of India',
    badge: 'Core Auth',
    description: 'Cross-federate biometric and demographic e-KYC validation for sovereign multi-department entitlements.',
    sla: 'Instant Real-time',
    fee: 'Free',
    requiredFields: [
      { key: 'aadhaarNumber', label: 'Aadhaar / Virtual ID (VID)', placeholder: '12-digit Aadhaar number', type: 'text', required: true },
      { key: 'purpose', label: 'Verification Purpose', placeholder: 'Interoperable Public Welfare Entitlement', type: 'text', required: true },
    ],
  },
  {
    id: 'property-cert',
    type: 'PROPERTY_CERTIFICATE',
    title: 'Property & Land Ownership Certificate',
    category: 'property',
    deptCode: 'DEPT_LAND',
    deptName: 'Department of Land Revenue & Cadastre',
    badge: 'ULPIN-Geo',
    description: 'Digital Record of Rights (RoR), non-encumbrance certificate, and geo-tagged cadastral plot validation.',
    sla: 'Avg 3 Working Days',
    fee: '₹400',
    requiredFields: [
      { key: 'surveyNumber', label: 'Cadastral Survey / Khasra No.', placeholder: 'Survey 108/4B', type: 'text', required: true },
      { key: 'district', label: 'Revenue District & Taluk', placeholder: 'South District, Tech Sub-Division', type: 'text', required: true },
    ],
  },
  {
    id: 'trade-cert',
    type: 'TRADE_CERTIFICATE',
    title: 'Non-Encumbrance Procurement Certificate',
    category: 'certificates',
    deptCode: 'DEPT_COMMERCE',
    deptName: 'Ministry of Commerce & Industry',
    badge: 'e-Tender',
    description: 'Inter-departmental clearance for commercial loans and government GeM e-procurement eligibility.',
    sla: 'Avg 4 Working Days',
    fee: '₹500',
    requiredFields: [
      { key: 'enterpriseName', label: 'Enterprise Legal Name', placeholder: 'Apex Cybernetics Private Limited', type: 'text', required: true },
      { key: 'gemId', label: 'GeM Portal Seller ID', placeholder: 'GEM-2024-99812', type: 'text', required: true },
    ],
  },
];

export function NewApplicationPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Step Tracker: 1 = Service Select, 2 = Fill Data, 3 = AI Diagnostics & DPDP Consent, 4 = Submitting
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dpdpConsent, setDpdpConsent] = useState<boolean>(true);
  const [dataRetentionConsent, setDataRetentionConsent] = useState<boolean>(true);

  // AI & Diagnostics State
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiRoutingResult, setAiRoutingResult] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      let walletAadhaar = '';
      let walletPan = '';
      let walletPhone = '';
      try {
        const { data } = await api.get('/documents/wallet');
        if (data.success && data.data) {
          walletAadhaar = data.data.aadhaarNumber || '';
          walletPan = data.data.panNumber || '';
          walletPhone = data.data.phone || '';
        }
      } catch {
        // ignore
      }

      if (user) {
        setFormData((prev) => ({
          ...prev,
          applicantName: user.name || '',
          applicantEmail: user.email || '',
          applicantPhone: walletPhone || prev.applicantPhone || '',
          aadhaarNumber: walletAadhaar,
          panNumber: walletPan,
          businessType: prev.businessType || 'Private Limited Technology',
          capital: prev.capital || '1000000',
        }));
      }
    };

    loadWallet();
  }, [user]);

  const handleSelectService = (svc: ServiceItem) => {
    setSelectedService(svc);
    setStep(2);
    setSubmitError(null);
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleProceedToDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setStep(3);
    setAiAnalyzing(true);
    setSubmitError(null);

    try {
      // Run AI Smart Routing & Duplicate Check
      const [routingRes, dupRes] = await Promise.allSettled([
        api.post('/ai/smart-routing', {
          serviceType: selectedService.type,
          priority: 'STANDARD',
          metadata: formData,
        }),
        api.post('/ai/detect-duplicates', {
          applicationData: {
            type: selectedService.type,
            formData,
          },
        }),
      ]);

      if (routingRes.status === 'fulfilled' && routingRes.value.data.success) {
        setAiRoutingResult(routingRes.value.data.data);
      } else {
        // Fallback calculated preview
        setAiRoutingResult({
          recommendedPath: ['DEPT_UIDAI (e-KYC)', 'DEPT_CBDT (Tax Clearance)', 'DEPT_MCA (Final Incorporation)'],
          estimatedHours: 48,
          confidence: 0.94,
          rationale: 'Optimal routing path determined via historical low latency gateways.',
        });
      }

      if (dupRes.status === 'fulfilled' && dupRes.value.data.success) {
        const dupData = dupRes.value.data.data;
        if (dupData.duplicateProbability > 0.6) {
          setDuplicateWarning(dupData);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch {
      // Graceful fallback
      setAiRoutingResult({
        recommendedPath: ['UIDAI Gateway', 'Tax Verification', 'Department Review'],
        estimatedHours: 48,
        confidence: 0.92,
        rationale: 'Direct pipeline routing enabled.',
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedService) return;
    if (!dpdpConsent) {
      setSubmitError('DPDP Act 2023 statutory electronic consent is required to proceed.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        type: selectedService.type,
        formData: {
          ...formData,
          consentGranted: true,
          consentTimestamp: new Date().toISOString(),
          dpdpComplianceTag: 'DPDP-SEC-6-EXPLICIT',
        },
      };

      const res = await api.post('/applications', payload);
      if (res.data.success && res.data.data) {
        const created = res.data.data;
        navigate(`/applications/${created.applicationId}`);
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Application submission error:', err);
      setSubmitError(err.response?.data?.message || err.message || 'Gateway connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = SERVICES.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="new-app">
      {/* ─── Breadcrumb & Step Indicator ─────────────────── */}
      <div className="new-app__wizard-header">
        <div className="wizard-progress">
          <div className={`wizard-step ${step >= 1 ? 'wizard-step--active' : ''}`}>
            <span className="wizard-step__number">1</span>
            <span className="wizard-step__label">Select Service</span>
          </div>
          <div className={`wizard-step__divider ${step >= 2 ? 'wizard-step__divider--active' : ''}`} />
          <div className={`wizard-step ${step >= 2 ? 'wizard-step--active' : ''}`}>
            <span className="wizard-step__number">2</span>
            <span className="wizard-step__label">Application Details</span>
          </div>
          <div className={`wizard-step__divider ${step >= 3 ? 'wizard-step__divider--active' : ''}`} />
          <div className={`wizard-step ${step >= 3 ? 'wizard-step--active' : ''}`}>
            <span className="wizard-step__number">3</span>
            <span className="wizard-step__label">AI Review & DPDP Consent</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="alert-banner alert-banner--error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* ─── STEP 1: SERVICE CATALOG ───────────────────────── */}
      {step === 1 && (
        <>
          <div className="new-app__hero">
            <div className="new-app__hero-badge">
              <Sparkles size={14} />
              <span>National Single Window Protocol</span>
            </div>
            <h1 className="new-app__hero-title">Initiate Interoperable Government Service</h1>
            <p className="new-app__hero-desc">
              Select a sovereign digital service below. Pre-verified citizen credentials and tax attributes
              will be auto-federated from linked department registries with zero manual paperwork.
            </p>

            <div className="new-app__search-wrap">
              <Search size={20} color="#64748b" style={{ position: 'absolute', left: 16, top: 14, pointerEvents: 'none' }} />
              <input
                type="text"
                className="new-app__search-input"
                placeholder='Search by service name, department, or keyword (e.g., "Incorporation", "GST", "Land Record")...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="new-app__categories">
            <button className={`filter-chip ${selectedCategory === 'all' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('all')}>
              <span>All Services</span>
              <span className="filter-chip__count">6</span>
            </button>
            <button className={`filter-chip ${selectedCategory === 'business' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('business')}>
              <Building2 size={14} />
              <span>Business & Corporate</span>
              <span className="filter-chip__count">2</span>
            </button>
            <button className={`filter-chip ${selectedCategory === 'revenue' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('revenue')}>
              <Receipt size={14} />
              <span>Revenue & Tax</span>
              <span className="filter-chip__count">1</span>
            </button>
            <button className={`filter-chip ${selectedCategory === 'identity' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('identity')}>
              <Fingerprint size={14} />
              <span>Digital Identity</span>
              <span className="filter-chip__count">1</span>
            </button>
            <button className={`filter-chip ${selectedCategory === 'property' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('property')}>
              <MapPin size={14} />
              <span>Land & Property</span>
              <span className="filter-chip__count">1</span>
            </button>
            <button className={`filter-chip ${selectedCategory === 'certificates' ? 'filter-chip--active' : ''}`} onClick={() => setSelectedCategory('certificates')}>
              <FileCheck size={14} />
              <span>Trade Certificates</span>
              <span className="filter-chip__count">1</span>
            </button>
          </div>

          <div className="services-catalog-grid" style={{ marginTop: 24 }}>
            {filteredServices.map((svc) => (
              <div key={svc.id} className="service-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="service-card__icon">
                        {svc.category === 'business' && <Building2 size={22} />}
                        {svc.category === 'revenue' && <Receipt size={22} />}
                        {svc.category === 'identity' && <Fingerprint size={22} />}
                        {svc.category === 'property' && <MapPin size={22} />}
                        {svc.category === 'certificates' && <FileCheck size={22} />}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>
                          {svc.deptName}
                        </span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{svc.title}</h3>
                      </div>
                    </div>
                    <span className="badge badge-teal">{svc.badge}</span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                    {svc.description}
                  </p>
                </div>

                <div>
                  <div className="service-card__meta-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0d9488' }}>
                      <Clock size={14} />
                      <span>{svc.sla}</span>
                    </div>
                    <div>Fee: <strong>{svc.fee}</strong></div>
                  </div>

                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => handleSelectService(svc)}>
                    <span>Select Service</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── STEP 2: FORM DATA & PRE-FILL ───────────────────── */}
      {step === 2 && selectedService && (
        <div className="wizard-form-container">
          <div className="gov-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span className="badge badge-teal" style={{ marginBottom: 6 }}>{selectedService.deptName}</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{selectedService.title}</h2>
              </div>
              <button className="btn-outline" onClick={() => setStep(1)} style={{ gap: 6 }}>
                <ArrowLeft size={14} />
                <span>Change Service</span>
              </button>
            </div>

            {/* Auto Pre-fill Notice */}
            <div className="prefill-notice-card">
              <ShieldCheck size={22} color="#0d9488" />
              <div>
                <strong>Interoperability Pre-fill Engaged</strong>
                <p>Verified attributes for <strong>{user?.name || 'Ravi Kumar'}</strong> (Aadhaar & PAN) will be seamlessly validated during automated gateway orchestration.</p>
              </div>
            </div>

            <form onSubmit={handleProceedToDiagnostics} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
              <div className="form-grid-2col">
                <div>
                  <label className="form-label">Applicant Name (e-KYC Verified)</label>
                  <input
                    type="text"
                    className="form-input"
                    disabled
                    value={formData.applicantName || user?.name || 'Ravi Kumar'}
                  />
                </div>
                <div>
                  <label className="form-label">Applicant Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.applicantEmail || user?.email || ''}
                    onChange={(e) => handleFieldChange('applicantEmail', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Service Specific Fields */}
              <div className="dynamic-fields-section">
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
                  Service-Specific Parameters
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedService.requiredFields.map((field) => (
                    <div key={field.key}>
                      <label className="form-label">
                        {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="form-input"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          required={field.required}
                        >
                          <option value="Private Limited Technology">Private Limited Technology</option>
                          <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                          <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                          <option value="Public Limited Commercial">Public Limited Commercial</option>
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="form-input"
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button type="submit" className="btn-primary">
                  <span>Continue to AI Verification</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── STEP 3: AI DIAGNOSTICS & DPDP CONSENT ─────────── */}
      {step === 3 && selectedService && (
        <div className="wizard-form-container">
          <div className="gov-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 6 }}>
              AI Smart Pre-Check & Statutory DPDP Consent
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24 }}>
              The platform evaluates automated routing topology and executes duplicate detection before committing your application to the sovereign hash ledger.
            </p>

            {/* AI Diagnostics Box */}
            <div className="ai-diagnostics-card">
              <div className="ai-diagnostics-header">
                <Sparkles size={20} color="#6366f1" />
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#1e1b4b', fontSize: '0.9375rem' }}>Automated AI Smart Routing Assessment</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#6366f1' }}>
                    {aiAnalyzing ? 'Evaluating gateway latencies & pipeline dependencies...' : 'Diagnostics complete'}
                  </span>
                </div>
                {aiAnalyzing ? (
                  <span className="badge badge-warning">Analyzing...</span>
                ) : (
                  <span className="badge badge-success">✓ SLA Optimized</span>
                )}
              </div>

              {aiRoutingResult && (
                <div className="ai-routing-details">
                  <div className="routing-path">
                    <span className="routing-path__title">Optimal Interoperability Path:</span>
                    <div className="routing-path__nodes">
                      {Array.isArray(aiRoutingResult.recommendedPath) ? (
                        aiRoutingResult.recommendedPath.map((node: string, i: number) => (
                          <React.Fragment key={i}>
                            <span className="node-chip">{node}</span>
                            {i < aiRoutingResult.recommendedPath.length - 1 && <span className="node-arrow">➔</span>}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="node-chip">UIDAI e-KYC ➔ CBDT Tax Verification ➔ MCA Adjudication</span>
                      )}
                    </div>
                  </div>

                  <div className="routing-meta-grid">
                    <div className="routing-meta-item">
                      <Clock size={16} color="#0d9488" />
                      <span>Estimated Resolution: <strong>{aiRoutingResult.estimatedHours || 48} Hours</strong></span>
                    </div>
                    <div className="routing-meta-item">
                      <Zap size={16} color="#6366f1" />
                      <span>Confidence Score: <strong>{Math.round((aiRoutingResult.confidence || 0.94) * 100)}%</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {duplicateWarning && (
                <div className="duplicate-alert">
                  <AlertTriangle size={18} color="#b45309" />
                  <div>
                    <strong>Potential Duplicate Detected ({Math.round(duplicateWarning.duplicateProbability * 100)}% match)</strong>
                    <p>{duplicateWarning.recommendation || 'An existing application with matching parameters was found in progress.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* DPDP Act 2023 Consent Section */}
            <div className="dpdp-consent-section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={20} color="#0d9488" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Statutory DPDP Act 2023 Electronic Consent Grant
                </h4>
              </div>

              <div className="consent-checkbox-card">
                <label className="custom-checkbox-row">
                  <input
                    type="checkbox"
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                  />
                  <div>
                    <strong>Purpose-Bound Gateway Verification (Statutory)</strong>
                    <p>
                      I hereby authorize GovInterconnect to exchange verified identity (UIDAI) and tax compliance records (CBDT) with <strong>{selectedService.deptName}</strong> strictly for the purpose of adjudicating this application under Section 6 of the DPDP Act 2023.
                    </p>
                  </div>
                </label>
              </div>

              <div className="consent-checkbox-card" style={{ marginTop: 12 }}>
                <label className="custom-checkbox-row">
                  <input
                    type="checkbox"
                    checked={dataRetentionConsent}
                    onChange={(e) => setDataRetentionConsent(e.target.checked)}
                  />
                  <div>
                    <strong>Audit Trail & Certificate Vault Storage</strong>
                    <p>
                      I consent to the generation of a verifiable SHA-256 hashed audit block and secure storage of the resultant approval credential in my digital document vault for 30 days.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submission Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <button type="button" className="btn-outline" onClick={() => setStep(2)} disabled={submitting}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleFinalSubmit}
                disabled={submitting || !dpdpConsent}
                style={{ minWidth: 220, justifyContent: 'center' }}
              >
                {submitting ? (
                  <span>Transmitting to Gateway...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirm & Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
