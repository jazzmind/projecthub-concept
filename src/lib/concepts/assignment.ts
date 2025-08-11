import { PrismaClient, Assignment, ProgressNote, Feedback } from "@prisma/client";

const prisma = new PrismaClient();

export class AssignmentConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async assign(input: {
    assignment: string;
    task: string;
    assignee: string;
    assigner?: string;
    dueDate?: Date;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      // Check if assignment ID already exists
      const existing = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (existing) {
        return { error: "Assignment with this ID already exists" };
      }

      const assignment = await this.prisma.assignment.create({
        data: {
          assignment: input.assignment,
          task: input.task,
          assignee: input.assignee,
          assigner: input.assigner,
          status: "pending",
          dueDate: input.dueDate,
        }
      });

      return { assignment };
    } catch (error) {
      return { error: `Failed to create assignment: ${error}` };
    }
  }

  async updateStatus(input: {
    assignment: string;
    status: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const existing = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!existing) {
        return { error: "Assignment not found" };
      }

      const updated = await this.prisma.assignment.update({
        where: { id: existing.id },
        data: { 
          status: input.status,
          ...(input.status === "completed" && { completedDate: new Date() }),
          ...(input.status === "in_progress" && { startDate: new Date() })
        }
      });

      return { assignment: updated };
    } catch (error) {
      return { error: `Failed to update assignment status: ${error}` };
    }
  }

  async updatePriority(input: {
    assignment: string;
    priority: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const existing = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!existing) {
        return { error: "Assignment not found" };
      }

      const updated = await this.prisma.assignment.update({
        where: { id: existing.id },
        data: { priority: input.priority }
      });

      return { assignment: updated };
    } catch (error) {
      return { error: `Failed to update assignment priority: ${error}` };
    }
  }

  async addProgress(input: {
    assignment: string;
    note: string;
    author: string;
    noteType: string;
  }): Promise<{ progressNote: ProgressNote } | { error: string }> {
    try {
      // Verify assignment exists
      const assignment = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!assignment) {
        return { error: "Assignment not found" };
      }

      const progressNote = await this.prisma.progressNote.create({
        data: {
          assignment: input.assignment,
          note: input.note,
          author: input.author,
          noteType: input.noteType,
        }
      });

      return { progressNote };
    } catch (error) {
      return { error: `Failed to add progress note: ${error}` };
    }
  }

  async addFeedback(input: {
    assignment: string;
    author: string;
    rating?: number;
    comment: string;
  }): Promise<{ feedback: Feedback } | { error: string }> {
    try {
      // Verify assignment exists
      const assignment = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!assignment) {
        return { error: "Assignment not found" };
      }

      const feedback = await this.prisma.feedback.create({
        data: {
          assignment: input.assignment,
          author: input.author,
          rating: input.rating,
          comment: input.comment,
        }
      });

      return { feedback };
    } catch (error) {
      return { error: `Failed to add feedback: ${error}` };
    }
  }

  async reassign(input: {
    assignment: string;
    newAssignee: string;
    assigner?: string;
  }): Promise<{ assignment: Assignment } | { error: string }> {
    try {
      const existing = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!existing) {
        return { error: "Assignment not found" };
      }

      const updated = await this.prisma.assignment.update({
        where: { id: existing.id },
        data: { 
          assignee: input.newAssignee,
          assigner: input.assigner,
          status: "pending" // Reset status on reassignment
        }
      });

      return { assignment: updated };
    } catch (error) {
      return { error: `Failed to reassign: ${error}` };
    }
  }

  async delete(input: { assignment: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const existing = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });

      if (!existing) {
        return { error: "Assignment not found" };
      }

      // Delete related progress notes and feedback
      await this.prisma.progressNote.deleteMany({
        where: { assignment: input.assignment }
      });

      await this.prisma.feedback.deleteMany({
        where: { assignment: input.assignment }
      });

      // Delete the assignment
      await this.prisma.assignment.delete({
        where: { id: existing.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete assignment: ${error}` };
    }
  }

  // Queries
  async _getById(input: { assignment: string }): Promise<Assignment[]> {
    try {
      const assignment = await this.prisma.assignment.findFirst({
        where: { assignment: input.assignment }
      });
      return assignment ? [assignment] : [];
    } catch {
      return [];
    }
  }

  async _getByAssignee(input: { assignee: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { assignee: input.assignee }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByTask(input: { task: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { task: input.task }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByStatus(input: { status: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { status: input.status }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getOverdue(): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: {
          dueDate: {
            lt: new Date()
          },
          status: {
            notIn: ["completed", "cancelled"]
          }
        }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getByPriority(input: { priority: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { priority: input.priority }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getProgressNotes(input: { assignment: string }): Promise<ProgressNote[]> {
    try {
      const notes = await this.prisma.progressNote.findMany({
        where: { assignment: input.assignment },
        orderBy: { createdAt: "desc" }
      });
      return notes;
    } catch {
      return [];
    }
  }

  async _getFeedback(input: { assignment: string }): Promise<Feedback[]> {
    try {
      const feedback = await this.prisma.feedback.findMany({
        where: { assignment: input.assignment },
        orderBy: { createdAt: "desc" }
      });
      return feedback;
    } catch {
      return [];
    }
  }

  async _getByAssigner(input: { assigner: string }): Promise<Assignment[]> {
    try {
      const assignments = await this.prisma.assignment.findMany({
        where: { assigner: input.assigner }
      });
      return assignments;
    } catch {
      return [];
    }
  }

  async _getUpcoming(input: { days: number }): Promise<Assignment[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.days);

      const assignments = await this.prisma.assignment.findMany({
        where: {
          dueDate: {
            gte: new Date(),
            lte: futureDate
          },
          status: {
            notIn: ["completed", "cancelled"]
          }
        },
        orderBy: { dueDate: "asc" }
      });
      return assignments;
    } catch {
      return [];
    }
  }
}