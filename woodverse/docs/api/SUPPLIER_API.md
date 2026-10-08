# Supplier Api

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

This document defines the API requirements for the related WoodVerse
module.

## Base Route

```text
/api/v1/
```

## Authentication

- Use JWT access tokens for protected endpoints.
- Validate the current user role before executing business logic.
- Return consistent error responses for unauthorized and forbidden access.

## Endpoint Checklist

For each endpoint, document:

- Method
- Path
- Required role
- Request parameters
- Request body
- Success response
- Error responses
- Validation rules
- Rate limits

## Standard Response Shape

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

## Error Response Shape

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

## Notes

- Keep controller logic thin.
- Put business rules in services.
- Validate all incoming data.
- Log operational failures without exposing sensitive data.
