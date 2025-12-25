import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/families/[familyId]/members
 * Get all family members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        people: {
          where: { active: true },
          orderBy: { role: 'asc' },
        },
      },
    });

    if (!family) {
      return createApiError('Family not found', 404);
    }

    return createApiResponse(family);
  } catch (error) {
    console.error('GET /api/families/[familyId]/members error:', error);
    return createApiError('Internal server error', 500);
  }
}
