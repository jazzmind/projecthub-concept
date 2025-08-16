import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create or upsert a few campaigns
  const campaigns = [
    {
      id: 'fall-bootcamp',
      name: 'Fall Bootcamp',
      description: 'Intensive program to kickstart projects.',
      learningObjectives: ['Teamwork', 'Execution'],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      contactEmail: 'bootcamp@projecthub.local',
      status: 'active' as const,
    },
    {
      id: 'spring-studio',
      name: 'Spring Studio',
      description: 'Studio course partnering with industry.',
      learningObjectives: ['Research', 'Communication'],
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      contactEmail: 'studio@projecthub.local',
      status: 'draft' as const,
    },
  ];

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


