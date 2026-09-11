import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import './LandingPage.css';

export function LandingPage() {
  const { isAuthenticated, login } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoLaunch = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      try {
        // Quick sign in with demo citizen account or redirect to login
        await login('ravi.kumar@example.com', 'password123');
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    }
  };

  return (
    <div className="landing-page" id="overview">
      {/* ─── Top Sovereign Header ───────────────────────── */}
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="flex items-center gap-unit-md shrink-0">
            <Link to="/" className="landing-brand">
              <img
                src="/govconnect-logo.png"
                alt="GovConnect Integration Hub Logo"
                className="landing-logo-img"
              />
            </Link>
          </div>

          <nav className="landing-nav">
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => scrollToSection('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'architecture' ? 'active' : ''}`}
              onClick={() => scrollToSection('architecture')}
            >
              Architecture
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'capabilities' ? 'active' : ''}`}
              onClick={() => scrollToSection('capabilities')}
            >
              Features
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => scrollToSection('security')}
            >
              Security
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'departments' ? 'active' : ''}`}
              onClick={() => scrollToSection('departments')}
            >
              Departments
            </button>
            <button
              type="button"
              className={`landing-nav-link ${activeSection === 'documentation' ? 'active' : ''}`}
              onClick={() => scrollToSection('documentation')}
            >
              Documentation
            </button>
          </nav>

          <div className="landing-header-right-spacer shrink-0"></div>
        </div>
      </header>

      {/* ─── Main Landing Content ──────────────────────── */}
      <main className="landing-main">
        {/* Top Sovereign Announcement & Hero Section */}
        <section className="landing-hero">
          <div className="landing-container">
            <div className="landing-hero-content">
              <div className="landing-announcement">
                <span className="landing-pulse-dot"></span>
                <span className="landing-announcement-tag">SIH 2026 National Finalist</span>
                <span className="landing-announcement-sep">•</span>
                <span className="landing-announcement-desc">
                  Digital Public Infrastructure Standard v4.2
                </span>
              </div>

              <h1 className="landing-hero-title">
                Connect Government Services Through One Secure Interoperability Platform
              </h1>

              <p className="landing-hero-desc">
                GovConnect enables secure interoperability between existing government digital systems,
                eliminating duplicate citizen data entry, synchronizing cross-department workflows via
                APIs, and delivering a unified digital governance experience without replacing legacy
                databases.
              </p>

              <div className="landing-hero-actions">
                <Link to="/login" className="btn-primary-hero">
                  <span>Get Started / Citizen Portal</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>

                <div className="landing-hero-trust">
                  <span className="material-symbols-outlined landing-trust-icon">verified_user</span>
                  <span>Zero Credential Plaintext Exposure</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Interactive Architecture Visualization Panel ─ */}
        <section className="landing-architecture-section" id="architecture">
          <div className="landing-container">
            <div className="arch-panel">
              {/* Architecture Top Bar */}
              <div className="arch-header">
                <div className="arch-header-left">
                  <div className="arch-tag-group">
                    <span className="arch-fabric-tag">Tier-3 Distributed Fabric</span>
                    <span className="arch-telemetry-tag">REALTIME_TELEMETRY</span>
                  </div>
                  <h2 className="arch-title">Cryptographic Gateway Interoperability Model</h2>
                </div>

                <div className="arch-header-right">
                  <div className="arch-status-pill">
                    <span className="landing-pulse-dot"></span>
                    <span>mTLS Handshake 1.3 Active</span>
                  </div>
                  <div className="arch-buffer-pill">Buffer: 0.04ms</div>
                </div>
              </div>

              {/* 3-Tier Grid Diagram */}
              <div className="arch-grid">
                {/* Left Column: Client Edge */}
                <div className="arch-card-column">
                  <div>
                    <div className="arch-col-header">
                      <span className="arch-col-title">Client Edge</span>
                      <span className="material-symbols-outlined" style={{ color: '#1d4ed8' }}>
                        devices
                      </span>
                    </div>
                    <p className="arch-col-subtitle">Citizen &amp; Enterprise Access Nodes</p>
                  </div>

                  <div className="arch-node-list">
                    <div className="arch-node-item">
                      <div className="arch-node-main">
                        <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                          public
                        </span>
                        <div>
                          <div className="arch-node-title">Unified Citizen Portal</div>
                          <div className="arch-node-sub">HTTPS / OIDC v2</div>
                        </div>
                      </div>
                      <span className="arch-node-dot"></span>
                    </div>

                    <div className="arch-node-item">
                      <div className="arch-node-main">
                        <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                          smartphone
                        </span>
                        <div>
                          <div className="arch-node-title">UMANG / Mobile App</div>
                          <div className="arch-node-sub">Signed Payload SDK</div>
                        </div>
                      </div>
                      <span className="arch-node-dot"></span>
                    </div>

                    <div className="arch-node-item">
                      <div className="arch-node-main">
                        <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                          storefront
                        </span>
                        <div>
                          <div className="arch-node-title">CSC Digital Kiosks</div>
                          <div className="arch-node-sub">Biometric Session Token</div>
                        </div>
                      </div>
                      <span className="arch-node-dot"></span>
                    </div>
                  </div>

                  <div className="arch-col-footer-pill">Zero Raw Data Stored on Edge Nodes</div>
                </div>

                {/* Center Column: GovConnect Core Mesh Engine */}
                <div className="arch-center-card">
                  <div className="arch-center-bg-glow"></div>
                  <div>
                    <div className="arch-center-header">
                      <div className="arch-center-title">
                        <span className="material-symbols-outlined" style={{ color: '#68dba9' }}>
                          hub
                        </span>
                        <span>GovConnect Core Mesh Engine</span>
                      </div>
                      <span className="arch-center-badge">Zero-Trust Kernel</span>
                    </div>
                    <p className="arch-center-desc">
                      Autonomous Payload Translation &amp; Sovereign State Machine
                    </p>
                  </div>

                  {/* Flow Visualizer Subgrid */}
                  <div className="arch-center-body">
                    <div className="arch-center-row">
                      <div className="arch-engine-box">
                        <div className="arch-engine-box-top teal">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            sync_alt
                          </span>
                          <span>Schema Transform</span>
                        </div>
                        <div className="arch-engine-box-title">Dynamic JSON-LD / XML</div>
                        <div className="arch-engine-box-sub">Zero db migration</div>
                      </div>

                      <div className="arch-engine-box">
                        <div className="arch-engine-box-top blue">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            fact_check
                          </span>
                          <span>Consent Broker</span>
                        </div>
                        <div className="arch-engine-box-title">Cryptographic Passports</div>
                        <div className="arch-engine-box-sub">DPDP 2023 Enforcement</div>
                      </div>
                    </div>

                    <div className="arch-orchestrator-box">
                      <div className="arch-orchestrator-main">
                        <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: 24 }}>
                          route
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                            Multi-Stage Workflow Orchestrator
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            Auto-triggers verification chain without manual queue locks
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: '#93c5fd', fontSize: 20 }}>
                        lock_clock
                      </span>
                    </div>

                    <div className="arch-token-pill">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#93c5fd' }}></span>
                        <span>Token: GC-AUTH#9042a-SEC</span>
                      </span>
                      <span style={{ color: '#68dba9', fontWeight: 600 }}>Ephemeral ECDSA Verified</span>
                    </div>
                  </div>

                  <div className="arch-center-footer">
                    <span>Sovereign HSM Vault Protection</span>
                    <span>Latency SLA &lt; 250ms</span>
                  </div>
                </div>

                {/* Right Column: Connected Sinks */}
                <div className="arch-card-column">
                  <div>
                    <div className="arch-col-header">
                      <span className="arch-col-title">Connected Sinks</span>
                      <span className="material-symbols-outlined" style={{ color: '#1d4ed8' }}>
                        lan
                      </span>
                    </div>
                    <p className="arch-col-subtitle">Federated Ministry Endpoints (Live Mock)</p>
                  </div>

                  <div className="arch-node-list">
                    <div className="arch-node-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 18 }}>
                            badge
                          </span>
                          <span className="arch-node-title">Identity Services (UIDAI/Aadhaar)</span>
                        </div>
                        <span className="arch-node-badge">
                          <span className="landing-pulse-dot" style={{ width: 6, height: 6 }}></span>
                          180ms
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                        <span>KYC Tokenizer Connector</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>Active Sync</span>
                      </div>
                    </div>

                    <div className="arch-node-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 18 }}>
                            receipt_long
                          </span>
                          <span className="arch-node-title">Tax &amp; Revenue (CBDT / GSTN)</span>
                        </div>
                        <span className="arch-node-badge">
                          <span className="landing-pulse-dot" style={{ width: 6, height: 6 }}></span>
                          210ms
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                        <span>Direct PAN-GST Matcher API</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>Active Sync</span>
                      </div>
                    </div>

                    <div className="arch-node-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 18 }}>
                            domain
                          </span>
                          <span className="arch-node-title">Corporate Registry (MCA21 v3)</span>
                        </div>
                        <span className="arch-node-badge">
                          <span className="landing-pulse-dot" style={{ width: 6, height: 6 }}></span>
                          195ms
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                        <span>CIN / DIN Validation Engine</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>Active Sync</span>
                      </div>
                    </div>
                  </div>

                  <div className="arch-col-footer-pill flex-between">
                    <span>Legacy DB Modification</span>
                    <strong style={{ color: '#001428' }}>0% Needed</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Live Interoperability Metrics Bar ─────────── */}
        <section className="landing-metrics-section">
          <div className="landing-container">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-card-top">
                  <span className="metric-label">Processed Volume</span>
                  <span className="material-symbols-outlined" style={{ color: '#1d4ed8' }}>
                    stacked_bar_chart
                  </span>
                </div>
                <div className="metric-value" style={{ color: '#001428' }}>
                  4,825+
                </div>
                <div className="metric-desc">Unified Multi-Agency Applications</div>
              </div>

              <div className="metric-card">
                <div className="metric-card-top">
                  <span className="metric-label">Gateway Reliability</span>
                  <span className="material-symbols-outlined" style={{ color: '#059669' }}>
                    check_circle
                  </span>
                </div>
                <div className="metric-value" style={{ color: '#059669' }}>
                  99.4%
                </div>
                <div className="metric-desc">Real-Time Routing &amp; Schema Match</div>
              </div>

              <div className="metric-card">
                <div className="metric-card-top">
                  <span className="metric-label">Sovereign Nodes</span>
                  <span className="material-symbols-outlined" style={{ color: '#1d4ed8' }}>
                    account_balance
                  </span>
                </div>
                <div className="metric-value" style={{ color: '#001428' }}>
                  18
                </div>
                <div className="metric-desc">Federated State &amp; Central Connectors</div>
              </div>

              <div className="metric-card">
                <div className="metric-card-top">
                  <span className="metric-label">Citizen Sovereignty</span>
                  <span className="material-symbols-outlined" style={{ color: '#1d4ed8' }}>
                    lock_reset
                  </span>
                </div>
                <div className="metric-value" style={{ color: '#001428' }}>
                  0%
                </div>
                <div className="metric-desc">Data Duplication (Direct Consent Access)</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Core Enterprise Capabilities ──────────────── */}
        <section className="landing-capabilities-section" id="capabilities">
          <div className="landing-container">
            <div className="section-header-block">
              <div className="section-eyebrow">System Specifications</div>
              <h2 className="section-title">Core Enterprise Capabilities</h2>
              <p className="section-subtitle">
                GovConnect redefines public sector technology by introducing an event-driven, decoupled
                interoperability mesh built to support national-scale citizen queries.
              </p>
            </div>

            <div className="capabilities-grid">
              {/* Capability 1 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      person_pin_circle
                    </span>
                  </div>
                  <h3 className="capability-title">Unified Citizen Experience</h3>
                  <p className="capability-desc">
                    Eliminates multi-portal fatigue. Provides single sign-on (SSO) and a universal tracking ID
                    spanning cross-ministry applications from inception to certificate dispatch.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>Identity-Federated SSO</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Capability 2 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      cable
                    </span>
                  </div>
                  <h3 className="capability-title">API-Driven Interoperability</h3>
                  <p className="capability-desc">
                    Direct REST/gRPC adapters bridging legacy relational databases (PostgreSQL, Oracle,
                    MSSQL) to modernized sovereign microservices with zero schema rewrites.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>Legacy Adapter Fabric</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Capability 3 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      key
                    </span>
                  </div>
                  <h3 className="capability-title">Consent-Driven Data Exchange</h3>
                  <p className="capability-desc">
                    Citizens grant time-bound, purpose-restricted cryptographic permissions. No department
                    gains raw persistent access to records residing in other ministries.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>DPDP Act Enforcement</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Capability 4 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      schema
                    </span>
                  </div>
                  <h3 className="capability-title">Automated Workflow Orchestration</h3>
                  <p className="capability-desc">
                    Deterministic state machines transition administrative review pipelines dynamically as
                    authoritative prerequisites from connected departments resolve.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>State Machine Automations</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Capability 5 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      insights
                    </span>
                  </div>
                  <h3 className="capability-title">Real-Time Cross-Dept Tracking</h3>
                  <p className="capability-desc">
                    Milestone-level observation matrices reporting latency and clearance status across
                    Identity, Tax, and Municipal systems in a unified analytical pane.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>Live Trace Telemetry</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Capability 6 */}
              <div className="capability-card">
                <div className="capability-card-top">
                  <div className="capability-icon-box">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      lock
                    </span>
                  </div>
                  <h3 className="capability-title">Complete Auditability &amp; Zero Trust</h3>
                  <p className="capability-desc">
                    Immutable log streams with SHA-256 cryptographic chaining, ensuring zero unauthorized
                    alterations, comprehensive forensic trails, and field encryption.
                  </p>
                </div>
                <div className="capability-card-footer">
                  <span>Cryptographic Ledger</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Deep Dive Stack Architecture Diagram ───────── */}
        <section className="landing-stack-section">
          <div className="landing-container">
            <div className="stack-card">
              <div className="stack-top-bar">
                <div>
                  <div className="section-eyebrow">Architecture Blueprint</div>
                  <h2 className="arch-title" style={{ fontSize: 24, marginTop: 4 }}>
                    End-to-End Interoperability Stack
                  </h2>
                </div>
                <div className="stack-badges">
                  <span className="stack-badge-item">OpenAPI 3.1 Compliant</span>
                  <span className="stack-badge-item">gRPC Channels</span>
                </div>
              </div>

              {/* 4 Phase Workflow Pipeline */}
              <div className="pipeline-grid">
                <div className="pipeline-step">
                  <div className="pipeline-step-header">
                    <span className="pipeline-phase-tag">PHASE 01</span>
                    <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                      touch_app
                    </span>
                  </div>
                  <div className="pipeline-step-title">Citizen Application Entry</div>
                  <p className="pipeline-step-desc">
                    Citizen inputs base claims via Web, Mobile, or CSC Kiosk using OAuth2 single session.
                  </p>
                  <div className="pipeline-step-footer">Output: Signed JWT Request</div>
                </div>

                <div className="pipeline-step">
                  <div className="pipeline-step-header">
                    <span className="pipeline-phase-tag">PHASE 02</span>
                    <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                      mediation
                    </span>
                  </div>
                  <div className="pipeline-step-title">GovConnect Interoperability Layer</div>
                  <p className="pipeline-step-desc">
                    Dynamic schema mapping validates formats, strips unauthorized metadata, and invokes consent check.
                  </p>
                  <div className="pipeline-step-footer">Engine: Semantic Schema Transformer</div>
                </div>

                <div className="pipeline-step">
                  <div className="pipeline-step-header">
                    <span className="pipeline-phase-tag">PHASE 03</span>
                    <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                      alt_route
                    </span>
                  </div>
                  <div className="pipeline-step-title">Workflow State Machine</div>
                  <p className="pipeline-step-desc">
                    Orchestrates async verification tasks across respective ministries without bottlenecking.
                  </p>
                  <div className="pipeline-step-footer">Protocol: Temporal State Coordinator</div>
                </div>

                <div className="pipeline-step">
                  <div className="pipeline-step-header">
                    <span className="pipeline-phase-tag">PHASE 04</span>
                    <span className="material-symbols-outlined" style={{ color: '#001428' }}>
                      verified
                    </span>
                  </div>
                  <div className="pipeline-step-title">Federated Department Verification</div>
                  <p className="pipeline-step-desc">
                    Target ministry APIs issue signed assertions back to the hub. Final certificate created.
                  </p>
                  <div className="pipeline-step-footer">Target: UIDAI, CBDT, MCA, Land Records</div>
                </div>
              </div>

              {/* Realtime Inspection Code / JSON Preview Panel */}
              <div className="json-inspector-box">
                <div className="json-inspector-header">
                  <div className="json-dots">
                    <span className="json-dot red"></span>
                    <span className="json-dot yellow"></span>
                    <span className="json-dot green"></span>
                    <span className="json-inspector-title">interop_envelope_v4.json</span>
                  </div>
                  <span style={{ color: '#68dba9' }}>TLS_AES_256_GCM_SHA384</span>
                </div>

                <pre className="json-inspector-code">
                  <code>{`{
  `}<span className="json-key">"transaction_id"</span>{`: `}<span className="json-str">"txn_in_gov_2026_988231c"</span>{`,
  `}<span className="json-key">"consent_urn"</span>{`: `}<span className="json-str">"urn:dpdp:in:consent:7263-9112-aa8"</span>{`,
  `}<span className="json-key">"source_agency"</span>{`: `}<span className="json-str">"NIC_MEITY_GATEWAY"</span>{`,
  `}<span className="json-key">"destination_endpoints"</span>{`: [`}<span className="json-str">"UIDAI_AUTH"</span>{`, `}<span className="json-str">"GSTN_VERIFY"</span>{`, `}<span className="json-str">"MCA21_FILING"</span>{`],
  `}<span className="json-key">"payload_hash_sha256"</span>{`: `}<span className="json-str">"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"</span>{`,
  `}<span className="json-key">"status"</span>{`: `}<span className="json-str">"ORCHESTRATION_COMMITTED"</span>{`
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Enterprise Security & Sovereign Compliance ─── */}
        <section className="landing-security-section" id="security">
          <div className="landing-container">
            <div className="security-panel">
              <div className="section-header-block" style={{ marginBottom: 0 }}>
                <div className="section-eyebrow">Zero Vulnerability Mandate</div>
                <h2 className="section-title">Enterprise Security &amp; Sovereign Compliance</h2>
                <p className="section-subtitle">
                  Engineered to satisfy stringent Indian sovereign cyber requirements and international
                  public infrastructure benchmarks.
                </p>
              </div>

              <div className="security-grid">
                <div className="security-card">
                  <div className="security-card-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      security
                    </span>
                    <span>Security Standard</span>
                  </div>
                  <div className="security-card-title">ISO 27001 Certified Architecture</div>
                  <p className="security-card-desc">
                    Strict isolation of departmental network zones with constant threat modeling and red-team audits.
                  </p>
                </div>

                <div className="security-card">
                  <div className="security-card-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      gavel
                    </span>
                    <span>Data Privacy</span>
                  </div>
                  <div className="security-card-title">DPDP Act &amp; MeitY Compliant</div>
                  <p className="security-card-desc">
                    Native implementation of Purpose Limitation, Data Minimization, and revocation rights for citizens.
                  </p>
                </div>

                <div className="security-card">
                  <div className="security-card-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      lock_clock
                    </span>
                    <span>Encryption Tier</span>
                  </div>
                  <div className="security-card-title">End-to-End TLS 1.3 &amp; AES-256</div>
                  <p className="security-card-desc">
                    Field-level asymmetric encryption guarantees zero operational engineer exposure to PII in transit or rest.
                  </p>
                </div>

                <div className="security-card">
                  <div className="security-card-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      history_edu
                    </span>
                    <span>Access Control</span>
                  </div>
                  <div className="security-card-title">RBAC &amp; Sovereign Audit Logs</div>
                  <p className="security-card-desc">
                    Attribute-based permissions for civil servants combined with non-repudiable ledger logs for Cert-In forensic readiness.
                  </p>
                </div>
              </div>

              {/* National Portal Endorsement Bar */}
              <div className="security-endorsement-bar">
                <div className="endorsement-left">
                  <span className="material-symbols-outlined endorsement-icon">assured_workload</span>
                  <div>
                    <div className="endorsement-title">
                      Integrated with National Digital Public Infrastructure
                    </div>
                    <div className="endorsement-desc">
                      Compliant with National Data Governance Framework Policy (NDGFP) draft guidelines.
                    </div>
                  </div>
                </div>
                <Link to="/login" className="btn-endorsement">
                  Request Officer Sandbox
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Detailed Public References Directory ───────── */}
        <section className="landing-references-section" id="departments">
          <div className="landing-container">
            <div className="references-grid">
              <div className="ref-col" id="documentation">
                <h4 className="ref-col-title">Products &amp; Tools</h4>
                <ul className="ref-col-list">
                  <li className="ref-col-item">Citizen Verification Gateway</li>
                  <li className="ref-col-item">Departmental REST Adapters</li>
                  <li className="ref-col-item">Dynamic Schema Modeler</li>
                  <li className="ref-col-item">Unified Tracking Engine</li>
                </ul>
              </div>

              <div className="ref-col">
                <h4 className="ref-col-title">Security &amp; Policy</h4>
                <ul className="ref-col-list">
                  <li className="ref-col-item">Security Whitepaper 2026</li>
                  <li className="ref-col-item">Consent Protocol Specs</li>
                  <li className="ref-col-item">Gov-CERT Incident Portal</li>
                  <li className="ref-col-item">NDGFP Conformance Reports</li>
                </ul>
              </div>

              <div className="ref-col">
                <h4 className="ref-col-title">Developer Resources</h4>
                <ul className="ref-col-list">
                  <li className="ref-col-item">Swagger API Explorer</li>
                  <li className="ref-col-item">gRPC Protobuf Definitions</li>
                  <li className="ref-col-item">Connector Sandbox SDK</li>
                  <li className="ref-col-item">Mock Department Endpoints</li>
                </ul>
              </div>

              <div className="ref-col">
                <h4 className="ref-col-title">Ministry Onboarding</h4>
                <ul className="ref-col-list">
                  <li className="ref-col-item">Integration Checklist</li>
                  <li className="ref-col-item">Legacy Database Bridge SLA</li>
                  <li className="ref-col-item">Interoperability Readiness Audit</li>
                  <li className="ref-col-item">Contact Mission Directorate</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Global Footer ──────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <span className="footer-brand-title">GovConnect Hub</span>
              <p className="footer-brand-desc">
                National public sector integration fabric delivering citizen-centric digital services with
                cryptographic verification and unified identity.
              </p>
              <div className="footer-cert-pill">
                <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: 16 }}>
                  verified
                </span>
                <span>ISO 27001 • FedRAMP Moderate • GDPR Ready</span>
              </div>
            </div>

            <div className="footer-nav-col">
              <span className="footer-col-title">Platforms</span>
              <ul className="footer-link-list">
                <li className="footer-link-item"><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Citizen Portal</Link></li>
                <li className="footer-link-item"><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Officer Operations Gateway</Link></li>
                <li className="footer-link-item"><Link to="/connectors" style={{ color: 'inherit', textDecoration: 'none' }}>Departmental API Hub</Link></li>
                <li className="footer-link-item"><Link to="/consents" style={{ color: 'inherit', textDecoration: 'none' }}>Consent Orchestrator</Link></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <span className="footer-col-title">Governance &amp; Trust</span>
              <ul className="footer-link-list">
                <li className="footer-link-item">National Privacy Act Compliance</li>
                <li className="footer-link-item">Zero-Trust Architecture</li>
                <li className="footer-link-item">Audit Log Ledger</li>
                <li className="footer-link-item">Vulnerability Disclosure</li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <span className="footer-col-title">Emergency &amp; Support</span>
              <ul className="footer-link-list">
                <li className="footer-link-item">Gov-CERT Incident Line</li>
                <li className="footer-link-item">24/7 Federal Operations Center</li>
                <li className="footer-link-item">Federated Service Desk</li>
                <li className="footer-link-item">Status &amp; Telemetry Feed</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© 2025 GovConnect Digital Integration Hub • National Civil Digital Infrastructure. All rights reserved.</p>
            <div className="footer-legal-links">
              <span className="footer-legal-link">Privacy Policy</span>
              <span className="footer-legal-link">Terms of Governance</span>
              <span className="footer-legal-link">Accessibility Standard</span>
              <span className="footer-legal-link">Security Certifications</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
