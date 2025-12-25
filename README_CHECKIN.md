# Check-In / Check-Out + Name Tags System

A production-ready MVP web application for event check-in, attendance tracking, and secure family pickup with printed name tags.

## Features

- ✅ **Kiosk-friendly check-in**: Tap-to-enter phone last-4 digits for fast family lookup
- ✅ **Attendance tracking**: Track check-in and check-out times for each youth
- ✅ **Secure pickup codes**: Generate unique codes for secure child pickup
- ✅ **Printable tags**: Child name tags and parent pickup tags with QR codes
- ✅ **Admin tools**: Manage families, people, events, and view attendance reports
- ✅ **Staff controls**: PIN-protected staff actions to prevent unauthorized access
- ✅ **Self-hosted**: Docker support for easy deployment
- ✅ **Mobile-friendly**: Works on tablets, laptops, and kiosks

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes + Prisma ORM + SQLite
- **Printing**: Browser print CSS for label sheets
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+ or Docker/Docker Compose
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository>
   cd five-talents
   npm install
   ```

2. **Set up database**:
   ```bash
   echo "DATABASE_URL=file:./prisma/dev.db" > .env.local
   npm run db:push
   npm run db:seed
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

2. **Initialize database** (automatically done on first run):
   ```bash
   docker-compose exec app npm run db:push
   docker-compose exec app npm run db:seed
   ```

### Podman Deployment

Podman is a drop-in replacement for Docker with improved security (rootless by default).

1. **Using podman-compose** (recommended):
   ```bash
   podman-compose up --build
   ```

2. **Using Podman directly**:
   ```bash
   # Build image
   podman build -t five-talents:latest .

   # Create pod with port and volume mapping
   podman pod create -n five-talents -p 3000:3000 \
     -v $(pwd)/data:/app/data:z

   # Run container
   podman run -d --pod five-talents --name app \
     -e DATABASE_URL=file:/app/data/checkin.db \
     five-talents:latest

   # Initialize database
   podman exec app npm run db:push
   podman exec app npm run db:seed
   ```

**Note**: Podman runs rootless by default (more secure than Docker)

## Usage

### Kiosk Check-In Flow

1. Navigate to [http://localhost:3000/checkin](http://localhost:3000/checkin)
2. Enter the last 4 digits of your phone number
3. Select your family (if multiple matches)
4. Check in youth by clicking their name
5. A pickup code is generated and displayed

### Admin Dashboard

Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin) (staff PIN: `5555` for demo)

**Available sections:**
- **Families**: View and create families with contact information
- **People**: Manage adults and youth
- **Events**: Create events and set one as ACTIVE
- **Reports**: View attendance reports for events

### Check-Out / Pickup Verification

1. Navigate to [http://localhost:3000/checkout](http://localhost:3000/checkout)
2. Enter staff PIN (demo: `5555`)
3. Enter or scan the pickup code
4. Confirm the youth information
5. Complete the checkout

### Tag Printing

When a youth is checked in, a pickup code is generated. To print tags:

1. Go to `/print/[eventId]/[personId]` in a new tab
2. Click "Print Tags" button
3. Print to a label printer

**Tag sizes**: Default 2.25in × 4in (configurable in CSS)

**Tag contents**:
- **Child tag**: Child name, event info, code + QR code
- **Parent pickup tag**: Code + QR code, minimal text

## Database Schema

### Core Tables

- **Organization**: Organization metadata and staff PIN
- **Family**: Family contact information (phone number indexed for kiosk lookup)
- **Person**: Adults and youth members
- **Event**: Events with status (DRAFT, ACTIVE, CLOSED)
- **Attendance**: Check-in/check-out records
- **PickupCode**: Unique codes for secure pickup verification
- **AuditLog**: Audit trail for security events

### Key Relationships

- Families belong to an Organization
- People belong to a Family and Organization
- Attendance links Youth → Event with timestamps
- PickupCode links Youth → Event with redemption tracking

## API Endpoints

### Public (Kiosk)
- `GET /api/families?organizationId=...&phoneLast4=...` - Search families
- `POST /api/checkin` - Check in a youth
- `GET /api/checkout` - Lookup pickup code
- `POST /api/checkout` - Redeem pickup code

### Admin
- `POST /api/families` - Create family
- `POST /api/people` - Create person
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `PATCH /api/events/[eventId]` - Update event
- `GET /api/reports/attendance` - Get attendance report

## Development

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
```

Tests cover:
- Pickup code generation uniqueness
- Phone number normalization
- Attendance state transitions

### Database Migrations

```bash
npm run db:migrate      # Create a migration
npm run db:push         # Push schema to database
npm run db:reset        # Reset database (DANGER!)
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=development
```

## Security Considerations

### Implemented

- ✅ Staff PIN protection for sensitive actions (admin, checkout)
- ✅ Phone number masking (only last 4 visible in kiosk)
- ✅ Code redemption tracking to prevent double-checkout
- ✅ Server-side validation of all inputs
- ✅ SQLite with file-based storage for simplicity
- ✅ Audit logging for code redemption

### Recommendations for Production

- Use environment variables for staff PIN (hash with bcryptjs)
- Enable HTTPS
- Implement rate limiting on kiosk endpoints
- Add authentication/authorization middleware
- Use a production database (PostgreSQL recommended)
- Enable CORS restrictions
- Add monitoring and alerting
- Regular backups of SQLite database
- Consider adding 2FA for admin actions

## Printing Setup

### Label Printer Configuration

1. **Purchase**: Brother QL-800 or similar label printer (USB or network)
2. **Setup**: Install printer drivers on kiosk machine
3. **Print Preview**: Use `/print/[eventId]/[personId]` page
4. **Label Size**: Configure in CSS (`@page { size: 2.25in 4in }`)

### Print CSS Tips

- Tags are printed on 2.25in × 4in labels
- QR codes are 150px for easy scanning
- Test print on regular paper first
- Adjust margins in print settings to 0 if needed

## Troubleshooting

### Database Issues

```bash
# Reset database and reseed
npm run db:reset
npm run db:seed
```

### Port Already in Use

```bash
# Change port
PORT=3001 npm run dev
```

### Docker Issues

```bash
# Rebuild containers
docker-compose down
docker-compose up --build
```

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure real staff PIN (hash with bcryptjs)
- [ ] Update database URL to production instance
- [ ] Test on actual label printer
- [ ] Test on target kiosk hardware
- [ ] Configure backups for SQLite database
- [ ] Set up monitoring and error tracking
- [ ] Train staff on check-in/check-out flow
- [ ] Create printed documentation for kiosk
- [ ] Test network stability and offline behavior

## File Structure

```
five-talents/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── admin/            # Admin pages
│   │   ├── checkin/          # Kiosk check-in
│   │   ├── checkout/         # Checkout verification
│   │   └── print/            # Tag printing
│   ├── components/           # React components
│   ├── lib/                  # Utilities & helpers
│   └── __tests__/            # Tests
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Seed script
│   └── migrations/           # Migration history
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── Dockerfile
└── docker-compose.yml
```

## Contributing

1. Create a feature branch
2. Make changes with TypeScript strict mode
3. Add/update tests
4. Update documentation
5. Submit pull request

## License

Proprietary - Five Talents Organization

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review database schema in `prisma/schema.prisma`
3. Check logs: `docker-compose logs app`
4. Contact: [support contact info]

## Future Enhancements

- [ ] QR code scanning on checkout
- [ ] CSV import/export for families
- [ ] Attendance analytics dashboard
- [ ] Email/SMS notifications
- [ ] Multiple event check-in
- [ ] Recurring events
- [ ] Parent portal for viewing attendance
- [ ] Multi-organization support
- [ ] Advanced reporting (charts, trends)
- [ ] Integration with registration system
