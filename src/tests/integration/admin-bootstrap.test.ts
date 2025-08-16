import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { RoleConcept } from '@/lib/concepts/common/role';
import { OrganizationConcept } from '@/lib/concepts/common/organization';
import { MembershipConcept } from '@/lib/concepts/common/membership';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL } }
});

describe('Admin bootstrap on login', () => {
  const role = new RoleConcept();
  const org = new OrganizationConcept();
  const membership = new MembershipConcept();
  const adminEmail = `admin-${Date.now()}@practera.com`;
  let userId = '';

  beforeAll(async () => {
    process.env.ADMIN_USERS = adminEmail; // mark as admin
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await prisma.organization.deleteMany({ where: { domain: 'practera.com' } });
    await prisma.role.deleteMany({ where: { name: { in: ['platform_admin', 'educator'] } } });
    await prisma.membership.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('creates Practera org, platform_admin role and membership on admin login', async () => {
    // Simulate sign up to trigger callbacks.user.create
    const created = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin Test',
      },
    });
    userId = created.id;

    // Call the callback explicitly to simulate better-auth user creation path
    // @ts-ignore access internal for test
    await (auth as any).options.callbacks.user.create({ user: created });

    const roles = await role._getByName({ name: 'platform_admin' });
    expect(roles.length).toBeGreaterThan(0);

    const practera = await org._getByDomain({ domain: 'practera.com' } as any);
    expect(practera.length).toBeGreaterThan(0);

    const member = await membership._getByMemberAndTarget({
      memberEntity: userId,
      targetEntity: practera[0].organization,
    });
    expect(member.length).toBe(1);
    expect(member[0].roleEntity).toBe('platform_admin');
    expect(member[0].isActive).toBe(true);
  });
});


