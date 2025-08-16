import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TeamConcept } from '@/lib/concepts/common/team';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const teamConcept = new TeamConcept();

describe('TeamConcept', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'team-test-' + Date.now();
    
    // Clean up test data
    await prisma.team.deleteMany({});
  });

  afterEach(async () => {
    await prisma.team.deleteMany({});
  });

  describe('create', () => {
    test('should create team successfully', async () => {
      const teamData = {
        team: testId + '-team',
        name: 'Frontend Development Team',
        description: 'Team focused on building modern React applications with TypeScript',
        maxMembers: 6,
        requiredSkills: ['React', 'TypeScript', 'CSS'],
        preferredSkills: ['Next.js', 'Tailwind CSS', 'GraphQL']
      };

      const result = await teamConcept.create(teamData);

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.team).toBe(testId + '-team');
        expect(result.team.name).toBe('Frontend Development Team');
        expect(result.team.description).toBe(teamData.description);
        expect(result.team.maxMembers).toBe(6);
        expect(result.team.requiredSkills).toEqual(teamData.requiredSkills);
        expect(result.team.preferredSkills).toEqual(teamData.preferredSkills);
        expect(result.team.memberIds).toEqual([]);
        expect(result.team.status).toBe('forming');
        expect(result.team.isActive).toBe(true);
      }
    });

    test('should create team with minimal required fields', async () => {
      const minimalTeamData = {
        team: testId + '-minimal',
        name: 'Minimal Team',
        description: 'Team with only required fields'
      };

      const result = await teamConcept.create(minimalTeamData);

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.name).toBe('Minimal Team');
        expect(result.team.maxMembers).toBeNull();
        expect(result.team.requiredSkills).toEqual([]);
        expect(result.team.preferredSkills).toEqual([]);
      }
    });

    test('should prevent duplicate team identifiers', async () => {
      const teamId = testId + '-duplicate';
      
      // Create first team
      await teamConcept.create({
        team: teamId,
        name: 'First Team',
        description: 'First team description'
      });

      // Try to create duplicate
      const duplicateResult = await teamConcept.create({
        team: teamId,
        name: 'Duplicate Team',
        description: 'Duplicate team description'
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('team');
      }
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await teamConcept.create({
        team: testId + '-update-test',
        name: 'Original Team Name',
        description: 'Original description',
        maxMembers: 4
      });
    });

    test('should update team details', async () => {
      const updateData = {
        team: testId + '-update-test',
        name: 'Updated Team Name',
        description: 'Updated description with comprehensive information about the team goals',
        maxMembers: 8,
        requiredSkills: ['JavaScript', 'Node.js', 'MongoDB'],
        preferredSkills: ['Express.js', 'React', 'Docker']
      };

      const result = await teamConcept.update(updateData);

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.name).toBe('Updated Team Name');
        expect(result.team.description).toBe(updateData.description);
        expect(result.team.maxMembers).toBe(8);
        expect(result.team.requiredSkills).toEqual(updateData.requiredSkills);
        expect(result.team.preferredSkills).toEqual(updateData.preferredSkills);
      }
    });

    test('should handle partial updates', async () => {
      const partialUpdate = {
        team: testId + '-update-test',
        name: 'Only Name Updated'
      };

      const result = await teamConcept.update(partialUpdate);

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.name).toBe('Only Name Updated');
        expect(result.team.description).toBe('Original description'); // Should remain unchanged
        expect(result.team.maxMembers).toBe(4); // Should remain unchanged
      }
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await teamConcept.create({
        team: testId + '-status-test',
        name: 'Status Test Team',
        description: 'Team for status testing'
      });
    });

    test('should update team status to active', async () => {
      const result = await teamConcept.updateStatus({
        team: testId + '-status-test',
        status: 'active'
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.status).toBe('active');
      }
    });

    test('should update team status to completed', async () => {
      // First set to active
      await teamConcept.updateStatus({
        team: testId + '-status-test',
        status: 'active'
      });

      // Then complete
      const result = await teamConcept.updateStatus({
        team: testId + '-status-test',
        status: 'completed'
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.status).toBe('completed');
      }
    });

    test('should update team status to disbanded', async () => {
      const result = await teamConcept.updateStatus({
        team: testId + '-status-test',
        status: 'disbanded'
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.status).toBe('disbanded');
      }
    });
  });

  describe('member management', () => {
    beforeEach(async () => {
      await teamConcept.create({
        team: testId + '-members-test',
        name: 'Member Management Test Team',
        description: 'Team for testing member management features',
        maxMembers: 4
      });
    });

    test('should add members to team', async () => {
      const memberId1 = testId + '-member-1';
      const memberId2 = testId + '-member-2';

      // Add first member
      const result1 = await teamConcept.addMember({
        team: testId + '-members-test',
        memberId: memberId1
      });

      expect(result1).toHaveProperty('team');
      if ('team' in result1) {
        expect(result1.team.memberIds).toContain(memberId1);
      }

      // Add second member
      const result2 = await teamConcept.addMember({
        team: testId + '-members-test',
        memberId: memberId2
      });

      expect(result2).toHaveProperty('team');
      if ('team' in result2) {
        expect(result2.team.memberIds).toContain(memberId1);
        expect(result2.team.memberIds).toContain(memberId2);
        expect(result2.team.memberIds).toHaveLength(2);
      }
    });

    test('should remove members from team', async () => {
      const memberId = testId + '-remove-member';

      // Add member first
      await teamConcept.addMember({
        team: testId + '-members-test',
        memberId
      });

      // Remove member
      const result = await teamConcept.removeMember({
        team: testId + '-members-test',
        memberId
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.memberIds).not.toContain(memberId);
      }
    });

    test('should prevent adding duplicate members', async () => {
      const memberId = testId + '-duplicate-member';

      // Add member first time
      await teamConcept.addMember({
        team: testId + '-members-test',
        memberId
      });

      // Try to add same member again
      const duplicateResult = await teamConcept.addMember({
        team: testId + '-members-test',
        memberId
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('already') || 
        expect(duplicateResult.error).toContain('member');
      }
    });

    test('should enforce team capacity limits', async () => {
      const memberIds = [
        testId + '-member-1',
        testId + '-member-2',
        testId + '-member-3',
        testId + '-member-4',
        testId + '-member-5' // This should exceed the limit of 4
      ];

      // Add members up to limit
      for (let i = 0; i < 4; i++) {
        const result = await teamConcept.addMember({
          team: testId + '-members-test',
          memberId: memberIds[i]
        });
        expect(result).toHaveProperty('team');
      }

      // Try to add member beyond limit
      const overLimitResult = await teamConcept.addMember({
        team: testId + '-members-test',
        memberId: memberIds[4]
      });

      expect(overLimitResult).toHaveProperty('error');
      if ('error' in overLimitResult) {
        expect(overLimitResult.error).toContain('capacity') || 
        expect(overLimitResult.error).toContain('full') ||
        expect(overLimitResult.error).toContain('limit');
      }
    });

    test('should assign team leader', async () => {
      const leaderId = testId + '-leader';
      const memberId = testId + '-member';

      // Add members first
      await teamConcept.addMember({
        team: testId + '-members-test',
        memberId: leaderId
      });

      await teamConcept.addMember({
        team: testId + '-members-test',
        memberId
      });

      // Assign leader
      const result = await teamConcept.assignLeader({
        team: testId + '-members-test',
        leaderId
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.leaderId).toBe(leaderId);
      }
    });

    test('should prevent assigning non-member as leader', async () => {
      const nonMemberId = testId + '-non-member';

      const result = await teamConcept.assignLeader({
        team: testId + '-members-test',
        leaderId: nonMemberId
      });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('member') || 
        expect(result.error).toContain('team');
      }
    });
  });

  describe('project assignment', () => {
    beforeEach(async () => {
      await teamConcept.create({
        team: testId + '-project-test',
        name: 'Project Assignment Test Team',
        description: 'Team for testing project assignments'
      });
    });

    test('should assign project to team', async () => {
      const projectId = testId + '-project';

      const result = await teamConcept.assignProject({
        team: testId + '-project-test',
        projectId
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.projectId).toBe(projectId);
      }
    });

    test('should unassign project from team', async () => {
      const projectId = testId + '-project';

      // Assign project first
      await teamConcept.assignProject({
        team: testId + '-project-test',
        projectId
      });

      // Unassign project
      const result = await teamConcept.unassignProject({
        team: testId + '-project-test'
      });

      expect(result).toHaveProperty('team');
      if ('team' in result) {
        expect(result.team.projectId).toBeNull();
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test teams
      const teams = [
        {
          team: testId + '-frontend-team',
          name: 'Frontend Development Team',
          description: 'React and TypeScript specialists',
          maxMembers: 5,
          requiredSkills: ['React', 'TypeScript'],
          status: 'active'
        },
        {
          team: testId + '-backend-team',
          name: 'Backend Development Team',
          description: 'Node.js and database experts',
          maxMembers: 4,
          requiredSkills: ['Node.js', 'PostgreSQL'],
          status: 'forming'
        },
        {
          team: testId + '-fullstack-team',
          name: 'Full-Stack Team',
          description: 'End-to-end application development',
          maxMembers: 6,
          requiredSkills: ['React', 'Node.js', 'PostgreSQL'],
          status: 'completed'
        }
      ];

      for (const teamData of teams) {
        await teamConcept.create(teamData);
        if (teamData.status !== 'forming') {
          await teamConcept.updateStatus({
            team: teamData.team,
            status: teamData.status
          });
        }
      }

      // Add members to some teams
      await teamConcept.addMember({
        team: testId + '-frontend-team',
        memberId: testId + '-member-1'
      });

      await teamConcept.addMember({
        team: testId + '-frontend-team',
        memberId: testId + '-member-2'
      });

      await teamConcept.addMember({
        team: testId + '-backend-team',
        memberId: testId + '-member-3'
      });

      // Assign leader to frontend team
      await teamConcept.assignLeader({
        team: testId + '-frontend-team',
        leaderId: testId + '-member-1'
      });

      // Assign project to frontend team
      await teamConcept.assignProject({
        team: testId + '-frontend-team',
        projectId: testId + '-frontend-project'
      });
    });

    test('should query team by identifier', async () => {
      const teams = await teamConcept._getByTeam({
        team: testId + '-frontend-team'
      });

      expect(teams).toHaveLength(1);
      expect(teams[0].name).toBe('Frontend Development Team');
    });

    test('should query teams by status', async () => {
      const activeTeams = await teamConcept._getByStatus({ status: 'active' });
      const formingTeams = await teamConcept._getByStatus({ status: 'forming' });
      const completedTeams = await teamConcept._getByStatus({ status: 'completed' });

      expect(activeTeams.length).toBeGreaterThanOrEqual(1);
      expect(formingTeams.length).toBeGreaterThanOrEqual(1);
      expect(completedTeams.length).toBeGreaterThanOrEqual(1);

      expect(activeTeams.every(t => t.status === 'active')).toBe(true);
      expect(formingTeams.every(t => t.status === 'forming')).toBe(true);
      expect(completedTeams.every(t => t.status === 'completed')).toBe(true);
    });

    test('should get active teams', async () => {
      const activeTeams = await teamConcept._getActive();

      expect(activeTeams.length).toBeGreaterThanOrEqual(1);
      expect(activeTeams.every(t => t.status === 'active')).toBe(true);
    });

    test('should search teams by keywords', async () => {
      const frontendSearch = await teamConcept._searchByKeywords({
        keywords: ['React', 'frontend']
      });

      expect(frontendSearch.length).toBeGreaterThanOrEqual(1);
      expect(frontendSearch.some(t => 
        t.name.includes('Frontend') || 
        t.description.includes('React') ||
        t.requiredSkills.includes('React')
      )).toBe(true);

      const backendSearch = await teamConcept._searchByKeywords({
        keywords: ['Node.js', 'backend']
      });

      expect(backendSearch.length).toBeGreaterThanOrEqual(1);
      expect(backendSearch.some(t => 
        t.name.includes('Backend') || 
        t.requiredSkills.includes('Node.js')
      )).toBe(true);
    });

    test('should get teams by skill requirements', async () => {
      const reactTeams = await teamConcept._getBySkillRequirement({
        skill: 'React'
      });

      expect(reactTeams.length).toBeGreaterThanOrEqual(2);
      expect(reactTeams.every(t => 
        t.requiredSkills.includes('React') || 
        t.preferredSkills.includes('React')
      )).toBe(true);

      const nodeTeams = await teamConcept._getBySkillRequirement({
        skill: 'Node.js'
      });

      expect(nodeTeams.length).toBeGreaterThanOrEqual(2);
      expect(nodeTeams.every(t => 
        t.requiredSkills.includes('Node.js') || 
        t.preferredSkills.includes('Node.js')
      )).toBe(true);
    });

    test('should get teams by member', async () => {
      const member1Teams = await teamConcept._getByMember({
        memberId: testId + '-member-1'
      });

      expect(member1Teams.length).toBeGreaterThanOrEqual(1);
      expect(member1Teams.every(t => t.memberIds.includes(testId + '-member-1'))).toBe(true);

      const member3Teams = await teamConcept._getByMember({
        memberId: testId + '-member-3'
      });

      expect(member3Teams.length).toBeGreaterThanOrEqual(1);
      expect(member3Teams.every(t => t.memberIds.includes(testId + '-member-3'))).toBe(true);
    });

    test('should get teams by leader', async () => {
      const leaderTeams = await teamConcept._getByLeader({
        leaderId: testId + '-member-1'
      });

      expect(leaderTeams.length).toBeGreaterThanOrEqual(1);
      expect(leaderTeams.every(t => t.leaderId === testId + '-member-1')).toBe(true);
    });

    test('should get teams by project', async () => {
      const projectTeams = await teamConcept._getByProject({
        projectId: testId + '-frontend-project'
      });

      expect(projectTeams.length).toBeGreaterThanOrEqual(1);
      expect(projectTeams.every(t => t.projectId === testId + '-frontend-project')).toBe(true);
    });

    test('should check team capacity', async () => {
      const hasCapacity = await teamConcept._hasCapacity({
        team: testId + '-frontend-team'
      });

      expect(hasCapacity).toHaveLength(1);
      expect(typeof hasCapacity[0]).toBe('boolean');
    });

    test('should get member count', async () => {
      const memberCount = await teamConcept._getMemberCount({
        team: testId + '-frontend-team'
      });

      expect(memberCount).toHaveLength(1);
      expect(memberCount[0]).toBe(2);
    });

    test('should get available teams (with capacity)', async () => {
      const availableTeams = await teamConcept._getAvailable();

      expect(availableTeams.length).toBeGreaterThanOrEqual(1);
      availableTeams.forEach(team => {
        expect(team.isActive).toBe(true);
        if (team.maxMembers !== null) {
          expect(team.memberIds.length).toBeLessThan(team.maxMembers);
        }
      });
    });
  });

  describe('team metrics and statistics', () => {
    beforeEach(async () => {
      // Create teams for metrics testing
      await teamConcept.create({
        team: testId + '-metrics-team-1',
        name: 'Metrics Test Team 1',
        description: 'Team for testing metrics',
        maxMembers: 5
      });

      await teamConcept.create({
        team: testId + '-metrics-team-2',
        name: 'Metrics Test Team 2',
        description: 'Another team for testing metrics',
        maxMembers: 3
      });

      // Add members to teams
      await teamConcept.addMember({
        team: testId + '-metrics-team-1',
        memberId: testId + '-metrics-member-1'
      });

      await teamConcept.addMember({
        team: testId + '-metrics-team-1',
        memberId: testId + '-metrics-member-2'
      });

      await teamConcept.addMember({
        team: testId + '-metrics-team-2',
        memberId: testId + '-metrics-member-3'
      });
    });

    test('should get team count by status', async () => {
      const statusCounts = await teamConcept._getCountByStatus();

      expect(statusCounts.length).toBeGreaterThanOrEqual(1);
      
      const formingCount = statusCounts.find(sc => sc.status === 'forming');
      expect(formingCount?.count).toBeGreaterThanOrEqual(2);
    });

    test('should get average team size', async () => {
      const avgSize = await teamConcept._getAverageTeamSize();

      expect(avgSize).toHaveLength(1);
      expect(typeof avgSize[0]).toBe('number');
      expect(avgSize[0]).toBeGreaterThan(0);
    });

    test('should get teams with capacity', async () => {
      const teamsWithCapacity = await teamConcept._getTeamsWithCapacity();

      expect(teamsWithCapacity.length).toBeGreaterThanOrEqual(2);
      teamsWithCapacity.forEach(team => {
        if (team.maxMembers !== null) {
          expect(team.memberIds.length).toBeLessThan(team.maxMembers);
        }
      });
    });
  });

  describe('team lifecycle', () => {
    test('should handle complete team lifecycle', async () => {
      const teamId = testId + '-lifecycle';

      // 1. Create team
      const createResult = await teamConcept.create({
        team: teamId,
        name: 'Complete Lifecycle Team',
        description: 'Testing complete team lifecycle',
        maxMembers: 4,
        requiredSkills: ['JavaScript']
      });
      expect(createResult).toHaveProperty('team');

      // 2. Update team details
      const updateResult = await teamConcept.update({
        team: teamId,
        description: 'Updated description with comprehensive team information',
        maxMembers: 6,
        requiredSkills: ['JavaScript', 'React'],
        preferredSkills: ['TypeScript', 'Node.js']
      });
      expect(updateResult).toHaveProperty('team');

      // 3. Add members
      const member1Result = await teamConcept.addMember({
        team: teamId,
        memberId: testId + '-lifecycle-member-1'
      });
      expect(member1Result).toHaveProperty('team');

      const member2Result = await teamConcept.addMember({
        team: teamId,
        memberId: testId + '-lifecycle-member-2'
      });
      expect(member2Result).toHaveProperty('team');

      const member3Result = await teamConcept.addMember({
        team: teamId,
        memberId: testId + '-lifecycle-member-3'
      });
      expect(member3Result).toHaveProperty('team');

      // 4. Assign leader
      const leaderResult = await teamConcept.assignLeader({
        team: teamId,
        leaderId: testId + '-lifecycle-member-1'
      });
      expect(leaderResult).toHaveProperty('team');

      // 5. Activate team
      const activateResult = await teamConcept.updateStatus({
        team: teamId,
        status: 'active'
      });
      expect(activateResult).toHaveProperty('team');

      // 6. Assign project
      const projectResult = await teamConcept.assignProject({
        team: teamId,
        projectId: testId + '-lifecycle-project'
      });
      expect(projectResult).toHaveProperty('team');

      // 7. Check final team state
      const finalTeams = await teamConcept._getByTeam({ team: teamId });

      expect(finalTeams).toHaveLength(1);
      const finalTeam = finalTeams[0];
      expect(finalTeam.status).toBe('active');
      expect(finalTeam.memberIds).toHaveLength(3);
      expect(finalTeam.leaderId).toBe(testId + '-lifecycle-member-1');
      expect(finalTeam.projectId).toBe(testId + '-lifecycle-project');
      expect(finalTeam.maxMembers).toBe(6);
      expect(finalTeam.requiredSkills).toContain('React');
      expect(finalTeam.preferredSkills).toContain('TypeScript');

      // 8. Complete team work
      const completeResult = await teamConcept.updateStatus({
        team: teamId,
        status: 'completed'
      });
      expect(completeResult).toHaveProperty('team');
      if ('team' in completeResult) {
        expect(completeResult.team.status).toBe('completed');
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle operations on non-existent team', async () => {
      const nonExistentId = 'non-existent-team';

      const updateResult = await teamConcept.update({
        team: nonExistentId,
        name: 'Should Fail'
      });
      expect(updateResult).toHaveProperty('error');

      const statusResult = await teamConcept.updateStatus({
        team: nonExistentId,
        status: 'active'
      });
      expect(statusResult).toHaveProperty('error');

      const memberResult = await teamConcept.addMember({
        team: nonExistentId,
        memberId: 'some-member'
      });
      expect(memberResult).toHaveProperty('error');

      const leaderResult = await teamConcept.assignLeader({
        team: nonExistentId,
        leaderId: 'some-leader'
      });
      expect(leaderResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidTeamData = {
        team: testId + '-invalid',
        name: '', // Empty name
        description: 'Valid description'
      };

      const result = await teamConcept.create(invalidTeamData);
      expect(result).toHaveProperty('error');
    });

    test('should validate member capacity constraints', async () => {
      await teamConcept.create({
        team: testId + '-capacity-test',
        name: 'Capacity Test Team',
        description: 'Testing capacity constraints',
        maxMembers: 0 // Invalid capacity
      });

      const result = await teamConcept.addMember({
        team: testId + '-capacity-test',
        memberId: 'some-member'
      });

      expect(result).toHaveProperty('error');
    });

    test('should handle removing non-existent member', async () => {
      await teamConcept.create({
        team: testId + '-remove-test',
        name: 'Remove Test Team',
        description: 'Testing member removal'
      });

      const result = await teamConcept.removeMember({
        team: testId + '-remove-test',
        memberId: 'non-existent-member'
      });

      expect(result).toHaveProperty('error');
    });

    test('should handle unassigning project when none assigned', async () => {
      await teamConcept.create({
        team: testId + '-unassign-test',
        name: 'Unassign Test Team',
        description: 'Testing project unassignment'
      });

      const result = await teamConcept.unassignProject({
        team: testId + '-unassign-test'
      });

      expect(result).toHaveProperty('error');
    });
  });
});
