# Five Talents

Registration, payment, and event check-in tool for nonprofits.

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
