import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { APIConcept } from '@/lib/concepts/common/api';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const apiConcept = new APIConcept();

describe('APIConcept', () => {
  let testId: string;

  beforeEach(async () => {
    testId = 'api-test-' + Date.now();
    
    // Clean up test data
    await prisma.request.deleteMany({});
  });

  afterEach(async () => {
    await prisma.request.deleteMany({});
  });

  describe('request', () => {
    test('should handle GET request successfully', async () => {
      const requestData = {
        request: testId + '-get-request',
        method: 'GET',
        path: '/api/users',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        query: {
          page: '1',
          limit: '10',
          search: 'john'
        }
      };

      const result = await apiConcept.request(requestData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.request).toBe(testId + '-get-request');
        expect(result.request.method).toBe('GET');
        expect(result.request.path).toBe('/api/users');
        expect(result.request.headers).toEqual(requestData.headers);
        expect(result.request.query).toEqual(requestData.query);
        expect(result.request.status).toBe('pending');
        expect(result.request.timestamp).toBeDefined();
      }
    });

    test('should handle POST request with body', async () => {
      const requestData = {
        request: testId + '-post-request',
        method: 'POST',
        path: '/api/users',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'learner'
        }
      };

      const result = await apiConcept.request(requestData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.method).toBe('POST');
        expect(result.request.body).toEqual(requestData.body);
        expect(result.request.status).toBe('pending');
      }
    });

    test('should handle PUT request for updates', async () => {
      const requestData = {
        request: testId + '-put-request',
        method: 'PUT',
        path: '/api/users/123',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer update-token'
        },
        body: {
          name: 'John Updated',
          email: 'john.updated@example.com'
        }
      };

      const result = await apiConcept.request(requestData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.method).toBe('PUT');
        expect(result.request.path).toBe('/api/users/123');
        expect(result.request.body).toEqual(requestData.body);
      }
    });

    test('should handle DELETE request', async () => {
      const requestData = {
        request: testId + '-delete-request',
        method: 'DELETE',
        path: '/api/users/123',
        headers: {
          'Authorization': 'Bearer delete-token'
        }
      };

      const result = await apiConcept.request(requestData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.method).toBe('DELETE');
        expect(result.request.path).toBe('/api/users/123');
        expect(result.request.body).toBeNull();
      }
    });

    test('should prevent duplicate request identifiers', async () => {
      const requestId = testId + '-duplicate';
      
      // Create first request
      await apiConcept.request({
        request: requestId,
        method: 'GET',
        path: '/api/test'
      });

      // Try to create duplicate
      const duplicateResult = await apiConcept.request({
        request: requestId,
        method: 'POST',
        path: '/api/test'
      });

      expect(duplicateResult).toHaveProperty('error');
      if ('error' in duplicateResult) {
        expect(duplicateResult.error).toContain('request');
      }
    });
  });

  describe('respond', () => {
    beforeEach(async () => {
      await apiConcept.request({
        request: testId + '-respond-test',
        method: 'GET',
        path: '/api/test'
      });
    });

    test('should respond with success', async () => {
      const responseData = {
        request: testId + '-respond-test',
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          data: {
            users: [
              { id: 1, name: 'John Doe' },
              { id: 2, name: 'Jane Smith' }
            ]
          }
        }
      };

      const result = await apiConcept.respond(responseData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.status).toBe('completed');
        expect(result.request.responseStatus).toBe(200);
        expect(result.request.responseHeaders).toEqual(responseData.headers);
        expect(result.request.responseBody).toEqual(responseData.body);
        expect(result.request.completedAt).toBeDefined();
      }
    });

    test('should respond with error', async () => {
      // Create another request for error testing
      await apiConcept.request({
        request: testId + '-error-test',
        method: 'POST',
        path: '/api/users',
        body: { invalid: 'data' }
      });

      const errorResponse = {
        request: testId + '-error-test',
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          error: 'Validation failed',
          details: [
            'Name is required',
            'Email must be valid'
          ]
        }
      };

      const result = await apiConcept.respond(errorResponse);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.status).toBe('completed');
        expect(result.request.responseStatus).toBe(400);
        expect(result.request.responseBody).toEqual(errorResponse.body);
      }
    });

    test('should handle server error response', async () => {
      await apiConcept.request({
        request: testId + '-server-error',
        method: 'GET',
        path: '/api/internal-error'
      });

      const serverErrorResponse = {
        request: testId + '-server-error',
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        }
      };

      const result = await apiConcept.respond(serverErrorResponse);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.responseStatus).toBe(500);
        expect(result.request.status).toBe('completed');
      }
    });
  });

  describe('fail', () => {
    beforeEach(async () => {
      await apiConcept.request({
        request: testId + '-fail-test',
        method: 'GET',
        path: '/api/fail-test'
      });
    });

    test('should mark request as failed with error', async () => {
      const failureData = {
        request: testId + '-fail-test',
        error: 'Network timeout after 30 seconds'
      };

      const result = await apiConcept.fail(failureData);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.status).toBe('failed');
        expect(result.request.error).toBe('Network timeout after 30 seconds');
        expect(result.request.failedAt).toBeDefined();
      }
    });

    test('should handle request processing failure', async () => {
      await apiConcept.request({
        request: testId + '-processing-fail',
        method: 'POST',
        path: '/api/complex-operation'
      });

      const processingFailure = {
        request: testId + '-processing-fail',
        error: 'Database connection failed during transaction'
      };

      const result = await apiConcept.fail(processingFailure);

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.status).toBe('failed');
        expect(result.request.error).toContain('Database connection');
      }
    });
  });

  describe('cancel', () => {
    beforeEach(async () => {
      await apiConcept.request({
        request: testId + '-cancel-test',
        method: 'GET',
        path: '/api/long-running-operation'
      });
    });

    test('should cancel pending request', async () => {
      const result = await apiConcept.cancel({
        request: testId + '-cancel-test'
      });

      expect(result).toHaveProperty('request');
      if ('request' in result) {
        expect(result.request.status).toBe('cancelled');
        expect(result.request.cancelledAt).toBeDefined();
      }
    });

    test('should not cancel completed request', async () => {
      // First complete the request
      await apiConcept.respond({
        request: testId + '-cancel-test',
        status: 200,
        body: { completed: true }
      });

      // Try to cancel completed request
      const result = await apiConcept.cancel({
        request: testId + '-cancel-test'
      });

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('cannot be cancelled') || 
        expect(result.error).toContain('already completed');
      }
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      // Create multiple test requests
      const requests = [
        {
          request: testId + '-get-users',
          method: 'GET',
          path: '/api/users',
          headers: { 'Authorization': 'Bearer token1' }
        },
        {
          request: testId + '-post-user',
          method: 'POST',
          path: '/api/users',
          body: { name: 'New User' }
        },
        {
          request: testId + '-get-projects',
          method: 'GET',
          path: '/api/projects'
        },
        {
          request: testId + '-put-user',
          method: 'PUT',
          path: '/api/users/123',
          body: { name: 'Updated User' }
        }
      ];

      for (const requestData of requests) {
        await apiConcept.request(requestData);
      }

      // Complete some requests
      await apiConcept.respond({
        request: testId + '-get-users',
        status: 200,
        body: { users: [] }
      });

      await apiConcept.respond({
        request: testId + '-post-user',
        status: 201,
        body: { id: 1, name: 'New User' }
      });

      // Fail one request
      await apiConcept.fail({
        request: testId + '-get-projects',
        error: 'Authorization failed'
      });

      // Leave put-user as pending
    });

    test('should query request by identifier', async () => {
      const requests = await apiConcept._getByRequest({
        request: testId + '-get-users'
      });

      expect(requests).toHaveLength(1);
      expect(requests[0].method).toBe('GET');
      expect(requests[0].path).toBe('/api/users');
    });

    test('should query requests by method', async () => {
      const getRequests = await apiConcept._getByMethod({ method: 'GET' });
      const postRequests = await apiConcept._getByMethod({ method: 'POST' });

      expect(getRequests.length).toBeGreaterThanOrEqual(2);
      expect(postRequests.length).toBeGreaterThanOrEqual(1);

      expect(getRequests.every(r => r.method === 'GET')).toBe(true);
      expect(postRequests.every(r => r.method === 'POST')).toBe(true);
    });

    test('should query requests by path pattern', async () => {
      const userRequests = await apiConcept._getByPathPattern({
        pattern: '/api/users'
      });

      expect(userRequests.length).toBeGreaterThanOrEqual(3);
      expect(userRequests.every(r => r.path.includes('/api/users'))).toBe(true);
    });

    test('should query requests by status', async () => {
      const pendingRequests = await apiConcept._getByStatus({ status: 'pending' });
      const completedRequests = await apiConcept._getByStatus({ status: 'completed' });
      const failedRequests = await apiConcept._getByStatus({ status: 'failed' });

      expect(pendingRequests.length).toBeGreaterThanOrEqual(1);
      expect(completedRequests.length).toBeGreaterThanOrEqual(2);
      expect(failedRequests.length).toBeGreaterThanOrEqual(1);

      expect(pendingRequests.every(r => r.status === 'pending')).toBe(true);
      expect(completedRequests.every(r => r.status === 'completed')).toBe(true);
      expect(failedRequests.every(r => r.status === 'failed')).toBe(true);
    });

    test('should get pending requests', async () => {
      const pendingRequests = await apiConcept._getPending();

      expect(pendingRequests.length).toBeGreaterThanOrEqual(1);
      expect(pendingRequests.every(r => r.status === 'pending')).toBe(true);
    });

    test('should get recent requests', async () => {
      const recentRequests = await apiConcept._getRecent({ limit: 5 });

      expect(recentRequests.length).toBeGreaterThanOrEqual(4);
      
      // Should be ordered by timestamp (most recent first)
      for (let i = 0; i < recentRequests.length - 1; i++) {
        expect(recentRequests[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(recentRequests[i + 1].timestamp.getTime());
      }
    });

    test('should check if request exists', async () => {
      const exists = await apiConcept._exists({
        request: testId + '-get-users'
      });

      const notExists = await apiConcept._exists({
        request: 'non-existent-request'
      });

      expect(exists).toHaveLength(1);
      expect(exists[0]).toBe(true);

      expect(notExists).toHaveLength(1);
      expect(notExists[0]).toBe(false);
    });

    test('should wait for response', async () => {
      // Create a new pending request
      await apiConcept.request({
        request: testId + '-wait-test',
        method: 'GET',
        path: '/api/wait-test'
      });

      // Start waiting (this would typically be done in parallel)
      const waitPromise = apiConcept._waitForResponse({
        request: testId + '-wait-test'
      });

      // Simulate response after a short delay
      setTimeout(async () => {
        await apiConcept.respond({
          request: testId + '-wait-test',
          status: 200,
          body: { waited: true }
        });
      }, 100);

      const response = await waitPromise;

      expect(response).toHaveLength(1);
      expect(response[0].status).toBe('completed');
      expect(response[0].responseStatus).toBe(200);
      expect(response[0].responseBody).toEqual({ waited: true });
    });
  });

  describe('request analytics and metrics', () => {
    beforeEach(async () => {
      // Create requests for analytics testing
      const analyticsRequests = [
        { request: testId + '-analytics-1', method: 'GET', path: '/api/users', status: 200 },
        { request: testId + '-analytics-2', method: 'GET', path: '/api/projects', status: 200 },
        { request: testId + '-analytics-3', method: 'POST', path: '/api/users', status: 201 },
        { request: testId + '-analytics-4', method: 'GET', path: '/api/users', status: 404 },
        { request: testId + '-analytics-5', method: 'PUT', path: '/api/users/1', status: 200 },
        { request: testId + '-analytics-6', method: 'DELETE', path: '/api/users/2', status: 204 }
      ];

      for (const req of analyticsRequests) {
        await apiConcept.request({
          request: req.request,
          method: req.method,
          path: req.path
        });

        await apiConcept.respond({
          request: req.request,
          status: req.status,
          body: { analytics: true }
        });
      }

      // Add some failed requests
      await apiConcept.request({
        request: testId + '-analytics-fail-1',
        method: 'GET',
        path: '/api/error'
      });

      await apiConcept.fail({
        request: testId + '-analytics-fail-1',
        error: 'Network error'
      });
    });

    test('should get request count by method', async () => {
      const methodCounts = await apiConcept._getCountByMethod();

      expect(methodCounts.length).toBeGreaterThanOrEqual(3);
      
      const getCount = methodCounts.find(mc => mc.method === 'GET');
      const postCount = methodCounts.find(mc => mc.method === 'POST');

      expect(getCount?.count).toBeGreaterThanOrEqual(3);
      expect(postCount?.count).toBeGreaterThanOrEqual(1);
    });

    test('should get request count by status', async () => {
      const statusCounts = await apiConcept._getCountByStatus();

      expect(statusCounts.length).toBeGreaterThanOrEqual(2);
      
      const completedCount = statusCounts.find(sc => sc.status === 'completed');
      const failedCount = statusCounts.find(sc => sc.status === 'failed');

      expect(completedCount?.count).toBeGreaterThanOrEqual(6);
      expect(failedCount?.count).toBeGreaterThanOrEqual(1);
    });

    test('should get average response time', async () => {
      const avgResponseTime = await apiConcept._getAverageResponseTime();

      expect(avgResponseTime).toHaveLength(1);
      expect(typeof avgResponseTime[0]).toBe('number');
      expect(avgResponseTime[0]).toBeGreaterThanOrEqual(0);
    });

    test('should get requests by response status code', async () => {
      const successRequests = await apiConcept._getByResponseStatus({ status: 200 });
      const createdRequests = await apiConcept._getByResponseStatus({ status: 201 });
      const notFoundRequests = await apiConcept._getByResponseStatus({ status: 404 });

      expect(successRequests.length).toBeGreaterThanOrEqual(3);
      expect(createdRequests.length).toBeGreaterThanOrEqual(1);
      expect(notFoundRequests.length).toBeGreaterThanOrEqual(1);

      expect(successRequests.every(r => r.responseStatus === 200)).toBe(true);
      expect(createdRequests.every(r => r.responseStatus === 201)).toBe(true);
      expect(notFoundRequests.every(r => r.responseStatus === 404)).toBe(true);
    });
  });

  describe('request lifecycle and flow', () => {
    test('should handle complete request-response lifecycle', async () => {
      const requestId = testId + '-lifecycle';

      // 1. Create request
      const createResult = await apiConcept.request({
        request: requestId,
        method: 'POST',
        path: '/api/complex-operation',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer lifecycle-token'
        },
        body: {
          operation: 'create_user_and_profile',
          data: {
            name: 'Lifecycle User',
            email: 'lifecycle@example.com',
            profile: {
              bio: 'Testing complete lifecycle',
              skills: ['Testing', 'API Design']
            }
          }
        }
      });

      expect(createResult).toHaveProperty('request');
      if ('request' in createResult) {
        expect(createResult.request.status).toBe('pending');
      }

      // 2. Check that request exists and is pending
      const pendingRequests = await apiConcept._getPending();
      expect(pendingRequests.some(r => r.request === requestId)).toBe(true);

      // 3. Process and respond successfully
      const responseResult = await apiConcept.respond({
        request: requestId,
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Location': '/api/users/123'
        },
        body: {
          success: true,
          user: {
            id: 123,
            name: 'Lifecycle User',
            email: 'lifecycle@example.com'
          },
          profile: {
            id: 456,
            bio: 'Testing complete lifecycle',
            skills: ['Testing', 'API Design']
          }
        }
      });

      expect(responseResult).toHaveProperty('request');
      if ('request' in responseResult) {
        expect(responseResult.request.status).toBe('completed');
        expect(responseResult.request.responseStatus).toBe(201);
        expect(responseResult.request.completedAt).toBeDefined();
      }

      // 4. Verify final state
      const finalRequests = await apiConcept._getByRequest({ request: requestId });
      expect(finalRequests).toHaveLength(1);
      
      const finalRequest = finalRequests[0];
      expect(finalRequest.status).toBe('completed');
      expect(finalRequest.responseStatus).toBe(201);
      expect(finalRequest.responseBody).toHaveProperty('success', true);
      expect(finalRequest.responseBody.user).toHaveProperty('id', 123);
    });

    test('should handle request failure scenarios', async () => {
      const requestId = testId + '-failure-scenario';

      // Create request
      await apiConcept.request({
        request: requestId,
        method: 'POST',
        path: '/api/risky-operation',
        body: { dangerous: 'operation' }
      });

      // Simulate processing failure
      const failResult = await apiConcept.fail({
        request: requestId,
        error: 'Critical system error: Database unavailable'
      });

      expect(failResult).toHaveProperty('request');
      if ('request' in failResult) {
        expect(failResult.request.status).toBe('failed');
        expect(failResult.request.error).toContain('Database unavailable');
        expect(failResult.request.failedAt).toBeDefined();
      }

      // Verify it's not in pending requests
      const pendingRequests = await apiConcept._getPending();
      expect(pendingRequests.some(r => r.request === requestId)).toBe(false);

      // Verify it's in failed requests
      const failedRequests = await apiConcept._getByStatus({ status: 'failed' });
      expect(failedRequests.some(r => r.request === requestId)).toBe(true);
    });

    test('should handle request cancellation', async () => {
      const requestId = testId + '-cancellation';

      // Create long-running request
      await apiConcept.request({
        request: requestId,
        method: 'GET',
        path: '/api/long-running-report',
        query: { format: 'pdf', size: 'large' }
      });

      // Cancel the request
      const cancelResult = await apiConcept.cancel({
        request: requestId
      });

      expect(cancelResult).toHaveProperty('request');
      if ('request' in cancelResult) {
        expect(cancelResult.request.status).toBe('cancelled');
        expect(cancelResult.request.cancelledAt).toBeDefined();
      }

      // Try to respond to cancelled request (should fail)
      const responseResult = await apiConcept.respond({
        request: requestId,
        status: 200,
        body: { report: 'data' }
      });

      expect(responseResult).toHaveProperty('error');
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle operations on non-existent request', async () => {
      const nonExistentId = 'non-existent-request';

      const respondResult = await apiConcept.respond({
        request: nonExistentId,
        status: 200,
        body: { test: true }
      });
      expect(respondResult).toHaveProperty('error');

      const failResult = await apiConcept.fail({
        request: nonExistentId,
        error: 'Should fail'
      });
      expect(failResult).toHaveProperty('error');

      const cancelResult = await apiConcept.cancel({
        request: nonExistentId
      });
      expect(cancelResult).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const invalidRequestData = {
        request: testId + '-invalid',
        method: '', // Invalid method
        path: '/api/test'
      };

      const result = await apiConcept.request(invalidRequestData);
      expect(result).toHaveProperty('error');
    });

    test('should handle malformed request data', async () => {
      const malformedData = {
        request: testId + '-malformed',
        method: 'GET',
        path: '', // Empty path
        headers: 'invalid-headers-format' // Should be object
      };

      const result = await apiConcept.request(malformedData);
      expect(result).toHaveProperty('error');
    });

    test('should handle response to already completed request', async () => {
      const requestId = testId + '-already-completed';

      // Create and complete request
      await apiConcept.request({
        request: requestId,
        method: 'GET',
        path: '/api/test'
      });

      await apiConcept.respond({
        request: requestId,
        status: 200,
        body: { first: 'response' }
      });

      // Try to respond again
      const secondResponse = await apiConcept.respond({
        request: requestId,
        status: 201,
        body: { second: 'response' }
      });

      expect(secondResponse).toHaveProperty('error');
      if ('error' in secondResponse) {
        expect(secondResponse.error).toContain('already') || 
        expect(secondResponse.error).toContain('completed');
      }
    });

    test('should handle timeout scenarios in wait operations', async () => {
      const requestId = testId + '-timeout-test';

      await apiConcept.request({
        request: requestId,
        method: 'GET',
        path: '/api/never-responds'
      });

      // Start waiting with a short timeout
      const startTime = Date.now();
      const waitPromise = apiConcept._waitForResponse({
        request: requestId
      });

      // Don't respond - let it timeout
      // Note: Implementation should have a reasonable timeout
      
      try {
        await Promise.race([
          waitPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), 1000)
          )
        ]);
      } catch (error) {
        expect(error.message).toBe('Test timeout');
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000); // Should timeout reasonably quickly
    });
  });
});
