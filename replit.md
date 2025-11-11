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
1. **Stripe Payment Integration**
   - Checkout session creation for ESSENTIEL plan
   - Webhook handler for payment confirmation
   - Update companyPlanState after successful payment
   - PDF invoice generation

2. **Event Management**
   - CRUD operations for events
   - Multi-day event parent/child relationship
   - QR code generation per event
   - Capacity management

3. **Participant Management**
   - Import participants (CSV/Excel)
   - Location-based matching algorithm
   - Vehicle assignment
   - Carpooling optimization

4. **Frontend Integration**
   - Connect registration pages to new validation endpoints
   - Implement SIREN autocomplete with company name display
   - French address autocomplete UI
   - Payment flow with Stripe Elements

### Future Enhancements
- Admin dashboard for quote approval (PRO/PREMIUM)
- Analytics and reporting
- Email notifications
- Mobile app considerations
- Export features

## File Structure
```
├── client/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       └── lib/            # Client utilities
├── server/
│   ├── auth/              # Authentication logic
│   ├── routes/            # API routes
│   ├── services/          # External API integrations
│   ├── utils/             # Server utilities
│   ├── db.ts              # Database connection
│   └── seed.ts            # Database seeding
├── shared/
│   └── schema.ts          # Shared database schema
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
