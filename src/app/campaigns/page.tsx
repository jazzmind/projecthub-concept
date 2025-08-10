'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  currentParticipants: number;
  participantLimit?: number;
  contactEmail: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    educationOrganizationId: '',
    learningObjectives: [''],
    startDate: '',
    contactEmail: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const objectives = formData.learningObjectives.filter(obj => obj.trim() !== '');
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          learningObjectives: objectives,
          startDate: new Date(formData.startDate)
        })
      });

      if (response.ok) {
        await fetchCampaigns();
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          educationOrganizationId: '',
          learningObjectives: [''],
          startDate: '',
          contactEmail: ''
        });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const addLearningObjective = () => {
    setFormData({
      ...formData,
      learningObjectives: [...formData.learningObjectives, '']
    });
  };

  const updateLearningObjective = (index: number, value: string) => {
    const objectives = [...formData.learningObjectives];
    objectives[index] = value;
    setFormData({ ...formData, learningObjectives: objectives });
  };

  const removeLearningObjective = (index: number) => {
    const objectives = formData.learningObjectives.filter((_, i) => i !== index);
    setFormData({ ...formData, learningObjectives: objectives });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Educational Campaigns</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create Campaign
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="label">Campaign Name</label>
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
              <label className="label">Education Organization ID</label>
              <input
                type="text"
                className="input"
                value={formData.educationOrganizationId}
                onChange={(e) => setFormData({ ...formData, educationOrganizationId: e.target.value })}
                placeholder="Enter organization ID"
                required
              />
            </div>

            <div>
              <label className="label">Learning Objectives</label>
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={objective}
                    onChange={(e) => updateLearningObjective(index, e.target.value)}
                    placeholder={`Learning objective ${index + 1}`}
                  />
                  {formData.learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLearningObjective(index)}
                      className="btn btn-secondary px-3"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLearningObjective}
                className="btn btn-secondary text-sm"
              >
                Add Objective
              </button>
            </div>

            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Create Campaign
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
        {campaigns.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No campaigns found. Create your first campaign!</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{campaign.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div>Participants: {campaign.currentParticipants}{campaign.participantLimit ? `/${campaign.participantLimit}` : ''}</div>
                <div>Contact: {campaign.contactEmail}</div>
                <div>Start Date: {new Date(campaign.startDate).toLocaleDateString()}</div>
                {campaign.endDate && (
                  <div>End Date: {new Date(campaign.endDate).toLocaleDateString()}</div>
                )}
                <div>Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t flex space-x-2">
                <button className="btn btn-primary flex-1 text-sm">
                  View Details
                </button>
                <button className="btn btn-secondary flex-1 text-sm">
                  Manage Teams
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
