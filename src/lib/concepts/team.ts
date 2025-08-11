import { PrismaClient, Team } from "@prisma/client";

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
          organizationId: input.campaignId, // Use campaignId as organizationId
          maxMembers: input.maxStudents || 6,
          isActive: true,
          studentIds: [],
          expertIds: [],
          industryPartnerIds: [],
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
      if (team.studentIds.length >= team.maxMembers) {
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
          organizationId: team.organizationId,
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
          studentIds: [...studentIds, input.studentId]
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
          studentIds: studentIds.filter(id => id !== input.studentId)
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

      if (!expert.isAvailable) {
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

      // Note: Team schema doesn't have projectIds, using description as workaround
      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          description: `${team.description || ""} - Project ${input.projectId} assigned`
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

      // Note: Team schema doesn't have projectIds, using description as workaround
      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          description: `${team.description || ""} - Project ${input.projectId} removed`
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

      const updateData: any = { isActive: input.status === "active" };

      // Note: Date fields not in current schema

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
          communicationChannel: input.channels
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

      const milestones: any[] = []; // TODO: Implement milestone storage
      const newMilestone = {
        title: input.title,
        dueDate: input.dueDate,
        completed: false
      };

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          description: `${team.description || ""} - Milestone added: ${input.title}`
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

      const milestones: any[] = []; // TODO: Implement milestone storage
      if (input.milestoneIndex < 0 || input.milestoneIndex >= milestones.length) {
        return { error: "Invalid milestone index" };
      }

      milestones[input.milestoneIndex].completed = true;

      const updatedTeam = await this.prisma.team.update({
        where: { id: input.id },
        data: {
          description: `${team.description || ""} - Milestone updated`
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
      if (team.isActive && team.studentIds.length > 0) {
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
        where: { organizationId: input.campaignId }
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
          description: {
            contains: input.projectId
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
        where: { isActive: input.status === "active" }
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
          organizationId: input.campaignId,
          isActive: true
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
          organizationId: input.campaignId,
          isActive: true
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
        where: { isActive: true }
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

      const milestones: any[] = []; // TODO: Implement milestone storage
      const completedMilestones = milestones.filter(m => m.completed).length;
      const totalMilestones = milestones.length;

      const stats = {
        teamId: team.id,
        studentCount: team.studentIds.length,
        expertCount: (team.expertIds as string[]).length,
        industryPartnerCount: (team.industryPartnerIds as string[]).length,
        projectCount: 0, // TODO: Implement project counting
        milestoneCompletion: totalMilestones > 0 ? completedMilestones / totalMilestones : 0,
        status: team.isActive ? "active" : "inactive",
        daysActive: Math.floor((Date.now() - team.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      };

      return [stats];
    } catch {
      return [];
    }
  }
}
