# Prisma

## Summary

This directory contains Prisma configuration and migrations for the check-in/check-out system.

## Files

- `schema.prisma` - Database schema definition
- `migrations/` - Database migration history
- `seed.ts` - Database seeding script

## Commands

```bash
# Push schema to database
npm run db:push

# Create a migration
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (danger!)
npm run db:reset
```
