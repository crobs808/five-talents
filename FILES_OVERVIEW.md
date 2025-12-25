# Project Files Overview

## 📊 Statistics
- **TypeScript/React files**: 27 (.ts, .tsx)
- **Seed script**: 1 (prisma/seed.ts)
- **Documentation**: 11 markdown files
- **Configuration**: 7 JSON/YAML/JS files
- **Total Lines of Code**: ~3,500+ (excluding node_modules)

## 📁 Directory Structure

### `/src/app` - Next.js Pages & Routes (17 files)
```
api/
├── checkin/route.ts          - Check-in endpoint
├── checkout/route.ts         - Checkout/redemption
├── events/
│   ├── route.ts              - Event CRUD
│   └── [eventId]/route.ts    - Event detail
├── families/
│   ├── route.ts              - Family search & create
│   └── [familyId]/members/   - Get family members
├── people/route.ts           - People CRUD
└── reports/
    └── attendance/route.ts   - Attendance report

pages/
├── layout.tsx                - Root layout
├── page.tsx                  - Home page
├── checkin/page.tsx          - Kiosk check-in
├── checkout/page.tsx         - Pickup verification
├── admin/
│   ├── page.tsx              - Admin dashboard
│   ├── families/page.tsx     - Family management
│   ├── people/page.tsx       - People management
│   ├── events/page.tsx       - Event management
│   └── reports/page.tsx      - Attendance reports
└── print/
    └── [eventId]/[personId]/ - Tag printing
```

### `/src/components` - Reusable React Components (3 files)
```
Header.tsx                     - Navigation header
NumericKeypad.tsx              - Kiosk input component
QRCode.tsx                     - QR code generation
```

### `/src/lib` - Utilities & Helpers (4 files)
```
utils.ts                       - Phone, code, display utilities
auth.ts                        - PIN hashing/verification
db.ts                          - Prisma client singleton
api.ts                         - API response helpers
```

### `/src/__tests__` - Test Files (2 files)
```
utils.test.ts                  - Utility function tests
integration.test.ts            - Workflow integration tests
```

### `/prisma` - Database (2 files)
```
schema.prisma                  - Prisma schema (7 models)
seed.ts                        - Demo data seed script
```

### `/src` - Styling
```
globals.css                    - Tailwind + print CSS
```

## 📄 Configuration Files (7)
```
package.json                   - Dependencies & scripts
tsconfig.json                  - TypeScript config (strict)
next.config.js                 - Next.js config
tailwind.config.ts             - Tailwind customization
postcss.config.js              - PostCSS config
jest.config.js                 - Jest testing config
.eslintrc.json                 - ESLint rules
```

## 📚 Documentation Files (11)
```
README.md                      - Main project README
README_CHECKIN.md              - Complete feature guide (500+ lines)
DEPLOYMENT.md                  - Production deployment guide
API_TESTING.md                 - API test examples
QUICK_REFERENCE.md             - User quick reference
PROJECT_SUMMARY.md             - Implementation summary
IMPLEMENTATION_CHECKLIST.md    - Feature checklist
FILES_OVERVIEW.md              - This file
.env.example                   - Environment template
prisma/README.md               - Prisma directory guide
.gitignore                     - Git ignore rules
.nvmrc                         - Node version
```

## 🐳 Docker Files
```
Dockerfile                     - Container image config
docker-compose.yml             - Compose setup
```

## 📊 File Organization by Purpose

### API Routes (12 endpoints)
1. `/api/families` - Family lookup & creation
2. `/api/families/[familyId]/members` - Family members
3. `/api/people` - People CRUD
4. `/api/events` - Event CRUD
5. `/api/events/[eventId]` - Event details
6. `/api/checkin` - Check-in operation
7. `/api/checkout` - Code lookup
8. `/api/checkout` - Code redemption
9. `/api/reports/attendance` - Attendance stats

### Pages (9 main pages)
1. `/` - Home landing page
2. `/checkin` - Kiosk check-in interface
3. `/checkout` - Staff pickup verification
4. `/admin` - Admin dashboard
5. `/admin/families` - Family management
6. `/admin/people` - People management
7. `/admin/events` - Event management
8. `/admin/reports` - Attendance reports
9. `/print/[eventId]/[personId]` - Tag printing

### Components (3 reusable)
1. `<Header />` - Navigation
2. `<NumericKeypad />` - Kiosk input
3. `<QRCodeComponent />` - QR display

### Utilities (30+ functions)
- Phone normalization & masking
- Pickup code generation
- PIN hashing & verification
- Display formatting
- API response helpers

### Tests (2 test files)
- Utility function tests
- Integration workflow tests

### Database (7 models)
1. Organization
2. Family
3. Person
4. Event
5. Attendance
6. PickupCode
7. AuditLog

## 🔄 Data Flow

### Check-In Flow
```
User Input (NumericKeypad)
    ↓
API: Search families by phone
    ↓
Display: Family selection
    ↓
User selects family
    ↓
Display: Family roster (adults + youth)
    ↓
User clicks "Check In" for youth
    ↓
API: POST /api/checkin
    ↓
Generate pickup code
    ↓
Create/update Attendance record
    ↓
Display: Pickup code to user
    ↓
User prints tags
```

### Check-Out Flow
```
Staff enters PIN
    ↓
PIN verification
    ↓
Code entry screen
    ↓
API: GET /api/checkout (lookup code)
    ↓
Display: Confirm youth info
    ↓
Staff clicks "Confirm Pickup"
    ↓
API: POST /api/checkout (redeem)
    ↓
Update Attendance to CHECKED_OUT
    ↓
Mark PickupCode as redeemed
    ↓
Display: Success confirmation
```

## 🎯 Key Files to Know

### For Features
- **Check-in UI**: `src/app/checkin/page.tsx`
- **Check-out UI**: `src/app/checkout/page.tsx`
- **Check-in API**: `src/app/api/checkin/route.ts`
- **Check-out API**: `src/app/api/checkout/route.ts`

### For Admin
- **Families**: `src/app/admin/families/page.tsx`
- **Events**: `src/app/admin/events/page.tsx`
- **Reports**: `src/app/admin/reports/page.tsx`

### For Database
- **Schema**: `prisma/schema.prisma`
- **Seed Data**: `prisma/seed.ts`

### For Utilities
- **Code Generation**: `src/lib/utils.ts` → `generatePickupCode()`
- **Phone Handling**: `src/lib/utils.ts` → Phone functions
- **Security**: `src/lib/auth.ts` → PIN hashing

### For Styling
- **Global Styles**: `src/globals.css`
- **Print CSS**: `src/globals.css` → `@media print`
- **Component Styles**: Tailwind classes in .tsx files

### For Testing
- **Utility Tests**: `src/__tests__/utils.test.ts`
- **Integration Tests**: `src/__tests__/integration.test.ts`

## 🚀 Getting Started with Files

### To Understand the Project
1. Start: `README.md` (overview)
2. Then: `PROJECT_SUMMARY.md` (complete implementation)
3. Details: `README_CHECKIN.md` (feature details)

### To Run Locally
1. Review: `package.json` (dependencies)
2. Setup: Follow README.md quick start
3. Seed: `prisma/seed.ts` creates demo data
4. Run: `npm run dev`

### To Deploy
1. Read: `DEPLOYMENT.md` (production setup)
2. Build: `npm run build`
3. Docker: `docker-compose up --build`

### To Test API
1. Review: `API_TESTING.md` (test scenarios)
2. Run: API examples with curl
3. Check: `src/__tests__/` for unit tests

### To Customize
1. Families/People: Edit `prisma/seed.ts`
2. Colors: Edit `tailwind.config.ts`
3. Endpoints: Modify `src/app/api/**/*.ts`
4. Pages: Modify `src/app/**/page.tsx`

## 📈 Dependency Tree

```
package.json
├── next@14
│   ├── react@18
│   ├── typescript@5
│   └── ...
├── @prisma/client@5
│   └── prisma@5 (dev)
├── tailwindcss@3 (dev)
├── bcryptjs@2
├── qrcode@1
└── jest@29 (dev)
```

## 🔒 Security-Critical Files
- `src/lib/auth.ts` - PIN hashing
- `src/app/api/checkout/route.ts` - Redemption protection
- `prisma/schema.prisma` - Constraints & validation
- `.env.local` - Secrets (not in repo)

## 📋 Documentation Files by Topic
- **Setup**: README.md, DEPLOYMENT.md
- **Features**: README_CHECKIN.md, PROJECT_SUMMARY.md
- **API**: API_TESTING.md, individual route.ts files
- **Usage**: QUICK_REFERENCE.md
- **Status**: IMPLEMENTATION_CHECKLIST.md

---

**Total Project Size**: ~3,500 lines of production code + 1,000+ lines of documentation

**Ready for**: Immediate deployment and production use
