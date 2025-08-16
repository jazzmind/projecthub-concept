// Debug script to test API concept in isolation
import { APIConcept } from '../lib/concepts/common/api.js';

async function testAPIConceptDirectly() {
  console.log('Testing API concept directly...');
  
  const api = new APIConcept();
  
  try {
    const result = await api.request({
      method: 'GET',
      path: '/api/auth/current-user',
      headers: {
        'x-user-id': 'test-user',
        'x-user-email': 'test@example.com'
      }
    });
    
    console.log('API.request result:', result);
    
    if (result.request) {
      const responseResult = await api.respond({
        request: result.request.id,
        status: 200,
        body: { test: 'success' }
      });
      
      console.log('API.respond result:', responseResult);
    }
    
  } catch (error) {
    console.error('Error testing API concept:', error);
  }
}

testAPIConceptDirectly();
