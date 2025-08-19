'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

interface DebugInfo {
  user: any;
  organizations: any[];
  currentOrganization: any;
  sessionInfo: any;
  memberships: any[];
  rawApiResponse: any;
}

export default function ProfilePage() {
  const { user, organizations, currentOrganization, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Fetch current user info
        const userResponse = await fetch('/api/auth/current-user');
        const userData = userResponse.ok ? await userResponse.json() : null;

        const orgsData = userData.availableOrganizations;

        // Fetch session info if available
        let sessionInfo = null;
        try {
          const sessionResponse = await fetch('/api/debug/session-info', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          sessionInfo = sessionResponse.ok ? await sessionResponse.json() : null;
        } catch (e) {
          console.warn('Session info endpoint not available');
        }

        // Fetch memberships if available
        let memberships = [];
        try {
          const membershipsResponse = await fetch('/api/debug/memberships', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          memberships = membershipsResponse.ok ? await membershipsResponse.json() : [];
        } catch (e) {
          console.warn('Memberships endpoint not available');
        }

        setDebugInfo({
          user: userData,
          organizations: orgsData?.organizations || [],
          currentOrganization,
          sessionInfo,
          memberships,
          rawApiResponse: {
            userApi: userData,
            orgsApi: orgsData
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    if (!isLoading) {
      fetchDebugInfo();
    }
  }, [isLoading, currentOrganization]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Profile & Debug Information
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Auth Context User */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Auth Context User
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Current Organization */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Organization (from Context)
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(currentOrganization, null, 2)}
            </pre>
          </div>

          {/* Organizations List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Organizations List (from Context)
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(organizations, null, 2)}
            </pre>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <>
              {/* Raw API Responses */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Raw API Responses
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      /api/auth/current-user Response:
                    </h3>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(debugInfo.rawApiResponse.userApi, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      /api/auth/organizations Response:
                    </h3>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(debugInfo.rawApiResponse.orgsApi, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              {debugInfo.sessionInfo && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Session Information
                  </h2>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.sessionInfo, null, 2)}
                  </pre>
                </div>
              )}

              {/* Memberships */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  User Memberships
                </h2>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.memberships, null, 2)}
                </pre>
              </div>
            </>
          )}

          {/* Manual Refresh Button */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Debug Actions
            </h2>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  } catch (e) {
                    console.error('Logout failed:', e);
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout & Re-login
              </button>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Environment Info
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>Local Storage Auth Keys:</strong></p>
              <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2">
                {Object.keys(localStorage)
                  .filter(key => key.includes('auth') || key.includes('session'))
                  .map(key => `${key}: ${localStorage.getItem(key)}`)
                  .join('\n') || 'None found'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}