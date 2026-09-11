import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Receipt,
  FileText,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react';
import './DashboardPage.css';
import type { IApplication } from '@govconnect/shared-types';

export function DashboardPage() {
  const { user, citizen } = useAuthStore();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      if (res.data.success && res.data.data) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load applications for dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Compute live KPIs
  const activeCount = applications.filter((a) =>
    ['SUBMITTED', 'PENDING', 'PROCESSING', 'IN_REVIEW', 'IDENTITY_VERIFICATION', 'TAX_VERIFICATION', 'DEPARTMENT_REVIEW'].includes(
      a.status,
    ),
  ).length;

  const completedCount = applications.filter((a) =>
    ['APPROVED', 'COMPLETED'].includes(a.status),
  ).length;

  const attentionCount = applications.filter((a) =>
    ['FAILED', 'REJECTED'].includes(a.status),
  ).length;

  const totalCount = applications.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Approved & Issued</span>;
      case 'REJECTED':
        return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Action Required</span>;
      case 'FAILED':
        return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Inter-Agency Failed</span>;
      case 'IN_REVIEW':
      case 'PROCESSING':
      case 'SUBMITTED':
      default:
        return <span className="badge badge-teal" style={{ background: '#ccfbf1', color: '#0f766e', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>In Review ({status.replace(/_/g, ' ')})</span>;
    }
  };

  const getProgressPercent = (app: IApplication) => {
    if (app.status === 'APPROVED' || app.status === 'COMPLETED') return 100;
    if (app.status === 'REJECTED' || app.status === 'FAILED') return 40;
    if (app.status === 'IN_REVIEW') return 75;
    if (app.status === 'PROCESSING') return 50;
    return 25;
  };

  return (
    <div className="citizen-dash" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ─── Top Welcome & Institutional Identity Banner ─── */}
      <div className="citizen-dash__welcome">
        <div>
          <div className="citizen-dash__badge-single-window">
            <ShieldCheck size={16} />
            <span>National Civic Interoperability Gateway</span>
          </div>
          <h1 className="citizen-dash__title">
            Welcome back, {user?.name || citizen?.fullName || 'Citizen'}
          </h1>
          <div className="citizen-dash__meta-row">
            <div className="citizen-dash__id-chip">
              <span className="citizen-dash__id-label">Sovereign Identity:</span>
              <span className="citizen-dash__id-code">
                {citizen?.aadhaarNumber ? `AADHAAR-****-${citizen.aadhaarNumber.slice(-4)}` : user?.email}
              </span>
            </div>
            <span className="citizen-dash__assurance-level">
              e-Gov ID Tier 3 • High Assurance Digilocker Active
            </span>
          </div>
        </div>

        <div className="citizen-dash__action-bar">
          <button
            className="btn-primary"
            onClick={() => navigate('/applications/new')}
            id="start-new-service-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <PlusCircle size={18} />
            <span>Apply for New Service</span>
          </button>
        </div>
      </div>

      {/* ─── Top KPI Metric Cards (Max 4 clean cards) ─────── */}
      <div className="citizen-dash__kpis">
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Active Applications</span>
            <div className="kpi-card__icon-box">
              <Clock size={18} color="#1d4ed8" />
            </div>
          </div>
          <div className="kpi-card__value">{activeCount.toString().padStart(2, '0')}</div>
          <div className="kpi-card__footer">
            <span>In multi-agency workflow</span>
            <span className="badge badge-teal">{activeCount} Live</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Approved & Issued</span>
            <div className="kpi-card__icon-box">
              <CheckCircle2 size={18} color="#059669" />
            </div>
          </div>
          <div className="kpi-card__value">{completedCount.toString().padStart(2, '0')}</div>
          <div className="kpi-card__footer">
            <span>Certificates & clearances</span>
            <span className="badge badge-success">{completedCount} Issued</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title" style={{ color: attentionCount > 0 ? '#dc2626' : undefined }}>
              Requires Attention
            </span>
            <div className="kpi-card__icon-box" style={{ background: attentionCount > 0 ? '#fef2f2' : undefined, color: attentionCount > 0 ? '#dc2626' : undefined }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card__value" style={{ color: attentionCount > 0 ? '#dc2626' : undefined }}>
            {attentionCount.toString().padStart(2, '0')}
          </div>
          <div className="kpi-card__footer">
            <span>Action or re-filing needed</span>
            <span className={attentionCount > 0 ? 'badge badge-error' : 'badge badge-neutral'}>
              {attentionCount > 0 ? 'Action Needed' : 'All Nominal'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Total Interop Records</span>
            <div className="kpi-card__icon-box">
              <Lock size={18} color="#0d9488" />
            </div>
          </div>
          <div className="kpi-card__value">{totalCount.toString().padStart(2, '0')}</div>
          <div className="kpi-card__footer">
            <span>DPDP consent-governed</span>
            <span className="badge badge-teal">Protected</span>
          </div>
        </div>
      </div>

      {/* ─── Primary Applications List ────────────────────── */}
      <div>
        <div className="citizen-dash__section-header">
          <div>
            <h2 className="citizen-dash__section-title">Active Service Applications</h2>
            <p className="citizen-dash__section-sub">
              Live inter-departmental clearance milestones, circuit breaker state, and statutory notifications
            </p>
          </div>
          <button
            className="btn-outline"
            onClick={() => navigate('/applications')}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>All Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="gov-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Syncing applications from federated ministries...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="gov-card" style={{ padding: 40, textAlign: 'center' }}>
            <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>No Applications Yet</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4, maxWidth: 460, marginInline: 'auto' }}>
              You haven't filed any applications yet. Click below to launch a fast-track cross-agency registration.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/applications/new')}
              style={{ marginTop: 18 }}
            >
              <PlusCircle size={16} />
              <span>Start First Application</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {applications.slice(0, 3).map((app) => {
              const progressPct = getProgressPercent(app);
              const deptName =
                (app.departmentId && (app.departmentId.name || app.departmentId.code)) ||
                'Department of Business & Public Commerce';

              return (
                <div key={app._id || app.id || app.applicationId} className="app-priority-card">
                  <div className="app-priority-card__top">
                    <div className="app-priority-card__main-info">
                      <div className="app-priority-card__icon-box">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <div className="app-priority-card__tags">
                          <span className="app-priority-card__ref">{app.applicationId}</span>
                          {getStatusBadge(app.status)}
                          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            Applied {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="app-priority-card__name">
                          {app.type.replace(/_/g, ' ')}
                          {app.formData?.companyName ? ` — ${app.formData.companyName}` : ''}
                        </h3>
                        <p className="app-priority-card__desc">{deptName}</p>
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/applications/${app.applicationId || app._id}`)}
                    >
                      <span>Track Workflow</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="workflow-progress-box">
                    <div className="workflow-progress-box__header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={15} color="#0d9488" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Current Milestone:</span>
                        <span style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                          {app.currentStep || 'Multi-Agency Verification'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Service SLA: <strong style={{ color: '#0f172a' }}>48 Hours</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ color: '#64748b' }}>Sovereign Handshake Pipeline</span>
                        <span style={{ color: '#0d9488', fontFamily: 'monospace' }}>
                          {progressPct}% Completed
                        </span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Bottom Two Columns (Activity & Quick Services) ─ */}
      <div className="citizen-dash__bottom-grid">
        {/* Left: Recent Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Recent Interoperability Activity
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Immutable civic ledger of cross-department verifications
            </p>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-item__left">
                <div className="activity-item__icon">
                  <FileCheck size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="activity-item__title">Identity Attestation Synced</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      UIDAI-Sync
                    </span>
                  </div>
                  <p className="activity-item__desc">
                    Aadhaar cryptographic identity verified for high-assurance services.
                  </p>
                </div>
              </div>
              <span className="activity-item__time">Live Handshake</span>
            </div>

            <div className="activity-item">
              <div className="activity-item__left">
                <div className="activity-item__icon">
                  <Receipt size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="activity-item__title">Tax Compliance Handshake</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      CBDT-REST
                    </span>
                  </div>
                  <p className="activity-item__desc">
                    Automated non-dues status cleared with Central Board of Direct Taxes.
                  </p>
                </div>
              </div>
              <span className="activity-item__time">Auto-Cleared</span>
            </div>

            <div className="activity-item">
              <div className="activity-item__left">
                <div className="activity-item__icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="activity-item__title">DPDP Consent Registered</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      Consent v1.0
                    </span>
                  </div>
                  <p className="activity-item__desc">
                    Authorized spatial & corporate filing exchange under statutory purpose.
                  </p>
                </div>
              </div>
              <span className="activity-item__time">Active</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Services Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Quick Sovereign Services</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Integrated Multi-Agency Clearance Portals
            </p>
          </div>

          <div className="quick-services-card">
            <button
              className="quick-launch-btn"
              onClick={() => navigate('/applications/new')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlusCircle size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                    Start New Application
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Unified single-window wizard with automated KYC pre-fill
                  </div>
                </div>
              </div>
              <ArrowRight size={18} color="#1d4ed8" />
            </button>

            <div className="quick-catalog-grid">
              <div
                className="catalog-item"
                onClick={() => navigate('/applications/new?type=BUSINESS_APPROVAL')}
                style={{ cursor: 'pointer' }}
              >
                <Building2 size={20} color="#1d4ed8" />
                <div>
                  <div className="catalog-item__title">Business Incorporation</div>
                  <div className="catalog-item__sub">MCA & Commerce clearance</div>
                </div>
              </div>

              <div
                className="catalog-item"
                onClick={() => navigate('/applications/new?type=TAX_CLEARANCE')}
                style={{ cursor: 'pointer' }}
              >
                <Receipt size={20} color="#1d4ed8" />
                <div>
                  <div className="catalog-item__title">Tax Clearance NOC</div>
                  <div className="catalog-item__sub">CBDT compliance cert</div>
                </div>
              </div>

              <div
                className="catalog-item"
                onClick={() => navigate('/applications/new?type=TRADE_LICENSE')}
                style={{ cursor: 'pointer' }}
              >
                <Zap size={20} color="#1d4ed8" />
                <div>
                  <div className="catalog-item__title">Trade License</div>
                  <div className="catalog-item__sub">Municipal urban registry</div>
                </div>
              </div>

              <div
                className="catalog-item"
                onClick={() => navigate('/applications/new?type=LAND_REGISTRATION')}
                style={{ cursor: 'pointer' }}
              >
                <MapPin size={20} color="#1d4ed8" />
                <div>
                  <div className="catalog-item__title">Land Registration</div>
                  <div className="catalog-item__sub">Spatial cadastral deed</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0d9488',
                  }}
                ></span>
                <span>3 Federated Departments Live (UIDAI, CBDT, MCA)</span>
              </div>
              <a
                href="/applications/new"
                style={{ fontWeight: 600, color: '#1d4ed8' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/applications/new');
                }}
              >
                Explore Catalog →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
