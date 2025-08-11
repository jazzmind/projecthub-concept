import { PrismaClient, Assignment, AssignmentType, AssignmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class AssignmentConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createDirectAssignment(input: {
    projectId: string;
    campaignId: string;
    studentId?: string;
    teamId?: string;
    studentName?: string;
    studentEmail?: string;
    assignedBy: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      // Validate either studentId or teamId is provided (not both)
      if (!input.studentId && !input.teamId) {
        return { error: "Either studentId or teamId must be provided" };
      }
      if (input.studentId && input.teamId) {
        return { error: "Cannot assign to both student and team" };
      }

      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId }
      });
      if (!project) {
        return { error: "Project not found" };
      }

      // Validate campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.campaignId }
      });
      if (!campaign) {
        return { error: "Campaign not found" };
      }

      // Validate team exists if teamId provided
      if (input.teamId) {
        const team = await this.prisma.team.findUnique({
          where: { id: input.teamId }
        });
        if (!team) {
          return { error: "Team not found" };
        }
      }

      const assignment = await this.prisma.assignment.create({
        data: {
          projectId: input.projectId,
          campaignId: input.campaignId,
          type: "direct",
          teamId: input.teamId,
          studentId: input.studentId,
          status: "accepted",
          organizationId: input.campaignId, // Use campaignId as organization identifier
          progressNotes: [],
          deliverableSubmissions: [],
        }
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to create direct assignment: ${error}` };
    }
  }

  async createApplication(input: {
    projectId: string;
    campaignId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    applicationText: string;
    motivationStatement?: string;
    relevantSkills?: string[];
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId }
      });
      if (!project) {
        return { error: "Project not found" };
      }

      // Validate campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.campaignId }
      });
      if (!campaign) {
        return { error: "Campaign not found" };
      }

      const assignment = await this.prisma.assignment.create({
        data: {
          projectId: input.projectId,
          campaignId: input.campaignId,
          type: "application",
          studentId: input.studentId,
          status: "pending",
          applicationMessage: input.applicationText,
          organizationId: input.campaignId,
          progressNotes: [],
          deliverableSubmissions: [],
        }
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to create application: ${error}` };
    }
  }

  async createRecommendation(input: {
    projectId: string;
    campaignId: string;
    industryPartnerId: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId }
      });
      if (!project) {
        return { error: "Project not found" };
      }

      // Validate campaign exists
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: input.campaignId }
      });
      if (!campaign) {
        return { error: "Campaign not found" };
      }

      // Validate industry partner exists
      const partner = await this.prisma.industryPartner.findUnique({
        where: { id: input.industryPartnerId }
      });
      if (!partner) {
        return { error: "Industry partner not found" };
      }

      const assignment = await this.prisma.assignment.create({
        data: {
          projectId: input.projectId,
          campaignId: input.campaignId,
          type: "application",
          status: "pending",
          organizationId: input.campaignId,
          progressNotes: [],
          deliverableSubmissions: [],
        }
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to create recommendation: ${error}` };
    }
  }

  async updateStatus(input: {
    id: string;
    status: string;
    updatedBy?: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const validStatuses = ["pending", "accepted", "rejected", "in_progress", "completed", "withdrawn"];
      if (!validStatuses.includes(input.status)) {
        return { error: "Invalid status" };
      }

      const updateData: any = { status: input.status as AssignmentStatus };

      // Set assignedAt if status changes to "accepted"
      if (input.status === "accepted") {
        updateData.assignedAt = new Date();
      }

      const assignment = await this.prisma.assignment.update({
        where: { id: input.id },
        data: updateData
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to update status: ${error}` };
    }
  }

  async addProgressNote(input: {
    id: string;
    note: string;
    author: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: input.id }
      });

      if (!assignment) {
        return { error: "Assignment not found" };
      }

      const progressNotes = (assignment.progressNotes as any[]) || [];
      const newNote = {
        date: new Date(),
        note: input.note,
        author: input.author
      };

      const updatedAssignment = await this.prisma.assignment.update({
        where: { id: input.id },
        data: {
          progressNotes: [...progressNotes, newNote]
        }
      });

      return { assignment: updatedAssignment };
    } catch (error) {
      return { error: `Failed to add progress note: ${error}` };
    }
  }

  async submitDeliverable(input: {
    id: string;
    deliverable: string;
    fileUrl: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: input.id }
      });

      if (!assignment) {
        return { error: "Assignment not found" };
      }

      const submissions = (assignment.deliverableSubmissions as any[]) || [];
      const newSubmission = {
        deliverable: input.deliverable,
        submittedAt: new Date(),
        fileUrl: input.fileUrl
      };

      const updatedAssignment = await this.prisma.assignment.update({
        where: { id: input.id },
        data: {
          deliverableSubmissions: [...submissions, newSubmission]
        }
      });

      return { assignment: updatedAssignment };
    } catch (error) {
      return { error: `Failed to submit deliverable: ${error}` };
    }
  }

  async addFeedback(input: {
    id: string;
    feedbackType: string;
    feedback: string;
    grade?: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const validTypes = ["student", "partner", "expert"];
      if (!validTypes.includes(input.feedbackType)) {
        return { error: "Invalid feedback type" };
      }

      const updateData: any = {};
      if (input.feedbackType === "student") {
        updateData.studentFeedback = input.feedback;
      } else if (input.feedbackType === "partner") {
        updateData.partnerFeedback = input.feedback;
      } else if (input.feedbackType === "expert") {
        updateData.expertFeedback = input.feedback;
      }

      if (input.grade) {
        updateData.finalGrade = input.grade;
      }

      const assignment = await this.prisma.assignment.update({
        where: { id: input.id },
        data: updateData
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to add feedback: ${error}` };
    }
  }

  async withdraw(input: { id: string }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const assignment = await this.prisma.assignment.update({
        where: { id: input.id },
        data: {
          status: "cancelled"
        }
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to withdraw assignment: ${error}` };
    }
  }

  async delete(input: { id: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: input.id }
      });

      if (!assignment) {
        return { error: "Assignment not found" };
      }

      if (!["pending", "withdrawn"].includes(assignment.status)) {
        return { error: "Can only delete pending or withdrawn assignments" };
      }

      await this.prisma.assignment.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete assignment: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<Assignment[]> {
    try {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: input.id }
      });
      return assignment ? [assignment] : [];
    } catch {
      return [];
    }
  }

  async _getByProject(input: { projectId: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { projectId: input.projectId }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByCampaign(input: { campaignId: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { campaignId: input.campaignId }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByStudent(input: { studentId: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { studentId: input.studentId }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByTeam(input: { teamId: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { teamId: input.teamId }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByIndustryPartner(input: { industryPartnerId: string }): Promise<Assignment[]> {
    try {
      // Note: industryPartnerId is not directly on Assignment, need to join through Project
      // For now, return empty array - this would need a proper join query
      return [];
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { status: input.status as AssignmentStatus }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getPendingApplications(input: { campaignId: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: {
          campaignId: input.campaignId,
          type: "application",
          status: "pending"
        }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getActiveAssignments(): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { status: "in_progress" }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getCompletedAssignments(input: { campaignId?: string }): Promise<Assignment[]> {
    try {
      const where: any = { status: "completed" };
      if (input.campaignId) {
        where.campaignId = input.campaignId;
      }

      const assignments = await this.prisma.assignment.findMany({
        where
      });
      return assignments;
    } catch {
      return [];
    }
  }
}