# Integration Map

## Document Information

- Project: WoodVerse
- Status: Draft
- Version: 1.0
- Last Updated: To be updated
- Owner: WoodVerse Development Team

## Project Context

WoodVerse is an AI-assisted multi-vendor web platform for furniture,
wooden products, wooden gifts, standard laser-cut files, indoor plants,
custom furniture, supplier management, inventory, production tracking,
payments, shipments, support, and administration.

Main roles:

- Customer
- Vendor
- Supplier
- Admin

Technology stack:

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


## Overview

WoodVerse is planned as a modular monolith that can later evolve into
separate services for commerce, operations, AI, payments, and notifications.

## Main Modules

- Authentication and RBAC
- Customer ecommerce
- Vendor operations
- Supplier management
- Inventory and warehouse management
- Production tracking
- Payment and shipment management
- AI services
- Support and administration

## Application Layers

- Frontend: React.js and Tailwind CSS
- Backend API: Node.js and Express.js
- AI service: Python and FastAPI
- Database: PostgreSQL
- Realtime: Socket.IO
- Storage: Supabase Storage or compatible object storage

## Design Principles

- Keep module boundaries clear.
- Centralize authentication and authorization.
- Use consistent API response standards.
- Store audit logs for sensitive actions.
- Prefer explicit status values and predictable workflows.
