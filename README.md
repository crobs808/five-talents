# Five Talents

**Five Talents** is a modern, self-service event management platform designed specifically for nonprofit youth groups, community organizations, and faith-based gatherings. Named after the biblical parable of the talents, it empowers organizations to efficiently manage their events without requiring staff intervention at every touchpoint.

## What is Five Talents?

Five Talents streamlines the complete event lifecycle for nonprofits:

- **📋 Event Registration** - Self-service family registration with integrated payment processing
- **💳 Payment Processing** - Built-in Stripe integration for collecting event fees, donations, and registrations
- **✅ Attendance Tracking** - Real-time check-in and check-out with a kiosk-friendly interface
- **🔐 Secure Pickup** - Family-facing pickup code system with QR code verification to ensure youth are released to authorized adults
- **📊 Reporting & Analytics** - Admin dashboard for viewing attendance reports, managing families, and tracking event metrics

Perfect for youth group events, church gatherings, community festivals, camps, field trips, and any organization that needs to track who attended and collect payments efficiently.

## Features

- **Registration & Payment**: Integrated with Stripe API
- **Event Check-In/Check-Out**: Kiosk-friendly system with phone-based lookup
- **Attendance Tracking**: Real-time check-in/check-out with timestamps
- **Secure Pickup**: Unique codes and QR codes for family pickup verification
- **Printed Name Tags**: Child and parent pickup tags
- **Admin Dashboard**: Manage families, events, and view reports

## Documentation

- [Check-In Feature README](./README_CHECKIN.md) - Complete setup and usage guide for the check-in system
- [Prisma Schema](./prisma/schema.prisma) - Database schema
- [API Documentation](./README_CHECKIN.md#api-endpoints) - All available endpoints

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Deployment
```bash
docker-compose up --build
```

### Podman Deployment (Rootless, More Secure)
```bash
podman-compose up --build
# OR: podman build -t five-talents . && podman pod create -n five-talents -p 3000:3000 -v $(pwd)/data:/app/data:z
```

For detailed setup and deployment instructions, see [README_CHECKIN.md](./README_CHECKIN.md).
