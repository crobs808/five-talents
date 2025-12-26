import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse } from '@/lib/api';

/**
 * GET /api/debug/family?phoneLast4=...
 * Debug endpoint to see what the families API returns
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneLast4 = searchParams.get('phoneLast4') || '5244';

    const families = await prisma.family.findMany({
      where: {
        organizationId: 'default-org',
        phoneLast4,
      },
      include: {
        people: {
          where: { active: true },
          orderBy: { role: 'asc' },
        },
      },
    });

    return createApiResponse({
      phoneLast4,
      count: families.length,
      families: families.map(f => ({
        id: f.id,
        name: f.familyName,
        phoneLast4: f.phoneLast4,
        people: f.people.map(p => ({ 
          id: p.id, 
          name: `${p.firstName} ${p.lastName}`,
          role: p.role,
        })),
      })),
    });
  } catch (error) {
    console.error('GET /api/debug/family error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
