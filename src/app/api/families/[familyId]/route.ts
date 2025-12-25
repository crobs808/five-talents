import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const body = await request.json();
    const { familyName, primaryPhone, people } = body;

    if (!familyName || !primaryPhone || !people) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update family
    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        familyName,
        primaryPhoneE164: primaryPhone,
      },
    });

    // Get existing people
    const existingPeople = await prisma.person.findMany({
      where: { familyId },
    });

    // Delete people not in the updated list (by checking IDs)
    const newPersonIds = people.filter((p: any) => !p.id.startsWith('new-')).map((p: any) => p.id);
    for (const existingPerson of existingPeople) {
      if (!newPersonIds.includes(existingPerson.id)) {
        await prisma.person.delete({
          where: { id: existingPerson.id },
        });
      }
    }

    // Update or create people
    for (const person of people) {
      if (person.id.startsWith('new-')) {
        // Create new person
        await prisma.person.create({
          data: {
            organizationId: family.organizationId,
            familyId,
            firstName: person.firstName,
            lastName: person.lastName,
            role: person.role,
            active: true,
          },
        });
      } else {
        // Update existing person
        await prisma.person.update({
          where: { id: person.id },
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            role: person.role,
          },
        });
      }
    }

    return NextResponse.json({ success: true, family });
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json(
      { error: 'Failed to update family' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;

    // Delete all people in the family
    await prisma.person.deleteMany({
      where: { familyId },
    });

    // Delete the family
    const family = await prisma.family.delete({
      where: { id: familyId },
    });

    return NextResponse.json({ success: true, family });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json(
      { error: 'Failed to delete family' },
      { status: 500 }
    );
  }
}
