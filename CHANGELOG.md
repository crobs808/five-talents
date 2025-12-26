# Changelog

All notable changes to the Five Talents project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-25

### Added
- **Stripe Payment Integration**: Complete payment processing system with Stripe API
  - Payment intent creation endpoint
  - Webhook handling for payment events (succeeded, failed, refunded)
  - Registration management (CRUD) endpoints
  - Registration and PaymentTransaction database models
- **Security Authentication**: Admin area protection with configurable security code
  - Session-based authentication with localStorage
  - Lock/logout functionality
  - Secure gate component
- **Stripe Integration Testing**: Comprehensive test dashboard for API validation
  - Real-time API console with request/response logging
  - Payment intent testing
  - Registration lookup and status checking
  - Database health checks
  - Stripe key verification
- **Performance Optimizations**: Code efficiency improvements
  - Added useCallback hooks for memoization
  - Reduced code duplication in API call patterns
  - Optimized component re-renders

### Changed
- Updated package name from `five-talents-checkin` to `five-talents`
- Enhanced README with comprehensive project description
- Improved component architecture for better maintainability

### Technical
- Installed Stripe npm package
- Database migration: `add_stripe_models`
- Setup Stripe CLI for local webhook testing

## [1.0.0] - 2025-12-20

### Added
- **Event Check-In System**: Kiosk-friendly interface for family check-ins
  - Phone-based household lookup
  - Real-time youth roster display
  - Automatic pickup code generation
  - Calendar event integration with grace period support
- **Event Check-Out System**: Secure pickup code verification
  - Staff PIN protection
  - QR code display for verification
  - Double-redemption prevention
- **Event Management**: Admin interface for event CRUD operations
  - Local and Google Calendar event integration
  - Event status toggling (ACTIVE/INACTIVE)
  - Attendance count tracking
  - Unsaved changes protection with visual feedback
  - Local-only event filtering
- **Attendance Tracking**: Real-time check-in/check-out with timestamps
  - Detailed attendance reports by event
  - Family and youth roster management
  - Attendance statistics
- **Family Management**: Complete family CRUD operations
  - Family profile creation and editing
  - Contact information management
  - Family member (youth/adults) tracking
  - Bulk import from CSV
  - Duplicate detection
- **People Management**: Individual person management
  - Youth and adult role assignments
  - Person CRUD operations
- **Print System**: Name tag generation for pickup verification
  - Child name tags with QR codes
  - Parent pickup tags with matching QR codes
  - Print-optimized formatting (2.25in × 4in)
- **Database Schema**: Comprehensive data model
  - Organizations, Families, People (Adults/Youth)
  - Events, Attendance, Pickup Codes
  - Calendar URLs, Event Settings
- **UI/UX Features**:
  - Dark mode support
  - Responsive design for desktop and mobile
  - Touch-friendly kiosk interface
  - Modal dialogs for forms
  - Real-time error handling and validation
  - Pickup code display and generation

### Infrastructure
- Next.js 16.1.1 with Turbopack
- TypeScript for type safety
- Prisma ORM with SQLite
- Tailwind CSS for styling
- iCal parsing with node-ical for calendar integration
- JWT token support for future enhancements
- Docker and Podman support for deployment

---

## Versioning Strategy

- **MAJOR** version bump: Breaking changes, complete rewrites, database schema changes
- **MINOR** version bump: New features, backward compatible changes
- **PATCH** version bump: Bug fixes, performance improvements, documentation updates

## Version Format

`MAJOR.MINOR.PATCH` (e.g., `1.1.0`)

- MAJOR: Incompatible API changes
- MINOR: New functionality (backward compatible)
- PATCH: Bug fixes and non-breaking improvements
