import { PrismaClient, APIRequest, APIResponse } from "@prisma/client";

const prisma = new PrismaClient();

export class APIConcept {
  private prisma: PrismaClient;
  // In-memory response coordination to avoid DB polling
  private responseWaiters: Map<string, {
    resolve: (value: APIResponse) => void;
    reject: (reason?: any) => void;
  }> = new Map();
  private responseCache: Map<string, APIResponse> = new Map();

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
          query: input.query || undefined
        }
      });
      // Clear any stale caches for this id just in case
      this.responseCache.delete(request.id);
      this.responseWaiters.delete(request.id);
      
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

      const resolvedRequestId = typeof (input as any).requestId === 'string'
        ? (input as any).requestId
        : ((input as any).requestId?.id ?? String((input as any).requestId));

      console.log('[DEBUG] API.respond input body:', input.body);

      const response = await this.prisma.aPIResponse.create({
        data: {
          requestId: resolvedRequestId,
          statusCode: input.status,
          headers: input.headers || {},
          body: input.body,
        }
      });
      // Resolve any in-memory waiter first (fast path)
      const waiter = this.responseWaiters.get(resolvedRequestId);
      if (waiter) {
        try {
          waiter.resolve(response);
        } finally {
          this.responseWaiters.delete(resolvedRequestId);
        }
      } else {
        // No waiter yet - cache so a subsequent waiter resolves instantly
        this.responseCache.set(resolvedRequestId, response);
      }
      
      return { response };
    } catch (error) {
      return { error: `Failed to create response: ${error}` };
    }
  }

  async _waitForResponse(input: { request: APIRequest; timeoutMs?: number }): Promise<APIResponse[]> {
    const requestId = input.request.id;
    const timeoutMs = input.timeoutMs ?? 30000;
    try {
      // If we already have the response cached, return immediately
      const cached = this.responseCache.get(requestId);
      if (cached) {
        this.responseCache.delete(requestId);
        return [cached];
      }

      // Otherwise, set up a one-shot waiter that resolves when respond() is called
      const waiterPromise = new Promise<APIResponse>((resolve, reject) => {
        this.responseWaiters.set(requestId, { resolve, reject });
      });

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      });

      const result = await Promise.race([waiterPromise, timeoutPromise]);
      if (result === null) {
        // Timeout - clean up waiter to avoid leaks
        this.responseWaiters.delete(requestId);
        return [];
      }
      return [result as APIResponse];
    } catch {
      // Ensure cleanup on error
      this.responseWaiters.delete(requestId);
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
