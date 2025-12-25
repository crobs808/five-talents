import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || 'default-org';

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { checkInGraceMinutes: true },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      checkInGraceMinutes: org.checkInGraceMinutes,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, checkInGraceMinutes } = body;

    if (!organizationId || checkInGraceMinutes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (checkInGraceMinutes < 0 || checkInGraceMinutes > 120) {
      return NextResponse.json(
        { error: 'Grace minutes must be between 0 and 120' },
        { status: 400 }
      );
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: { checkInGraceMinutes },
      select: { checkInGraceMinutes: true },
    });

    return NextResponse.json({
      checkInGraceMinutes: org.checkInGraceMinutes,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
