import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AssignmentConcept } from '@/lib/concepts/wip/assignment';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const assignmentConcept = new AssignmentConcept();

describe('AssignmentConcept', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'assignment-test-' + Date.now();
    
    // Clean up test data
    await prisma.assignment.deleteMany({});
  });

  afterEach(async () => {
    await prisma.assignment.deleteMany({});
  });

  describe('assign', () => {
    test('should create assignment successfully', async () => {
      const assignmentData = {
        assignment: testId + '-assignment',
        task: 'Implement user authentication system',
        description: 'Build a secure authentication system with JWT tokens, password hashing, and role-based access control',
        assignee: testId + '-assignee-user',
        assigner: testId + '-assigner-user',
        dueDate: new Date('2024-06-15'),
        priority: 'high',
        estimatedHours: 40,
        skills: ['Node.js', 'Express.js', 'JWT', 'bcrypt', 'RBAC']
      };

      const result = await assignmentConcept.assign(assignmentData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.assignment).toBe(testId + '-assignment');
        expect(result.assignment.task).toBe('Implement user authentication system');
        expect(result.assignment.description).toBe(assignmentData.description);
        expect(result.assignment.assignee).toBe(testId + '-assignee-user');
        expect(result.assignment.assigner).toBe(testId + '-assigner-user');
        expect(result.assignment.dueDate).toEqual(assignmentData.dueDate);
        expect(result.assignment.priority).toBe('high');
        expect(result.assignment.estimatedHours).toBe(40);
        expect(result.assignment.skills).toEqual(assignmentData.skills);
        expect(result.assignment.status).toBe('assigned');
        expect(result.assignment.progress).toBe(0);
        expect(result.assignment.isActive).toBe(true);
      }
    });

    test('should create assignment with minimal required fields', async () => {
      const minimalAssignmentData = {
        assignment: testId + '-minimal',
        task: 'Simple task',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      };

      const result = await assignmentConcept.assign(minimalAssignmentData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.task).toBe('Simple task');
        expect(result.assignment.description).toBeNull();
        expect(result.assignment.dueDate).toBeNull();
        expect(result.assignment.priority).toBe('medium');
        expect(result.assignment.estimatedHours).toBeNull();
        expect(result.assignment.skills).toEqual([]);
      }
    });

    test('should prevent duplicate assignment identifiers', async () => {
      const assignmentId = testId + '-duplicate';
      
      // Create first assignment
      await assignmentConcept.assign({
        assignment: assignmentId,
        task: 'First task',
        assignee: testId + '-assignee-1',
        assigner: testId + '-assigner'
      });

      // Try to create duplicate
      const duplicateResult = await assignmentConcept.assign({
        assignment: assignmentId,
        task: 'Duplicate task',
        assignee: testId + '-assignee-2',
        assigner: testId + '-assigner'
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('assignment');
      }
    });
  });

  describe('accept', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-accept-test',
        task: 'Test task for acceptance',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });
    });

    test('should accept assignment successfully', async () => {
      const result = await assignmentConcept.accept({
        assignment: testId + '-accept-test'
      });

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.status).toBe('in_progress');
        expect(result.assignment.acceptedAt).toBeDefined();
      }
    });

    test('should not accept already accepted assignment', async () => {
      // Accept first time
      await assignmentConcept.accept({
        assignment: testId + '-accept-test'
      });

      // Try to accept again
      const secondAcceptResult = await assignmentConcept.accept({
        assignment: testId + '-accept-test'
      });

      expect(secondAcceptResult).toHaveProperty('error');
      if ('error' in secondAcceptResult) {
        expect(secondAcceptResult.error).toContain('already') || 
        expect(secondAcceptResult.error).toContain('accepted');
      }
    });
  });

  describe('updateProgress', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-progress-test',
        task: 'Test task for progress tracking',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });

      await assignmentConcept.accept({
        assignment: testId + '-progress-test'
      });
    });

    test('should update progress successfully', async () => {
      const result = await assignmentConcept.updateProgress({
        assignment: testId + '-progress-test',
        progress: 25,
        notes: 'Completed initial setup and requirements analysis'
      });

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.progress).toBe(25);
        expect(result.assignment.progressNotes).toBe('Completed initial setup and requirements analysis');
        expect(result.assignment.lastProgressUpdate).toBeDefined();
      }
    });

    test('should validate progress bounds', async () => {
      const invalidProgressResult = await assignmentConcept.updateProgress({
        assignment: testId + '-progress-test',
        progress: 150 // Invalid progress > 100
      });

      expect(invalidProgressResult).toHaveProperty('error');
      if ('error' in invalidProgressResult) {
        expect(invalidProgressResult.error).toContain('progress') || 
        expect(invalidProgressResult.error).toContain('100');
      }

      const negativeProgressResult = await assignmentConcept.updateProgress({
        assignment: testId + '-progress-test',
        progress: -10 // Invalid negative progress
      });

      expect(negativeProgressResult).toHaveProperty('error');
    });

    test('should auto-complete at 100% progress', async () => {
      const result = await assignmentConcept.updateProgress({
        assignment: testId + '-progress-test',
        progress: 100,
        notes: 'Task completed successfully'
      });

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.progress).toBe(100);
        expect(result.assignment.status).toBe('completed');
        expect(result.assignment.completedAt).toBeDefined();
      }
    });
  });

  describe('complete', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-complete-test',
        task: 'Test task for completion',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });

      await assignmentConcept.accept({
        assignment: testId + '-complete-test'
      });
    });

    test('should complete assignment successfully', async () => {
      const completionData = {
        assignment: testId + '-complete-test',
        completionNotes: 'Task completed successfully with all requirements met',
        deliverables: [
          'Authentication API endpoints',
          'JWT token validation middleware',
          'Password hashing utilities',
          'Role-based access control system',
          'Unit tests with 95% coverage'
        ],
        actualHours: 38
      };

      const result = await assignmentConcept.complete(completionData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.status).toBe('completed');
        expect(result.assignment.progress).toBe(100);
        expect(result.assignment.completionNotes).toBe(completionData.completionNotes);
        expect(result.assignment.deliverables).toEqual(completionData.deliverables);
        expect(result.assignment.actualHours).toBe(38);
        expect(result.assignment.completedAt).toBeDefined();
      }
    });

    test('should not complete already completed assignment', async () => {
      // Complete first time
      await assignmentConcept.complete({
        assignment: testId + '-complete-test',
        completionNotes: 'First completion'
      });

      // Try to complete again
      const secondCompleteResult = await assignmentConcept.complete({
        assignment: testId + '-complete-test',
        completionNotes: 'Second completion'
      });

      expect(secondCompleteResult).toHaveProperty('error');
    });
  });

  describe('review', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-review-test',
        task: 'Test task for review',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });

      await assignmentConcept.accept({
        assignment: testId + '-review-test'
      });

      await assignmentConcept.complete({
        assignment: testId + '-review-test',
        completionNotes: 'Task completed for review'
      });
    });

    test('should review assignment with approval', async () => {
      const reviewData = {
        assignment: testId + '-review-test',
        reviewer: testId + '-reviewer',
        approved: true,
        rating: 4.5,
        feedback: 'Excellent work! Code quality is high and all requirements are met.',
        suggestions: [
          'Consider adding more error handling',
          'Documentation could be more comprehensive'
        ]
      };

      const result = await assignmentConcept.review(reviewData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.status).toBe('reviewed');
        expect(result.assignment.reviewer).toBe(testId + '-reviewer');
        expect(result.assignment.approved).toBe(true);
        expect(result.assignment.rating).toBe(4.5);
        expect(result.assignment.feedback).toBe(reviewData.feedback);
        expect(result.assignment.suggestions).toEqual(reviewData.suggestions);
        expect(result.assignment.reviewedAt).toBeDefined();
      }
    });

    test('should review assignment with rejection', async () => {
      const rejectionData = {
        assignment: testId + '-review-test',
        reviewer: testId + '-reviewer',
        approved: false,
        rating: 2.0,
        feedback: 'Assignment needs significant improvements before acceptance.',
        suggestions: [
          'Add proper error handling',
          'Improve test coverage',
          'Fix security vulnerabilities',
          'Update documentation'
        ]
      };

      const result = await assignmentConcept.review(rejectionData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.approved).toBe(false);
        expect(result.assignment.rating).toBe(2.0);
        expect(result.assignment.status).toBe('needs_revision');
      }
    });
  });

  describe('reassign', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-reassign-test',
        task: 'Test task for reassignment',
        assignee: testId + '-original-assignee',
        assigner: testId + '-assigner'
      });
    });

    test('should reassign to different user', async () => {
      const reassignData = {
        assignment: testId + '-reassign-test',
        newAssignee: testId + '-new-assignee',
        reason: 'Original assignee unavailable due to other priorities'
      };

      const result = await assignmentConcept.reassign(reassignData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.assignee).toBe(testId + '-new-assignee');
        expect(result.assignment.status).toBe('assigned');
        expect(result.assignment.reassignedAt).toBeDefined();
        expect(result.assignment.reassignmentReason).toBe(reassignData.reason);
      }
    });

    test('should not reassign completed assignment', async () => {
      // First complete the assignment
      await assignmentConcept.accept({
        assignment: testId + '-reassign-test'
      });

      await assignmentConcept.complete({
        assignment: testId + '-reassign-test',
        completionNotes: 'Completed work'
      });

      // Try to reassign completed assignment
      const reassignResult = await assignmentConcept.reassign({
        assignment: testId + '-reassign-test',
        newAssignee: testId + '-new-assignee',
        reason: 'Should not work'
      });

      expect(reassignResult).toHaveProperty('error');
    });
  });

  describe('extend deadline', () => {
    beforeEach(async () => {
      await assignmentConcept.assign({
        assignment: testId + '-extend-test',
        task: 'Test task for deadline extension',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner',
        dueDate: new Date('2024-06-15')
      });
    });

    test('should extend deadline successfully', async () => {
      const extensionData = {
        assignment: testId + '-extend-test',
        newDueDate: new Date('2024-06-30'),
        reason: 'Additional requirements discovered during implementation'
      };

      const result = await assignmentConcept.extendDeadline(extensionData);

      expect(result).toHaveProperty('assignment');
      if ('assignment' in result) {
        expect(result.assignment.dueDate).toEqual(extensionData.newDueDate);
        expect(result.assignment.extensionReason).toBe(extensionData.reason);
        expect(result.assignment.extendedAt).toBeDefined();
      }
    });

    test('should not extend to past date', async () => {
      const invalidExtensionData = {
        assignment: testId + '-extend-test',
        newDueDate: new Date('2024-05-01'), // Past date
        reason: 'Invalid extension'
      };

      const result = await assignmentConcept.extendDeadline(invalidExtensionData);

      expect(result).toHaveProperty('error');
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test assignments
      const assignments = [
        {
          assignment: testId + '-frontend-task',
          task: 'Build React dashboard',
          assignee: testId + '-developer-1',
          assigner: testId + '-manager',
          priority: 'high',
          skills: ['React', 'TypeScript', 'CSS'],
          status: 'in_progress'
        },
        {
          assignment: testId + '-backend-task',
          task: 'Implement REST API',
          assignee: testId + '-developer-2',
          assigner: testId + '-manager',
          priority: 'medium',
          skills: ['Node.js', 'Express', 'PostgreSQL'],
          status: 'assigned'
        },
        {
          assignment: testId + '-testing-task',
          task: 'Write automated tests',
          assignee: testId + '-developer-1',
          assigner: testId + '-lead',
          priority: 'low',
          skills: ['Jest', 'Cypress', 'Testing'],
          status: 'completed'
        },
        {
          assignment: testId + '-design-task',
          task: 'Create UI mockups',
          assignee: testId + '-designer',
          assigner: testId + '-manager',
          priority: 'high',
          skills: ['Figma', 'UI Design', 'UX'],
          status: 'assigned'
        }
      ];

      for (const assignmentData of assignments) {
        await assignmentConcept.assign(assignmentData);
        
        // Update status if needed
        if (assignmentData.status === 'in_progress') {
          await assignmentConcept.accept({
            assignment: assignmentData.assignment
          });
        } else if (assignmentData.status === 'completed') {
          await assignmentConcept.accept({
            assignment: assignmentData.assignment
          });
          await assignmentConcept.complete({
            assignment: assignmentData.assignment,
            completionNotes: 'Test completion'
          });
        }
      }

      // Add progress to in-progress assignment
      await assignmentConcept.updateProgress({
        assignment: testId + '-frontend-task',
        progress: 65,
        notes: 'Dashboard components implemented'
      });
    });

    test('should query assignment by identifier', async () => {
      const assignments = await assignmentConcept._getByAssignment({
        assignment: testId + '-frontend-task'
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0].task).toBe('Build React dashboard');
    });

    test('should query assignments by assignee', async () => {
      const developer1Assignments = await assignmentConcept._getByAssignee({
        assignee: testId + '-developer-1'
      });

      expect(developer1Assignments.length).toBeGreaterThanOrEqual(2);
      expect(developer1Assignments.every(a => a.assignee === testId + '-developer-1')).toBe(true);
    });

    test('should query assignments by assigner', async () => {
      const managerAssignments = await assignmentConcept._getByAssigner({
        assigner: testId + '-manager'
      });

      expect(managerAssignments.length).toBeGreaterThanOrEqual(3);
      expect(managerAssignments.every(a => a.assigner === testId + '-manager')).toBe(true);
    });

    test('should query assignments by status', async () => {
      const assignedTasks = await assignmentConcept._getByStatus({ status: 'assigned' });
      const inProgressTasks = await assignmentConcept._getByStatus({ status: 'in_progress' });
      const completedTasks = await assignmentConcept._getByStatus({ status: 'completed' });

      expect(assignedTasks.length).toBeGreaterThanOrEqual(2);
      expect(inProgressTasks.length).toBeGreaterThanOrEqual(1);
      expect(completedTasks.length).toBeGreaterThanOrEqual(1);

      expect(assignedTasks.every(a => a.status === 'assigned')).toBe(true);
      expect(inProgressTasks.every(a => a.status === 'in_progress')).toBe(true);
      expect(completedTasks.every(a => a.status === 'completed')).toBe(true);
    });

    test('should query assignments by priority', async () => {
      const highPriorityTasks = await assignmentConcept._getByPriority({ priority: 'high' });
      const mediumPriorityTasks = await assignmentConcept._getByPriority({ priority: 'medium' });

      expect(highPriorityTasks.length).toBeGreaterThanOrEqual(2);
      expect(mediumPriorityTasks.length).toBeGreaterThanOrEqual(1);

      expect(highPriorityTasks.every(a => a.priority === 'high')).toBe(true);
      expect(mediumPriorityTasks.every(a => a.priority === 'medium')).toBe(true);
    });

    test('should get active assignments', async () => {
      const activeAssignments = await assignmentConcept._getActive();

      expect(activeAssignments.length).toBeGreaterThanOrEqual(3);
      expect(activeAssignments.every(a => a.isActive)).toBe(true);
    });

    test('should get overdue assignments', async () => {
      // Create overdue assignment
      await assignmentConcept.assign({
        assignment: testId + '-overdue',
        task: 'Overdue task',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner',
        dueDate: new Date('2020-01-01') // Past date
      });

      const overdueAssignments = await assignmentConcept._getOverdue();

      expect(overdueAssignments.length).toBeGreaterThanOrEqual(1);
      expect(overdueAssignments.some(a => a.assignment === testId + '-overdue')).toBe(true);
    });

    test('should search assignments by keywords', async () => {
      const reactSearch = await assignmentConcept._searchByKeywords({
        keywords: ['React', 'dashboard']
      });

      expect(reactSearch.length).toBeGreaterThanOrEqual(1);
      expect(reactSearch.some(a => 
        a.task.includes('React') || 
        a.skills.includes('React') ||
        a.task.includes('dashboard')
      )).toBe(true);

      const testingSearch = await assignmentConcept._searchByKeywords({
        keywords: ['test', 'automated']
      });

      expect(testingSearch.length).toBeGreaterThanOrEqual(1);
      expect(testingSearch.some(a => 
        a.task.includes('test') || 
        a.task.includes('automated')
      )).toBe(true);
    });

    test('should get assignments by skill requirement', async () => {
      const reactAssignments = await assignmentConcept._getBySkillRequirement({
        skill: 'React'
      });

      expect(reactAssignments.length).toBeGreaterThanOrEqual(1);
      expect(reactAssignments.every(a => a.skills.includes('React'))).toBe(true);

      const nodeAssignments = await assignmentConcept._getBySkillRequirement({
        skill: 'Node.js'
      });

      expect(nodeAssignments.length).toBeGreaterThanOrEqual(1);
      expect(nodeAssignments.every(a => a.skills.includes('Node.js'))).toBe(true);
    });

    test('should get assignment progress statistics', async () => {
      const progressStats = await assignmentConcept._getProgressStats({
        assignment: testId + '-frontend-task'
      });

      expect(progressStats).toHaveLength(1);
      expect(progressStats[0].progress).toBe(65);
      expect(progressStats[0].lastProgressUpdate).toBeDefined();
    });
  });

  describe('assignment lifecycle', () => {
    test('should handle complete assignment lifecycle', async () => {
      const assignmentId = testId + '-lifecycle';

      // 1. Create assignment
      const createResult = await assignmentConcept.assign({
        assignment: assignmentId,
        task: 'Build complete user management system',
        description: 'Implement full CRUD operations for user management with authentication',
        assignee: testId + '-developer',
        assigner: testId + '-manager',
        dueDate: new Date('2024-07-01'),
        priority: 'high',
        estimatedHours: 60,
        skills: ['React', 'Node.js', 'PostgreSQL', 'JWT']
      });
      expect(createResult).toHaveProperty('assignment');

      // 2. Accept assignment
      const acceptResult = await assignmentConcept.accept({
        assignment: assignmentId
      });
      expect(acceptResult).toHaveProperty('assignment');
      if ('assignment' in acceptResult) {
        expect(acceptResult.assignment.status).toBe('in_progress');
      }

      // 3. Update progress multiple times
      const progress1 = await assignmentConcept.updateProgress({
        assignment: assignmentId,
        progress: 25,
        notes: 'Set up project structure and database models'
      });
      expect(progress1).toHaveProperty('assignment');

      const progress2 = await assignmentConcept.updateProgress({
        assignment: assignmentId,
        progress: 50,
        notes: 'Implemented authentication and basic CRUD operations'
      });
      expect(progress2).toHaveProperty('assignment');

      const progress3 = await assignmentConcept.updateProgress({
        assignment: assignmentId,
        progress: 80,
        notes: 'Added frontend components and API integration'
      });
      expect(progress3).toHaveProperty('assignment');

      // 4. Complete assignment
      const completeResult = await assignmentConcept.complete({
        assignment: assignmentId,
        completionNotes: 'All requirements implemented and tested successfully',
        deliverables: [
          'User registration and authentication API',
          'Admin dashboard for user management',
          'Role-based access control',
          'Comprehensive test suite',
          'API documentation'
        ],
        actualHours: 58
      });
      expect(completeResult).toHaveProperty('assignment');

      // 5. Review assignment
      const reviewResult = await assignmentConcept.review({
        assignment: assignmentId,
        reviewer: testId + '-senior-dev',
        approved: true,
        rating: 4.8,
        feedback: 'Outstanding work! Code quality is excellent and all requirements exceeded.',
        suggestions: [
          'Consider adding performance monitoring',
          'Documentation could include deployment guide'
        ]
      });
      expect(reviewResult).toHaveProperty('assignment');

      // 6. Verify final state
      const finalAssignments = await assignmentConcept._getByAssignment({
        assignment: assignmentId
      });

      expect(finalAssignments).toHaveLength(1);
      const finalAssignment = finalAssignments[0];
      expect(finalAssignment.status).toBe('reviewed');
      expect(finalAssignment.progress).toBe(100);
      expect(finalAssignment.approved).toBe(true);
      expect(finalAssignment.rating).toBe(4.8);
      expect(finalAssignment.actualHours).toBe(58);
      expect(finalAssignment.deliverables).toHaveLength(5);
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle operations on non-existent assignment', async () => {
      const nonExistentId = 'non-existent-assignment';

      const acceptResult = await assignmentConcept.accept({
        assignment: nonExistentId
      });
      expect(acceptResult).toHaveProperty('error');

      const progressResult = await assignmentConcept.updateProgress({
        assignment: nonExistentId,
        progress: 50
      });
      expect(progressResult).toHaveProperty('error');

      const completeResult = await assignmentConcept.complete({
        assignment: nonExistentId,
        completionNotes: 'Should fail'
      });
      expect(completeResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidAssignmentData = {
        assignment: testId + '-invalid',
        task: '', // Empty task
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      };

      const result = await assignmentConcept.assign(invalidAssignmentData);
      expect(result).toHaveProperty('error');
    });

    test('should validate priority values', async () => {
      const invalidPriorityData = {
        assignment: testId + '-invalid-priority',
        task: 'Test task',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner',
        priority: 'invalid-priority'
      };

      const result = await assignmentConcept.assign(invalidPriorityData);
      expect(result).toHaveProperty('error');
    });

    test('should handle progress updates on non-in-progress assignments', async () => {
      // Create but don't accept assignment
      await assignmentConcept.assign({
        assignment: testId + '-not-accepted',
        task: 'Test task',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });

      const progressResult = await assignmentConcept.updateProgress({
        assignment: testId + '-not-accepted',
        progress: 50
      });

      expect(progressResult).toHaveProperty('error');
    });

    test('should handle review of non-completed assignment', async () => {
      await assignmentConcept.assign({
        assignment: testId + '-not-completed',
        task: 'Test task',
        assignee: testId + '-assignee',
        assigner: testId + '-assigner'
      });

      const reviewResult = await assignmentConcept.review({
        assignment: testId + '-not-completed',
        reviewer: testId + '-reviewer',
        approved: true,
        rating: 5.0,
        feedback: 'Should not work'
      });

      expect(reviewResult).toHaveProperty('error');
    });
  });
});
