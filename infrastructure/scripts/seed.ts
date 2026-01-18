// FlowBond × DANZ Venue System - Database Seed Script
// Run with: npx ts-node infrastructure/scripts/seed.ts

import { PrismaClient, TaskType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function generateQRCode(): string {
  return nanoid(12).toUpperCase();
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.drinkPass.deleteMany();
  await prisma.drinkReward.deleteMany();
  await prisma.taskCompletion.deleteMany();
  await prisma.questProgress.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sponsorQuest.deleteMany();
  await prisma.qRPoint.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@flowbond.io',
      passwordHash: await generatePasswordHash('admin123'),
      language: 'en',
      isAdmin: true,
      isStaff: true,
    },
  });
  console.log(`   Created admin: ${adminUser.email}`);

  // Create Staff User
  console.log('👤 Creating staff user...');
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@flowbond.io',
      passwordHash: await generatePasswordHash('staff123'),
      language: 'en',
      isStaff: true,
    },
  });
  console.log(`   Created staff: ${staffUser.email}`);

  // Create Test Users
  console.log('👥 Creating test users...');
  const testUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        passwordHash: await generatePasswordHash('user123'),
        language: 'en',
      },
    }),
    prisma.user.create({
      data: {
        email: 'usuario@example.com',
        passwordHash: await generatePasswordHash('user123'),
        language: 'es',
      },
    }),
    prisma.user.create({
      data: {
        email: 'utilisateur@example.com',
        passwordHash: await generatePasswordHash('user123'),
        language: 'fr',
      },
    }),
  ]);
  console.log(`   Created ${testUsers.length} test users`);

  // Create Sponsors
  console.log('🏢 Creating sponsors...');
  const sponsors = await Promise.all([
    prisma.sponsor.create({
      data: {
        name: 'Topo Chico',
        slug: 'topo-chico',
        logo: 'https://example.com/logos/topo-chico.png',
        primaryColor: '#00A19B',
        secondaryColor: '#FFFFFF',
      },
    }),
    prisma.sponsor.create({
      data: {
        name: 'Deep Eddy Vodka',
        slug: 'deep-eddy',
        logo: 'https://example.com/logos/deep-eddy.png',
        primaryColor: '#E31837',
        secondaryColor: '#FFFFFF',
      },
    }),
    prisma.sponsor.create({
      data: {
        name: 'Austin Beerworks',
        slug: 'austin-beerworks',
        logo: 'https://example.com/logos/austin-beerworks.png',
        primaryColor: '#F7941D',
        secondaryColor: '#000000',
      },
    }),
  ]);
  console.log(`   Created ${sponsors.length} sponsors`);

  // Create Venue
  console.log('🏛️ Creating venue...');
  const venue = await prisma.venue.create({
    data: {
      name: 'DANZ Austin',
      slug: 'danz-austin',
      address: '123 Music Lane, Austin, TX 78701',
      timezone: 'America/Chicago',
      logo: 'https://example.com/logos/danz-austin.png',
      primaryColor: '#6366F1',
      secondaryColor: '#EC4899',
      staff: {
        connect: [{ id: adminUser.id }, { id: staffUser.id }],
      },
      sponsors: {
        connect: sponsors.map((s) => ({ id: s.id })),
      },
    },
  });
  console.log(`   Created venue: ${venue.name}`);

  // Create Zones
  console.log('📍 Creating zones...');
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        name: 'Main Floor',
        venueId: venue.id,
      },
    }),
    prisma.zone.create({
      data: {
        name: 'VIP Lounge',
        venueId: venue.id,
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Outdoor Patio',
        venueId: venue.id,
      },
    }),
    prisma.zone.create({
      data: {
        name: 'Bar Area',
        venueId: venue.id,
      },
    }),
  ]);
  console.log(`   Created ${zones.length} zones`);

  // Create QR Points
  console.log('📱 Creating QR points...');
  const qrPoints = await Promise.all([
    // Main Floor QR points
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[0].id,
        sponsorId: sponsors[0].id,
        label: 'Main Floor - Topo Chico Station',
      },
    }),
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[0].id,
        sponsorId: sponsors[1].id,
        label: 'Main Floor - Deep Eddy Bar',
      },
    }),
    // VIP Lounge QR points
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[1].id,
        sponsorId: sponsors[2].id,
        label: 'VIP - Austin Beerworks Tap',
      },
    }),
    // Outdoor Patio QR points
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[2].id,
        sponsorId: sponsors[0].id,
        label: 'Patio - Topo Chico Cooler',
      },
    }),
    // Bar Area QR points
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[3].id,
        sponsorId: sponsors[1].id,
        label: 'Bar - Deep Eddy Featured',
      },
    }),
    prisma.qRPoint.create({
      data: {
        code: generateQRCode(),
        zoneId: zones[3].id,
        sponsorId: sponsors[2].id,
        label: 'Bar - Austin Beerworks Draft',
      },
    }),
  ]);
  console.log(`   Created ${qrPoints.length} QR points`);

  // Create Sponsor Quests
  console.log('🎯 Creating sponsor quests...');
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Topo Chico Quest
  const topoQuest = await prisma.sponsorQuest.create({
    data: {
      name: 'Topo Chico Explorer',
      description: 'Discover the refreshing taste of Topo Chico throughout the venue!',
      sponsorId: sponsors[0].id,
      venueId: venue.id,
      startDate: now,
      endDate: thirtyDaysFromNow,
      maxCompletions: 500,
      imageUrl: 'https://example.com/quests/topo-explorer.jpg',
    },
  });

  // Deep Eddy Quest
  const deepEddyQuest = await prisma.sponsorQuest.create({
    data: {
      name: 'Deep Eddy Discovery',
      description: 'Experience the smooth taste of Deep Eddy Vodka cocktails!',
      sponsorId: sponsors[1].id,
      venueId: venue.id,
      startDate: now,
      endDate: thirtyDaysFromNow,
      maxCompletions: 300,
      imageUrl: 'https://example.com/quests/deep-eddy.jpg',
    },
  });

  // Austin Beerworks Quest
  const beerworksQuest = await prisma.sponsorQuest.create({
    data: {
      name: 'Local Brews Journey',
      description: 'Support local and taste the best craft beers Austin has to offer!',
      sponsorId: sponsors[2].id,
      venueId: venue.id,
      startDate: now,
      endDate: thirtyDaysFromNow,
      maxCompletions: 400,
      imageUrl: 'https://example.com/quests/beerworks.jpg',
    },
  });

  console.log(`   Created 3 sponsor quests`);

  // Create Tasks for Quests
  console.log('✅ Creating quest tasks...');

  // Topo Chico Quest Tasks
  await prisma.task.createMany({
    data: [
      {
        questId: topoQuest.id,
        type: TaskType.QR_SCAN,
        name: 'Scan Main Floor Station',
        description: 'Find and scan the Topo Chico QR code on the main floor',
        order: 1,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[0].code },
      },
      {
        questId: topoQuest.id,
        type: TaskType.QR_SCAN,
        name: 'Scan Patio Cooler',
        description: 'Head to the outdoor patio and scan the cooler QR code',
        order: 2,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[3].code },
      },
      {
        questId: topoQuest.id,
        type: TaskType.SURVEY,
        name: 'Share Your Favorite Flavor',
        description: 'Tell us which Topo Chico flavor is your favorite!',
        order: 3,
        isRequired: false,
        validationConfig: {
          requiredFields: ['favoriteFlavorField'],
          options: ['Original', 'Lime', 'Grapefruit', 'Twist of Tangerine'],
        },
      },
    ],
  });

  // Deep Eddy Quest Tasks
  await prisma.task.createMany({
    data: [
      {
        questId: deepEddyQuest.id,
        type: TaskType.QR_SCAN,
        name: 'Scan Main Floor Bar',
        description: 'Find the Deep Eddy display on the main floor',
        order: 1,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[1].code },
      },
      {
        questId: deepEddyQuest.id,
        type: TaskType.SOCIAL_SHARE,
        name: 'Share on Social Media',
        description: 'Post about your Deep Eddy experience with #DeepEddyDANZ',
        order: 2,
        isRequired: true,
        validationConfig: {
          allowedPlatforms: ['instagram', 'twitter', 'tiktok'],
          hashtag: '#DeepEddyDANZ',
        },
      },
      {
        questId: deepEddyQuest.id,
        type: TaskType.QR_SCAN,
        name: 'Visit the Bar',
        description: 'Scan the Deep Eddy featured cocktail QR at the bar',
        order: 3,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[4].code },
      },
    ],
  });

  // Austin Beerworks Quest Tasks
  await prisma.task.createMany({
    data: [
      {
        questId: beerworksQuest.id,
        type: TaskType.QR_SCAN,
        name: 'VIP Tap Experience',
        description: 'Head to the VIP lounge and scan the Austin Beerworks tap',
        order: 1,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[2].code },
      },
      {
        questId: beerworksQuest.id,
        type: TaskType.CHECKIN,
        name: 'Check-in at the Venue',
        description: 'Enable location and check-in to verify your presence',
        order: 2,
        isRequired: true,
        validationConfig: {
          latitude: 30.2672,
          longitude: -97.7431,
          radiusMeters: 200,
        },
      },
      {
        questId: beerworksQuest.id,
        type: TaskType.QR_SCAN,
        name: 'Visit the Draft Station',
        description: 'Find the Austin Beerworks draft station at the bar',
        order: 3,
        isRequired: true,
        validationConfig: { expectedQRCode: qrPoints[5].code },
      },
      {
        questId: beerworksQuest.id,
        type: TaskType.SURVEY,
        name: 'Rate Your Experience',
        description: 'Give us feedback on the Local Brews Journey',
        order: 4,
        isRequired: false,
        validationConfig: {
          requiredFields: ['ratingField', 'feedbackField'],
        },
      },
    ],
  });

  console.log(`   Created 10 quest tasks`);

  // Create Drink Rewards
  console.log('🍹 Creating drink rewards...');
  await Promise.all([
    prisma.drinkReward.create({
      data: {
        questId: topoQuest.id,
        sponsorId: sponsors[0].id,
        name: 'Free Topo Chico',
        description: 'Enjoy a complimentary Topo Chico of your choice!',
        validityHours: 24,
        maxRedemptions: 1,
      },
    }),
    prisma.drinkReward.create({
      data: {
        questId: deepEddyQuest.id,
        sponsorId: sponsors[1].id,
        name: 'Deep Eddy Cocktail',
        description: 'Redeem for any Deep Eddy signature cocktail!',
        validityHours: 24,
        maxRedemptions: 1,
      },
    }),
    prisma.drinkReward.create({
      data: {
        questId: beerworksQuest.id,
        sponsorId: sponsors[2].id,
        name: 'Austin Beerworks Pint',
        description: 'Claim your complimentary pint of local craft beer!',
        validityHours: 24,
        maxRedemptions: 1,
      },
    }),
  ]);
  console.log(`   Created 3 drink rewards`);

  // Summary
  console.log('\n✨ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Venues: ${await prisma.venue.count()}`);
  console.log(`   Zones: ${await prisma.zone.count()}`);
  console.log(`   Sponsors: ${await prisma.sponsor.count()}`);
  console.log(`   QR Points: ${await prisma.qRPoint.count()}`);
  console.log(`   Quests: ${await prisma.sponsorQuest.count()}`);
  console.log(`   Tasks: ${await prisma.task.count()}`);
  console.log(`   Drink Rewards: ${await prisma.drinkReward.count()}`);

  console.log('\n🔐 Test Credentials:');
  console.log('   Admin: admin@flowbond.io / admin123');
  console.log('   Staff: staff@flowbond.io / staff123');
  console.log('   User:  user1@example.com / user123');

  console.log('\n📱 QR Codes:');
  qrPoints.forEach((qr) => {
    console.log(`   ${qr.label}: ${qr.code}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
