import { PrismaClient, Team, TeamStatus, TeamType } from "@prisma/client";

const prisma = new PrismaClient();

export class TeamConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    name: string;
    description: string;
    campaignId: string;
    maxStudents: number;
    teamType: string;
    isPublic: boolean;
    requiresApproval: boolean;
  }): Promise<{ team: Team } | { error: string }> {
    try {
      // Validate campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.campaignId }
      });
      if (!campaign) {
        return { error: "Campaign not found" };
      }

      // Validate maxStudents is positive
      if (input.maxStudents <= 0) {
        return { error: "Maximum students must be positive" };
      }

      // Validate team type
      const validTeamTypes = ["student_only", "with_expert", "with_industry", "full_collaboration"];
      if (!validTeamTypes.includes(input.teamType)) {
        return { error: "Invalid team type" };
      }

      const team = await this.prisma.team.create({
        data: {
          name: input.name,
          description: input.description,
          campaignId: input.campaignId,
          maxStudents: input.maxStudents,
          currentStudents: 0,
          teamType: input.teamType as TeamType,
          isPublic: input.isPublic,
          requiresApproval: input.requiresApproval,
          status: "forming",
          studentIds: [],
          expertIds: [],
          industryPartnerIds: [],
          projectIds: [],
        }
      });

      return { team };
    } catch (error) {
      return { error: `Failed to create team: ${error}` };
    }
  }

  async addStudent(input: { id: string; studentId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      // Check if team has capacity
      if (team.currentStudents >= team.maxStudents) {
        return { error: "Team is at maximum capacity" };
      }

      // Check if student is already in team
      const studentIds = team.studentIds as string[];
      if (studentIds.includes(input.studentId)) {
        return { error: "Student is already in this team" };
      }

      // Check if student is already in another team for same campaign
      const existingTeam = await this.prisma.team.findFirst({
        where: {
          campaignId: team.campaignId,
          studentIds: {
            has: input.studentId
          }
        }
      });

      if (existingTeam && existingTeam.id !== input.id) {
        return { error: "Student is already in another team for this campaign" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          studentIds: [...studentIds, input.studentId],
          currentStudents: team.currentStudents + 1
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to add student to team: ${error}` };
    }
  }

  async removeStudent(input: { id: string; studentId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const studentIds = team.studentIds as string[];
      if (!studentIds.includes(input.studentId)) {
        return { error: "Student is not in this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          studentIds: studentIds.filter(id => id !== input.studentId),
          currentStudents: Math.max(0, team.currentStudents - 1)
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to remove student from team: ${error}` };
    }
  }

  async addExpert(input: { id: string; expertId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      // Validate expert exists and is available
      const expert = await this.prisma.expert.findUnique({
        where: { id: input.expertId }
      });

      if (!expert) {
        return { error: "Expert not found" };
      }

      if (expert.availability === "unavailable") {
        return { error: "Expert is not available" };
      }

      const expertIds = team.expertIds as string[];
      if (expertIds.includes(input.expertId)) {
        return { error: "Expert is already in this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          expertIds: [...expertIds, input.expertId]
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to add expert to team: ${error}` };
    }
  }

  async removeExpert(input: { id: string; expertId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const expertIds = team.expertIds as string[];
      if (!expertIds.includes(input.expertId)) {
        return { error: "Expert is not in this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          expertIds: expertIds.filter(id => id !== input.expertId)
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to remove expert from team: ${error}` };
    }
  }

  async addIndustryPartner(input: { id: string; industryPartnerId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      // Validate industry partner exists
      const partner = await this.prisma.industryPartner.findUnique({
        where: { id: input.industryPartnerId }
      });

      if (!partner) {
        return { error: "Industry partner not found" };
      }

      const partnerIds = team.industryPartnerIds as string[];
      if (partnerIds.includes(input.industryPartnerId)) {
        return { error: "Industry partner is already in this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          industryPartnerIds: [...partnerIds, input.industryPartnerId]
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to add industry partner to team: ${error}` };
    }
  }

  async removeIndustryPartner(input: { id: string; industryPartnerId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const partnerIds = team.industryPartnerIds as string[];
      if (!partnerIds.includes(input.industryPartnerId)) {
        return { error: "Industry partner is not in this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          industryPartnerIds: partnerIds.filter(id => id !== input.industryPartnerId)
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to remove industry partner from team: ${error}` };
    }
  }

  async assignProject(input: { id: string; projectId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      // Validate project exists and is available
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) {
        return { error: "Project not found" };
      }

      if (project.status === "archived" || project.status === "completed") {
        return { error: "Project is not available for assignment" };
      }

      const projectIds = team.projectIds as string[];
      if (projectIds.includes(input.projectId)) {
        return { error: "Project is already assigned to this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          projectIds: [...projectIds, input.projectId]
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to assign project to team: ${error}` };
    }
  }

  async unassignProject(input: { id: string; projectId: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const projectIds = team.projectIds as string[];
      if (!projectIds.includes(input.projectId)) {
        return { error: "Project is not assigned to this team" };
      }

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          projectIds: projectIds.filter(id => id !== input.projectId)
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to unassign project from team: ${error}` };
    }
  }

  async updateStatus(input: { id: string; status: string }): Promise<{ team: Team } | { error: string }> {
    try {
      const validStatuses = ["forming", "active", "completed", "archived"];
      if (!validStatuses.includes(input.status)) {
        return { error: "Invalid status" };
      }

      const updateData: any = { status: input.status as TeamStatus };

      // Set dates based on status changes
      if (input.status === "active") {
        updateData.startDate = new Date();
      } else if (input.status === "completed") {
        updateData.endDate = new Date();
      }

      const team = await this.prisma.team.update({
        where: { id: input.id },
        data: updateData
      });

      return { team };
    } catch (error) {
      return { error: `Failed to update team status: ${error}` };
    }
  }

  async updateCommunication(input: {
    id: string;
    channels: object;
    meetingSchedule?: string;
    timezone?: string;
  }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          communicationChannels: input.channels,
          meetingSchedule: input.meetingSchedule,
          timezone: input.timezone
        }
      });

      return { team };
    } catch (error) {
      return { error: `Failed to update team communication: ${error}` };
    }
  }

  async addMilestone(input: { id: string; title: string; dueDate: Date }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const milestones = (team.milestones as any[]) || [];
      const newMilestone = {
        title: input.title,
        dueDate: input.dueDate,
        completed: false
      };

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          milestones: [...milestones, newMilestone]
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to add milestone: ${error}` };
    }
  }

  async completeMilestone(input: { id: string; milestoneIndex: number }): Promise<{ team: Team } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      const milestones = (team.milestones as any[]) || [];
      if (input.milestoneIndex < 0 || input.milestoneIndex >= milestones.length) {
        return { error: "Invalid milestone index" };
      }

      milestones[input.milestoneIndex].completed = true;

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          milestones: milestones
        }
      });

      return { team: updatedTeam };
    } catch (error) {
      return { error: `Failed to complete milestone: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return { error: "Team not found" };
      }

      // Only allow deletion if team is forming or has no active assignments
      if (team.status !== "forming" && team.currentStudents > 0) {
        return { error: "Cannot delete team with active members" };
      }

      await this.prisma.team.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete team: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Team[]> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });
      return team ? [team] : [];
    } catch {
      return [];
    }
  }

  async _getByCampaign(input: { campaignId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: { campaignId: input.campaignId }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getByStudent(input: { studentId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          studentIds: {
            has: input.studentId
          }
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getByExpert(input: { expertId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          expertIds: {
            has: input.expertId
          }
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getByIndustryPartner(input: { industryPartnerId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          industryPartnerIds: {
            has: input.industryPartnerId
          }
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getByProject(input: { projectId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          projectIds: {
            has: input.projectId
          }
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: { status: input.status as TeamStatus }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getAvailableTeams(input: { campaignId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          campaignId: input.campaignId,
          status: "forming",
          currentStudents: {
            lt: prisma.team.fields.maxStudents
          }
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getPublicTeams(input: { campaignId: string }): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          campaignId: input.campaignId,
          isPublic: true,
          status: "forming"
        }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getActiveTeams(): Promise<Team[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: { status: "active" }
      });
      return teams;
    } catch {
      return [];
    }
  }

  async _getTeamStats(input: { id: string }): Promise<object[]> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: input.id }
      });

      if (!team) {
        return [];
      }

      const milestones = (team.milestones as any[]) || [];
      const completedMilestones = milestones.filter(m => m.completed).length;
      const totalMilestones = milestones.length;

      const stats = {
        teamId: team.id,
        studentCount: team.currentStudents,
        expertCount: (team.expertIds as string[]).length,
        industryPartnerCount: (team.industryPartnerIds as string[]).length,
        projectCount: (team.projectIds as string[]).length,
        milestoneCompletion: totalMilestones > 0 ? completedMilestones / totalMilestones : 0,
        status: team.status,
        daysActive: team.startDate ? Math.floor((Date.now() - team.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      };

      return [stats];
    } catch {
      return [];
    }
  }
}
