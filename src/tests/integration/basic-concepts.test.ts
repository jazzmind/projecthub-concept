import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { UserConcept } from '@/lib/concepts/common/user';
import { RoleConcept } from '@/lib/concepts/common/role';
import { SessionConcept } from '@/lib/concepts/common/session';
import { MembershipConcept } from '@/lib/concepts/common/membership';
import { ProfileConcept } from '@/lib/concepts/common/profile';
import { OrganizationConcept } from '@/lib/concepts/common/organization';
import { TeamConcept } from '@/lib/concepts/common/team';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { CampaignConcept } from '@/lib/concepts/project/campaign';
import { AssignmentConcept } from '@/lib/concepts/wip/assignment';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const concepts = {
  user: new UserConcept(),
  role: new RoleConcept(),
  session: new SessionConcept(),
  membership: new MembershipConcept(),
  profile: new ProfileConcept(),
  organization: new OrganizationConcept(),
  team: new TeamConcept(),
  project: new ProjectConcept(),
  campaign: new CampaignConcept(),
  assignment: new AssignmentConcept(),
};

describe('Basic Concepts Integration', () => {
  let testId: string;

  beforeAll(async () => {
    testId = 'integration-test-' + Date.now();
    // Clean up all test data
    await prisma.assignment.deleteMany({});
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.assignment.deleteMany({});
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('should create and query basic entities', async () => {
    // 1. Create User
    const userResult = await concepts.user.register({
      user: testId + '-user',
      email: `test-${testId}@example.com`,
      name: 'Test User'
    });
    expect(userResult).toHaveProperty('user');

    // 2. Create Role
    const roleResult = await concepts.role.create({
      name: testId + '-role',
      displayName: 'Test Role',
      description: 'Test role description',
      scope: 'organization',
      permissions: { users: { read: true } }
    });
    expect(roleResult).toHaveProperty('role');

    // 3. Create Session
    const sessionResult = await concepts.session.create({
      sessionKey: testId + '-session',
      loginMethod: 'email'
    });
    expect(sessionResult).toHaveProperty('session');

    // 4. Create Organization
    const orgResult = await concepts.organization.create({
      organization: testId + '-org',
      name: 'Test Organization',
      description: 'Test organization description',
      domain: `test-${testId}.com`,
      organizationType: 'company',
      contactEmail: `contact-${testId}@example.com`
    });
    expect(orgResult).toHaveProperty('organization');

    // 5. Create Membership
    const membershipResult = await concepts.membership.invite({
      memberEntity: testId + '-user',
      targetEntity: testId + '-org',
      roleEntity: testId + '-role',
      invitedBy: 'system'
    });
    expect(membershipResult).toHaveProperty('membership');

    // 6. Create Profile
    const profileResult = await concepts.profile.create({
      profile: testId + '-profile',
      userEntity: testId + '-user',
      profileType: 'expert',
      bio: 'Test expert profile',
      timezone: 'UTC'
    });
    expect(profileResult).toHaveProperty('profile');

    // 7. Create Team
    const teamResult = await concepts.team.create({
      team: testId + '-team',
      name: 'Test Team',
      description: 'Test team description'
    });
    expect(teamResult).toHaveProperty('team');

    // 8. Create Project
    const projectResult = await concepts.project.create({
      project: testId + '-project',
      title: 'Test Project',
      description: 'Test project description',
      scope: 'Build a test application',
      learningObjectives: ['Learn testing', 'Learn concepts'],
      industry: 'Technology',
      domain: 'Software Development',
      difficulty: 'intermediate',
      estimatedHours: 40,
      requiredSkills: ['JavaScript', 'Testing'],
      deliverables: ['Working application', 'Test suite']
    });
    expect(projectResult).toHaveProperty('project');

    // 9. Create Campaign
    const campaignResult = await concepts.campaign.create({
      campaign: testId + '-campaign',
      name: 'Test Campaign',
      description: 'Test campaign description',
      learningObjectives: ['Learn project management'],
      startDate: new Date(),
      contactEmail: `campaign-${testId}@example.com`
    });
    expect(campaignResult).toHaveProperty('campaign');

    // 10. Create Assignment
    const assignmentResult = await concepts.assignment.assign({
      assignment: testId + '-assignment',
      task: 'Complete test project',
      assignee: testId + '-user',
      assigner: 'system'
    });
    expect(assignmentResult).toHaveProperty('assignment');
  });

  test('should query created entities', async () => {
    // Query User
    const users = await concepts.user._getById({ user: testId + '-user' });
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Test User');

    // Query Role
    const roles = await concepts.role._getByName({ name: testId + '-role' });
    expect(roles).toHaveLength(1);
    expect(roles[0].displayName).toBe('Test Role');

    // Query Session
    const sessions = await concepts.session._getBySessionKey({ sessionKey: testId + '-session' });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].loginMethod).toBe('email');

    // Query Organization
    const orgs = await concepts.organization._getByOrganization({ organization: testId + '-org' });
    expect(orgs).toHaveLength(1);
    expect(orgs[0].name).toBe('Test Organization');

    // Query Membership
    const memberships = await concepts.membership._getByMemberAndTarget({
      memberEntity: testId + '-user',
      targetEntity: testId + '-org'
    });
    expect(memberships).toHaveLength(1);

    // Query Profile
    const profiles = await concepts.profile._getByProfile({ profile: testId + '-profile' });
    expect(profiles).toHaveLength(1);
    expect(profiles[0].profileType).toBe('expert');

    // Query Team
    const teams = await concepts.team._getByTeam({ team: testId + '-team' });
    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe('Test Team');

    // Query Project
    const projects = await concepts.project._getByProject({ project: testId + '-project' });
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('Test Project');

    // Query Campaign
    const campaigns = await concepts.campaign._getByCampaign({ campaign: testId + '-campaign' });
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toBe('Test Campaign');

    // Query Assignment
    const assignments = await concepts.assignment._getByAssignment({ assignment: testId + '-assignment' });
    expect(assignments).toHaveLength(1);
    expect(assignments[0].task).toBe('Complete test project');
  });

  test('should perform basic operations', async () => {
    // Update user
    const userUpdate = await concepts.user.updateProfile({
      user: testId + '-user',
      name: 'Updated Test User'
    });
    expect(userUpdate).toHaveProperty('user');

    // Verify email
    const emailVerify = await concepts.user.verifyEmail({ user: testId + '-user' });
    expect(emailVerify).toHaveProperty('user');

    // Accept membership
    const membershipAccept = await concepts.membership.accept({
      memberEntity: testId + '-user',
      targetEntity: testId + '-org'
    });
    expect(membershipAccept).toHaveProperty('membership');

    // Add profile skill
    const skillAdd = await concepts.profile.addSkill({
      profile: testId + '-profile',
      skillName: 'Testing',
      skillLevel: 'expert',
      isExpertise: true
    });
    expect(skillAdd).toHaveProperty('profileSkill');

    // Update session activity
    const sessionUpdate = await concepts.session.updateActivity({ sessionKey: testId + '-session' });
    expect(sessionUpdate).toHaveProperty('session');

    // Update project
    const projectUpdate = await concepts.project.update({
      project: testId + '-project',
      title: 'Updated Test Project'
    });
    expect(projectUpdate).toHaveProperty('project');

    // Accept assignment
    const assignmentAccept = await concepts.assignment.accept({ assignment: testId + '-assignment' });
    expect(assignmentAccept).toHaveProperty('assignment');
  });

  test('all concepts should be properly instantiated', () => {
    // Verify all concepts are instances of their respective classes
    expect(concepts.user).toBeInstanceOf(UserConcept);
    expect(concepts.role).toBeInstanceOf(RoleConcept);
    expect(concepts.session).toBeInstanceOf(SessionConcept);
    expect(concepts.membership).toBeInstanceOf(MembershipConcept);
    expect(concepts.profile).toBeInstanceOf(ProfileConcept);
    expect(concepts.organization).toBeInstanceOf(OrganizationConcept);
    expect(concepts.team).toBeInstanceOf(TeamConcept);
    expect(concepts.project).toBeInstanceOf(ProjectConcept);
    expect(concepts.campaign).toBeInstanceOf(CampaignConcept);
    expect(concepts.assignment).toBeInstanceOf(AssignmentConcept);
  });
});
