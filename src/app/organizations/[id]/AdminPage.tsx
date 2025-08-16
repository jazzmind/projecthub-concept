'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminOnlyRoute } from '@/components/ProtectedRoute';
import { useParams } from 'next/navigation';

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [org, setOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${orgId}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const body = data?.body ?? data;
      setOrg(body?.organization ?? body);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchOrg();
  }, [orgId]);

  return (
    <AdminOnlyRoute>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && org && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">{org.name}</h1>
              <a className="px-3 py-1 rounded-md border" href="/admin/organizations">Back</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Domain" value={org.domain} />
              <DetailField label="Type" value={org.organizationType} />
              <DetailField label="Contact Email" value={org.contactEmail} />
              <DetailField label="Website" value={org.website} />
              <div className="md:col-span-2">
                <DetailField label="Description" value={org.description} />
              </div>
            </div>
            <section>
              <h2 className="text-xl font-medium mb-3">Members</h2>
              <MembersManager organizationId={org.id} />
            </section>
          </div>
        )}
      </div>
    </AdminOnlyRoute>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{value || '-'}</div>
    </div>
  );
}

function MembersManager({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${organizationId}/members`);
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      const data = await res.json();
      const body = data?.body ?? data;
      const list = body?.members ?? body;
      setMembers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Organization Members</div>
        <AddMemberModal organizationId={organizationId} onAdded={fetchMembers} />
      </div>
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="space-y-2">
          {members && members.length > 0 && members.map((m, idx) => (
            <li key={m.id ?? idx} className="text-sm flex items-center justify-between">
              <span>{m.memberEntity} — {m.roleEntity} — {m.status}</span>
            </li>
          ))}
          {members.length === 0 && <li className="text-sm text-gray-500">No members yet</li>}
        </ul>
      )}
    </div>
  );
}

function AddMemberModal({ organizationId, onAdded }: { organizationId: string; onAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState('org_member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberEntity: selectedUser.id, 
          roleEntity: role 
        })
      });
      if (!res.ok) throw new Error(`Failed to add member (${res.status})`);
      setIsOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      onAdded();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const createAndAddUser = async (userData: { name: string; email: string }) => {
    try {
      setSaving(true);
      setError(null);
      
      // First create the user
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!userRes.ok) throw new Error(`Failed to create user (${userRes.status})`);
      const newUser = await userRes.json();
      
      // Then add them to the organization
      const memberRes = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberEntity: newUser.id, 
          roleEntity: role 
        })
      });
      
      if (!memberRes.ok) throw new Error(`Failed to add member (${memberRes.status})`);
      
      setIsOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      onAdded();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create and add user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button 
        className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => setIsOpen(true)}
      >
        Add Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Add Member</h3>
            
            {/* Search Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search Users</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded px-3 py-2 bg-transparent"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
                <button
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                  onClick={() => searchUsers(searchQuery)}
                >
                  Search
                </button>
              </div>
              
              {/* Search Results */}
              {searching && <div className="text-sm text-gray-500 mt-2">Searching...</div>}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto border rounded">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-2 cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                className="w-full border rounded px-3 py-2 bg-transparent"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="org_member">Member</option>
                <option value="org_admin">Admin</option>
              </select>
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
              </div>
            )}

            {/* Create New User Section */}
            <div className="mb-4 p-3 border rounded">
              <h4 className="font-medium mb-2">Or Create New User</h4>
              <CreateUserForm onCreateUser={createAndAddUser} />
            </div>

            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              {selectedUser && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                  onClick={addMember}
                >
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateUserForm({ onCreateUser }: { onCreateUser: (userData: { name: string; email: string }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    setCreating(true);
    try {
      await onCreateUser({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="w-full border rounded px-2 py-1 bg-transparent text-sm"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="w-full border rounded px-2 py-1 bg-transparent text-sm"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        disabled={creating || !name.trim() || !email.trim()}
      >
        {creating ? 'Creating...' : 'Create & Add User'}
      </button>
    </form>
  );
}


