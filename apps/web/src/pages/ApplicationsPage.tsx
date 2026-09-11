import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Search,
  PlusCircle,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import './ApplicationsPage.css';

interface ApplicationItem {
  _id: string;
  applicationId: string;
  type: string;
  status: string;
  currentStep?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  citizenId?: {
    _id: string;
    fullName: string;
    contact?: { email?: string; phone?: string };
  };
  formData?: Record<string, any>;
  createdAt: string;
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/applications');
      if (res.data.success && res.data.data) {
        setApplications(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
        return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Approved & Issued</span>;
      case 'PENDING':
      case 'IN_PROGRESS':
      case 'IN_REVIEW':
      case 'SUBMITTED':
      case 'PROCESSING':
        return <span className="badge badge-teal" style={{ background: '#ccfbf1', color: '#0f766e', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>In Progress</span>;
      case 'ACTION_REQUIRED':
      case 'REJECTED':
        return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Rejected / Attention</span>;
      case 'FAILED':
        return <span className="badge badge-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Inter-Agency Failed</span>;
      case 'DRAFT':
        return <span className="badge badge-neutral" style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>Draft</span>;
      default:
        return <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
    }
  };

  const getProgressPercentage = (status: string, currentStep?: string) => {
    if (status === 'COMPLETED' || status === 'APPROVED') return 100;
    if (status === 'REJECTED' || status === 'FAILED') return 40;
    if (currentStep?.includes('TAX')) return 50;
    if (currentStep?.includes('COMMERCE') || currentStep?.includes('REVIEW')) return 75;
    if (currentStep?.includes('ISSUANCE') || currentStep?.includes('FINAL')) return 90;
    return 25;
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      app.applicationId.toLowerCase().includes(q) ||
      (app.formData?.companyName && app.formData.companyName.toLowerCase().includes(q)) ||
      (app.formData?.businessName && app.formData.businessName.toLowerCase().includes(q)) ||
      (app.departmentId?.name && app.departmentId.name.toLowerCase().includes(q)) ||
      (app.citizenId?.fullName && app.citizenId.fullName.toLowerCase().includes(q)) ||
      app.type.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_PROGRESS') return ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'SUBMITTED', 'PROCESSING'].includes(app.status);
    if (statusFilter === 'COMPLETED') return ['COMPLETED', 'APPROVED'].includes(app.status);
    if (statusFilter === 'REJECTED') return ['REJECTED', 'FAILED'].includes(app.status);
    if (statusFilter === 'DRAFT') return app.status === 'DRAFT';

    return true;
  });

  return (
    <div className="apps-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="apps-page__header">
        <div>
          <h1 className="apps-page__title">Service Applications Registry</h1>
          <p className="apps-page__subtitle">
            Manage, track, and review your multi-departmental government filings and clearances
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={fetchApplications}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/applications/new')}
            id="new-application-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PlusCircle size={18} />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* ─── Controls & Search ─────────────────────────────── */}
      <div className="apps-page__controls">
        <div className="apps-page__search-wrap">
          <Search size={18} className="apps-page__search-icon" />
          <input
            type="text"
            className="apps-page__search-input"
            placeholder="Search by Reference ID (GC-XXXXX), applicant, company, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="apps-page__filter-tabs">
          <button
            className={`filter-chip ${statusFilter === 'ALL' ? 'filter-chip--active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>All</span>
            <span className="filter-chip__count">{applications.length}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'IN_PROGRESS' ? 'filter-chip--active' : ''}`}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            <span>In Progress</span>
            <span className="filter-chip__count">
              {applications.filter((a) => ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'SUBMITTED', 'PROCESSING'].includes(a.status)).length}
            </span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'COMPLETED' ? 'filter-chip--active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            <span>Completed</span>
            <span className="filter-chip__count">
              {applications.filter((a) => ['COMPLETED', 'APPROVED'].includes(a.status)).length}
            </span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'REJECTED' ? 'filter-chip--active' : ''}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            <span>Rejected / Action</span>
            <span className="filter-chip__count">
              {applications.filter((a) => ['REJECTED', 'FAILED'].includes(a.status)).length}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Table View ────────────────────────────────────── */}
      <div className="apps-table-container">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <p>Loading application ledger...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              No applications found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
              {searchQuery
                ? 'Try adjusting your search query or reset the filters.'
                : 'No applications currently registered in this view.'}
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/applications/new')}
            >
              Start New Service Application
            </button>
          </div>
        ) : (
          <table className="apps-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Service & Department</th>
                <th>Applicant / Entity</th>
                <th>Current Status</th>
                <th>Pipeline Progress</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => {
                const progress = getProgressPercentage(app.status, app.currentStep);
                return (
                  <tr key={app._id || app.applicationId}>
                    <td>
                      <span className="apps-table__ref">{app.applicationId}</span>
                    </td>
                    <td>
                      <span className="apps-table__service-title">
                        {app.type.replace(/_/g, ' ')}
                      </span>
                      <span className="apps-table__service-dept">
                        {app.departmentId?.name || 'Department of Commerce & Public Services'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {app.formData?.companyName || app.formData?.businessName || app.citizenId?.fullName || 'Citizen Applicant'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {app.formData?.panNumber ? `PAN: ${app.formData.panNumber}` : app.citizenId?.contact?.phone || ''}
                      </div>
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      <div className="apps-table__progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                          <span style={{ color: '#64748b' }}>{app.currentStep || 'Submitted'}</span>
                          <span style={{ fontWeight: 700, color: '#0d9488' }}>{progress}%</span>
                        </div>
                        <div className="apps-table__progress-track">
                          <div
                            className="apps-table__progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {new Date(app.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => navigate(`/applications/${app.applicationId || app._id}`)}
                      >
                        <span>View</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
