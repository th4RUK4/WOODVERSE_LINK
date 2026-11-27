# WoodVerse Role-Based Access Control (RBAC) Audit

Branch: `audit/security-hardening`

## Scope reviewed
- Login and registration routes
- JWT signing and verification
- Authentication middleware and role middleware
- Frontend role-gated route map
- User administration
- Products, orders, quotations, notifications and messaging routes

## Changes made during this audit
- Authentication middleware now re-queries the account on authenticated requests (when PostgreSQL is configured) and rejects inactive accounts or JWT role claims that no longer match the account's current role. In development without DB, seeded accounts are used.
- Customer cart, delivery and payment frontend routes are restricted to the customer role (previously vendor/admin could access these pages too).
- Earlier branch hardening already enforced admin-only user creation/listing, disallowed admin in public registration, and required vendor/supplier approval.

## Findings / risk

### Fixed in this branch
1. **Stale role/status in JWT — High:** JWT role claims could outlive account role/status changes. Current auth middleware checks live account status and role before accepting authenticated requests.
2. **Checkout page role access — Medium:** Frontend route map previously allowed vendor/admin access to customer checkout routes. Restricted to customer role.
3. **Admin creation endpoint — High (previous branch change):** `POST /api/users` now requires authentication and admin role; public registration excludes admin.

### Still requires work / verification
1. **Shared development credentials — High if deployed or exposed:** memory seed accounts use a shared known password. Keep memory fallback strictly development-only; never expose or use these credentials in deployed environments.
2. **JWT stored in localStorage — Medium:** susceptible to token theft through successful XSS. Consider HttpOnly, Secure, SameSite cookies and CSRF controls; also review XSS prevention.
3. **Frontend route guards are not security boundaries:** server-side authorization must cover every sensitive endpoint. Continue reviewing each API route and ownership checks.
4. **Supplier registration/profile lifecycle:** verify supplier profiles are created and approval workflows correctly set account and supplier statuses.
5. **Admin user creation:** password is optional and can create accounts with no password; review intended onboarding and password reset/invite process.
6. **Message authorization and object-level permissions:** validate participant, recipient and ownership rules for every thread, including IDs supplied by clients.
7. **Production test coverage:** integration tests for each role (admin, vendor, supplier, customer), inactive/pending accounts, role changes, expired JWT, and object ownership are needed. Changes have not been run in tests.

## Access matrix (intended)
| Feature | Customer | Vendor | Supplier | Admin |
|---|---:|---:|---:|---:|
| Customer checkout | Yes | No | No | No |
| View own orders | Yes | Yes (own vendor) | No | Yes |
| Create products | No | Own vendor | No | Yes |
| User management | No | No | No | Yes |
| Send admin notifications | No | No | No | Yes |
| Public registration | Yes | Yes (pending) | Yes (pending) | No |

## Status
This is a code-level audit of the files available on this branch, not a complete penetration test. Changes are committed but untested.
