import { PrismaClient, Notification, NotificationPreference } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: object;
    priority?: string;
    sourceConceptType?: string;
    sourceEntityId?: string;
    organizationId?: string;
  }): Promise<{ notification: Notification } | { error: string }> {
    try {
      // Validate notification type
      const validTypes = ["welcome", "assignment", "project_assigned", "team_invite", "campaign_update", "expert_feedback", "application_status", "system"];
      if (!validTypes.includes(input.type)) {
        return { error: "Invalid notification type" };
      }

      // Validate priority
      const priority = input.priority || "medium";
      const validPriorities = ["low", "medium", "high", "urgent"];
      if (!validPriorities.includes(priority)) {
        return { error: "Invalid priority level" };
      }

      // Get user preferences to determine channels
      const preferences = await this._getUserPreferences({ 
        userId: input.userId, 
        organizationId: input.organizationId 
      });
      
      let channels = ["in_app"]; // Always include in-app
      if (preferences.length > 0) {
        const userPrefs = preferences[0];
        if (userPrefs.emailEnabled) channels.push("email");
        if (userPrefs.pushEnabled) channels.push("push");
      } else {
        // Default to email enabled for new users
        channels.push("email");
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          priority,
          sourceConceptType: input.sourceConceptType,
          sourceEntityId: input.sourceEntityId,
          organizationId: input.organizationId,
          isRead: false,
          channels,
          emailSent: false
        }
      });

      return { notification };
    } catch (error) {
      return { error: `Failed to create notification: ${error}` };
    }
  }

  async createBulk(input: {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data?: object;
    priority?: string;
    sourceConceptType?: string;
    sourceEntityId?: string;
    organizationId?: string;
  }): Promise<{ notifications: Notification[] } | { error: string }> {
    try {
      // Validate all user IDs exist
      const users = await this.prisma.user.findMany({
        where: { id: { in: input.userIds } }
      });
      
      if (users.length !== input.userIds.length) {
        return { error: "Some user IDs do not exist" };
      }

      const notifications: Notification[] = [];
      
      // Create notifications for each user
      for (const userId of input.userIds) {
        const result = await this.create({
          ...input,
          userId
        });
        
        if ('error' in result) {
          return { error: `Failed to create notification for user ${userId}: ${result.error}` };
        }
        
        notifications.push(result.notification);
      }

      return { notifications };
    } catch (error) {
      return { error: `Failed to create bulk notifications: ${error}` };
    }
  }

  async markAsRead(input: {
    id: string;
    userId: string;
  }): Promise<{ notification: Notification } | { error: string }> {
    try {
      // Validate notification belongs to user
      const existing = await this.prisma.notification.findFirst({
        where: { id: input.id, userId: input.userId }
      });
      
      if (!existing) {
        return { error: "Notification not found or access denied" };
      }

      const notification = await this.prisma.notification.update({
        where: { id: input.id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { notification };
    } catch (error) {
      return { error: `Failed to mark notification as read: ${error}` };
    }
  }

  async markAllAsRead(input: {
    userId: string;
    organizationId?: string;
  }): Promise<{ success: boolean; count: number } | { error: string }> {
    try {
      const whereClause: any = {
        userId: input.userId,
        isRead: false
      };
      
      if (input.organizationId) {
        whereClause.organizationId = input.organizationId;
      }

      const result = await this.prisma.notification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { success: true, count: result.count };
    } catch (error) {
      return { error: `Failed to mark all notifications as read: ${error}` };
    }
  }

  async delete(input: {
    id: string;
    userId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      // Validate notification belongs to user
      const existing = await this.prisma.notification.findFirst({
        where: { id: input.id, userId: input.userId }
      });
      
      if (!existing) {
        return { error: "Notification not found or access denied" };
      }

      await this.prisma.notification.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete notification: ${error}` };
    }
  }

  async updatePreferences(input: {
    userId: string;
    organizationId?: string;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    typePreferences?: object;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
  }): Promise<{ preferences: NotificationPreference } | { error: string }> {
    try {
      // Validate timezone format if provided
      if (input.timezone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(input.timezone)) {
        return { error: "Invalid timezone format" };
      }

      // Try to find existing preferences
      const existing = await this.prisma.notificationPreference.findFirst({
        where: {
          userId: input.userId,
          organizationId: input.organizationId || null
        }
      });

      const data: any = {};
      if (input.emailEnabled !== undefined) data.emailEnabled = input.emailEnabled;
      if (input.pushEnabled !== undefined) data.pushEnabled = input.pushEnabled;
      if (input.inAppEnabled !== undefined) data.inAppEnabled = input.inAppEnabled;
      if (input.typePreferences !== undefined) data.typePreferences = input.typePreferences;
      if (input.quietHoursEnabled !== undefined) data.quietHoursEnabled = input.quietHoursEnabled;
      if (input.quietHoursStart !== undefined) data.quietHoursStart = input.quietHoursStart;
      if (input.quietHoursEnd !== undefined) data.quietHoursEnd = input.quietHoursEnd;
      if (input.timezone !== undefined) data.timezone = input.timezone;

      let preferences: NotificationPreference;
      
      if (existing) {
        preferences = await this.prisma.notificationPreference.update({
          where: { id: existing.id },
          data
        });
      } else {
        preferences = await this.prisma.notificationPreference.create({
          data: {
            userId: input.userId,
            organizationId: input.organizationId,
            emailEnabled: input.emailEnabled ?? true,
            pushEnabled: input.pushEnabled ?? false,
            inAppEnabled: input.inAppEnabled ?? true,
            typePreferences: input.typePreferences || {},
            quietHoursEnabled: input.quietHoursEnabled ?? false,
            quietHoursStart: input.quietHoursStart,
            quietHoursEnd: input.quietHoursEnd,
            timezone: input.timezone,
            ...data
          }
        });
      }

      return { preferences };
    } catch (error) {
      return { error: `Failed to update notification preferences: ${error}` };
    }
  }

  async sendEmail(input: { notificationId: string }): Promise<{ success: boolean } | { error: string }> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: input.notificationId }
      });

      if (!notification) {
        return { error: "Notification not found" };
      }

      if (!notification.channels.includes("email")) {
        return { error: "Email not enabled for this notification" };
      }

      if (notification.emailSent) {
        return { error: "Email already sent for this notification" };
      }

      // TODO: Integrate with actual email service (Nodemailer)
      // For now, just mark as sent
      
      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          emailSent: true,
          emailSentAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to send email: ${error}` };
    }
  }

  // Queries
  async _getByUser(input: {
    userId: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    try {
      const whereClause: any = { userId: input.userId };
      if (input.organizationId) {
        whereClause.organizationId = input.organizationId;
      }

      const notifications = await this.prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: input.limit || 50,
        skip: input.offset || 0
      });

      return notifications;
    } catch {
      return [];
    }
  }

  async _getUnreadByUser(input: {
    userId: string;
    organizationId?: string;
  }): Promise<Notification[]> {
    try {
      const whereClause: any = { 
        userId: input.userId,
        isRead: false
      };
      if (input.organizationId) {
        whereClause.organizationId = input.organizationId;
      }

      const notifications = await this.prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return notifications;
    } catch {
      return [];
    }
  }

  async _getUnreadCount(input: {
    userId: string;
    organizationId?: string;
  }): Promise<number[]> {
    try {
      const whereClause: any = { 
        userId: input.userId,
        isRead: false
      };
      if (input.organizationId) {
        whereClause.organizationId = input.organizationId;
      }

      const count = await this.prisma.notification.count({
        where: whereClause
      });

      return [count];
    } catch {
      return [0];
    }
  }

  async _getByType(input: {
    userId: string;
    type: string;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          userId: input.userId,
          type: input.type
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit || 20
      });

      return notifications;
    } catch {
      return [];
    }
  }

  async _getRecentActivity(input: {
    organizationId: string;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: 'desc' },
        take: input.limit || 50
      });

      return notifications;
    } catch {
      return [];
    }
  }

  async _getUserPreferences(input: {
    userId: string;
    organizationId?: string;
  }): Promise<NotificationPreference[]> {
    try {
      const preferences = await this.prisma.notificationPreference.findMany({
        where: {
          userId: input.userId,
          organizationId: input.organizationId || null
        }
      });

      return preferences;
    } catch {
      return [];
    }
  }

  async _getPendingEmails(): Promise<Notification[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          emailSent: false,
          channels: {
            array_contains: "email"
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return notifications;
    } catch {
      return [];
    }
  }
}
