import { PrismaClient } from '@prisma/client';
import { hashPin } from '@/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Five Talents',
      staffPin: await hashPin('5555'), // Demo PIN
    },
  });

  console.log('✓ Created organization:', org.name);

  // Create sample families
  const family1 = await prisma.family.upsert({
    where: {
      organizationId_primaryPhoneE164: {
        organizationId: org.id,
        primaryPhoneE164: '+15551234567',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      primaryPhoneE164: '+15551234567',
      phoneLast4: '4567',
      familyName: 'Smith',
    },
  });

  const family2 = await prisma.family.upsert({
    where: {
      organizationId_primaryPhoneE164: {
        organizationId: org.id,
        primaryPhoneE164: '+15559876543',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      primaryPhoneE164: '+15559876543',
      phoneLast4: '6543',
      familyName: 'Johnson',
    },
  });

  console.log('✓ Created families:', family1.familyName, family2.familyName);

  // Create people
  const adult1 = await prisma.person.upsert({
    where: { id: 'person-adult1' },
    update: {},
    create: {
      id: 'person-adult1',
      organizationId: org.id,
      familyId: family1.id,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'ADULT',
      active: true,
    },
  });

  const youth1 = await prisma.person.upsert({
    where: { id: 'person-youth1' },
    update: {},
    create: {
      id: 'person-youth1',
      organizationId: org.id,
      familyId: family1.id,
      firstName: 'John',
      lastName: 'Smith',
      role: 'YOUTH',
      dateOfBirth: new Date('2010-05-15'),
      active: true,
    },
  });

  const youth2 = await prisma.person.upsert({
    where: { id: 'person-youth2' },
    update: {},
    create: {
      id: 'person-youth2',
      organizationId: org.id,
      familyId: family1.id,
      firstName: 'Mary',
      lastName: 'Smith',
      role: 'YOUTH',
      dateOfBirth: new Date('2012-08-20'),
      active: true,
    },
  });

  const adult2 = await prisma.person.upsert({
    where: { id: 'person-adult2' },
    update: {},
    create: {
      id: 'person-adult2',
      organizationId: org.id,
      familyId: family2.id,
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'ADULT',
      active: true,
    },
  });

  const youth3 = await prisma.person.upsert({
    where: { id: 'person-youth3' },
    update: {},
    create: {
      id: 'person-youth3',
      organizationId: org.id,
      familyId: family2.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'YOUTH',
      dateOfBirth: new Date('2011-03-10'),
      active: true,
    },
  });

  console.log('✓ Created people:', adult1.firstName, youth1.firstName, youth2.firstName);

  // Create an event
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { id: 'default-event' },
    update: {},
    create: {
      id: 'default-event',
      organizationId: org.id,
      title: 'Summer Program 2024',
      description: 'Annual summer event for youth',
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endsAt: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      location: 'Community Center',
      status: 'ACTIVE',
    },
  });

  console.log('✓ Created event:', event.title);

  // Create sample attendance records
  const attendance1 = await prisma.attendance.upsert({
    where: {
      eventId_personId: {
        eventId: event.id,
        personId: youth1.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      eventId: event.id,
      personId: youth1.id,
      status: 'CHECKED_IN',
      checkInAt: new Date(),
    },
  });

  console.log('✓ Created attendance record');

  // Create pickup code
  const pickupCode = await prisma.pickupCode.upsert({
    where: {
      eventId_youthPersonId: {
        eventId: event.id,
        youthPersonId: youth1.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      eventId: event.id,
      youthPersonId: youth1.id,
      code: 'ABC',
    },
  });

  console.log('✓ Created pickup code:', pickupCode.code);

  console.log('✅ Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('  Staff PIN: 5555');
  console.log('  Family phone last 4: 4567 or 6543');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
