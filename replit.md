# TEAMMOVE - Corporate Event Management Platform

## Project Overview
TEAMMOVE is a comprehensive SaaS platform for corporate event management with intelligent carpooling capabilities. The platform offers multi-tier subscription plans (Découverte/Essentiel/Pro/Premium) with Stripe payment integration, automatic PDF invoicing, and role-based access control.

## Current State (as of 2025-11-11)

### Completed Features

#### 1. Authentication System ✅
- JWT-based authentication with access tokens (15min) and refresh tokens (30 days)
- Secure JWT secrets required from environment variables (JWT_SECRET, JWT_REFRESH_SECRET)
- Rate limiting: 5 login attempts per 15 minutes
- Brute-force protection: Account lock after 5 failed attempts (30min lockout)
- Endpoints:
  - POST `/api/auth/login` - User login with email/password
  - POST `/api/auth/refresh` - Refresh access token
  - POST `/api/auth/logout` - Logout and invalidate refresh token
  - GET `/api/auth/me` - Get current user info
- Middleware: `requireAuth`, `requireAdmin`, `requireCompany`

#### 2. Database Schema ✅
PostgreSQL database with 13 tables:
- **companies**: Company profiles with SIREN validation
- **users**: User accounts (admin/company roles)
- **plans**: Subscription plans (Découverte/Essentiel/Pro/Premium)
- **companyPlanState**: Current subscription state per company
- **planHistory**: Audit trail of plan changes
- **eventParents**: Multi-day event parents
- **events**: Individual events with location and capacity
- **participants**: External event participants
- **vehicles**: Participant vehicles for carpooling
- **transactions**: Payment transactions via Stripe
- **invoices**: PDF invoices for transactions
- **refreshTokens**: JWT refresh token storage

Seed data:
- 4 subscription plans configured
- 2 admin accounts: admin1@teammove.fr, admin2@teammove.fr (password: Admin123!)

#### 3. Multi-step Company Registration ✅
Three registration flows based on plan tier:

**DECOUVERTE (Free Plan)**
- Immediate account creation
- Atomic transaction: company → user → planState → planHistory
- Direct access with JWT token

**ESSENTIEL (Paid Plan)**
- Account creation with plan state
- Atomic transaction: company → user → planState → planHistory
- Returns payment info for Stripe checkout
- Plan marked as "payment pending"

**PRO/PREMIUM (Quote Required)**
- Account creation on temporary DECOUVERTE plan
- Atomic transaction with quotePending flag
- Full access to limited features pending quote approval

Registration endpoints:
- POST `/api/registration/register` - Main registration with validation
- POST `/api/registration/validate-siren` - SIREN validation with external API
- GET `/api/registration/address-autocomplete` - French address suggestions
- POST `/api/registration/validate-address` - Address validation

#### 4. External API Integrations ✅

**SIREN Validation Service** (`server/services/siren.ts`)
- Luhn checksum algorithm validation
- Integration with API Entreprise (api.gouv.fr)
- Verifies company existence and active status
- Graceful fallback if API token not available
- Environment variable: `API_ENTREPRISE_TOKEN` (optional)

**French Address Autocomplete** (`server/services/address.ts`)
- Free API from adresse.data.gouv.fr
- Real-time address suggestions (min 3 characters)
- Returns full address details (street, city, postal code, coordinates)
- No authentication required

#### 5. Stripe Payment Integration ✅

**Checkout Session Creation** (`server/routes/stripe.ts`)
- POST `/api/stripe/create-checkout-session` - Create Stripe checkout for ESSENTIEL plan
- Session metadata includes: companyId, planId, userId
- Duplicate transaction prevention using idempotency keys
- Success/cancel URLs with session tracking
- Environment: STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY

**Webhook Handler** (`server/routes/stripe.ts`)
- POST `/api/stripe/webhook` - Handle Stripe events with rawBody
- Signature verification using stripe.webhooks.constructEvent
- Events handled:
  - `checkout.session.completed` - Initial payment completion
  - `invoice.payment_succeeded` - Subscription renewals
- Automatic plan state updates in companyPlanState
- Transaction logging in transactions table
- PDF invoice generation triggered automatically

**Transaction Management & Idempotency**
- Idempotent checkout session creation with duplicate prevention
- Webhook idempotency guaranteed via `stripeEvents` table
- Stripe event ID tracking prevents duplicate processing on retries
- Atomic DB transactions: stripeEvent → transaction → planState → history
- Unique constraints: `stripeSessionId`, `stripeInvoiceId` for DB-level protection
- PDF generation outside transaction (post-commit hook)
- Full audit trail in planHistory table

#### 6. PDF Invoice Generation ✅

**Invoice Service** (`server/services/invoice.ts`)
- Automatic invoice generation after successful payment
- Uses pdfkit for PDF creation
- Stores PDFs in Object Storage (not ephemeral filesystem)
- Invoice format: TEAMMOVE-YYYY-{sequential}
- Includes: company details, plan info, amount, date, transaction ID
- Professional layout with proper formatting

**Invoice Endpoints** (`server/routes/invoices.ts`)
- GET `/api/invoices/:invoiceNumber` - Download specific invoice (authenticated)
- GET `/api/invoices/company/:companyId` - List all company invoices (authenticated)
- Access control: Users can only download their company's invoices, admins can access all
- Content-Type: application/pdf with proper disposition headers

**Object Storage Integration**
- PDFs stored in private Object Storage bucket (.private/invoices/)
- Avoids ephemeral filesystem issues on Replit
- Persistent storage across restarts
- Automatic cleanup not implemented (invoices kept indefinitely)

#### 7. Event Management ✅

**Event CRUD Operations** (`server/routes/events.ts`)
- POST `/api/events` - Create event with automatic QR code generation
- GET `/api/events` - List company events with filters:
  - status: upcoming, ongoing, completed, cancelled
  - city: filter by location
  - startDate: events starting after date (validated)
  - endDate: events ending before date (validated)
- GET `/api/events/:id` - Get single event details
- PATCH `/api/events/:id` - Update event (with ownership check)
- DELETE `/api/events/:id` - Delete event (cascade to related data)
- POST `/api/events/:id/qrcode` - Regenerate QR code for event

**Event Features**
- Multi-tenant isolation (companyId scoping)
- Automatic QR code generation on creation
- Date validation with proper 400 errors for invalid dates
- Graceful error handling for QR code failures
- Ownership verification on all mutations
- Prevents manual tampering with companyId/qrCode fields

**QR Code Generation** (`server/services/qrcode.ts`)
- Automatic QR code generation using qrcode library
- QR codes point to event page: `https://{domain}/events/{eventId}`
- Environment-aware URL building (REPLIT_DOMAIN for production)
- Data URL format (base64 PNG) stored directly in database
- 300px size, error correction level M
- Manual regeneration endpoint available

### Security Features
- **JWT Secrets**: Required from environment, no hardcoded fallbacks
- **Database Transactions**: All registration flows use atomic transactions
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Per-endpoint protection
- **Input Validation**: Zod schemas on all endpoints
- **Multi-tenant Isolation**: All data scoped by companyId

### Environment Variables Required
```
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
SESSION_SECRET=<your-session-secret>

# Stripe (configured)
STRIPE_SECRET_KEY=<your-stripe-key>
VITE_STRIPE_PUBLIC_KEY=<your-stripe-public-key>

# External APIs (optional)
API_ENTREPRISE_TOKEN=<optional-for-siren-validation>

# Object Storage (configured)
PUBLIC_OBJECT_SEARCH_PATHS=...
PRIVATE_OBJECT_DIR=...
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...
```

## Architecture Decisions

### Frontend Stack
- React with TypeScript
- Carbon Design System for enterprise UI
- Wouter for routing
- TanStack Query for data fetching
- React Hook Form + Zod for forms
- Dark/Light mode support

### Backend Stack
- Express.js
- Drizzle ORM with PostgreSQL
- JWT authentication
- Stripe for payments
- Rate limiting and security middleware

### Multi-tenant Design
- Strict companyId scoping on all business tables
- Separate Users (employees) vs Participants (external guests)
- Role-based access: admin, company
- Plan-based feature activation

## Next Steps

### Immediate Priorities
1. **Participant Management**
   - Import participants (CSV/Excel)
   - Location-based matching algorithm
   - Vehicle assignment
   - Carpooling optimization
   - Participant CRUD operations

2. **Frontend Development**
   - Complete registration flow UI with SIREN/address autocomplete
   - Company dashboard with event management
   - Stripe checkout flow integration
   - Event creation/editing forms
   - QR code display and download
   - Invoice viewing and download
   - Participant management interface
   - Carpooling assignment interface

3. **Multi-day Event Support**
   - EventParent implementation for recurring events
   - Event series management UI
   - Automatic event generation from rrule
   - Parent-child relationship management

4. **Admin Features**
   - Admin dashboard for company management
   - Quote approval workflow (PRO/PREMIUM plans)
   - Manual plan assignment/upgrades
   - Transaction history and analytics
   - Company activity monitoring

### Future Enhancements
- Analytics and reporting dashboards
- Email notifications (registration, payments, events)
- SMS notifications for event reminders
- Mobile app considerations
- Export features (participants, events, invoices)
- Webhook management UI for Stripe
- Advanced carpooling optimization algorithms
- Multi-language support (EN/FR)

## File Structure
```
├── client/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       └── lib/            # Client utilities
├── server/
│   ├── auth/              # Authentication logic
│   │   ├── jwt.ts         # JWT token generation/verification
│   │   ├── middleware.ts  # Auth middleware (requireAuth, requireAdmin, requireCompany)
│   │   └── rateLimiter.ts # Rate limiting configuration
│   ├── routes/            # API routes
│   │   ├── auth.ts        # Login, logout, refresh, me
│   │   ├── registration.ts # Multi-step registration with validation
│   │   ├── stripe.ts      # Checkout sessions and webhooks
│   │   ├── invoices.ts    # PDF invoice download endpoints
│   │   └── events.ts      # Event CRUD with QR codes
│   ├── services/          # Business logic services
│   │   ├── siren.ts       # SIREN validation via api.gouv.fr
│   │   ├── address.ts     # French address autocomplete
│   │   ├── invoice.ts     # PDF invoice generation with pdfkit
│   │   └── qrcode.ts      # QR code generation for events
│   ├── utils/             # Server utilities
│   ├── db.ts              # Database connection
│   ├── seed.ts            # Database seeding
│   └── routes.ts          # Route registration
├── shared/
│   └── schema.ts          # Shared database schema (13 tables)
└── design_guidelines.md   # UI/UX design system
```

## Design Philosophy
- **Security First**: No hardcoded secrets, transaction safety, input validation
- **User Experience**: Multi-step registration, real-time validation, helpful error messages
- **Scalability**: Multi-tenant architecture, efficient database indexing
- **Reliability**: Atomic transactions, graceful API fallbacks, comprehensive error handling

## Testing Strategy
- E2E testing with Playwright (planned)
- API endpoint testing
- Transaction rollback scenarios
- External API failure handling

## Notes for Future Development
- Consider implementing refresh token rotation for enhanced security
- Add webhook signature verification for Stripe
- Implement proper logging and monitoring
- Add database backup strategy
- Consider implementing feature flags for gradual rollout
