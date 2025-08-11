/**
 * Notification Event Synchronizations
 * 
 * This file demonstrates the power of the concept design framework by showing
 * how notifications can be automatically triggered by events across ALL concepts
 * without modifying any existing concept code.
 */

import { actions } from '@/lib/engine/mod';
import { UserConcept } from '@/lib/concepts/user';
import { AssignmentConcept } from '@/lib/concepts/assignment';
import { TeamConcept } from '@/lib/concepts/team';
import { CampaignConcept } from '@/lib/concepts/campaign';
import { ProjectConcept } from '@/lib/concepts/project';
import { NotificationConcept } from '@/lib/concepts/notification';

// Instantiate concepts (these would normally be instrumented by the engine)
const User = new UserConcept();
const Assignment = new AssignmentConcept();
const Team = new TeamConcept();
const Campaign = new CampaignConcept();
const Project = new ProjectConcept();
const Notification = new NotificationConcept();

/**
 * USER LIFECYCLE NOTIFICATIONS
 */

// Welcome notification when user is created
export const userWelcomeNotification = actions({
  when: User.create,
  then: async (context: any) => {
    const { user } = context.when.output;
    
    await Notification.create({
      userId: user.id,
      type: "welcome",
      title: "Welcome to ProjectHub!",
      message: `Hi ${user.name}, welcome to ProjectHub! Complete your profile to get started with projects and teams.`,
      priority: "medium",
      sourceConceptType: "User",
      sourceEntityId: user.id
    });
  }
});

// Notification when user is added to organization
export const organizationMembershipNotification = actions({
  when: User.addOrganizationMembership,
  then: async (context: any) => {
    const { user } = context.when.output;
    const { organizationId, role } = context.when.input;
    
    // Get organization details
    const organizations = await User._canAccessOrganization({ 
      id: user.id, 
      organizationId 
    });
    
    if (organizations.length > 0) {
      await Notification.create({
        userId: user.id,
        type: "system",
        title: "Added to Organization",
        message: `You've been added to an organization with the role: ${role}`,
        priority: "medium",
        sourceConceptType: "Organization",
        sourceEntityId: organizationId,
        organizationId
      });
    }
  }
});

/**
 * ASSIGNMENT NOTIFICATIONS
 */

// Direct assignment notifications
export const directAssignmentNotification = actions({
  when: Assignment.createDirectAssignment,
  then: async (context: any) => {
    const { assignment } = context.when.output;
    const { studentId, teamId, projectId } = context.when.input;
    
    // Get project details for context
    const projects = await Project._getById({ id: projectId });
    const project = projects[0];
    
    if (!project) return;
    
    // Notify student if individual assignment
    if (studentId) {
      await Notification.create({
        userId: studentId,
        type: "assignment",
        title: "New Project Assignment",
        message: `You've been assigned to the project: ${project.title}`,
        data: { projectId, assignmentId: assignment.id },
        priority: "high",
        sourceConceptType: "Assignment",
        sourceEntityId: assignment.id,
        organizationId: assignment.organizationId
      });
    }
    
    // Notify team members if team assignment
    if (teamId) {
      const teams = await Team._getById({ id: teamId });
      const team = teams[0];
      
      if (team) {
        // Get all team member IDs from the team's student lists
        const studentIds = team.studentIds || [];
        
        if (studentIds.length > 0) {
          await Notification.createBulk({
            userIds: studentIds,
            type: "assignment",
            title: "Team Project Assignment",
            message: `Your team "${team.name}" has been assigned to: ${project.title}`,
            data: { projectId, teamId, assignmentId: assignment.id },
            priority: "high",
            sourceConceptType: "Assignment",
            sourceEntityId: assignment.id,
            organizationId: assignment.organizationId
          });
        }
      }
    }
    
    // Notify expert if assigned to project
    if (project.expertId) {
      await Notification.create({
        userId: project.expertId,
        type: "project_assigned",
        title: "Project Assignment Notification",
        message: `A new assignment has been created for your project: ${project.title}`,
        data: { projectId, assignmentId: assignment.id },
        priority: "medium",
        sourceConceptType: "Assignment",
        sourceEntityId: assignment.id,
        organizationId: assignment.organizationId
      });
    }
  }
});

// Application status notifications
export const applicationStatusNotification = actions({
  when: Assignment.updateStatus,
  then: async (context: any) => {
    const { assignment } = context.when.output;
    const { status } = context.when.input;
    
    // Only notify on status changes that matter to students
    const notifiableStatuses = ["accepted", "rejected", "in_progress", "completed"];
    if (!notifiableStatuses.includes(status)) return;
    
    // Get project details
    const projects = await Project._getById({ id: assignment.projectId });
    const project = projects[0];
    
    if (!project) return;
    
    const statusMessages = {
      accepted: "Your application has been accepted! You can now start working on the project.",
      rejected: "Your application was not accepted this time. Keep applying to other projects!",
      in_progress: "Your project assignment is now in progress. Good luck!",
      completed: "Congratulations! Your project has been marked as completed."
    };
    
    const priorities = {
      accepted: "high",
      rejected: "medium", 
      in_progress: "medium",
      completed: "high"
    };
    
    // Notify the student
    if (assignment.studentId) {
      await Notification.create({
        userId: assignment.studentId,
        type: "application_status",
        title: `Project Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessages[status as keyof typeof statusMessages],
        data: { projectId: assignment.projectId, assignmentId: assignment.id, status },
        priority: priorities[status as keyof typeof priorities] as "low" | "medium" | "high",
        sourceConceptType: "Assignment",
        sourceEntityId: assignment.id,
        organizationId: assignment.organizationId
      });
    }
  }
});

/**
 * TEAM NOTIFICATIONS
 */

// Team invitation notifications
export const teamInviteNotification = actions({
  when: Team.addStudent,
  then: async (context: any) => {
    const { team } = context.when.output;
    const { studentId } = context.when.input;
    
    await Notification.create({
      userId: studentId,
      type: "team_invite",
      title: "Added to Team",
      message: `You've been added to the team: ${team.name}`,
      data: { teamId: team.id },
      priority: "medium",
      sourceConceptType: "Team",
      sourceEntityId: team.id,
      organizationId: team.organizationId
    });
  }
});

// Expert assignment to team notification
export const teamExpertNotification = actions({
  when: Team.addExpert,
  then: async (context: any) => {
    const { team } = context.when.output;
    const { expertId } = context.when.input;
    
    await Notification.create({
      userId: expertId,
      type: "team_invite",
      title: "Assigned as Team Expert",
      message: `You've been assigned as an expert to the team: ${team.name}`,
      data: { teamId: team.id },
      priority: "medium",
      sourceConceptType: "Team", 
      sourceEntityId: team.id,
      organizationId: team.organizationId
    });
    
    // Also notify team members about the new expert
    const studentIds = team.studentIds || [];
    if (studentIds.length > 0) {
      await Notification.createBulk({
        userIds: studentIds,
        type: "team_invite",
        title: "Expert Joined Your Team",
        message: `An expert has been assigned to your team: ${team.name}`,
        data: { teamId: team.id, expertId },
        priority: "low",
        sourceConceptType: "Team",
        sourceEntityId: team.id,
        organizationId: team.organizationId
      });
    }
  }
});

/**
 * CAMPAIGN NOTIFICATIONS
 */

// Campaign status change notifications
export const campaignUpdateNotification = actions({
  when: Campaign.updateStatus,
  then: async (context: any) => {
    const { campaign } = context.when.output;
    const { status } = context.when.input;
    
    // Get all participants in the campaign
    const participants = campaign.participantIds || [];
    
    if (participants.length > 0) {
      const statusMessages = {
        active: "The campaign is now active! You can start applying for projects.",
        paused: "The campaign has been temporarily paused.",
        completed: "The campaign has been completed. Thank you for participating!",
        archived: "The campaign has been archived."
      };
      
      const message = statusMessages[status as keyof typeof statusMessages] || 
                     `Campaign status updated to: ${status}`;
      
      await Notification.createBulk({
        userIds: participants,
        type: "campaign_update",
        title: `Campaign Update: ${campaign.name}`,
        message,
        data: { campaignId: campaign.id, status },
        priority: "medium",
        sourceConceptType: "Campaign",
        sourceEntityId: campaign.id,
        organizationId: campaign.organizationId
      });
    }
  }
});

/**
 * PROJECT NOTIFICATIONS
 */

// Expert assignment to project notification
export const projectExpertNotification = actions({
  when: Project.assignExpert,
  then: async (context: any) => {
    const { project } = context.when.output;
    const { expertId } = context.when.input;
    
    await Notification.create({
      userId: expertId,
      type: "project_assigned",
      title: "Assigned to Project",
      message: `You've been assigned as an expert to the project: ${project.title}`,
      data: { projectId: project.id },
      priority: "medium",
      sourceConceptType: "Project",
      sourceEntityId: project.id,
      organizationId: project.organizationId
    });
  }
});

// Export all synchronizations for registration
export const notificationSyncs = {
  userWelcomeNotification,
  organizationMembershipNotification,
  directAssignmentNotification,
  applicationStatusNotification,
  teamInviteNotification,
  teamExpertNotification,
  campaignUpdateNotification,
  projectExpertNotification
};
