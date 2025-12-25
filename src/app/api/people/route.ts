import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * POST /api/people
 * Create a new person (family member)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      familyId,
      firstName,
      lastName,
      role,
      dateOfBirth,
    } = body;

    if (!organizationId || !firstName || !lastName || !role) {
      return createApiError('Missing required fields');
    }

    // Validate role
    if (!['ADULT', 'YOUTH'].includes(role)) {
      return createApiError('Invalid role. Must be ADULT or YOUTH');
    }

    const person = await prisma.person.create({
      data: {
        organizationId,
        familyId: familyId || null,
        firstName,
        lastName,
        role,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        active: true,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: 'PERSON_CREATED',
        details: JSON.stringify({ personId: person.id, firstName, lastName, role }),
      },
    });

    return createApiResponse(person, 201);
  } catch (error) {
    console.error('POST /api/people error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * GET /api/people?organizationId=...&role=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const role = searchParams.get('role');

    if (!organizationId) {
      return createApiError('organizationId is required');
    }

    const where: any = { organizationId };
    if (role) {
      where.role = role;
    }

    const people = await prisma.person.findMany({
      where,
      orderBy: { firstName: 'asc' },
    });

    return createApiResponse(people);
  } catch (error) {
    console.error('GET /api/people error:', error);
    return createApiError('Internal server error', 500);
  }
}
