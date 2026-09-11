import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, KeyRound } from 'lucide-react';
import type { IConsent } from '@govconnect/shared-types';

export function ConsentCenterPage() {
  const [consents, setConsents] = useState<IConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchConsents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/consents');
      setConsents(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch DPDP consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (consentId: string, token: string) => {
    setRevokingId(consentId);
    setActionSuccess(null);
    try {
      await api.post(`/consents/${consentId}/revoke`);
      setActionSuccess(`Consent token ${token} has been revoked successfully under DPDP Act 2023 provisions.`);
      // Refresh list
      await fetchConsents();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to revoke consent');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
            Consent Management Center (DPDP Act 2023)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
            Sovereign transparency dashboard: Monitor and revoke data sharing authorizations granted to government departments.
          </p>
        </div>
        <button
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={fetchConsents}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: 8,
            color: '#065f46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 8,
            color: '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      <div className="gov-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#eff6ff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Statutory Revocation Rights & Purpose Limitation
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              In accordance with DPDP rules, cross-department data exchange is restricted strictly to active tokens.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading active DPDP consent records...</p>
          </div>
        ) : consents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <KeyRound size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
            <p style={{ fontWeight: 600, color: '#334155' }}>No Data Exchange Consents Found</p>
            <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>
              When you apply for government services requiring inter-agency verification, authorizations will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {consents.map((item) => {
              const deptName =
                (item.departmentId && (item.departmentId.name || item.departmentId.code)) ||
                'Federated Government Agency';
              const isGranted = item.status === 'GRANTED';
              const isRevoked = item.status === 'REVOKED';
              const isExpired = item.status === 'EXPIRED' || new Date(item.expiresAt) < new Date();

              return (
                <div
                  key={item._id || item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          background: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1px solid #cbd5e1',
                          color: '#1e293b',
                        }}
                      >
                        {item.token}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                        {deptName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                        {item.version || 'v1.0-DPDP'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: 2 }}>
                      {item.purpose}
                    </p>

                    {item.dataFields && item.dataFields.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Authorized Fields:</span>
                        {item.dataFields.map((f, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.75rem',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '1px 6px',
                              borderRadius: 4,
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      Granted: {new Date(item.grantedAt).toLocaleDateString()} • Expires: {new Date(item.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {isGranted && !isExpired && (
                      <>
                        <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                          Active Token
                        </span>
                        <button
                          className="btn-outline"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8125rem',
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            cursor: revokingId === item._id ? 'not-allowed' : 'pointer',
                          }}
                          disabled={revokingId === item._id}
                          onClick={() => handleRevoke(item._id!, item.token)}
                        >
                          {revokingId === item._id ? 'Revoking...' : 'Revoke Consent'}
                        </button>
                      </>
                    )}
                    {isExpired && (
                      <span className="badge badge-neutral" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        Expired
                      </span>
                    )}
                    {isRevoked && (
                      <span className="badge badge-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        Revoked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
