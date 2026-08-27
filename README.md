# WebSecAnalyzer — Web Security Header & Configuration Analyzer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB)](https://reactjs.org/)

**WebSecAnalyzer** is an ethical web security assessment tool designed to passively analyze website security configurations (HTTP headers, HTTPS/TLS certificates, cookies, redirect chains, server information disclosure) without performing destructive or intrusive actions.

---

## 1. Project Overview

WebSecAnalyzer evaluates the security posture of an authorized website using non-destructive, configuration-based security checks. It features BOTH:

1. A **Modern Web GUI** (React + TypeScript + Tailwind CSS)
2. A **Fully Functional CLI** (Python + Rich)

---

## 2. Key Features

- **HTTP Security Headers Inspection**: Audits CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, COEP, and Cache-Control.
- **Cookie Security Analyzer**: Checks `Secure`, `HttpOnly`, `SameSite`, `Domain`, and `Path` attributes.
- **HTTPS & TLS Certificate Metrics**: Collects subject, issuer, validity period, expiration countdown, hostname verification status, and negotiated protocol version.
- **Redirect Chain & Server Exposure Tracking**: Records redirect steps and identifies technology version disclosure banners (e.g. `Server`, `X-Powered-By`).
- **Transparent Security Scoring**: Calculates a 0–100 score and assigns ratings (`Excellent`, `Good`, `Moderate`, `Weak`, `Critical Configuration Risk`).
- **Reporting Engine**: Exports machine-readable **JSON** and standalone styled **HTML** assessment reports.
- **Safe Offline Demo Target**: Includes a built-in mock endpoint (`/demo-target`) serving intentional configuration flaws for safe offline demonstration.

---

## 3. Architecture

```text
websecanalyzer/
├── backend/                  # FastAPI REST API & Core Engine
│   ├── app/
│   │   ├── api/              # Endpoints (/api/scans, /api/health) & Demo Router (/demo-target)
│   │   ├── core/             # Configuration & Database setup
│   │   ├── models/           # SQLAlchemy ScanResultModel schema
│   │   ├── schemas/          # Pydantic data validation models
│   │   └── services/         # Scanner, Headers, Cookies, TLS, Scoring, Reports logic
│   └── requirements.txt
├── cli/                      # Command Line Interface Package
│   ├── websecanalyzer_cli/   # Rich terminal commands (scan, history, version, demo)
│   └── setup.py
├── frontend/                 # React + TypeScript + Tailwind CSS SPA
│   ├── src/                  # Components, Pages, Services, Types
│   └── package.json
├── tests/                    # Pytest Automated Test Suite
├── Dockerfile & docker-compose.yml
└── README.md
```

---

## 4. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup
```bash
# Clone project and navigate to directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
API Documentation will be accessible at: `http://localhost:8001/docs`

### Frontend Setup
```bash
cd frontend

# Install node dependencies
cmd /c npm install

# Start Vite development server
cmd /c npm run dev
```
Web GUI will be accessible at: `http://localhost:3000`

---

## 5. CLI Usage

You can install the CLI locally:

```bash
cd cli
pip install -e .
```

### Commands

#### 1. Perform Security Scan
```bash
websecanalyzer scan https://example.com
```

#### 2. Export Scan Report to HTML / JSON
```bash
websecanalyzer scan https://example.com --format html --output report.html
websecanalyzer scan https://example.com --format json --output report.json
```

#### 3. View Scan History
```bash
websecanalyzer history
```

#### 4. Run Safe Offline Demo Scan
```bash
websecanalyzer demo
```

#### 5. Check Version
```bash
websecanalyzer version
```

---

## 6. Local Demo Mode

WebSecAnalyzer includes a local test target serving weak HTTP headers and insecure cookies so you can test the scanner safely offline.

Start the backend (`uvicorn app.main:app --port 8001`), then run:

```bash
websecanalyzer scan http://localhost:8001/demo-target
```
or click **Local Demo Target** in the Web GUI.

---

## 7. Automated Testing

Run the Pytest suite without network dependencies:

```bash
python -m pytest
```

---

## 8. Docker Deployment

Launch the entire stack (FastAPI backend + React frontend) with a single command:

```bash
docker compose up --build
```
- Web GUI: `http://localhost:3000`
- Backend API: `http://localhost:8001`

---

## 9. Security & Ethical Disclaimer

> [!CAUTION]
> Use WebSecAnalyzer ONLY against websites and systems that you own or have explicit authorization to assess.
> The tool performs non-destructive security configuration analysis and is not intended for unauthorized testing, payload injection, or brute-forcing.

---

## 10. License

Licensed under the [MIT License](LICENSE).
