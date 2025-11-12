# TEAMMOVE - Corporate Event Management Platform

### Overview
TEAMMOVE is a comprehensive SaaS platform for corporate event management, offering intelligent carpooling capabilities. The platform supports multi-tier subscription plans (Découverte/Essentiel/Pro/Premium) with integrated Stripe payments, automatic PDF invoicing, and robust role-based access control. The vision is to streamline corporate event planning and execution, enhance participant experience through optimized carpooling, and provide businesses with a scalable, secure, and user-friendly solution for managing their events.

### User Preferences
I prefer detailed explanations and a collaborative approach. Please ask before making major changes and explain the reasoning behind significant architectural decisions or code modifications. I appreciate clean, maintainable code.

### System Architecture
#### UI/UX Decisions
The frontend is built with React and TypeScript, leveraging the Carbon Design System for an enterprise-grade user interface. It supports both dark and light modes, and uses Wouter for routing, TanStack Query for data fetching, and React Hook Form with Zod for form management.

#### Technical Implementations
The backend is powered by Express.js, using Drizzle ORM with a PostgreSQL database. Authentication is JWT-based, and payments are handled via Stripe. The system employs rate limiting and various security middleware. Multi-tenancy is central to the design, with strict `companyId` scoping across all business tables, differentiating between users (employees) and participants (external guests), and implementing role-based access control (admin, company). Feature activation is dynamically managed based on the subscription plan.

#### Feature Specifications
- **Authentication**: JWT-based with access and refresh tokens stored in localStorage, rate limiting, and brute-force protection. All API requests include Authorization Bearer token header via queryClient.
- **Cryptographic CAPTCHA Security**: Server-side CAPTCHA system using HMAC-signed JWT tokens to prevent forgery attacks:
  - **Challenge Generation**: GET /api/security/captcha returns { challenge: "5+3", token: "jwt.signed.token" }
  - **JWT Payload**: Contains only num1, num2, operator, and timestamp (NO answer field to prevent extraction)
  - **Verification**: Server recalculates expected answer from JWT payload during verification
  - **Protection**: Rejects forged challenges, expired tokens (120s TTL), and incorrect answers
  - **Implementation**: server/utils/captcha.ts provides generateCaptchaChallenge() and verifyCaptchaResponse()
  - **Integration**: Mandatory on all authentication flows (login, registration) via MathCaptcha component
- **Multi-step Company Registration**: Three distinct flows based on subscription tier (Free, Paid, Quote Required), ensuring atomic transactions for data integrity.
- **Stripe Payment Integration**: Handles checkout session creation, webhook processing for payment status updates, and idempotent transaction management.
- **PDF Invoice Generation**: Automatic generation and secure storage of professional PDF invoices in object storage, accessible with role-based permissions.
- **Event Management**: Full CRUD operations for events, including automatic QR code generation, multi-tenant isolation, and comprehensive filtering capabilities.
- **Plan-Based Feature System**: Complete feature gating and resource quota enforcement across all subscription tiers (Découverte/Essentiel/Pro/Premium):
  - **Frontend**: PlanFeaturesContext provides hasFeature(), canAddMore(), getLimit() helpers consumed by FeatureGate and LimitGate components
  - **Backend**: Middleware (checkEventLimit, checkParticipantLimit, checkVehicleLimit, requireFeature) with ownership verification to prevent cross-tenant abuse
  - **API**: GET /api/plans/current-features returns company's plan features and quota status
  - **UI**: Dedicated /plan-features page displays tier capabilities, locked features with upgrade prompts, and current usage against limits
- **Security**: Environment variable-based secrets, bcrypt password hashing, input validation via Zod schemas, multi-tenant isolation with ownership checks, CSRF protection, and cryptographically secure CAPTCHA (HMAC-signed JWT, no answer exposure in payload).

#### System Design Choices
- **Multi-tenant Design**: Core architectural decision ensuring data isolation and scalability for multiple companies. All resource limits verified with ownership checks (event.companyId === req.user.companyId).
- **Object Storage**: Utilized for persistent storage of invoices to avoid ephemeral filesystem issues.
- **Atomic Database Transactions**: Ensures data consistency and integrity, particularly during critical operations like registration and payment processing.
- **Idempotency**: Implemented for payment processing and Stripe webhooks to prevent duplicate transactions.
- **Plan-Based Access Control**: Feature flags and resource quotas dynamically enforced across frontend (FeatureGate/LimitGate) and backend (middleware) based on company subscription tier.
- **Cryptographic CAPTCHA Design**: HMAC-signed JWT tokens ensure server-side verification without exposing answers in base64-decodable payload. setTimeout(0) pattern in AuthContext.login() prevents race condition between state update and redirect.

### External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Stripe**: Payment gateway for subscription management and processing.
- **API Entreprise (api.gouv.fr)**: Used for SIREN validation during company registration.
- **adresse.data.gouv.fr**: Free API for French address autocomplete and validation.
- **pdfkit**: Library for server-side PDF invoice generation.
- **qrcode**: Library for generating QR codes for events.