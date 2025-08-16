'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminOnlyRoute } from '@/components/ProtectedRoute';

type Organization = {
  id: string;
  name: string;
  description: string;
  domain: string;
  organizationType: string;
  contactEmail: string;
  website?: string | null;
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error(`Failed to load organizations (${res.status})`);
      
      // Handle empty response gracefully
      const text = await res.text();
      if (!text) {
        console.log('[DEBUG] Empty response from /api/organizations');
        setOrganizations([]);
        return;
      }
      
      const data = JSON.parse(text);
      console.log('[DEBUG] Organizations response:', data);
      
      // API may return { organizations: [...] }, { body: [...] }, or just [...]
      const list = data.organizations || (Array.isArray(data) ? data : (data.body ?? data));
      setOrganizations(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error('[DEBUG] Error fetching organizations:', e);
      setError(e.message ?? 'Failed to load organizations');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  return (
    <AdminOnlyRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setIsCreating(true)}
          >
            New Organization
          </button>
        </div>

        {isCreating && (
          <OrganizationCreateForm
            onCancel={() => setIsCreating(false)}
            onCreated={() => {
              setIsCreating(false);
              fetchOrgs();
            }}
          />
        )}

        {isLoading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} org={org} onUpdated={fetchOrgs} />
            ))}
          </div>
        )}
      </div>
    </AdminOnlyRoute>
  );
}

function OrganizationCard({ org, onUpdated }: { org: Organization; onUpdated: () => void }) {
  const [showMembers, setShowMembers] = useState<boolean>(false);

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-medium">{org.name}</div>
          <div className="text-sm text-gray-500">{org.domain}</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="px-3 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700"
            href={`/admin/organizations/${org.id}`}
          >
            Manage
          </a>
          <button
            className="px-3 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowMembers((v) => !v)}
          >
            {showMembers ? 'Hide Members' : 'View Members'}
          </button>
        </div>
      </div>
      {showMembers && (
        <div className="mt-4">
          <OrganizationMembers organizationId={org.id} />
        </div>
      )}
    </div>
  );
}

function OrganizationCreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('education');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const canSave = useMemo(() => name && domain && type, [name, domain, type]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, domain, type, website })
      });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      onCreated();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="border rounded-lg p-4 mb-6 bg-white dark:bg-gray-800" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2 bg-transparent" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select className="w-full border rounded px-3 py-2 bg-transparent" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="education">Education</option>
            <option value="industry">Industry</option>
            <option value="government">Government</option>
            <option value="nonprofit">Nonprofit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input className="w-full border rounded px-3 py-2 bg-transparent" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>
      {error && <div className="text-red-600 mt-3">{error}</div>}
      <div className="mt-4 flex gap-2">
        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" disabled={!canSave || saving}>
          {saving ? 'Creating...' : 'Create'}
        </button>
        <button type="button" className="px-4 py-2 rounded-md border" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${organizationId}/members`);
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.body ?? data);
      setMembers(list ?? []);
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
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Members</h3>
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
          {members.length === 0 && (
            <li className="text-sm text-gray-500">No members yet</li>
          )}
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
      
      if (!memberRes.ok) throw new Error(`Failed to add member (${userRes.status})`);
      
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
        className="px-3 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700"
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


