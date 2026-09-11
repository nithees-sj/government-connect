import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import {
  ChevronRight,
  Download,
  Terminal,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  Copy,
  FileText,
  AlertTriangle,
  User,
  Fingerprint,
  Receipt,
  MapPin,
  ArrowRight,
  Gavel,
  RefreshCw,
  Check,
  Send,
  HelpCircle,
  FolderLock,
} from 'lucide-react';
import './ApplicationDetailPage.css';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'workflow' | 'info' | 'notes' | 'audit'>('workflow');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCorrId, setCopiedCorrId] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Officer Adjudication modal state
  const [adjudicateOpen, setAdjudicateOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchApplicationDetails = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get(`/applications/${id}`);
      if (res.data.success && res.data.data) {
        setApplication(res.data.data);
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.error?.message || 'Failed to load application details');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  // Real-time polling while any step is processing
  useEffect(() => {
    const isProcessing = application?.workflowProgress?.steps?.some(
      (s: any) => s.status === 'PROCESSING',
    );

    if (isProcessing) {
      const timer = setInterval(() => {
        fetchApplicationDetails(true);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [application]);

  const handleRetryStep = async () => {
    if (!application?.workflowProgress?._id) return;
    setRetrying(true);
    setError(null);
    try {
      await api.post(`/workflows/instances/${application.workflowProgress._id}/retry`);
      setActionSuccess('Verification retry initiated with Citizen Wallet credentials.');
      setTimeout(() => fetchApplicationDetails(true), 500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to trigger step retry');
    } finally {
      setRetrying(false);
    }
  };

  const copyCorrelationId = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCorrId(true);
    setTimeout(() => setCopiedCorrId(false), 2000);
  };

  const handleAdjudicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.workflowProgress?._id) {
      setError('No active workflow instance found to adjudicate');
      return;
    }

    setSubmittingDecision(true);
    setActionSuccess(null);

    try {
      await api.post(`/workflows/instances/${application.workflowProgress._id}/adjudicate`, {
        decision,
        remarks,
        rejectionReason: decision === 'REJECT' ? rejectionReason : undefined,
      });

      setActionSuccess(`Application successfully ${decision === 'APPROVE' ? 'approved' : 'rejected'}`);
      setAdjudicateOpen(false);
      setRemarks('');
      setRejectionReason('');
      await fetchApplicationDetails();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit officer adjudication');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <p>Loading application record and federated proofs...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="gov-card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Application Not Found</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>{error || 'Unable to locate this application'}</p>
        <button className="btn-primary" onClick={() => navigate('/applications')} style={{ marginTop: 16 }}>
          Return to Applications List
        </button>
      </div>
    );
  }

  const formData = application.formData || {};
  const steps = application.workflowProgress?.steps || [];
  const progressPercent = application.workflowProgress?.progressPercent ?? (application.status === 'APPROVED' ? 100 : 50);
  const isOfficerOrAdmin = ['DEPT_OFFICER', 'DEPT_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <div className="app-detail" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Top Bar & Breadcrumb ─────────────────────────── */}
      <div className="app-detail__top-bar">
        <div className="app-detail__breadcrumbs">
          <Link to="/applications" style={{ color: '#64748b', textDecoration: 'none' }}>Applications</Link>
          <ChevronRight size={14} color="#94a3b8" />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{application.applicationId}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => fetchApplicationDetails()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          {isOfficerOrAdmin && (
            <button className="btn-primary" onClick={() => setAdjudicateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gavel size={16} />
              <span>Officer Review Action</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8, color: '#065f46', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ─── Hero Overview Card ───────────────────────────── */}
      <div className="gov-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="app-priority-card__ref" style={{ fontSize: '0.875rem' }}>{application.applicationId}</span>
                <span className="badge badge-teal" style={{ background: '#ccfbf1', color: '#0f766e', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                  {application.status.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Submitted on {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {application.type.replace(/_/g, ' ')}
                {formData.companyName ? ` — ${formData.companyName}` : ''}
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: 2 }}>
                Issuing Department: {application.departmentId?.name || 'Department of Business & Commerce'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div
              onClick={() => copyCorrelationId(application.correlationId || application.applicationId)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
              title="Click to copy Correlation ID"
            >
              <Terminal size={14} color="#64748b" />
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                {application.correlationId || application.applicationId}
              </span>
              {copiedCorrId ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#94a3b8" />}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              DPDP Consent Token: <strong style={{ color: '#0f172a' }}>Active Verified</strong>
            </span>
          </div>
        </div>

        {/* Workflow Progress Indicator Bar */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600 }}>
            <span style={{ color: '#64748b' }}>Current Step: <strong style={{ color: '#0f172a' }}>{application.currentStep || 'Multi-Agency Coordination'}</strong></span>
            <span style={{ color: '#0d9488', fontFamily: 'monospace' }}>{progressPercent}% Completed</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #1d4ed8, #0d9488)', borderRadius: 4, transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ──────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 12 }}>
        <button
          onClick={() => setActiveTab('workflow')}
          style={{
            padding: '10px 16px',
            borderBottom: activeTab === 'workflow' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'workflow' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Workflow Stepper & Microservices ({steps.length})
        </button>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '10px 16px',
            borderBottom: activeTab === 'info' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'info' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Application Form Data
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '10px 16px',
            borderBottom: activeTab === 'notes' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'notes' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Officer Notes ({application.notes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 16px',
            borderBottom: activeTab === 'audit' ? '2px solid #1d4ed8' : '2px solid transparent',
            color: activeTab === 'audit' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Audit Ledger ({application.auditTrail?.length || 0})
        </button>
      </div>

      {/* ─── Tab 1: Live Workflow Stepper ─────────────────── */}
      {activeTab === 'workflow' && (
        <div className="gov-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Inter-Departmental State Machine Execution
            </h3>
            {steps.some((s: any) => s.status === 'FAILED') && (
              <button
                className="btn-primary"
                onClick={handleRetryStep}
                disabled={retrying}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8125rem' }}
              >
                <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} />
                <span>{retrying ? 'Retrying...' : 'Retry Failed Steps'}</span>
              </button>
            )}
          </div>

          {steps.some((s: any) => s.status === 'PROCESSING') && (
            <div
              style={{
                padding: '16px 20px',
                background: '#eff6ff',
                border: '1.5px solid #3b82f6',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 20,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
              }}
            >
              <RefreshCw size={24} color="#1d4ed8" className="animate-spin" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e40af' }}>
                  Inter-Departmental State Machine Verification In Progress
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#1e3a8a', marginTop: 2 }}>
                  The Government's backend API is verifying your Aadhaar and PAN documents with UIDAI (Dept A) and CBDT (Dept B) sovereign gateways...
                </div>
              </div>
            </div>
          )}

          {steps.some((s: any) => s.status === 'FAILED') && (() => {
            const failedStep = steps.find((s: any) => s.status === 'FAILED');
            const failedMsg = failedStep?.errorMessage || 'Verification step failed.';
            const isDocError = failedMsg.toLowerCase().includes('document') || failedMsg.toLowerCase().includes('wallet') || failedMsg.toLowerCase().includes('upload');

            return (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991b1b' }}>
                      {isDocError ? 'Verification Action Required (Missing Documents)' : `Gateway Verification Failure: ${failedStep?.stepName || 'Inter-Agency API'}`}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#7f1d1d', marginTop: 2 }}>
                      {failedMsg}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {isDocError && (
                    <Link
                      to="/documents"
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '7px 14px', fontSize: '0.8125rem' }}
                    >
                      <FolderLock size={15} />
                      <span>Open Documents Wallet</span>
                    </Link>
                  )}
                  <button
                    className="btn-primary"
                    onClick={handleRetryStep}
                    disabled={retrying}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.8125rem' }}
                  >
                    <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
                    <span>{retrying ? 'Retrying...' : 'Retry Verification'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((step: any, idx: number) => {
              const isCompleted = step.status === 'COMPLETED';
              const isProcessing = step.status === 'PROCESSING';
              const isFailed = step.status === 'FAILED' || step.status === 'REJECTED';
              const isPending = step.status === 'PENDING';

              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid',
                    borderColor: isProcessing ? '#93c5fd' : isCompleted ? '#86efac' : isFailed ? '#fca5a5' : '#e2e8f0',
                    background: isProcessing ? '#eff6ff' : isCompleted ? '#f0fdf4' : isFailed ? '#fef2f2' : '#f8fafc',
                    borderRadius: 10,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isCompleted ? '#22c55e' : isProcessing ? '#3b82f6' : isFailed ? '#ef4444' : '#cbd5e1',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                        }}
                      >
                        {isCompleted ? <Check size={18} /> : isProcessing ? <RefreshCw size={15} className="animate-spin" /> : idx + 1}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                          {step.stepName}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Type: {step.stepType} {step.performedBy ? `• Performed by: ${step.performedBy}` : ''}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Completed</span>}
                      {isProcessing && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><RefreshCw size={12} className="animate-spin" /> Active Processing</span>}
                      {isFailed && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Failed / Action Required</span>}
                      {isPending && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Pending</span>}
                    </div>
                  </div>

                  {step.outputData && Object.keys(step.outputData).length > 0 && (
                    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 14px', marginTop: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                        Downstream Gateway Proof Payload:
                      </span>
                      <pre style={{ margin: 0, fontSize: '0.75rem', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {JSON.stringify(step.outputData, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.errorMessage && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', color: '#991b1b', fontSize: '0.8125rem' }}>
                      Error: {step.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Tab 2: Form Details ──────────────────────────── */}
      {activeTab === 'info' && (
        <div className="gov-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Application Submission Parameters
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {Object.entries(formData).map(([key, val]) => (
              <div key={key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', fontWeight: 600 }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', marginTop: 4 }}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Officer Notes ─────────────────────────── */}
      {activeTab === 'notes' && (
        <div className="gov-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Department Review Notes & Adjudications
          </h3>

          {application.notes && application.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {application.notes.map((note: any, i: number) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{note.author} ({note.role})</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No review notes attached yet.</p>
          )}
        </div>
      )}

      {/* ─── Tab 4: Audit Trail ───────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="gov-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            SHA-256 Tamper-Evident Audit Records
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {application.auditTrail && application.auditTrail.length > 0 ? (
              application.auditTrail.map((event: any, idx: number) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1d4ed8' }}>{event.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>
                    Actor: {event.actorName || 'System Gateway'} ({event.actorRole || 'SYSTEM'})
                  </div>
                  {event.currentHash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Block Hash:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#334155', background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>
                        {event.currentHash}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No audit events logged for this reference.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Officer Review Modal ─────────────────────────── */}
      {adjudicateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="gov-card" style={{ background: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Departmental Adjudication
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: 20 }}>
              Review the cross-agency proofs and record your official statutory determination.
            </p>

            <form onSubmit={handleAdjudicate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Decision
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVE')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: decision === 'APPROVE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: decision === 'APPROVE' ? '#ecfdf5' : '#ffffff',
                      color: decision === 'APPROVE' ? '#065f46' : '#334155',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Approve Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: decision === 'REJECT' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      background: decision === 'REJECT' ? '#fef2f2' : '#ffffff',
                      color: decision === 'REJECT' ? '#991b1b' : '#334155',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Reject Application
                  </button>
                </div>
              </div>

              {decision === 'REJECT' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Rejection Reason (Required)
                  </label>
                  <input
                    type="text"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete lease deed or non-compliant capital declaration"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Review Remarks & Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes for citizen and inter-departmental record..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setAdjudicateOpen(false)} disabled={submittingDecision}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingDecision}
                  style={{
                    background: decision === 'REJECT' ? '#dc2626' : undefined,
                    borderColor: decision === 'REJECT' ? '#dc2626' : undefined,
                  }}
                >
                  {submittingDecision ? 'Submitting...' : decision === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
