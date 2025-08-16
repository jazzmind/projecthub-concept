import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TeamConcept } from '@/lib/concepts/common/team';
import { UserConcept } from '@/lib/concepts/common/user';
import { RoleConcept } from '@/lib/concepts/common/role';
import { MembershipConcept } from '@/lib/concepts/common/membership';
import { ProfileConcept } from '@/lib/concepts/common/profile';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { AssignmentConcept } from '@/lib/concepts/wip/assignment';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock concept instances for testing sync workflows
const teamConcept = new TeamConcept();
const userConcept = new UserConcept();
const roleConcept = new RoleConcept();
const membershipConcept = new MembershipConcept();
const profileConcept = new ProfileConcept();
const projectConcept = new ProjectConcept();
const assignmentConcept = new AssignmentConcept();

describe('API Teams Sync Tests', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'team-sync-test-' + Date.now();
    
    // Clean up test data
    await prisma.assignment.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileSkill.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Team Formation Workflows', () => {
    test('should create cross-functional development team', async () => {
      // 1. Create team with skill requirements
      const team = await teamConcept.create({
        team: testId + '-dev-team',
        name: 'Full-Stack Development Team',
        description: 'Cross-functional team for end-to-end application development',
        maxMembers: 6,
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
        preferredSkills: ['TypeScript', 'GraphQL', 'Docker', 'AWS']
      });
      expect(team).toHaveProperty('team');

      // 2. Create diverse team member profiles
      const teamMembers = [
        {
          id: 'frontend-dev',
          name: 'Frontend Developer',
          email: 'frontend@dev.com',
          bio: 'Specialized in React and modern frontend development',
          title: 'Frontend Developer',
          skills: [
            { name: 'React', level: 'expert', expertise: true, years: 4 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 5 },
            { name: 'TypeScript', level: 'advanced', expertise: true, years: 2 },
            { name: 'CSS', level: 'expert', expertise: true, years: 6 }
          ]
        },
        {
          id: 'backend-dev',
          name: 'Backend Developer',
          email: 'backend@dev.com',
          bio: 'Expert in server-side development and database design',
          title: 'Backend Developer',
          skills: [
            { name: 'Node.js', level: 'expert', expertise: true, years: 5 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 6 },
            { name: 'PostgreSQL', level: 'expert', expertise: true, years: 4 },
            { name: 'AWS', level: 'advanced', expertise: false, years: 2 }
          ]
        },
        {
          id: 'fullstack-dev',
          name: 'Full-Stack Developer',
          email: 'fullstack@dev.com',
          bio: 'Versatile developer with experience across the full stack',
          title: 'Full-Stack Developer',
          skills: [
            { name: 'React', level: 'advanced', expertise: true, years: 3 },
            { name: 'Node.js', level: 'advanced', expertise: true, years: 3 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 5 },
            { name: 'Docker', level: 'intermediate', expertise: false, years: 1 }
          ]
        },
        {
          id: 'ui-ux-designer',
          name: 'UI/UX Designer',
          email: 'designer@dev.com',
          bio: 'User experience and interface design specialist',
          title: 'UI/UX Designer',
          skills: [
            { name: 'UI Design', level: 'expert', expertise: true, years: 4 },
            { name: 'UX Research', level: 'expert', expertise: true, years: 5 },
            { name: 'Figma', level: 'expert', expertise: true, years: 3 },
            { name: 'HTML/CSS', level: 'advanced', expertise: false, years: 2 }
          ]
        },
        {
          id: 'devops-engineer',
          name: 'DevOps Engineer',
          email: 'devops@dev.com',
          bio: 'Infrastructure and deployment automation specialist',
          title: 'DevOps Engineer',
          skills: [
            { name: 'AWS', level: 'expert', expertise: true, years: 4 },
            { name: 'Docker', level: 'expert', expertise: true, years: 3 },
            { name: 'Kubernetes', level: 'advanced', expertise: true, years: 2 },
            { name: 'CI/CD', level: 'expert', expertise: true, years: 4 }
          ]
        }
      ];

      for (const member of teamMembers) {
        // Create user
        await userConcept.register({
          user: testId + '-' + member.id,
          email: `${testId}-${member.email}`,
          name: member.name
        });

        // Create profile
        await profileConcept.create({
          profile: testId + '-' + member.id + '-profile',
          userEntity: testId + '-' + member.id,
          profileType: 'developer',
          bio: member.bio,
          title: member.title,
          timezone: 'UTC'
        });

        // Add skills
        for (const skill of member.skills) {
          await profileConcept.addSkill({
            profile: testId + '-' + member.id + '-profile',
            skillName: skill.name,
            skillLevel: skill.level,
            isExpertise: skill.expertise,
            yearsExperience: skill.years
          });
        }

        // Add to team
        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + member.id
          });
        }
      }

      // 3. Assign team leader (frontend developer)
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-frontend-dev'
        });

        // Verify team formation
        const teamDetails = await teamConcept._getByTeam({
          team: team.team.team
        });
        expect(teamDetails[0].leaderId).toBe(testId + '-frontend-dev');

        const memberCount = await teamConcept._getMemberCount({
          team: team.team.team
        });
        expect(memberCount[0]).toBe(5);
      }
    });

    test('should form specialized skill-based teams', async () => {
      // Create team focused on specific technology stack
      const team = await teamConcept.create({
        team: testId + '-react-team',
        name: 'React Specialists Team',
        description: 'Team specialized in React and modern frontend technologies',
        maxMembers: 4,
        requiredSkills: ['React', 'JavaScript', 'TypeScript'],
        preferredSkills: ['Next.js', 'GraphQL', 'Jest', 'Storybook']
      });
      expect(team).toHaveProperty('team');

      // Create React specialists
      const reactSpecialists = [
        {
          id: 'react-senior',
          name: 'Senior React Developer',
          skills: [
            { name: 'React', level: 'expert', expertise: true, years: 5 },
            { name: 'Next.js', level: 'expert', expertise: true, years: 3 },
            { name: 'TypeScript', level: 'expert', expertise: true, years: 4 },
            { name: 'GraphQL', level: 'advanced', expertise: true, years: 2 }
          ]
        },
        {
          id: 'react-mid',
          name: 'Mid-level React Developer',
          skills: [
            { name: 'React', level: 'advanced', expertise: true, years: 3 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 4 },
            { name: 'TypeScript', level: 'intermediate', expertise: false, years: 1 },
            { name: 'Jest', level: 'advanced', expertise: false, years: 2 }
          ]
        },
        {
          id: 'react-junior',
          name: 'Junior React Developer',
          skills: [
            { name: 'React', level: 'intermediate', expertise: false, years: 1 },
            { name: 'JavaScript', level: 'advanced', expertise: false, years: 2 },
            { name: 'HTML/CSS', level: 'advanced', expertise: false, years: 2 }
          ]
        }
      ];

      for (const specialist of reactSpecialists) {
        // Create user and profile
        await userConcept.register({
          user: testId + '-' + specialist.id,
          email: `${specialist.id}@${testId}.com`,
          name: specialist.name
        });

        await profileConcept.create({
          profile: testId + '-' + specialist.id + '-profile',
          userEntity: testId + '-' + specialist.id,
          profileType: 'developer',
          bio: `${specialist.name} with React expertise`,
          timezone: 'UTC'
        });

        // Add skills
        for (const skill of specialist.skills) {
          await profileConcept.addSkill({
            profile: testId + '-' + specialist.id + '-profile',
            skillName: skill.name,
            skillLevel: skill.level,
            isExpertise: skill.expertise,
            yearsExperience: skill.years
          });
        }

        // Add to team
        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + specialist.id
          });
        }
      }

      // Assign senior as leader
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-react-senior'
        });

        // Verify specialized team formation
        const teamMembers = await teamConcept._getMemberCount({
          team: team.team.team
        });
        expect(teamMembers[0]).toBe(3);

        // Find team members with React expertise
        const reactExperts = await profileConcept._getExpertiseBySkill({
          skillName: 'React'
        });
        const teamReactExperts = reactExperts.filter(expert => 
          expert.userEntity.includes(testId)
        );
        expect(teamReactExperts.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Team Role Management', () => {
    beforeEach(async () => {
      // Create team roles
      const teamRoles = [
        {
          name: 'team_leader',
          displayName: 'Team Leader',
          description: 'Team leadership and coordination',
          scope: 'team',
          permissions: {
            team: { manage: true, assign_tasks: true, manage_members: true },
            assignments: { create: true, review: true, approve: true },
            meetings: { schedule: true, lead: true },
            reports: { create: true, review: true }
          }
        },
        {
          name: 'senior_developer',
          displayName: 'Senior Developer',
          description: 'Senior development role with mentoring responsibilities',
          scope: 'team',
          permissions: {
            team: { contribute: true, mentor: true },
            assignments: { complete: true, review_junior: true },
            code: { review: true, merge: true },
            architecture: { design: true, review: true }
          }
        },
        {
          name: 'developer',
          displayName: 'Developer',
          description: 'Standard development team member',
          scope: 'team',
          permissions: {
            team: { contribute: true, collaborate: true },
            assignments: { complete: true, submit: true },
            code: { write: true, review_peer: true },
            meetings: { attend: true, participate: true }
          }
        },
        {
          name: 'junior_developer',
          displayName: 'Junior Developer',
          description: 'Entry-level developer with learning focus',
          scope: 'team',
          permissions: {
            team: { contribute: true, learn: true },
            assignments: { complete: true, seek_help: true },
            code: { write: true, request_review: true },
            mentoring: { receive: true, ask_questions: true }
          }
        }
      ];

      for (const role of teamRoles) {
        await roleConcept.create({
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          scope: role.scope,
          permissions: role.permissions
        });
      }
    });

    test('should assign hierarchical roles within team', async () => {
      // Create team for role testing
      const team = await teamConcept.create({
        team: testId + '-role-team',
        name: 'Role Management Team',
        description: 'Team for testing role assignments and permissions',
        maxMembers: 6
      });
      expect(team).toHaveProperty('team');

      // Create team members with different experience levels
      const teamMembers = [
        { id: 'leader', name: 'Team Leader', role: 'team_leader' },
        { id: 'senior1', name: 'Senior Dev 1', role: 'senior_developer' },
        { id: 'senior2', name: 'Senior Dev 2', role: 'senior_developer' },
        { id: 'dev1', name: 'Developer 1', role: 'developer' },
        { id: 'dev2', name: 'Developer 2', role: 'developer' },
        { id: 'junior', name: 'Junior Developer', role: 'junior_developer' }
      ];

      for (const member of teamMembers) {
        // Create user
        await userConcept.register({
          user: testId + '-' + member.id,
          email: `${member.id}@${testId}.com`,
          name: member.name
        });

        // Add to team
        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + member.id
          });

          // Create membership with role
          await membershipConcept.invite({
            memberEntity: testId + '-' + member.id,
            targetEntity: team.team.team,
            roleEntity: member.role,
            invitedBy: 'system'
          });

          await membershipConcept.accept({
            memberEntity: testId + '-' + member.id,
            targetEntity: team.team.team
          });
        }
      }

      // Assign team leader
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-leader'
        });

        // Verify role hierarchy
        const teamMemberships = await membershipConcept._getActiveByTarget({
          targetEntity: team.team.team
        });
        expect(teamMemberships.length).toBe(6);

        const leaderMembership = teamMemberships.find(m => 
          m.memberEntity === testId + '-leader'
        );
        expect(leaderMembership?.roleEntity).toBe('team_leader');

        const seniorMemberships = teamMemberships.filter(m => 
          m.roleEntity === 'senior_developer'
        );
        expect(seniorMemberships.length).toBe(2);
      }
    });

    test('should handle role transitions and promotions', async () => {
      // Create team with initial roles
      const team = await teamConcept.create({
        team: testId + '-promotion-team',
        name: 'Promotion Test Team',
        description: 'Team for testing role transitions'
      });

      // Create junior developer
      await userConcept.register({
        user: testId + '-junior-to-promote',
        email: `junior@${testId}.com`,
        name: 'Junior Developer'
      });

      if ('team' in team) {
        await teamConcept.addMember({
          team: team.team.team,
          memberId: testId + '-junior-to-promote'
        });

        // Initial role assignment
        await membershipConcept.invite({
          memberEntity: testId + '-junior-to-promote',
          targetEntity: team.team.team,
          roleEntity: 'junior_developer',
          invitedBy: 'system'
        });

        await membershipConcept.accept({
          memberEntity: testId + '-junior-to-promote',
          targetEntity: team.team.team
        });

        // Verify initial role
        const initialMembership = await membershipConcept._getByMemberAndTarget({
          memberEntity: testId + '-junior-to-promote',
          targetEntity: team.team.team
        });
        expect(initialMembership[0].roleEntity).toBe('junior_developer');

        // Promote to developer
        const promotion = await membershipConcept.updateRole({
          memberEntity: testId + '-junior-to-promote',
          targetEntity: team.team.team,
          roleEntity: 'developer'
        });
        expect(promotion).toHaveProperty('membership');

        // Verify promotion
        const updatedMembership = await membershipConcept._getByMemberAndTarget({
          memberEntity: testId + '-junior-to-promote',
          targetEntity: team.team.team
        });
        expect(updatedMembership[0].roleEntity).toBe('developer');
      }
    });
  });

  describe('Team-Project Assignment Workflows', () => {
    beforeEach(async () => {
      // Create project for team assignment
      await projectConcept.create({
        project: testId + '-team-project',
        title: 'Team Collaboration Project',
        description: 'Project requiring team-based development approach',
        scope: 'Build collaborative web application with multiple team members',
        learningObjectives: [
          'Practice team collaboration',
          'Learn agile development',
          'Master version control workflows',
          'Implement code review processes'
        ],
        industry: 'Software Development',
        domain: 'Web Development',
        difficulty: 'intermediate',
        estimatedHours: 120,
        requiredSkills: ['JavaScript', 'React', 'Git', 'Agile'],
        deliverables: [
          'Collaborative web application',
          'Team documentation',
          'Sprint reports',
          'Code review records'
        ]
      });
    });

    test('should assign team to project and create work breakdown', async () => {
      // Create team for project assignment
      const team = await teamConcept.create({
        team: testId + '-project-team',
        name: 'Project Assignment Team',
        description: 'Team assigned to collaborative project',
        maxMembers: 4,
        requiredSkills: ['JavaScript', 'React', 'Git']
      });
      expect(team).toHaveProperty('team');

      // Create team members
      const members = ['leader', 'dev1', 'dev2', 'dev3'];
      for (const member of members) {
        await userConcept.register({
          user: testId + '-' + member,
          email: `${member}@${testId}.com`,
          name: `Team Member ${member}`
        });

        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + member
          });
        }
      }

      // Assign leader
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-leader'
        });

        // Assign team to project
        await teamConcept.assignProject({
          team: team.team.team,
          projectId: testId + '-team-project'
        });

        // Verify project assignment
        const teamDetails = await teamConcept._getByTeam({
          team: team.team.team
        });
        expect(teamDetails[0].projectId).toBe(testId + '-team-project');

        // Create work breakdown assignments
        const workBreakdown = [
          {
            assignment: testId + '-frontend-work',
            task: 'Develop frontend components',
            description: 'Create user interface components and pages',
            assignee: testId + '-dev1',
            estimatedHours: 30,
            skills: ['React', 'CSS', 'JavaScript']
          },
          {
            assignment: testId + '-backend-work',
            task: 'Implement backend APIs',
            description: 'Create RESTful API endpoints and database integration',
            assignee: testId + '-dev2',
            estimatedHours: 25,
            skills: ['Node.js', 'Express', 'Database']
          },
          {
            assignment: testId + '-integration-work',
            task: 'Frontend-backend integration',
            description: 'Connect frontend components to backend APIs',
            assignee: testId + '-dev3',
            estimatedHours: 20,
            skills: ['JavaScript', 'API Integration', 'Testing']
          },
          {
            assignment: testId + '-project-management',
            task: 'Project coordination and review',
            description: 'Coordinate team activities and conduct code reviews',
            assignee: testId + '-leader',
            estimatedHours: 15,
            skills: ['Project Management', 'Code Review', 'Leadership']
          }
        ];

        for (const work of workBreakdown) {
          const assignment = await assignmentConcept.assign({
            ...work,
            assigner: testId + '-leader',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
          });
          expect(assignment).toHaveProperty('assignment');
        }

        // Verify work distribution
        const teamAssignments = await assignmentConcept._getByAssigner({
          assigner: testId + '-leader'
        });
        expect(teamAssignments.length).toBe(4);
      }
    });

    test('should handle team capacity and workload balancing', async () => {
      // Create team with capacity constraints
      const team = await teamConcept.create({
        team: testId + '-capacity-team',
        name: 'Capacity Management Team',
        description: 'Team for testing workload balancing',
        maxMembers: 3
      });

      // Create members with different availability
      const members = [
        { id: 'fulltime', name: 'Full-time Developer', availability: 40 },
        { id: 'parttime', name: 'Part-time Developer', availability: 20 },
        { id: 'consultant', name: 'Consultant Developer', availability: 15 }
      ];

      for (const member of members) {
        await userConcept.register({
          user: testId + '-' + member.id,
          email: `${member.id}@${testId}.com`,
          name: member.name
        });

        // Create profile with availability info
        await profileConcept.create({
          profile: testId + '-' + member.id + '-profile',
          userEntity: testId + '-' + member.id,
          profileType: 'developer',
          bio: `${member.name} with ${member.availability} hours/week availability`,
          timezone: 'UTC'
        });

        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + member.id
          });
        }
      }

      // Assign workload based on availability
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-fulltime'
        });

        await teamConcept.assignProject({
          team: team.team.team,
          projectId: testId + '-team-project'
        });

        // Create balanced assignments
        const balancedAssignments = [
          {
            assignment: testId + '-major-feature',
            task: 'Implement major feature',
            assignee: testId + '-fulltime',
            estimatedHours: 35 // Close to full capacity
          },
          {
            assignment: testId + '-medium-feature',
            task: 'Implement medium feature',
            assignee: testId + '-parttime',
            estimatedHours: 18 // Within part-time capacity
          },
          {
            assignment: testId + '-small-feature',
            task: 'Implement small feature',
            assignee: testId + '-consultant',
            estimatedHours: 12 // Within consultant capacity
          }
        ];

        for (const assignment of balancedAssignments) {
          const result = await assignmentConcept.assign({
            ...assignment,
            assigner: testId + '-fulltime',
            description: `${assignment.task} assigned based on team member availability`,
            skills: ['JavaScript', 'React']
          });
          expect(result).toHaveProperty('assignment');
        }

        // Verify capacity utilization
        const teamCapacity = await teamConcept._hasCapacity({
          team: team.team.team
        });
        expect(teamCapacity[0]).toBe(false); // Team should be at capacity
      }
    });
  });

  describe('Team Communication and Collaboration', () => {
    test('should facilitate team communication workflows', async () => {
      // Create communication-focused team
      const team = await teamConcept.create({
        team: testId + '-communication-team',
        name: 'Communication Team',
        description: 'Team focused on communication and collaboration workflows'
      });

      // Create team members with communication roles
      const communicationRoles = [
        { id: 'scrum-master', name: 'Scrum Master', role: 'team_leader' },
        { id: 'tech-lead', name: 'Technical Lead', role: 'senior_developer' },
        { id: 'developer1', name: 'Developer 1', role: 'developer' },
        { id: 'developer2', name: 'Developer 2', role: 'developer' }
      ];

      for (const member of communicationRoles) {
        await userConcept.register({
          user: testId + '-' + member.id,
          email: `${member.id}@communication-${testId}.com`,
          name: member.name
        });

        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-' + member.id
          });

          // Create membership with communication role
          await membershipConcept.invite({
            memberEntity: testId + '-' + member.id,
            targetEntity: team.team.team,
            roleEntity: member.role,
            invitedBy: 'system',
            message: `Join as ${member.name} for team communication`
          });

          await membershipConcept.accept({
            memberEntity: testId + '-' + member.id,
            targetEntity: team.team.team
          });
        }
      }

      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: testId + '-scrum-master'
        });

        // Verify communication structure
        const teamMemberships = await membershipConcept._getActiveByTarget({
          targetEntity: team.team.team
        });
        expect(teamMemberships.length).toBe(4);

        const scrumMaster = teamMemberships.find(m => 
          m.memberEntity === testId + '-scrum-master'
        );
        expect(scrumMaster?.roleEntity).toBe('team_leader');
      }
    });

    test('should handle cross-team collaboration', async () => {
      // Create multiple teams for collaboration testing
      const frontendTeam = await teamConcept.create({
        team: testId + '-frontend-collab-team',
        name: 'Frontend Collaboration Team',
        description: 'Frontend-focused team for cross-team collaboration',
        requiredSkills: ['React', 'JavaScript', 'CSS']
      });

      const backendTeam = await teamConcept.create({
        team: testId + '-backend-collab-team',
        name: 'Backend Collaboration Team',
        description: 'Backend-focused team for cross-team collaboration',
        requiredSkills: ['Node.js', 'Database', 'API Design']
      });

      expect(frontendTeam).toHaveProperty('team');
      expect(backendTeam).toHaveProperty('team');

      // Create members for each team
      const frontendMembers = ['frontend-lead', 'frontend-dev1', 'frontend-dev2'];
      const backendMembers = ['backend-lead', 'backend-dev1', 'backend-dev2'];

      for (const member of frontendMembers) {
        await userConcept.register({
          user: testId + '-' + member,
          email: `${member}@frontend-${testId}.com`,
          name: `Frontend ${member}`
        });

        if ('team' in frontendTeam) {
          await teamConcept.addMember({
            team: frontendTeam.team.team,
            memberId: testId + '-' + member
          });
        }
      }

      for (const member of backendMembers) {
        await userConcept.register({
          user: testId + '-' + member,
          email: `${member}@backend-${testId}.com`,
          name: `Backend ${member}`
        });

        if ('team' in backendTeam) {
          await teamConcept.addMember({
            team: backendTeam.team.team,
            memberId: testId + '-' + member
          });
        }
      }

      // Assign leaders
      if ('team' in frontendTeam) {
        await teamConcept.assignLeader({
          team: frontendTeam.team.team,
          leaderId: testId + '-frontend-lead'
        });
      }

      if ('team' in backendTeam) {
        await teamConcept.assignLeader({
          team: backendTeam.team.team,
          leaderId: testId + '-backend-lead'
        });
      }

      // Create collaborative assignments requiring both teams
      const collaborativeAssignments = [
        {
          assignment: testId + '-api-contract',
          task: 'Define API contract',
          assignee: testId + '-frontend-lead',
          assigner: 'system',
          description: 'Work with backend team to define API specifications',
          skills: ['API Design', 'Communication', 'Documentation']
        },
        {
          assignment: testId + '-api-implementation',
          task: 'Implement API endpoints',
          assignee: testId + '-backend-lead',
          assigner: 'system',
          description: 'Implement APIs based on frontend requirements',
          skills: ['Node.js', 'API Development', 'Testing']
        }
      ];

      for (const assignment of collaborativeAssignments) {
        const result = await assignmentConcept.assign(assignment);
        expect(result).toHaveProperty('assignment');
      }

      // Verify cross-team assignments
      const frontendAssignments = await assignmentConcept._getByAssignee({
        assignee: testId + '-frontend-lead'
      });
      const backendAssignments = await assignmentConcept._getByAssignee({
        assignee: testId + '-backend-lead'
      });

      expect(frontendAssignments.length).toBeGreaterThanOrEqual(1);
      expect(backendAssignments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Team Performance and Analytics', () => {
    beforeEach(async () => {
      // Create team for performance testing
      await teamConcept.create({
        team: testId + '-performance-team',
        name: 'Performance Analytics Team',
        description: 'Team for testing performance metrics and analytics'
      });

      // Create members with varying performance profiles
      const performanceMembers = [
        { id: 'high-performer', name: 'High Performer' },
        { id: 'consistent-performer', name: 'Consistent Performer' },
        { id: 'learning-performer', name: 'Learning Performer' }
      ];

      for (const member of performanceMembers) {
        await userConcept.register({
          user: testId + '-' + member.id,
          email: `${member.id}@performance-${testId}.com`,
          name: member.name
        });

        await profileConcept.create({
          profile: testId + '-' + member.id + '-profile',
          userEntity: testId + '-' + member.id,
          profileType: 'developer',
          bio: `${member.name} with different performance characteristics`,
          timezone: 'UTC'
        });

        await teamConcept.addMember({
          team: testId + '-performance-team',
          memberId: testId + '-' + member.id
        });
      }
    });

    test('should track team productivity metrics', async () => {
      // Create assignments to track productivity
      const productivityAssignments = [
        {
          assignment: testId + '-productive-task-1',
          task: 'High productivity task',
          assignee: testId + '-high-performer',
          assigner: 'system',
          estimatedHours: 10,
          skills: ['JavaScript', 'React']
        },
        {
          assignment: testId + '-productive-task-2',
          task: 'Consistent productivity task',
          assignee: testId + '-consistent-performer',
          assigner: 'system',
          estimatedHours: 12,
          skills: ['JavaScript', 'CSS']
        },
        {
          assignment: testId + '-learning-task',
          task: 'Learning-focused task',
          assignee: testId + '-learning-performer',
          assigner: 'system',
          estimatedHours: 15,
          skills: ['JavaScript', 'Learning']
        }
      ];

      for (const assignment of productivityAssignments) {
        const result = await assignmentConcept.assign(assignment);
        expect(result).toHaveProperty('assignment');
      }

      // Verify assignments for productivity tracking
      const teamAssignments = await assignmentConcept._getByStatus({ status: 'pending' });
      const teamSpecificAssignments = teamAssignments.filter(a => 
        a.assignee.includes(testId)
      );
      expect(teamSpecificAssignments.length).toBe(3);

      // Calculate team metrics
      const totalEstimatedHours = teamSpecificAssignments.reduce(
        (sum, assignment) => sum + (assignment.estimatedHours || 0), 0
      );
      expect(totalEstimatedHours).toBe(37);

      const averageTaskSize = totalEstimatedHours / teamSpecificAssignments.length;
      expect(averageTaskSize).toBeCloseTo(12.33, 1);
    });

    test('should analyze team skill distribution', async () => {
      // Add skills to team member profiles
      const skillDistribution = [
        {
          memberId: 'high-performer',
          skills: [
            { name: 'React', level: 'expert', expertise: true, years: 4 },
            { name: 'JavaScript', level: 'expert', expertise: true, years: 5 },
            { name: 'Node.js', level: 'advanced', expertise: true, years: 3 }
          ]
        },
        {
          memberId: 'consistent-performer',
          skills: [
            { name: 'JavaScript', level: 'advanced', expertise: true, years: 3 },
            { name: 'CSS', level: 'expert', expertise: true, years: 4 },
            { name: 'HTML', level: 'expert', expertise: true, years: 5 }
          ]
        },
        {
          memberId: 'learning-performer',
          skills: [
            { name: 'JavaScript', level: 'intermediate', expertise: false, years: 1 },
            { name: 'React', level: 'beginner', expertise: false, years: 0 },
            { name: 'Learning', level: 'advanced', expertise: false, years: 2 }
          ]
        }
      ];

      for (const member of skillDistribution) {
        for (const skill of member.skills) {
          await profileConcept.addSkill({
            profile: testId + '-' + member.memberId + '-profile',
            skillName: skill.name,
            skillLevel: skill.level,
            isExpertise: skill.expertise,
            yearsExperience: skill.years
          });
        }
      }

      // Analyze team skill coverage
      const javascriptSkills = await profileConcept._getBySkill({
        skillName: 'JavaScript'
      });
      const teamJavaScriptSkills = javascriptSkills.filter(skill => 
        skill.userEntity.includes(testId)
      );
      expect(teamJavaScriptSkills.length).toBe(3); // All team members have JavaScript

      const reactSkills = await profileConcept._getBySkill({
        skillName: 'React'
      });
      const teamReactSkills = reactSkills.filter(skill => 
        skill.userEntity.includes(testId)
      );
      expect(teamReactSkills.length).toBe(2); // Two team members have React

      // Calculate skill coverage gaps
      const requiredSkills = ['React', 'JavaScript', 'CSS', 'Node.js'];
      const skillCoverage = {};
      
      for (const skillName of requiredSkills) {
        const skillProfiles = await profileConcept._getBySkill({ skillName });
        const teamSkillProfiles = skillProfiles.filter(skill => 
          skill.userEntity.includes(testId)
        );
        skillCoverage[skillName] = teamSkillProfiles.length;
      }

      expect(skillCoverage['JavaScript']).toBe(3);
      expect(skillCoverage['React']).toBe(2);
      expect(skillCoverage['CSS']).toBe(1);
      expect(skillCoverage['Node.js']).toBe(1);
    });

    test('should measure team collaboration effectiveness', async () => {
      // Create collaborative assignments
      const collaborativeWork = [
        {
          assignment: testId + '-pair-programming',
          task: 'Pair programming session',
          assignee: testId + '-high-performer',
          assigner: 'system',
          description: 'Work together with learning performer on complex feature',
          skills: ['Mentoring', 'JavaScript', 'Collaboration']
        },
        {
          assignment: testId + '-code-review',
          task: 'Code review and feedback',
          assignee: testId + '-consistent-performer',
          assigner: 'system',
          description: 'Review code and provide constructive feedback',
          skills: ['Code Review', 'Communication', 'JavaScript']
        }
      ];

      for (const work of collaborativeWork) {
        const result = await assignmentConcept.assign(work);
        expect(result).toHaveProperty('assignment');
      }

      // Verify collaborative assignments
      const collaborationAssignments = await assignmentConcept._searchByKeywords({
        keywords: ['collaboration', 'mentoring', 'review']
      });
      const teamCollaborationAssignments = collaborationAssignments.filter(a => 
        a.assignee.includes(testId)
      );
      expect(teamCollaborationAssignments.length).toBeGreaterThanOrEqual(2);

      // Calculate collaboration metrics
      const totalAssignments = await assignmentConcept._getByStatus({ status: 'pending' });
      const teamTotalAssignments = totalAssignments.filter(a => 
        a.assignee.includes(testId)
      );
      
      const collaborationRatio = teamCollaborationAssignments.length / teamTotalAssignments.length;
      expect(collaborationRatio).toBeGreaterThan(0.3); // At least 30% collaborative work
    });
  });

  describe('Team Lifecycle Management', () => {
    test('should handle complete team lifecycle from formation to completion', async () => {
      const lifecycleId = testId + '-lifecycle';

      // 1. Team Formation
      const team = await teamConcept.create({
        team: lifecycleId + '-team',
        name: 'Complete Lifecycle Team',
        description: 'Team testing complete lifecycle from formation to disbanding',
        maxMembers: 4,
        requiredSkills: ['JavaScript', 'Teamwork'],
        preferredSkills: ['React', 'Leadership']
      });
      expect(team).toHaveProperty('team');

      // 2. Member Recruitment
      const lifecycleMembers = ['team-lead', 'senior-dev', 'junior-dev1', 'junior-dev2'];
      for (const member of lifecycleMembers) {
        await userConcept.register({
          user: lifecycleId + '-' + member,
          email: `${member}@lifecycle-${testId}.com`,
          name: `Lifecycle ${member}`
        });

        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: lifecycleId + '-' + member
          });
        }
      }

      // 3. Leadership Assignment
      if ('team' in team) {
        await teamConcept.assignLeader({
          team: team.team.team,
          leaderId: lifecycleId + '-team-lead'
        });

        // 4. Project Assignment
        const lifecycleProject = await projectConcept.create({
          project: lifecycleId + '-project',
          title: 'Lifecycle Team Project',
          description: 'Project for testing complete team lifecycle',
          scope: 'Build and deploy a complete application',
          learningObjectives: ['Complete project lifecycle', 'Team collaboration'],
          industry: 'Software',
          domain: 'Web Development',
          difficulty: 'intermediate',
          estimatedHours: 80,
          requiredSkills: ['JavaScript', 'React'],
          deliverables: ['Web application', 'Documentation']
        });

        if ('project' in lifecycleProject) {
          await teamConcept.assignProject({
            team: team.team.team,
            projectId: lifecycleProject.project.project
          });
        }

        // 5. Work Distribution
        const workItems = [
          {
            assignment: lifecycleId + '-planning',
            task: 'Project planning and architecture',
            assignee: lifecycleId + '-team-lead',
            estimatedHours: 16
          },
          {
            assignment: lifecycleId + '-frontend',
            task: 'Frontend development',
            assignee: lifecycleId + '-senior-dev',
            estimatedHours: 24
          },
          {
            assignment: lifecycleId + '-backend',
            task: 'Backend development',
            assignee: lifecycleId + '-junior-dev1',
            estimatedHours: 20
          },
          {
            assignment: lifecycleId + '-testing',
            task: 'Testing and quality assurance',
            assignee: lifecycleId + '-junior-dev2',
            estimatedHours: 20
          }
        ];

        for (const work of workItems) {
          const assignment = await assignmentConcept.assign({
            ...work,
            assigner: lifecycleId + '-team-lead',
            description: `${work.task} for lifecycle project`,
            skills: ['JavaScript', 'Teamwork']
          });
          expect(assignment).toHaveProperty('assignment');
        }

        // 6. Team Performance Tracking
        const teamAssignments = await assignmentConcept._getByAssigner({
          assigner: lifecycleId + '-team-lead'
        });
        expect(teamAssignments.length).toBe(4);

        const totalTeamHours = teamAssignments.reduce(
          (sum, assignment) => sum + (assignment.estimatedHours || 0), 0
        );
        expect(totalTeamHours).toBe(80);

        // 7. Team Status Management
        await teamConcept.updateStatus({
          team: team.team.team,
          status: 'active'
        });

        // Simulate project completion
        await teamConcept.updateStatus({
          team: team.team.team,
          status: 'completed'
        });

        // 8. Verify Final State
        const finalTeamState = await teamConcept._getByTeam({
          team: team.team.team
        });
        expect(finalTeamState[0].status).toBe('completed');
        expect(finalTeamState[0].projectId).toBe(lifecycleProject.project.project);

        const finalMemberCount = await teamConcept._getMemberCount({
          team: team.team.team
        });
        expect(finalMemberCount[0]).toBe(4);
      }
    });

    test('should handle team disbanding and member reallocation', async () => {
      // Create team for disbanding test
      const team = await teamConcept.create({
        team: testId + '-disband-team',
        name: 'Team to Disband',
        description: 'Team for testing disbanding workflows'
      });

      // Add members
      const disbandMembers = ['member1', 'member2', 'member3'];
      for (const member of disbandMembers) {
        await userConcept.register({
          user: testId + '-disband-' + member,
          email: `disband-${member}@${testId}.com`,
          name: `Disband ${member}`
        });

        if ('team' in team) {
          await teamConcept.addMember({
            team: team.team.team,
            memberId: testId + '-disband-' + member
          });
        }
      }

      if ('team' in team) {
        // Mark team as disbanded
        await teamConcept.updateStatus({
          team: team.team.team,
          status: 'disbanded'
        });

        // Verify disbanding
        const disbandedTeam = await teamConcept._getByTeam({
          team: team.team.team
        });
        expect(disbandedTeam[0].status).toBe('disbanded');

        // Members should still exist for reallocation
        const memberCount = await teamConcept._getMemberCount({
          team: team.team.team
        });
        expect(memberCount[0]).toBe(3);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle team formation errors', async () => {
      // Invalid team configuration
      const invalidTeam = await teamConcept.create({
        team: testId + '-invalid',
        name: '', // Empty name
        description: 'Invalid team configuration',
        maxMembers: 0, // Invalid capacity
        requiredSkills: [],
        preferredSkills: []
      });

      // The result depends on Team concept validation
      // This test documents expected error handling
    });

    test('should handle member assignment conflicts', async () => {
      // Create two teams
      const team1 = await teamConcept.create({
        team: testId + '-conflict-team-1',
        name: 'Conflict Team 1',
        description: 'First team for conflict testing'
      });

      const team2 = await teamConcept.create({
        team: testId + '-conflict-team-2',
        name: 'Conflict Team 2',
        description: 'Second team for conflict testing'
      });

      // Create member
      await userConcept.register({
        user: testId + '-conflict-member',
        email: `conflict@${testId}.com`,
        name: 'Conflict Member'
      });

      // Add to both teams (potential conflict)
      if ('team' in team1) {
        await teamConcept.addMember({
          team: team1.team.team,
          memberId: testId + '-conflict-member'
        });
      }

      if ('team' in team2) {
        const conflictResult = await teamConcept.addMember({
          team: team2.team.team,
          memberId: testId + '-conflict-member'
        });
        
        // This may or may not be allowed depending on business rules
        // The test documents the expected behavior
      }
    });

    test('should handle capacity and workload errors', async () => {
      // Create team with strict capacity
      const capacityTeam = await teamConcept.create({
        team: testId + '-capacity-error-team',
        name: 'Capacity Error Team',
        description: 'Team for testing capacity errors',
        maxMembers: 2
      });

      // Try to add more members than capacity
      const members = ['member1', 'member2', 'member3'];
      let addedMembers = 0;

      for (const member of members) {
        await userConcept.register({
          user: testId + '-capacity-' + member,
          email: `capacity-${member}@${testId}.com`,
          name: `Capacity ${member}`
        });

        if ('team' in capacityTeam) {
          const addResult = await teamConcept.addMember({
            team: capacityTeam.team.team,
            memberId: testId + '-capacity-' + member
          });

          if ('team' in addResult) {
            addedMembers++;
          }
        }
      }

      // Should not exceed capacity
      if ('team' in capacityTeam) {
        const finalCount = await teamConcept._getMemberCount({
          team: capacityTeam.team.team
        });
        expect(finalCount[0]).toBeLessThanOrEqual(2);
      }
    });
  });
});
