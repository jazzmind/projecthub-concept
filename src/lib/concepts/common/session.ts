import { PrismaClient, Session } from "@prisma/client";

const prisma = new PrismaClient();

export class SessionConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(input: {
    sessionKey: string;
    userAgent?: string;
    ipAddress?: string;
    loginMethod: string;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      // Check if session key already exists
      const existing = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (existing) {
        return { error: "Session key already exists" };
      }

      const session = await this.prisma.session.create({
        data: {
          sessionKey: input.sessionKey,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          loginMethod: input.loginMethod,
          isActive: true,
          lastActivityAt: new Date(),
        }
      });

      return { session };
    } catch (error) {
      return { error: `Failed to create session: ${error}` };
    }
  }

  async setContext(input: {
    sessionKey: string;
    context: string;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          currentContext: input.context,
          lastActivityAt: new Date()
        }
      });

      return { session: updated };
    } catch (error) {
      return { error: `Failed to set context: ${error}` };
    }
  }

  async clearContext(input: {
    sessionKey: string;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          currentContext: null,
          lastActivityAt: new Date()
        }
      });

      return { session: updated };
    } catch (error) {
      return { error: `Failed to clear context: ${error}` };
    }
  }

  async updateActivity(input: {
    sessionKey: string;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          lastActivityAt: new Date()
        }
      });

      return { session: updated };
    } catch (error) {
      return { error: `Failed to update activity: ${error}` };
    }
  }

  async updatePreferences(input: {
    sessionKey: string;
    preferences: object;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          preferences: input.preferences,
          lastActivityAt: new Date()
        }
      });

      return { session: updated };
    } catch (error) {
      return { error: `Failed to update preferences: ${error}` };
    }
  }

  async expire(input: {
    sessionKey: string;
  }): Promise<{ session: Session } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      const updated = await this.prisma.session.update({
        where: { id: session.id },
        data: {
          isActive: false,
          expiresAt: new Date()
        }
      });

      return { session: updated };
    } catch (error) {
      return { error: `Failed to expire session: ${error}` };
    }
  }

  async delete(input: {
    sessionKey: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });

      if (!session) {
        return { error: "Session not found" };
      }

      await this.prisma.session.delete({
        where: { id: session.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete session: ${error}` };
    }
  }

  // Queries
  async _getBySessionKey(input: { sessionKey: string }): Promise<Session[]> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });
      return session ? [session] : [];
    } catch {
      return [];
    }
  }

  async _getActive(input: { sessionKey: string }): Promise<Session[]> {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          sessionKey: input.sessionKey,
          isActive: true
        }
      });
      return session ? [session] : [];
    } catch {
      return [];
    }
  }

  async _getCurrentContext(input: { sessionKey: string }): Promise<string[]> {
    try {
      const session = await this.prisma.session.findFirst({
        where: { sessionKey: input.sessionKey }
      });
      return session?.currentContext ? [session.currentContext] : [];
    } catch {
      return [];
    }
  }

  async _isActiveSession(input: { sessionKey: string }): Promise<boolean[]> {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          sessionKey: input.sessionKey,
          isActive: true
        }
      });

      // Check if session is expired
      if (session?.expiresAt && session.expiresAt < new Date()) {
        return [false];
      }

      return [!!session];
    } catch {
      return [false];
    }
  }

  async _getExpiredSessions(): Promise<Session[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          OR: [
            { isActive: false },
            {
              expiresAt: {
                lt: new Date()
              }
            }
          ]
        }
      });
      return sessions;
    } catch {
      return [];
    }
  }
}
