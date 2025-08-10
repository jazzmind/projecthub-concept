import { PrismaClient, APIRequest, APIResponse } from "@prisma/client";

const prisma = new PrismaClient();

export class APIConcept {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async request(input: {
    method: string;
    path: string;
    headers?: object;
    body?: object;
    params?: object;
    query?: object;
    userId?: string;
    sessionId?: string;
  }): Promise<{ request: APIRequest } | { error: string }> {
    try {
      // Validate method
      if (!["GET", "POST", "PUT", "DELETE"].includes(input.method)) {
        return { error: "Invalid HTTP method" };
      }

      const request = await this.prisma.aPIRequest.create({
        data: {
          method: input.method,
          path: input.path,
          headers: input.headers || {},
          body: input.body || undefined,
          params: input.params || undefined,
          query: input.query || undefined,
          userId: input.userId || null,
          sessionId: input.sessionId || null,
        }
      });
      
      return { request };
    } catch (error) {
      return { error: `Failed to create request: ${error}` };
    }
  }

  async respond(input: {
    requestId: string;
    status: number;
    headers?: object;
    body: object;
  }): Promise<{ response: APIResponse } | { error: string }> {
    try {
      // Validate status code
      if (input.status < 100 || input.status > 599) {
        return { error: "Invalid HTTP status code" };
      }

      const response = await this.prisma.aPIResponse.create({
        data: {
          requestId: input.requestId,
          status: input.status,
          headers: input.headers || {},
          body: input.body,
        }
      });
      
      return { response };
    } catch (error) {
      return { error: `Failed to create response: ${error}` };
    }
  }

  async _waitForResponse(input: { request: APIRequest }): Promise<APIResponse[]> {
    try {
      // In a real implementation, this would use pub/sub or polling
      // For now, we'll do a simple wait with timeout
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const response = await this.prisma.aPIResponse.findFirst({ 
          where: { requestId: input.request.id }
        });
        
        if (response) {
          return [response];
        }
        
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Timeout - return empty response
      return [];
    } catch {
      return [];
    }
  }

  async _getRequest(input: { id: string }): Promise<APIRequest[]> {
    try {
      const request = await this.prisma.aPIRequest.findUnique({ 
        where: { id: input.id }
      });
      if (request) {
        return [request];
      }
      return [];
    } catch {
      return [];
    }
  }

  async _getResponse(input: { id: string }): Promise<APIResponse[]> {
    try {
      const response = await this.prisma.aPIResponse.findUnique({ 
        where: { id: input.id }
      });
      if (response) {
        return [response];
      }
      return [];
    } catch {
      return [];
    }
  }

  async _getRequestsByUser(input: { userId: string }): Promise<APIRequest[]> {
    try {
      const requests = await this.prisma.aPIRequest.findMany({ 
        where: { userId: input.userId }
      });
      return requests;
    } catch {
      return [];
    }
  }

  async _getRequestsByPath(input: { path: string }): Promise<APIRequest[]> {
    try {
      const requests = await this.prisma.aPIRequest.findMany({ 
        where: { path: input.path }
      });
      return requests;
    } catch {
      return [];
    }
  }
}
