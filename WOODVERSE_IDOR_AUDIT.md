# WoodVerse Object-level Authorization (IDOR) Audit

Branch: `audit/security-hardening`
Reviewed: order, product, quotation, messaging, vendor, notification route files visible in this branch.

## Applied fix
- `GET /api/orders`: in-memory fallback previously returned the shared order array for every authenticated role. It now returns all only to admins, customer-filtered entries only to customers (customerId/customer_id matches), vendor-user scoped entries only to vendors (vendorUserId/vendor_user_id matches), and none for other roles. This fail-closed behavior avoids exposing records when the memory-mode records do not carry ownership metadata.

## Reviewed endpoint behavior

- Orders (PostgreSQL): customer queries filter by customer_id; vendor queries resolve vendor profile from user_id and filter by vendor_id; admin can list all. Order creation is customer-role only. Stock reservation is within a transaction.
- Quotations: list filters by customer_id or vendor_id for respective roles; admin list all. Vendor quote creation resolves authenticated vendor and checks order ownership / customer match when orderId is supplied.
- Messages: message retrieval is scoped to sender or recipient of authenticated user; optional threadId is combined with participant filter. Sending checks active recipient and thread participants when threadId is provided.
- Products: creation checks vendor profile ownership for vendor role; admin can select vendorId. The reviewed file does not expose update/delete routes.
- Vendors: vendor creation checks self ownership for vendor role; public listing includes only approved vendors and limited fields.
- Users: creation and listing admin-only in previously hardened branch.
- Notifications: create route is admin-only in reviewed file.

## Findings / residual risks

1. **Memory-mode orders leakage (High)** — fixed as above.
2. **Message thread integrity (Medium, needs database-level review):** participant check relies on existing messages with a threadId; ensure thread IDs are pair-scoped or enforce a normalized conversation membership table and unique participant constraints. Current messages retrieval remains participant-filtered.
3. **Route coverage gaps:** repository route tree/available files did not expose production tracking, shipment, inventory, or supplier-specific API routes in the paths checked. Audit cannot assess these modules or frontend action paths.
4. **Product update/delete authorization:** no update/delete endpoint found in the reviewed products route. If these endpoints exist elsewhere, review vendor ownership checks and ID handling.
5. **Quotations without orderId (vendor):** vendor can provide customerId and creates quote for that customer without an associated order. This may be intended, but verify product/design policy and prevent unsolicited/abusive quote creation.
6. **Admin bypasses:** admin behavior is privileged by design; review audit logging and restrict admin access.
7. **Integration testing:** not run. Add tests for ID swaps and ownership boundaries.

## Suggested IDOR tests
- Customer A requests Customer B order UUID -> no record / forbidden.
- Vendor A requests Vendor B order/product/quotation UUID -> no access.
- Vendor attempts quotation with another vendor's orderId or mismatched customerId -> 403.
- Customer retrieves messages using another threadId -> no messages from other participants.
- Vendor memory-mode list receives only orders carrying matching vendor-user ownership metadata; otherwise empty.
- Admin-only endpoints return 403 for customer/vendor/supplier.

## Audit limits
Code review of selected files on the branch, not exhaustive penetration testing. Results require runtime tests before release.
