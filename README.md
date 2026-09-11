# 🏛️ GovInterconnect — National Government Interoperability Platform (SIH26129)
> **Master Presentation Documentation, Oral Presentation Script & Complete Feature Reference**
> *Developed for Smart India Hackathon (SIH) — Problem Statement SIH26129*

---

## 📑 Table of Contents
1. [🎯 Executive Pitch & Problem Statement](#-1-executive-pitch--problem-statement)
2. [🗺️ System Architecture & Monorepo Overview](#-2-system-architecture--monorepo-overview)
3. [👥 Demo Credentials & Quick Access Personas](#-3-demo-credentials--quick-access-personas)
4. [🎙️ Step-by-Step Presentation Script (What to Click & What to Say)](#-4-step-by-step-presentation-script-what-to-click--what-to-say)
   - [Phase 1: Public Landing Page & Technical Architecture](#phase-1-public-landing-page--technical-architecture-pitch)
   - [Phase 2: Citizen Login & End-to-End Service Application](#phase-2-citizen-login--end-to-end-service-journey)
   - [Phase 3: Department Officer Login & Sovereign Adjudication](#phase-3-department-officer-login--adjudication-flow)
   - [Phase 4: Admin Login, Resilience, AI Ops & Fault Injection](#phase-4-admin-login-telemetry-ai-ops--fault-injection)
5. [📱 Detailed Page-by-Page Feature Analysis & Role Breakdown](#-5-detailed-page-by-page-feature-analysis--role-breakdown)
   - [Public & Authentication Screens](#a-public--authentication-screens)
   - [Citizen Portal Screens](#b-citizen-portal-screens)
   - [Department Officer Portal Screens](#c-department-officer-portal-screens)
   - [Platform & Super Admin Portal Screens](#d-platform--super-admin-portal-screens)
6. [🛡️ Core Architectural Pillars & Security Features](#-6-core-architectural-pillars--security-features)
7. [⚡ Presentation Q&A Cheat Sheet for the Jury](#-7-presentation-qa-cheat-sheet-for-the-jury)
8. [🚀 Local Setup & Installation Guide](#-8-local-setup--installation-guide)

---

## 🎯 1. Executive Pitch & Problem Statement

### 📌 The Problem
Currently, public administration in India operates in **isolated departmental silos**. A citizen applying for a business license or government entitlement must repeatedly submit physical documents, provide Aadhaar/PAN copies to multiple disconnected agencies, and wait weeks for manual inter-departmental verification. When one department's server slows down or fails, entire public service pipelines stall without fallback or transparency. Furthermore, data sharing lacks statutory compliance under the **Digital Personal Data Protection (DPDP) Act 2023**.

### 💡 The Solution: GovInterconnect
**GovInterconnect** is a unified, enterprise-grade, fault-tolerant **National Government Interoperability Platform** that:
1. **Connects Sovereign Ministries Without Database Overhauls**: Bridges legacy and modern department APIs through dynamic schema transformation rules.
2. **Enforces DPDP Act 2023 Consent Governance**: Citizens possess complete cryptographic sovereignty over their data with one-click revocation.
3. **Guarantees Zero Cascading Outages**: Built-in 3-State Circuit Breakers (`CLOSED`, `OPEN`, `HALF_OPEN`) isolate failing downstream services.
4. **Maintains Immutable SHA-256 Audit Ledgers**: Every state transition and data exchange is chained cryptographically from the genesis block.
5. **Leverages AI-Powered Operations**: Automated schema field mapping, duplicate fraud detection, and natural language observability telemetry.

---

## 🗺️ 2. System Architecture & Monorepo Overview

GovInterconnect is built as a production-grade monorepo using **pnpm workspaces**:

```
govconnect/
├── apps/
│   ├── api/                 # Core API Gateway (Node.js, Express, TypeScript, Mongoose, BullMQ, Redis)
│   ├── web/                 # Sovereign Web Portal (React 18, Vite, TypeScript, Vanilla CSS Design System)
│   └── mock-departments/   # Federated Ministry Microservices & Chaos Simulation Engine
│       ├── deptA-identity   # UIDAI Aadhaar e-KYC & Biometric Gateway (Port 9001)
│       ├── deptB-tax        # CBDT Direct Tax & PAN Verification Gateway (Port 9002)
│       ├── deptC-business   # MCA Corporate Registry Gateway (Port 9003)
│       └── sim-controller   # SIH Resilience & Fault Injection Controller (Port 9000)
├── packages/
│   ├── shared-types/        # Canonical TypeScript types, enums, interfaces, and DTOs
│   └── ts-config/           # Base TypeScript configurations
├── docker/                  # MongoDB initialization scripts and Docker assets
└── docker-compose.yml       # Backing database (MongoDB :27017) and distributed cache (Redis :6379)
```

### 🌐 Federated Port Allocation & Endpoints
| Component | Port | URL / Endpoint | Purpose |
|---|---|---|---|
| **Web Portal** | `5173` | `http://localhost:5173` | Unified UI for Citizen, Officer & Admin |
| **Core API Gateway** | `8000` | `http://localhost:8000/api/v1` | Central Interoperability Mesh Engine |
| **API Documentation** | `8000` | `http://localhost:8000/api-docs` | Interactive Swagger / OpenAPI Specs |
| **Dept A (UIDAI Gateway)** | `9001` | `http://localhost:9001` | Sovereign Identity & e-KYC Microservice |
| **Dept B (CBDT Tax Gateway)** | `9002` | `http://localhost:9002` | PAN & Tax Clearance Microservice |
| **Dept C (MCA Corporate Gateway)** | `9003` | `http://localhost:9003` | Company Incorporation Microservice |
| **Simulation Controller** | `9000` | `http://localhost:9000` | Fault & Chaos Injection Engine for Live Jury Demo |
| **MongoDB** | `27017` | `mongodb://localhost:27017/govconnect` | Primary Encrypted Database Store |
| **Redis** | `6379` | `redis://localhost:6379` | BullMQ Distributed Workflow Queues & State |

---

## 👥 3. Demo Credentials & Quick Access Personas

The login screen features **1-Click Quick Persona Logins** to seamlessly switch between roles during your presentation:

| Persona Role | Email Address | Password | Default Landing Page | Primary Responsibilities |
|---|---|---|---|---|
| **Citizen (Tier 3)** | `ravi.kumar@example.com` *(or `citizen@govconnect.in`)* | `password123` | `/dashboard` | Apply for multi-agency services, track workflow progress, manage DigiLocker documents, and grant/revoke DPDP consents. |
| **Department Officer** | `officer@govconnect.in` | `password123` | `/officer/queue` | Review cross-department verification proofs (UIDAI/CBDT), inspect applicant forms, and digitally approve/reject applications with remarks. |
| **Department Admin** | `dept.admin@govconnect.in` | `password123` | `/dashboard` | Monitor department-specific application throughput, departmental audit trail, and service alerts. |
| **Platform / Super Admin** | `admin@govconnect.in` *(or `superadmin@govconnect.in`)* | `password123` | `/monitoring` | Full mesh observability: Real-time telemetry, 3-State Circuit Breakers, Schema Transformer playground, Cryptographic SHA-256 Ledger Verifier, AI Ops, and Fault Injection. |

---

## 🎙️ 4. Step-by-Step Presentation Script (What to Click & What to Say)

*Follow this structured 4-phase sequence during your project pitch to deliver a flawless, high-impact demonstration to the jury.*

---

### Phase 1: Public Landing Page & Technical Architecture (Pitch)
> **URL**: `http://localhost:5173/`

#### 🗣️ What to Say:
> *"Respected Jury, welcome to **GovInterconnect** — our National Government Interoperability Platform for Smart India Hackathon problem statement SIH26129.*
>
> *Today, government digital services are deeply fragmented. Citizens submit identical paperwork multiple times, and departments operate in data silos. GovInterconnect provides an event-driven, zero-trust interoperability mesh that integrates legacy ministry systems via standardized APIs—without requiring expensive database replacements or exposing raw citizen credentials.*
>
> *Here on our public portal, we showcase our **Tier-3 Distributed Cryptographic Interoperability Architecture**. On the left, we have client access nodes (Citizen Portal, UMANG, DigiLocker). In the center is the **GovConnect Core Mesh Engine** which handles autonomous payload translation, purpose-bound DPDP consent tokens, and distributed workflow orchestration. On the right are federated ministry endpoints: UIDAI, CBDT, and MCA21."*

#### 🖱️ What to Click:
1. Scroll through the **Landing Page**.
2. Point out the **Cryptographic Gateway Interoperability Model diagram**.
3. Highlight the live metrics bar: **4,825+ Processed Volume**, **99.4% Gateway Reliability**, **18 Sovereign Nodes**, and **0% Data Duplication**.
4. Click **"Get Started / Citizen Portal"** or the **Login** button in the header.

---

### Phase 2: Citizen Login & End-to-End Service Journey
> **Persona**: Citizen (`ravi.kumar@example.com` / `password123`)

#### 🗣️ What to Say:
> *"Let us first experience the platform from a citizen's perspective. On the login page, we support e-Gov Tier 3 biometric and sovereign credentials with password entropy validation and statutory DPDP compliance checkboxes.*
>
> *Upon logging in, the Citizen Dashboard displays the citizen's sovereign identity chip, active application statistics, and a live progress tracker for multi-agency clearances."*

#### 🖱️ Step-by-Step Actions:
1. **Login**: Click the **Citizen Persona Card** (`Ravi Kumar`) and log in.
2. **Citizen Dashboard (`/dashboard`)**:
   - Point out the top header: *"Welcome back, Ravi Kumar — Sovereign Identity AADHAAR-****-8888, Tier-3 High Assurance Active"*.
   - Point out the 4 KPI Cards: **Active Applications**, **Approved & Issued**, **Requires Attention**, and **Total Interop Records**.
   - Show the **Active Service Applications** card with real-time percentage progress bar and current milestone.
3. **DigiLocker & Sovereign Documents Vault (`/documents`)**:
   - Navigate to **"Documents Vault"** in the sidebar.
   - Show the linked Aadhaar and PAN badges with SHA-256 seal verification.
   - Explain: *"Citizens link their sovereign wallet once; the platform uses cryptographic hash pointers so citizens never have to re-upload documents across departments."*
4. **Apply for a New Service (`/applications/new`)**:
   - Click **"Apply for New Service"** to open the 4-step wizard:
     - **Step 1 (Catalog)**: Select **"Business Approval & Incorporation" (Ministry of Corporate Affairs)**.
     - **Step 2 (Form)**: Enter proposed company name (e.g. *Apex Cybernetics Private Limited*), classification (*Private Limited*), authorized capital (*₹1,000,000*), and registered address.
     - **Step 3 (AI Diagnostics & DPDP Consent)**: Point out the AI Duplicate Check and the explicit DPDP Act 2023 Section 6 consent authorization checkbox.
     - **Step 4 (Submit)**: Click **"Authorize & Submit"**.
5. **Track Application Progress (`/applications/:id`)**:
   - The citizen is navigated to the live **Application Detail** page.
   - Show the **Live Workflow Stepper & Microservices** tab:
     - **Step 1**: Dept A (UIDAI Aadhaar e-KYC) -> Auto-resolved via citizen wallet.
     - **Step 2**: Dept B (CBDT Tax & PAN Verification) -> Cross-verified via CBDT API.
     - **Step 3**: Dept C (MCA Officer Adjudication) -> Queued for manual officer review.
   - Copy the unique **Correlation ID** (e.g., `GC-CORR-...`) to demonstrate end-to-end distributed tracing.
6. **DPDP Consent Management Center (`/consents`)**:
   - Navigate to **"Consent Center"** in the sidebar.
   - Show the active purpose-bound consent tokens granted to UIDAI, CBDT, and MCA.
   - Explain: *"Citizens have statutory rights to revoke consent at any time. When revoked, downstream tokens are instantly invalidated, preventing unauthorized data queries."*

---

### Phase 3: Department Officer Login & Adjudication Flow
> **Persona**: Ministry Officer (`officer@govconnect.in` / `password123`)

#### 🗣️ What to Say:
> *"Now let us switch to the **Ministry Officer** view. Department officers don't have to manually chase tax records or identity documents from citizens. Our interoperability mesh has already fetched, transformed, and verified the proofs from UIDAI and CBDT."*

#### 🖱️ Step-by-Step Actions:
1. **Logout & Switch Persona**: Logout from Citizen, click the **Ministry Officer Persona Card** (`Arun Mohan`), and log in.
2. **Officer Adjudication Queue (`/officer/queue`)**:
   - Show the pending queue list containing the application submitted in Phase 2.
   - Point out the **AI Risk Score** (e.g. `Low - 0.98`), applicant name, and department tags.
   - Show the **Verification Proof Badges**: `UIDAI Verified ✅`, `CBDT Verified ✅`, `Documents Attached: 2`.
3. **Execute Adjudication Decision**:
   - Click **"Review & Adjudicate"** on the application card.
   - An institutional modal opens showing the applicant's cross-agency data.
   - Select **Decision: "APPROVE"**.
   - Enter Officer Remarks: *"All cross-departmental clearances verified against MCA21 criteria. Company incorporation approved."*
   - Check **"Apply Sovereign Digital Signature (SHA-256 Token Seal)"**.
   - Click **"Submit Final Adjudication"**.
   - An alert confirms the application has been approved and moved to the immutable ledger.

---

### Phase 4: Admin Login, Telemetry, AI Ops & Fault Injection
> **Persona**: Platform Admin (`admin@govconnect.in` / `password123`)

#### 🗣️ What to Say:
> *"Finally, let us inspect the **Platform & Super Admin Console** where we manage mesh observability, automated fault tolerance, schema mappings, immutable cryptographic ledgers, and AI operations."*

#### 🖱️ Step-by-Step Actions:

#### 1. System Telemetry & SLA Operations (`/monitoring`)
- Show live telemetry: **System Uptime**, **Total & Completed Applications**, **Average Gateway Latency (142ms)**, and **SLA Compliance (98.6%)**.
- Point out the **Async BullMQ Queue Telemetry**: Waiting, Active, Completed, and Failed jobs.
- Point out the **Circuit Breaker Status Matrix**: 3 Connectors Active & Closed (Healthy).

#### 2. Connectors & 3-State Circuit Breaker Matrix (`/connectors`)
- Show the 3 federated ministry connectors:
  - `CONN_UIDAI` (Port 9001)
  - `CONN_CBDT` (Port 9002)
  - `CONN_MCA` (Port 9003)
- Click **"Test Connection"** on any connector to demonstrate real-time ping latency.
- Explain: *"Each connector implements an automated 3-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) with a failure threshold of 5 and automatic 30-second cooldown resets."*

#### 3. Schema Transformation Engine & Playground (`/schema-mappings`)
- Click **"Schema Mappings"** in the sidebar.
- Select `MAP_UIDAI_CANONICAL` (UIDAI e-KYC -> Canonical Citizen Profile).
- Show the interactive **Visual Schema Transformer Playground**:
  - Left: Raw Department JSON (`aadhaar_no`, `full_name`, `dob`, etc.).
  - Middle: Dot-path field rules and transform functions (`MASK_AADHAAR`, `UPPERCASE`, `PHONE_NORMALIZE`, `DATE_FORMAT`).
  - Click **"Run Test Transformation"** -> Output renders the normalized Canonical JSON payload in milliseconds without database migrations!

#### 4. Immutable SHA-256 Audit Ledger & Chain Integrity Proof (`/audit`)
- Click **"Audit Ledger"** in the sidebar.
- Show the sequential log of events with sequence numbers, entity IDs, actions, and previous/current cryptographic hashes:
  - `previousHash` $\rightarrow$ `currentHash` (SHA-256).
- Click **"Verify Cryptographic Chain"**:
  - The system executes a live verification from the genesis block through all consecutive hashes.
  - A green badge appears: *"Audit Ledger Cryptographically Sound — 0 Tampered Events Detected"*.

#### 5. AI Operations Suite (`/ai-ops`)
- Click **"AI Operations"** in the sidebar. Demonstrate the 3 AI engines:
  - **Tab 1: AI Schema Mapper**: Click **"Suggest Field Mappings"**. AI inferentially maps disparate schemas with confidence scores (e.g. `aadhaar_no` $\rightarrow$ `citizen.aadhaarMasked`: 98%).
  - **Tab 2: AI Duplicate Scanner**: Click **"Scan for Duplicates"** to detect fraudulent multi-filings.
  - **Tab 3: NLP Telemetry Monitoring Assistant**: Type a natural language question (e.g., *"What is the average latency of the tax gateway?"* or *"How many applications completed today?"*) and receive a structured response.

#### 6. Live SIH Resilience & Fault Injection Controller (`/demo-controls`)
- Click **"Fault Injection (Demo)"** in the sidebar.
- Explain: *"To prove our platform's fault tolerance live before the jury, we built a dedicated Chaos Simulation Controller."*
- Click **"FAILURE (500 Error)"** on **Dept B (CBDT)**.
- Explain: *"Now, when requests hit Dept B, the gateway detects the consecutive failures, autonomously trips the Circuit Breaker to OPEN state, prevents server resource exhaustion, and activates fallback routing—protecting the rest of the national mesh."*
- Click **"Reset All to NORMAL"** to demonstrate instant recovery.

---

## 📱 5. Detailed Page-by-Page Feature Analysis & Role Breakdown

---

### A. Public & Authentication Screens

#### 1. Public Landing Page (`/`) — `LandingPage.tsx`
* **Target Audience**: General public, citizens, enterprise applicants, government officials, and hackathon evaluators.
* **Key Features & Components**:
  * **Institutional Sovereign Header**: Clean national branding, SIH 2026 National Finalist badge, and navigation links.
  * **Hero Section**: High-impact value proposition highlighting the Digital Public Infrastructure Standard v4.2 and zero raw credential exposure.
  * **Interactive Cryptographic Interoperability Visualizer**: 3-tier interactive diagram showing Client Edge nodes, GovConnect Core Mesh Kernel, and Connected Sinks (UIDAI, CBDT, MCA).
  * **Live Interoperability Metrics Bar**: Real-time counters displaying processed application volume (4,825+), gateway reliability (99.4%), active sovereign nodes (18), and data duplication rate (0%).
  * **Enterprise Capabilities Grid**: Cards explaining dynamic schema transformation, DPDP statutory passports, multi-stage workflow orchestration, and sub-250ms SLA latencies.
  * **Direct Entry Actions**: "Get Started / Citizen Portal" button with instant navigation.

#### 2. Institutional Authentication & Registration (`/login`, `/register`) — `LoginPage.tsx`
* **Target Audience**: All roles (Citizens, Officers, Department Admins, Platform Admins).
* **Key Features & Components**:
  * **1-Click Quick Persona Logins**: Pre-configured login cards for Citizen (`Ravi Kumar`), Officer (`Arun Mohan`), and Admin (`Gov Mesh Ops`) for instant zero-friction demonstrations.
  * **Role Selection Tabs**: Citizen / Enterprise, Ministry Officer, and Platform Admin.
  * **Password Entropy Evaluator**: Real-time cryptographic strength meter checking length, casing, numbers, and special characters.
  * **DPDP Act 2023 Statutory Consent Toggle**: Enforces explicit citizen acknowledgement during registration.
  * **Zero XSS Token Security**: JWT tokens stored strictly in memory with secure HTTP-only cookie rotation.

---

### B. Citizen Portal Screens

#### 1. Citizen Dashboard (`/dashboard`) — `DashboardPage.tsx`
* **Target Audience**: Individual citizens and enterprise authorized signatories.
* **Key Features & Components**:
  * **Sovereign ID Header**: Displays masked Aadhaar/VID chip, DigiLocker verification badge, and Tier-3 high-assurance status.
  * **4 KPI Metric Cards**:
    1. *Active Applications* (In multi-agency workflow).
    2. *Approved & Issued* (Certificates and clearances issued).
    3. *Requires Attention* (Action needed or re-filing required).
    4. *Total Interop Records* (DPDP consent-governed records).
  * **Active Service Priority Cards**: Shows application ID, department name, submission date, current processing milestone, and an animated percentage progress bar.
  * **Recent Interoperability Activity Feed**: Real-time event log showing live identity attestations, PAN verifications, and digital certificate issuances.
  * **Quick Launch Action**: "Apply for New Service" button.

#### 2. New Service Application Wizard (`/applications/new`) — `NewApplicationPage.tsx`
* **Target Audience**: Citizens applying for cross-departmental clearances.
* **Key Features & Components**:
  * **4-Step Wizard Stepper**:
    * **Step 1: Service Catalog Selection**: Category filters (All, Business, Revenue, Identity, Property, Certificates) and cards for *Business Approval (MCA)*, *Trade License (Municipal)*, *Tax Clearance (CBDT)*, *Identity Seeding (UIDAI)*, *Property Certificate (Land)*, and *Procurement Certificate (Commerce)*.
    * **Step 2: Dynamic Sovereign Data Entry**: Form fields dynamically rendered based on the selected service type (e.g., company name, classification, capital, address, PAN, etc.).
    * **Step 3: AI Diagnostics & DPDP Consent**: Heuristic duplicate submission detection and mandatory Section 6 DPDP Act consent authorization.
    * **Step 4: Submission & Mesh Ingestion**: Instant submission to the core API gateway with automated correlation ID assignment.

#### 3. Applications Registry (`/applications`) — `ApplicationsPage.tsx`
* **Target Audience**: Citizens managing multiple government filings.
* **Key Features & Components**:
  * **Unified Registry Table & Cards**: Displays all historical and active applications.
  * **Multi-Parameter Search Bar**: Real-time filtering by Application ID, Company Name, Department, or Service Type.
  * **Status Filter Tabs**: All, In Progress, Completed, Action Required, and Drafts.
  * **Status & Progress Badges**: Color-coded badges (`Approved & Issued`, `In Progress`, `Rejected`, `Failed`) with milestone tags.
  * **Direct Navigation**: 1-click access to the detailed tracking screen.

#### 4. Application Tracking & Microservice Stepper (`/applications/:id`) — `ApplicationDetailPage.tsx`
* **Target Audience**: Citizens tracking real-time status; Officers adjudicating.
* **Key Features & Components**:
  * **Breadcrumbs & Header**: Application ID, issuing department, submission date, status badge, and copyable Correlation ID for distributed tracing.
  * **Tabbed Information Views**:
    1. **Workflow Stepper & Microservices**: Visual state machine showing each department step (UIDAI Identity $\rightarrow$ CBDT Tax $\rightarrow$ MCA Adjudication), current status (`COMPLETED`, `PROCESSING`, `FAILED`, `PENDING`), latency, and automated retry trigger.
    2. **Application Form Data**: Form data payload submitted by the citizen.
    3. **Officer Notes**: Official remarks and determinations added by department officers.
    4. **Audit Ledger**: Event timestamps, action types, and SHA-256 hash entries.
  * **Officer Review Action Button**: (Visible to officers/admins) Launches the official adjudication modal.

#### 5. DigiLocker & Sovereign Documents Vault (`/documents`) — `DocumentsVaultPage.tsx`
* **Target Audience**: Citizens managing verified credentials.
* **Key Features & Components**:
  * **Sovereign Wallet Linking**: 1-click binding and verification of Aadhaar and PAN credentials.
  * **Verified Document Repository**: List of uploaded and verified credentials with Document Type, Issue Date, File Size, and SHA-256 Seal.
  * **Drag-and-Drop Document Upload**: Modal for uploading PDF/JPEG credentials with cryptographic hash calculation.
  * **Secure Document Download**: Direct download of verified artifacts.

#### 6. DPDP Consent Management Center (`/consents`) — `ConsentCenterPage.tsx`
* **Target Audience**: Citizens exercising statutory data privacy rights under DPDP Act 2023.
* **Key Features & Components**:
  * **Statutory Consent Ledger**: Displays all active and historical data-sharing authorizations granted to departments.
  * **Granular Consent Information**: Department name, unique Consent Token (`CONSENT-XXXX`), purpose limitation string, valid until timestamp, and status (`GRANTED` / `REVOKED`).
  * **1-Click Instant Revocation Engine**: Allows citizens to revoke data-sharing permissions with immediate downstream token invalidation.

#### 7. Notifications & Alerts (`/notifications`) — `NotificationsPage.tsx`
* **Target Audience**: Citizens receiving inter-agency milestone updates.
* **Key Features & Components**:
  * Real-time notifications for status changes, KYC verifications, and clearance approvals.
  * Filter by All, Unread, and Department Alerts.

---

### C. Department Officer Portal Screens

#### 1. Officer Adjudication Worklist (`/officer/queue`) — `OfficerQueuePage.tsx`
* **Target Audience**: Department reviewing officers (MCA, CBDT, Municipal, etc.).
* **Key Features & Components**:
  * **Department Review Queue**: Stream of applications awaiting manual determination.
  * **AI Risk Assessment Chip**: Displays AI-evaluated risk level (e.g. `Low - AI Score: 0.98`) to accelerate fast-track approvals.
  * **Pre-verified Cross-Agency Proof Badges**: Shows automated checks already completed by upstream microservices (`UIDAI Verified ✅`, `CBDT Tax Cleared ✅`).
  * **Official Adjudication Modal**:
    * Decision selector: `APPROVE` or `REJECT`.
    * Officer Remarks & Determination textarea.
    * Rejection Reason selector (if rejected).
    * Digital Signature Confirmation checkbox with SHA-256 cryptographic seal.
    * Real-time submission updating workflow progress and audit ledger.

---

### D. Platform & Super Admin Portal Screens

#### 1. System Telemetry & SLA Operations (`/monitoring`) — `AdminMonitoringPage.tsx`
* **Target Audience**: Platform engineers, DevOps, and ministry system administrators.
* **Key Features & Components**:
  * **4 Live KPI Metrics**: System Uptime (e.g. `10d 0h 3m`), Total Applications Processed, Average Processing Latency (142ms), and Statutory SLA Compliance Rate (98.6%).
  * **Async BullMQ Queue Telemetry**: Live bar meters showing Waiting, Active, Completed, and Failed asynchronous jobs.
  * **Connectors & Circuit Breaker Status**: Live counter of Total, Closed (Healthy), Half-Open, and Open connectors.
  * **Auto-refresh**: 15-second polling interval with manual "Sync Telemetry" trigger.

#### 2. Connectors & 3-State Circuit Breakers (`/connectors`) — `AdminConnectorsPage.tsx`
* **Target Audience**: System administrators managing department integrations.
* **Key Features & Components**:
  * **Connector Status Grid**: Cards for `CONN_UIDAI`, `CONN_CBDT`, and `CONN_MCA`.
  * **3-State Circuit Breaker Display**: Visual state badge (`CLOSED` = Healthy Green, `OPEN` = Tripped Red, `HALF_OPEN` = Testing Yellow).
  * **Live Metrics per Connector**: Total requests, successful requests, failed requests, failure threshold (5), and average latency (ms).
  * **Direct Administrative Controls**:
    * **Test Connection**: Pings the downstream microservice to measure live response latency.
    * **Manual Reset Circuit Breaker**: Forces an `OPEN` circuit back to `CLOSED` after remediation.

#### 3. Schema Transformation Engine & Playground (`/schema-mappings`) — `AdminSchemaMappingPage.tsx`
* **Target Audience**: Integration engineers mapping legacy schemas to canonical models.
* **Key Features & Components**:
  * **Active Schema Mappings List**: Overview of mappings between department formats (e.g., `UIDAI_EKYC_V2`, `CBDT_PAN_V1`) and Canonical Platform Schemas.
  * **Visual Schema Transformer Playground**:
    * Left panel: Source Department JSON editor.
    * Center panel: Field mapping rules with dot-notation pathing and transformation functions (`MASK_AADHAAR`, `UPPERCASE`, `PHONE_NORMALIZE`, `DATE_FORMAT`).
    * Right panel: Transformed Canonical Output preview.
    * **"Run Test Transformation"** button with millisecond execution latency measurement.

#### 4. Cryptographic SHA-256 Immutable Audit Ledger (`/audit`) — `AdminAuditPage.tsx`
* **Target Audience**: Compliance auditors, legal officers, and security administrators.
* **Key Features & Components**:
  * **Sequential Audit Chain**: Chronological ledger of every state change, consent grant, and transformation with sequence numbers, entity types, actions, performer roles, and IP addresses.
  * **Cryptographic Hash Linkage**: Displays `previousHash` $\rightarrow$ `currentHash` for every single block.
  * **Live Cryptographic Chain Verification Engine**:
    * Button: **"Verify Cryptographic Chain"**.
    * Recalculates SHA-256 hashes from the Genesis block to the latest block.
    * Displays verification proof badge: *Total Events Checked*, *0 Tampered Events*, and *Latest Verified Hash*.

#### 5. AI Operations Suite (`/ai-ops`) — `AdminAIOpsPage.tsx`
* **Target Audience**: Administrators utilizing machine learning for automation.
* **Key Features & Components**:
  * **Tab 1: AI Schema Mapper**: Automatically compares source and target JSON schemas and suggests dot-path mapping rules with confidence percentages (e.g., 98% confidence).
  * **Tab 2: AI Duplicate & Fraud Scanner**: Evaluates PAN, entity names, and applicant demographics using fuzzy matching to flag duplicate filings.
  * **Tab 3: NLP Telemetry Monitoring Assistant**: Interactive conversational AI where administrators ask natural language questions regarding system latency, queue health, or application volume and receive structured answers.

#### 6. Live Demo Resilience & Fault Injection Controller (`/demo-controls`) — `AdminDemoControlsPage.tsx`
* **Target Audience**: Presenters demonstrating fault tolerance to hackathon judges.
* **Key Features & Components**:
  * **Department Microservices Matrix**: Dept A (UIDAI Port 9001), Dept B (CBDT Port 9002), and Dept C (MCA Port 9003).
  * **Fault Injection Modes per Department**:
    1. `NORMAL`: Fast 200 OK responses (40-60ms).
    2. `SLOW`: Injects 2500ms latency to test SLA telemetry tracking.
    3. `TIMEOUT`: Injects 10,000ms socket timeouts to trigger retry backoff.
    4. `FAILURE`: Injects 500/503 errors to trip the Circuit Breaker live on screen.
    5. `MALFORMED_RESPONSE`: Returns broken payloads to test validation handlers.
  * **1-Click Recovery**: "Reset All to NORMAL" button.

---

## 🛡️ 6. Core Architectural Pillars & Security Features

| Pillar | Technical Implementation | Impact / Value |
|---|---|---|
| **Zero-XSS Token Storage** | Access tokens stored strictly in **Zustand in-memory state**; refresh tokens stored in secure, `HttpOnly`, `SameSite=Strict` cookies. | Even if malicious scripts run in the browser, access tokens cannot be stolen from `localStorage`. |
| **BOLA / IDOR Defense** | Middleware (`requireApplicationAccess`) checks ownership and tenancy on every object-level API request. | Citizens cannot view or tamper with other citizens' applications by changing URL IDs. |
| **3-State Circuit Breakers** | Autonomous state machine (`CLOSED` $\rightarrow$ `OPEN` $\rightarrow$ `HALF_OPEN`) wrapped around all external ministry HTTP calls. | Downstream outages at one department never freeze or crash the central gateway. |
| **DPDP Act 2023 Compliance** | Purpose-bound consent tokens issued under Section 6 with instant revocation endpoints. | Citizen data is never shared across departments without explicit, auditable, and revocable consent. |
| **Immutable SHA-256 Ledger** | Chained block architecture where every audit entry embeds the cryptographic SHA-256 hash of the preceding entry. | Any manual tampering or modification of historical database records is immediately detected. |
| **Non-Blocking Async Queues** | **BullMQ** on **Redis** handles background task orchestration, retries, and step execution. | API gateway handles thousands of concurrent requests with sub-millisecond response times. |

---

## ⚡ 7. Presentation Q&A Cheat Sheet for the Jury

### Q1: *"How does GovConnect avoid modifying existing legacy government databases?"*
> **Answer**: *"GovConnect operates as a non-invasive interoperability mesh. We don't replace or migrate legacy databases. Instead, our **Schema Transformation Engine** maps legacy payloads (XML/JSON) to canonical formats in-flight using declarative dot-notation mapping rules, preserving legacy investments while enabling modern interoperability."*

### Q2: *"What happens if a downstream ministry microservice goes down or experiences heavy lag?"*
> **Answer**: *"Our built-in **3-State Circuit Breaker** monitors consecutive failures. Once the failure threshold (5 failures) is reached, the circuit autonomously trips to `OPEN`, immediately returning graceful fallbacks or queuing tasks in **BullMQ** without stalling the gateway. After a 30-second cooldown, it enters `HALF_OPEN` to probe recovery safely."*

### Q3: *"How does the platform comply with the new DPDP Act 2023?"*
> **Answer**: *"Under Section 6 of the DPDP Act 2023, data processing requires explicit, purpose-limited consent. GovConnect issues cryptographic, purpose-bound consent tokens during application submission. Citizens have full sovereignty through our **Consent Management Center** to inspect active authorizations and revoke them with a single click, instantly invalidating downstream data sharing."*

### Q4: *"How do you guarantee that audit logs haven't been tampered with by a database administrator?"*
> **Answer**: *"Every audit event is cryptographically linked to the previous event using a **SHA-256 hash chain** (`previousHash` $\rightarrow$ `currentHash`). Our live **Chain Verification Engine** recalculates all hashes from the genesis block. If even a single character in a past record is modified, the hash chain breaks and the system flags the exact sequence number that was tampered with."*

### Q5: *"Where is AI integrated into the platform?"*
> **Answer**: *"We utilize AI in three critical operational areas:
> 1. **AI Schema Mapper**: Inferences dot-path field mappings between unfamiliar department schemas with confidence scoring.
> 2. **AI Duplicate & Fraud Scanner**: Analyzes applicant demographics and phonetic matches to prevent duplicate filings.
> 3. **NLP Telemetry Assistant**: Translates natural language questions from administrators into real-time operational telemetry queries."*

---

## 🚀 8. Local Setup & Installation Guide

### Prerequisites
* **Node.js**: `>= 20.0.0`
* **pnpm**: `>= 9.0.0`
* **Docker & Docker Compose**

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd government-connect
pnpm install
```

### 2. Start Backing Services (MongoDB & Redis)
```bash
docker compose up -d
```

### 3. Seed Database with Sovereign Demo Data
```bash
pnpm --filter @govconnect/api run seed
```

### 4. Start Full-Stack Services
```bash
# Terminal 1: Mock Department Gateways & Chaos Controller (Ports 9000, 9001, 9002, 9003)
pnpm --filter @govconnect/mock-departments run dev

# Terminal 2: Core API Gateway (Port 8000)
pnpm --filter @govconnect/api run dev

# Terminal 3: Web Portal (Port 5173)
pnpm --filter @govconnect/web run dev
```

### 5. Open Web Portal
Navigate to: **`http://localhost:5173`**

---

*GovInterconnect — Developed with pride for Smart India Hackathon (SIH26129) — National Government Interoperability Platform.*
