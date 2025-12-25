# API Testing Guide

## Setup

Make sure the server is running:
```bash
npm run dev
```

Base URL: `http://localhost:3000/api`

## Test Scenarios

### 1. Search for Families

```bash
curl "http://localhost:3000/api/families?organizationId=default-org&phoneLast4=4567"
```

Expected response:
```json
[
  {
    "id": "...",
    "organizationId": "default-org",
    "familyName": "Smith",
    "primaryPhoneE164": "+15551234567",
    "phoneLast4": "4567",
    "people": [...]
  }
]
```

### 2. Create a Family

```bash
curl -X POST "http://localhost:3000/api/families" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "primaryPhoneE164": "+15559999999",
    "familyName": "Test Family"
  }'
```

### 3. Create a Person

```bash
curl -X POST "http://localhost:3000/api/people" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "familyId": "family-id-here",
    "firstName": "John",
    "lastName": "Doe",
    "role": "YOUTH",
    "dateOfBirth": "2010-05-15"
  }'
```

### 4. Check In a Youth

```bash
curl -X POST "http://localhost:3000/api/checkin" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "eventId": "default-event",
    "personId": "person-youth1"
  }'
```

Expected response:
```json
{
  "attendance": {
    "id": "...",
    "status": "CHECKED_IN",
    "checkInAt": "2024-01-15T10:30:00Z",
    ...
  },
  "pickupCode": {
    "id": "...",
    "code": "ABC123",
    ...
  }
}
```

### 5. Lookup Pickup Code

```bash
curl "http://localhost:3000/api/checkout?code=ABC123&eventId=default-event"
```

### 6. Redeem Pickup Code (Check Out)

```bash
curl -X POST "http://localhost:3000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "pickupCodeId": "code-id-here"
  }'
```

### 7. View Attendance Report

```bash
curl "http://localhost:3000/api/reports/attendance?organizationId=default-org&eventId=default-event"
```

Expected response:
```json
{
  "event": { ... },
  "stats": {
    "totalCheckedIn": 1,
    "totalCheckedOut": 0,
    "totalAttendances": 1
  }
}
```

## Common Issues

### Family Not Found
- Verify phone number is in database: `sqlite3 prisma/dev.db "SELECT * FROM Family;"`
- Ensure phoneLast4 is exactly 4 digits

### Pickup Code Already Redeemed
- Expected when calling checkout twice with same code
- Create new check-in to get new code

### Invalid Event ID
- Verify event exists: `sqlite3 prisma/dev.db "SELECT * FROM Event;"`
- Use actual event ID from database

## Using with Postman/Insomnia

1. Create new environment with base URL: `http://localhost:3000/api`
2. Set variables: `organizationId`, `eventId`, `personId`
3. Import requests from examples above

## Database Inspection

```bash
# SQLite CLI
sqlite3 prisma/dev.db

# View tables
.tables

# View schema
.schema Family

# Query data
SELECT * FROM Family LIMIT 10;
```

## Performance Testing

```bash
# Load test check-in endpoint
ab -n 100 -c 10 "http://localhost:3000/api/families?organizationId=default-org&phoneLast4=4567"
```

## Debugging

Enable verbose logging by adding `?debug=1` to URLs (not implemented by default).

Check server logs for:
- Request details
- Database queries
- Error stack traces

## Integration Testing

See `src/__tests__/` for unit tests:

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
```
