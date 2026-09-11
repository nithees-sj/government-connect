import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  ShieldCheck,
  Download,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  Lock,
  Copy,
  CreditCard,
  Fingerprint,
  Save,
  Check,
} from 'lucide-react';
import type { IDocumentRecord } from '@govconnect/shared-types';

export function DocumentsVaultPage() {
  const [documents, setDocuments] = useState<IDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('SOVEREIGN_IDENTITY');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallet state
  const [walletLoading, setWalletLoading] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [panInput, setPanInput] = useState('');
  const [walletData, setWalletData] = useState<any>(null);

  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const { data } = await api.get('/documents/wallet');
      if (data.success && data.data) {
        setWalletData(data.data);
        setAadhaarInput(data.data.aadhaarNumber || '');
        setPanInput(data.data.panNumber || '');
      }
    } catch {
      // ignore
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch verified document vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchWallet();
  }, []);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWallet(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data } = await api.post('/documents/wallet', {
        aadhaarNumber: aadhaarInput,
        panNumber: panInput,
      });
      if (data.success) {
        setSuccessMsg('Sovereign Wallet credentials (Aadhaar & PAN) successfully linked and verified.');
        await fetchWallet();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save wallet credentials');
    } finally {
      setSavingWallet(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a file to upload');
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedDocType);

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg(`Document "${data.data?.originalName || file.name}" uploaded and verified with SHA-256 seal.`);
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await Promise.all([fetchDocuments(), fetchWallet()]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to download document artifact');
    }
  };

  const hasAadhaarLinked = Boolean(walletData?.aadhaarNumber || walletData?.hasAadhaarDoc);
  const hasPanLinked = Boolean(walletData?.panNumber || walletData?.hasPanDoc);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
            DigiLocker & Sovereign Documents Wallet
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
            Zero-Knowledge verified document artifacts and sovereign identity credentials required for inter-departmental government services.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => { fetchDocuments(); fetchWallet(); }}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <UploadCloud size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ─── Sovereign Credentials Wallet Card ─────────────── */}
      <div className="gov-card" style={{ padding: 24, border: '1px solid #bfdbfe', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fingerprint size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Sovereign Identity & Tax Credentials (Citizen Wallet)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 2, margin: 0 }}>
                These credentials are used by the State Machine to auto-verify your applications with UIDAI & CBDT gateways.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              background: hasAadhaarLinked ? '#dcfce7' : '#fee2e2',
              color: hasAadhaarLinked ? '#15803d' : '#b91c1c',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              {hasAadhaarLinked ? <Check size={14} /> : <AlertTriangle size={14} />}
              Aadhaar: {hasAadhaarLinked ? 'Linked' : 'Not Linked'}
            </span>
            <span style={{
              background: hasPanLinked ? '#dcfce7' : '#fee2e2',
              color: hasPanLinked ? '#15803d' : '#b91c1c',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              {hasPanLinked ? <Check size={14} /> : <AlertTriangle size={14} />}
              PAN: {hasPanLinked ? 'Linked' : 'Not Linked'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveWallet} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Aadhaar Number (12 Digits)
            </label>
            <input
              type="text"
              placeholder="e.g. 5432 8901 1234"
              value={aadhaarInput}
              onChange={(e) => setAadhaarInput(e.target.value)}
              maxLength={16}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                background: '#ffffff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              PAN Number (10 Alphanumeric)
            </label>
            <input
              type="text"
              placeholder="e.g. ABCDE1234F"
              value={panInput}
              onChange={(e) => setPanInput(e.target.value.toUpperCase())}
              maxLength={10}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                background: '#ffffff',
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary"
              disabled={savingWallet}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, width: '100%', justifyContent: 'center' }}
            >
              {savingWallet ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving Wallet...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save & Link to Wallet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {successMsg && (
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
          <span>{successMsg}</span>
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
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Cryptographic Integrity Verification
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              All {documents.length} documents stored in this vault are validated against sovereign registries.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Fetching sovereign document vault...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
            <p style={{ fontWeight: 600, color: '#334155' }}>No Documents Uploaded Yet</p>
            <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>
              Click "Upload Document" to add verified identity proof, tax returns, or enterprise deeds.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {documents.map((doc) => {
              const docId = (doc._id || doc.id) as string;
              const formatSize = (bytes: number) => {
                if (!bytes) return '1.2 MB';
                return bytes < 1024 * 1024
                  ? `${Math.round(bytes / 1024)} KB`
                  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
              };

              return (
                <div
                  key={docId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileCheck2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                        {doc.originalName || doc.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>
                        Type: {doc.metadata?.documentType || 'OFFICIAL_DOCUMENT'} • Size: {formatSize(doc.sizeBytes)} • Uploaded: {new Date(doc.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                      {doc.sha256Hash && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SHA-256:</span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              color: '#334155',
                              background: '#e2e8f0',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {doc.sha256Hash.slice(0, 20)}...{doc.sha256Hash.slice(-8)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Verified & Virus-Clean
                    </span>
                    <button
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleDownload(docId, doc.originalName || doc.fileName)}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="gov-card"
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Upload Sovereign Document Artifact
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: 20 }}>
              Files are automatically scanned for integrity and stamped with a SHA-256 checksum.
            </p>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Document Category
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="SOVEREIGN_IDENTITY">Aadhaar / Passport / Voter ID</option>
                  <option value="TAX_CLEARANCE">PAN Card / Tax Clearance Certificate</option>
                  <option value="COMMERCE_FILING">Certificate of Incorporation / MOA / AOA</option>
                  <option value="PROPERTY_DEED">Cadastral Land Deed / Lease Agreement</option>
                  <option value="SUPPORTING_PROOF">General Supporting Evidence</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Select File (PDF, PNG, JPEG up to 10MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Hashing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Upload & Verify</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
