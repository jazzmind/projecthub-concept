'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  description: string;
  status: string;
  maxStudents: number;
  currentStudents: number;
  teamType: string;
  isPublic: boolean;
  createdAt: string;
}

export default function ManagerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignId: '',
    maxStudents: 5,
    teamType: 'student_only',
    isPublic: true,
    requiresApproval: false
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTeams();
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          campaignId: '',
          maxStudents: 5,
          teamType: 'student_only',
          isPublic: true,
          requiresApproval: false
        });
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="label">Team Name</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Campaign ID (Required)</label>
              <input
                type="text"
                className="input"
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                placeholder="Enter campaign ID"
                required
              />
            </div>

            <div>
              <label className="label">Maximum Students</label>
              <input
                type="number"
                className="input"
                min="1"
                max="20"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="label">Team Type</label>
              <select
                className="input"
                value={formData.teamType}
                onChange={(e) => setFormData({ ...formData, teamType: e.target.value })}
              >
                <option value="student_only">Student Only</option>
                <option value="with_expert">With Expert</option>
                <option value="with_industry">With Industry Partner</option>
                <option value="full_collaboration">Full Collaboration</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                Public Team
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="mr-2"
                />
                Requires Approval
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Create Team
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No teams found. Create your first team!</p>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{team.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  team.status === 'active' ? 'bg-green-100 text-green-800' :
                  team.status === 'forming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {team.status}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{team.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div>Students: {team.currentStudents}/{team.maxStudents}</div>
                <div>Type: {team.teamType.replace('_', ' ')}</div>
                <div>Public: {team.isPublic ? 'Yes' : 'No'}</div>
                <div>Created: {new Date(team.createdAt).toLocaleDateString()}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button className="btn btn-primary w-full">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
