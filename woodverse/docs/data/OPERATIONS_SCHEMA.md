# Operations Schema

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


## Purpose

This document captures database design decisions and data requirements.

## Entity Checklist

For each entity, document:

- Table name
- Primary key
- Foreign keys
- Required fields
- Optional fields
- Status fields
- Indexes
- Constraints
- Audit fields

## Common Fields

```text
id
created_at
updated_at
created_by
updated_by
status
```

## Data Quality Rules

- Validate required values before writing.
- Keep status values consistent across frontend and backend.
- Use foreign keys for important relationships.
- Add indexes for common filters and lookups.
