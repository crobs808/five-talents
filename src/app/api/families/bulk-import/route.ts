import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface FamilyImport {
  familyName: string;
  primaryPhoneE164: string;
  adults: Array<{
    firstName: string;
    lastName: string;
    position?: string;
  }>;
  youth: Array<{
    firstName: string;
    lastName: string;
    levelGroup?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, families } = body as {
      organizationId: string;
      families: FamilyImport[];
    };

    if (!organizationId || !families || !Array.isArray(families)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const imported: any[] = [];

    for (const familyData of families) {
      // Check if family already exists
      const existing = await prisma.family.findUnique({
        where: {
          organizationId_primaryPhoneE164: {
            organizationId,
            primaryPhoneE164: familyData.primaryPhoneE164,
          },
        },
      });

      if (existing) continue;

      // Create family
      const family = await prisma.family.create({
        data: {
          organizationId,
          familyName: familyData.familyName,
          primaryPhoneE164: familyData.primaryPhoneE164,
          phoneLast4: familyData.primaryPhoneE164.startsWith('temp-') 
            ? '0000' 
            : familyData.primaryPhoneE164.slice(-4),
        },
      });

      // Create adult members
      for (const adult of familyData.adults) {
        await prisma.person.create({
          data: {
            organizationId,
            familyId: family.id,
            firstName: adult.firstName,
            lastName: adult.lastName,
            role: 'ADULT',
            position: adult.position,
            active: true,
          },
        });
      }

      // Create youth members
      for (const youth of familyData.youth) {
        await prisma.person.create({
          data: {
            organizationId,
            familyId: family.id,
            firstName: youth.firstName,
            lastName: youth.lastName,
            role: 'YOUTH',
            levelGroup: youth.levelGroup,
            active: true,
          },
        });
      }

      imported.push({
        id: family.id,
        familyName: family.familyName,
        primaryPhoneE164: family.primaryPhoneE164,
      });
    }

    return NextResponse.json({
      importedCount: imported.length,
      families: imported,
    });
  } catch (error) {
    console.error('Error importing families:', error);
    return NextResponse.json(
      { error: 'Failed to import families' },
      { status: 500 }
    );
  }
}
