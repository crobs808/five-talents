import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, phones } = body;

    if (!organizationId || !phones || !Array.isArray(phones)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check which phone numbers already exist
    const existingFamilies = await prisma.family.findMany({
      where: {
        organizationId,
        primaryPhoneE164: { in: phones },
      },
      select: { primaryPhoneE164: true },
    });

    const existingPhones = existingFamilies.map((f) => f.primaryPhoneE164);

    return NextResponse.json({ existingPhones });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
