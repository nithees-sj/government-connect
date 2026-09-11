import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import './Auth.css';

interface LoginPageProps {
  initialTab?: 'login' | 'reg';
}

export function LoginPage({ initialTab = 'login' }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'reg'>(initialTab);
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer' | 'admin'>('citizen');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('ravi.kumar@example.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Individual Citizen');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);

  // Status & loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  // Role details mapping
  const roleContextInfo = {
    citizen: {
      title: 'Selected: Citizen / Enterprise (Ravi Kumar)',
      desc: 'Pending authentication into Ministry Health & Corporate registers',
      email: 'ravi.kumar@example.com',
      password: 'password123',
    },
    officer: {
      title: 'Selected: Ministry Officer (Arun Mohan)',
      desc: 'Review and verify pending cross-agency citizen applications',
      email: 'officer@govconnect.in',
      password: 'password123',
    },
    admin: {
      title: 'Selected: Platform Admin (Gov Mesh Ops)',
      desc: 'Core infrastructure telemetry, connectors, and schema mapping',
      email: 'admin@govconnect.in',
      password: 'password123',
    },
  };

  const handleRoleSelect = (role: 'citizen' | 'officer' | 'admin') => {
    setSelectedRole(role);
    setLoginIdentifier(roleContextInfo[role].email);
    setLoginPassword(roleContextInfo[role].password);
    setError('');
  };

  const handlePersonaClick = async (role: 'citizen' | 'officer' | 'admin') => {
    handleRoleSelect(role);
    setError('');
    setLoading(true);
    try {
      await login(roleContextInfo[role].email, roleContextInfo[role].password);
      if (role === 'officer') {
        navigate('/officer/queue');
      } else if (role === 'admin') {
        navigate('/monitoring');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginIdentifier, loginPassword);
      if (loginIdentifier.includes('officer')) {
        navigate('/officer/queue');
      } else if (loginIdentifier.includes('admin')) {
        navigate('/monitoring');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('Sovereign passwords do not match');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must contain at least 8 characters');
      return;
    }
    if (!dpdpConsent) {
      setError('Statutory DPDP consent is required for registration');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Password Strength evaluation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Enter minimum 8 chars' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { score: 1, text: 'Weak — Add numbers & symbols' };
    if (score === 2) return { score: 2, text: 'Fair — Add special characters' };
    if (score === 3) return { score: 3, text: 'Good — High entropy' };
    return { score: 4, text: 'Strong — Sovereign Cryptographic Grade' };
  };

  const pwdStrength = getPasswordStrength(regPassword);

  return (
    <div className="gateway-page">
      <div className="gateway-container">
        {/* ─── Top Operational Banner & Security Bar ─────────── */}
        <div className="gateway-top-bar">
          <div className="gateway-top-left">
            <div className="gateway-ping-wrap">
              <span className="gateway-ping-circle"></span>
              <span className="gateway-ping-dot"></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="gateway-env-tag">Sandbox Gateway</span>
              <span className="gateway-top-text">
                Demo Environment Active — Select pre-configured synthetic personas below or enter standard credentials.
              </span>
            </div>
          </div>

          <div className="gateway-top-badges">
            <span className="gateway-top-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#1d4ed8' }}>
                verified_user
              </span>
              FIPS 140-3 Hardware Level
            </span>
            <span className="gateway-top-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#059669' }}>
                lock
              </span>
              256-bit Ephemeral Session
            </span>
            <span className="gateway-top-badge highlight">DPDP Act 2023 Compliant</span>
          </div>
        </div>

        {/* ─── Gateway Identity Header ───────────────────────── */}
        <div className="gateway-identity-bar">
          <div className="gateway-identity-left">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="gateway-logo-box">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor">
                  <circle cx="24" cy="11" fill="#38BDF8" r="5" stroke="none" />
                  <circle cx="11" cy="35" fill="#34D399" r="5" stroke="none" />
                  <circle cx="37" cy="35" fill="#818CF8" r="5" stroke="none" />
                  <polygon
                    className="text-white"
                    fill="none"
                    points="24,11 11,35 37,35"
                    stroke="#ffffff"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <circle cx="24" cy="27" fill="#FFFFFF" r="3" stroke="none" />
                </svg>
              </div>
              <div>
                <div className="gateway-title-row">
                  <span className="gateway-brand-title">GovConnect</span>
                  <span className="gateway-version-pill">v4.8 Core Mesh</span>
                </div>
                <p className="gateway-brand-desc">
                  Sovereign Interoperability Gateway &amp; Federated Access Hub
                </p>
              </div>
            </Link>
          </div>

          <div className="gateway-telemetry-pill">
            <span className="gateway-live-dot"></span>
            <strong style={{ color: '#001428' }}>18 Nodes Synced</strong>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ fontFamily: 'var(--font-code)', color: '#64748b' }}>RTT: 18ms</span>
          </div>
        </div>

        {/* ─── Main Two-Column Layout ────────────────────────── */}
        <div className="gateway-main-grid">
          {/* LEFT PANEL: Primary Authentication & Registration */}
          <div className="gateway-left-panel">
            <div className="gateway-card">
              {/* Segmented Tab Switcher */}
              <div className="gateway-tab-switcher">
                <button
                  type="button"
                  className={`gateway-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                >
                  Sign In to Gateway
                </button>
                <button
                  type="button"
                  className={`gateway-tab-btn ${activeTab === 'reg' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('reg');
                    setError('');
                  }}
                >
                  Citizen Registration
                </button>
              </div>

              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              {/* ─── TAB 1: LOGIN ─── */}
              {activeTab === 'login' && (
                <div>
                  {/* Operational Context Role Selector */}
                  <div className="role-context-section">
                    <span className="role-context-label">Operational Context</span>
                    <div className="role-context-grid">
                      <button
                        type="button"
                        className={`role-context-btn ${selectedRole === 'citizen' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('citizen')}
                      >
                        <span className="role-btn-title">Citizen / Enterprise</span>
                        <span className="role-btn-sub">e.g. Ravi Kumar</span>
                      </button>

                      <button
                        type="button"
                        className={`role-context-btn ${selectedRole === 'officer' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('officer')}
                      >
                        <span className="role-btn-title">Ministry Officer</span>
                        <span className="role-btn-sub">MCA Tier-2 Review</span>
                      </button>

                      <button
                        type="button"
                        className={`role-context-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('admin')}
                      >
                        <span className="role-btn-title">Platform Admin</span>
                        <span className="role-btn-sub">Core Infrastructure</span>
                      </button>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form className="gateway-form" onSubmit={handleLoginSubmit}>
                    <div className="form-field-group">
                      <label className="form-field-label" htmlFor="login-identifier">
                        Government ID / Registered Email / PAN
                      </label>
                      <div className="input-with-icon">
                        <span className="material-symbols-outlined input-icon-left">badge</span>
                        <input
                          id="login-identifier"
                          type="text"
                          className="gateway-input"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. ABCDE1234F or sovereign user ID"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <div className="form-field-label-row">
                        <label className="form-field-label" htmlFor="login-password">
                          Access Credential / Secret PIN
                        </label>
                        <span className="form-forgot-link" style={{ cursor: 'pointer' }}>
                          Forgot Credentials?
                        </span>
                      </div>
                      <div className="input-with-icon">
                        <span className="material-symbols-outlined input-icon-left">key</span>
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          className="gateway-input"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="checkbox-row">
                      <input
                        id="remember-session"
                        type="checkbox"
                        className="gateway-checkbox"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                      />
                      <label htmlFor="remember-session" className="checkbox-label">
                        Enforce persistent sovereign token on this secure terminal
                      </label>
                    </div>

                    <button type="submit" className="btn-gateway-submit" disabled={loading}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        lock_open
                      </span>
                      <span>{loading ? 'Authenticating...' : 'Authenticate & Access Gateway'}</span>
                    </button>
                  </form>

                  {/* Synthetic Personas 1-Click Fast Auth */}
                  <div className="personas-section">
                    <div className="personas-header">
                      <span className="personas-title">
                        <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 18 }}>
                          switch_account
                        </span>
                        Synthetic Gateway Personas
                      </span>
                      <span className="personas-subtitle">1-Click Fast Auth</span>
                    </div>

                    <div className="personas-grid">
                      {/* Persona 1: Citizen */}
                      <div className="persona-card" onClick={() => handlePersonaClick('citizen')}>
                        <div className="persona-top">
                          <div className="persona-avatar blue">RK</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="persona-name">Ravi Kumar</div>
                            <div className="persona-role">MD, Arogya Health</div>
                          </div>
                        </div>
                        <div className="persona-footer">
                          <span className="persona-code">#GC-10021</span>
                          <span className="persona-action">Load →</span>
                        </div>
                      </div>

                      {/* Persona 2: Officer */}
                      <div className="persona-card" onClick={() => handlePersonaClick('officer')}>
                        <div className="persona-top">
                          <div className="persona-avatar slate">AM</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="persona-name">Officer Arun</div>
                            <div className="persona-role">MCA Tier-2 Reviewer</div>
                          </div>
                        </div>
                        <div className="persona-footer">
                          <span className="persona-code">Desk #44-B</span>
                          <span className="persona-action">Load →</span>
                        </div>
                      </div>

                      {/* Persona 3: Admin */}
                      <div className="persona-card" onClick={() => handlePersonaClick('admin')}>
                        <div className="persona-top">
                          <div className="persona-avatar navy">OP</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="persona-name">Gov Mesh Ops</div>
                            <div className="persona-role">Cluster Root Lead</div>
                          </div>
                        </div>
                        <div className="persona-footer">
                          <span className="persona-code">All Min. Mesh</span>
                          <span className="persona-action">Load →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: CITIZEN REGISTRATION ─── */}
              {activeTab === 'reg' && (
                <div>
                  <div className="reg-banner">
                    <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 22, marginTop: 1 }}>
                      how_to_reg
                    </span>
                    <div>
                      <h4 className="reg-banner-title">Direct Citizen Identity Onboarding</h4>
                      <p className="reg-banner-desc">
                        Federated registration creates a verified single sign-on anchor across all connected
                        ministries and statutory bodies.
                      </p>
                    </div>
                  </div>

                  <form className="gateway-form" onSubmit={handleRegSubmit}>
                    <div className="form-grid-2">
                      <div className="form-field-group">
                        <label className="form-field-label">Full Legal Name</label>
                        <input
                          type="text"
                          className="gateway-input no-icon"
                          placeholder="As shown on Aadhaar / PAN"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="form-field-label">Aadhaar Linked Mobile</label>
                        <input
                          type="tel"
                          className="gateway-input no-icon"
                          placeholder="+91 98765 43210"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field-group">
                        <label className="form-field-label">Email Address</label>
                        <input
                          type="email"
                          className="gateway-input no-icon"
                          placeholder="name@domain.gov.in / personal"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="form-field-label">Entity Profile Type</label>
                        <select
                          className="gateway-input no-icon"
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value)}
                        >
                          <option>Individual Citizen</option>
                          <option>Incorporated Company Director (DIN/MCA)</option>
                          <option>Statutory Legal Representative</option>
                          <option>Authorized NGO / Trust Officer</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field-group">
                        <label className="form-field-label">Set Sovereign Password</label>
                        <input
                          type="password"
                          className="gateway-input no-icon"
                          placeholder="••••••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="form-field-label">Confirm Sovereign Password</label>
                        <input
                          type="password"
                          className="gateway-input no-icon"
                          placeholder="••••••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    <div className="strength-meter-wrap">
                      <div className="strength-meter-header">
                        <span style={{ color: '#64748b' }}>Cryptographic Strength</span>
                        <strong style={{ color: '#001428' }}>{pwdStrength.text}</strong>
                      </div>
                      <div className="strength-bars-grid">
                        <div
                          className={`strength-bar ${
                            pwdStrength.score >= 1
                              ? pwdStrength.score === 1
                                ? 'active-weak'
                                : pwdStrength.score === 2
                                ? 'active-medium'
                                : 'active-strong'
                              : ''
                          }`}
                        ></div>
                        <div
                          className={`strength-bar ${
                            pwdStrength.score >= 2
                              ? pwdStrength.score === 2
                                ? 'active-medium'
                                : 'active-strong'
                              : ''
                          }`}
                        ></div>
                        <div
                          className={`strength-bar ${pwdStrength.score >= 3 ? 'active-strong' : ''}`}
                        ></div>
                        <div
                          className={`strength-bar ${pwdStrength.score >= 4 ? 'active-strong' : ''}`}
                        ></div>
                      </div>
                    </div>

                    <div className="checkbox-row">
                      <input
                        id="dpdp-reg-consent"
                        type="checkbox"
                        className="gateway-checkbox"
                        checked={dpdpConsent}
                        onChange={(e) => setDpdpConsent(e.target.checked)}
                        required
                      />
                      <label htmlFor="dpdp-reg-consent" className="checkbox-label">
                        I solemnly consent to DigiLocker and UIDAI e-KYC token verification in strict compliance
                        with the <span className="checkbox-highlight">Digital Personal Data Protection (DPDP) Act 2023</span>. Session metadata is retained strictly for audit trails.
                      </label>
                    </div>

                    <button type="submit" className="btn-gateway-submit" disabled={loading}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        verified
                      </span>
                      <span>{loading ? 'Registering...' : 'Register Sovereign Identity'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Context Notification Status Box */}
            <div className="gateway-status-box">
              <div className="status-left">
                <span className="gateway-live-dot"></span>
                <div style={{ minWidth: 0 }}>
                  <p className="status-title">{roleContextInfo[selectedRole].title}</p>
                  <p className="status-desc">{roleContextInfo[selectedRole].desc}</p>
                </div>
              </div>
              <span className="status-badge">Ready</span>
            </div>
          </div>

          {/* RIGHT PANEL: Sovereign Security & Gateway Telemetry */}
          <div className="gateway-right-panel">
            <div className="right-trust-card">
              <div className="trust-card-header">
                <div>
                  <h3 className="trust-title">Enterprise Interoperability</h3>
                  <p className="trust-subtitle">Sovereign identity guarantees &amp; trust boundaries</p>
                </div>
                <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 24 }}>
                  shield
                </span>
              </div>

              {/* Telemetry SVG Live Chart */}
              <div className="telemetry-chart-box">
                <div className="chart-header">
                  <span style={{ fontWeight: 700, color: '#001428' }}>Gateway Mesh RTT Distribution</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>99.998% Uptime</span>
                </div>

                <svg className="w-full h-16 text-secondary" style={{ width: '100%', height: 64, color: '#1d4ed8' }} fill="none" stroke="currentColor" viewBox="0 0 320 64">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,48 Q40,42 80,45 T160,30 T240,38 T320,24 L320,64 L0,64 Z" fill="url(#chartGradient)" stroke="none" />
                  <path d="M0,48 Q40,42 80,45 T160,30 T240,38 T320,24" fill="none" stroke="#1d4ed8" strokeWidth="2" />
                  <circle cx="160" cy="30" fill="#001428" r="3" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="320" cy="24" fill="#059669" r="3" stroke="#FFFFFF" strokeWidth="1.5" />
                </svg>

                <div className="chart-stats-grid">
                  <div className="chart-stat-item">
                    <div className="stat-item-val">18 Nodes</div>
                    <div className="stat-item-lbl">All Active</div>
                  </div>
                  <div className="chart-stat-item">
                    <div className="stat-item-val">Zero-Leak</div>
                    <div className="stat-item-lbl">Air-Gapped Vaults</div>
                  </div>
                  <div className="chart-stat-item">
                    <div className="stat-item-val">SHA-256</div>
                    <div className="stat-item-lbl">State Hashes</div>
                  </div>
                </div>
              </div>

              {/* Security Pillars List */}
              <div className="pillars-list">
                <div className="pillar-item">
                  <div className="pillar-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      memory
                    </span>
                  </div>
                  <div>
                    <h4 className="pillar-title">Zero Plaintext Storage</h4>
                    <p className="pillar-desc">
                      Identity assertions are hashed via SHA-256 and stored strictly as short-lived, ephemeral JWT tickets.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      share
                    </span>
                  </div>
                  <div>
                    <h4 className="pillar-title">Consent-Driven Federation</h4>
                    <p className="pillar-desc">
                      Target ministries only receive purpose-specific scopes. Permanent citizen master vaults remain inaccessible.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      usb
                    </span>
                  </div>
                  <div>
                    <h4 className="pillar-title">Hardware Token Interoperability</h4>
                    <p className="pillar-desc">
                      Class 3 DSC USB tokens auto-verified via CCA India Root Authority with real-time CRL checking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Datacenter Image Frame */}
              <div className="datacenter-frame">
                <img
                  src="/datacenter.png"
                  alt="Sovereign Data Center Security Operations"
                  className="datacenter-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Grievance & SLA Support Box */}
            <div className="support-box">
              <div className="support-header">
                <span className="support-title">
                  <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 18 }}>
                    support_agent
                  </span>
                  Sovereign Desk &amp; SLA Support
                </span>
                <span className="support-sla-badge">SLA: &lt; 15 min</span>
              </div>
              <p className="support-desc">
                Facing authentication timeouts, token expiry or DSC driver handshakes? Contact Central Technical Dispatch:
              </p>
              <div className="support-contacts-row">
                <div className="support-phone">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    call
                  </span>
                  <span>1800-11-0024 (Toll Free)</span>
                </div>
                <a href="#faq" className="support-faq-link">
                  Integration FAQ
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    arrow_outward
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Gateway Footer Badges ─────────────────────────── */}
        <div className="gateway-bottom-bar">
          <div className="gateway-bottom-badges">
            <span>Official Portal of National Interoperability Framework</span>
            <span>•</span>
            <span>MeitY &amp; NIC Certified Node</span>
          </div>
          <div>© 2026 GovConnect Hub • Sovereign Cyber Infrastructure</div>
        </div>
      </div>
    </div>
  );
}
