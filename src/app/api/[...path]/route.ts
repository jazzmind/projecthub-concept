import { NextRequest } from 'next/server';
import { API } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const result = await API.request({ 
      method: 'GET', 
      path: path,
      query: searchParams,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    const response = await API._waitForResponse({ request: result.request });
    const responseData = response.length > 0 ? response[0] : { error: 'No response received' };
    
    if ('error' in responseData) {
      return Response.json(responseData, { status: 500 });
    }
    
    // Type assertion since responseData structure is dynamic
    const apiResponse = responseData as any;
    return Response.json(apiResponse.body || apiResponse, { status: apiResponse.status || 200 });
  } catch (error) {
    console.error('API GET Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const body = await request.json();
    
    const result = await API.request({
      method: 'POST',
      path: path,
      body: body,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    const response = await API._waitForResponse({ request: result.request });
    const responseData = response.length > 0 ? response[0] : { error: 'No response received' };
    
    if ('error' in responseData) {
      return Response.json(responseData, { status: 500 });
    }
    
    // Type assertion since responseData structure is dynamic
    const apiResponse = responseData as any;
    return Response.json(apiResponse.body || apiResponse, { status: apiResponse.status || 200 });
  } catch (error) {
    console.error('API POST Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const body = await request.json();
    
    const result = await API.request({
      method: 'PUT',
      path: path,
      body: body,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    const response = await API._waitForResponse({ request: result.request });
    const responseData = response.length > 0 ? response[0] : { error: 'No response received' };
    
    if ('error' in responseData) {
      return Response.json(responseData, { status: 500 });
    }
    
    // Type assertion since responseData structure is dynamic
    const apiResponse = responseData as any;
    return Response.json(apiResponse.body || apiResponse, { status: apiResponse.status || 200 });
  } catch (error) {
    console.error('API PUT Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const result = await API.request({
      method: 'DELETE',
      path: path,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    const response = await API._waitForResponse({ request: result.request });
    const responseData = response.length > 0 ? response[0] : { error: 'No response received' };
    
    if ('error' in responseData) {
      return Response.json(responseData, { status: 500 });
    }
    
    // Type assertion since responseData structure is dynamic
    const apiResponse = responseData as any;
    return Response.json(apiResponse.body || apiResponse, { status: apiResponse.status || 200 });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
