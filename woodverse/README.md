# WoodVerse

## Project Overview

WoodVerse is an AI-assisted multi-vendor commerce and production platform for furniture, wooden products, custom fabrication, supplier workflows, inventory operations, payments, shipping, support, and administration.

The platform is organized as a monorepo with three main runtime services:

- Frontend: React + Vite + Tailwind
- API: Node.js + Express + Socket.IO
- AI service: Python + FastAPI

## Core Roles

The implemented platform roles are limited to four server-authorized roles:

- Customer
- Vendor
- Supplier
- Admin

## Tech Stack

- React.js
- Tailwind CSS
- Node.js
- Express.js
- PostgreSQL
- Python
- FastAPI
- Scikit-learn
- OpenCV
- MiDaS / DPT
- Socket.IO

## Repository Structure

```bash
woodverse/
├── package.json             # Root workspace scripts
├── frontend/                # React app
│   ├── package.json
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── index.html
├── backend/
│   ├── api/                 # Express API service
│   │   ├── package.json
│   │   └── src/
│   └── ai-service/          # FastAPI AI service
│       ├── package.json
│       ├── requirements.txt
│       └── src/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
├── docs/
│   └── ...
├── DEPLOYMENT.md
├── DEPLOYMENT_GUIDE.md
├── package-lock.json
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- PostgreSQL 14+

## Installation

From the project root:

```bash
cd woodverse
npm install
```

For the AI service Python environment:

```bash
cd woodverse
python -m venv .venv
source .venv/bin/activate
pip install -r backend/ai-service/requirements.txt
```

## Local Development

From the project root, start the local app stack:

```bash
cd woodverse
npm install
npm run dev
```

Then open the app in your browser:

- Frontend: http://localhost:5173
- API: http://localhost:4000
- AI service: http://localhost:8000

To run services individually:

```bash
cd woodverse
npm run dev:web
npm run dev:api
npm run dev:ai
```

## Build

```bash
cd woodverse
npm run build
```

The root build script currently compiles the frontend application.

## Additional Notes

- The root workspace uses npm workspaces.
- API and frontend scripts are defined in their package manifests.
- The AI service runs via `uvicorn` and uses the service's Python requirements file.

## Documentation

Start with these project docs:

- `docs/FULL_SYSTEM_DOCUMENTATION.md`
- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/phases/IMPLEMENTATION_ROADMAP.md`
- `DEPLOYMENT_GUIDE.md`
