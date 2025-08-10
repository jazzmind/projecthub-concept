'use client';

import { useState, useEffect } from 'react';

interface Expert {
  id: string;
  name: string;
  email: string;
  bio: string;
  expertiseDomains: string[];
  organizationId?: string;
  linkedinUrl?: string;
  website?: string;
  availability: string;
  hourlyRate?: number;
  rating: number;
  totalProjects: number;
  languages: string[];
  timezone: string;
  createdAt: string;
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    availability: '',
    domain: '',
    minRating: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    expertiseDomains: [''],
    organizationId: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      const response = await fetch('/api/experts');
      if (response.ok) {
        const data = await response.json();
        setExperts(data.experts || []);
      }
    } catch (error) {
      console.error('Failed to fetch experts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const domains = formData.expertiseDomains.filter(domain => domain.trim() !== '');
      const response = await fetch('/api/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expertiseDomains: domains
        })
      });

      if (response.ok) {
        await fetchExperts();
        setShowCreateForm(false);
        setFormData({
          name: '',
          email: '',
          bio: '',
          expertiseDomains: [''],
          organizationId: '',
          timezone: 'UTC'
        });
      }
    } catch (error) {
      console.error('Failed to create expert:', error);
    }
  };

  const addExpertiseDomain = () => {
    setFormData({
      ...formData,
      expertiseDomains: [...formData.expertiseDomains, '']
    });
  };

  const updateExpertiseDomain = (index: number, value: string) => {
    const domains = [...formData.expertiseDomains];
    domains[index] = value;
    setFormData({ ...formData, expertiseDomains: domains });
  };

  const removeExpertiseDomain = (index: number) => {
    const domains = formData.expertiseDomains.filter((_, i) => i !== index);
    setFormData({ ...formData, expertiseDomains: domains });
  };

  const filteredExperts = experts.filter(expert => {
    return (
      (!filters.availability || expert.availability === filters.availability) &&
      (!filters.domain || expert.expertiseDomains.some(domain => 
        domain.toLowerCase().includes(filters.domain.toLowerCase())
      )) &&
      (expert.rating >= filters.minRating)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading experts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Domain Experts</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Add Expert
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filter Experts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Availability</label>
            <select
              className="input"
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div>
            <label className="label">Expertise Domain</label>
            <input
              type="text"
              className="input"
              placeholder="Search by domain"
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Minimum Rating</label>
            <select
              className="input"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Add New Expert</h2>
          <form onSubmit={handleCreateExpert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                className="input min-h-24 resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief professional bio..."
                required
              />
            </div>

            <div>
              <label className="label">Expertise Domains</label>
              {formData.expertiseDomains.map((domain, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={domain}
                    onChange={(e) => updateExpertiseDomain(index, e.target.value)}
                    placeholder={`Expertise domain ${index + 1}`}
                  />
                  {formData.expertiseDomains.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpertiseDomain(index)}
                      className="btn btn-secondary px-3"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExpertiseDomain}
                className="btn btn-secondary text-sm"
              >
                Add Domain
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Organization ID (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  placeholder="Leave blank if independent"
                />
              </div>
              <div>
                <label className="label">Timezone</label>
                <input
                  type="text"
                  className="input"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="e.g. UTC, EST, PST"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Add Expert
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
        {filteredExperts.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No experts found. Add your first expert!</p>
          </div>
        ) : (
          filteredExperts.map((expert) => (
            <div key={expert.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{expert.name}</h3>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    expert.availability === 'available' ? 'bg-green-100 text-green-800' :
                    expert.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {expert.availability}
                  </span>
                  {expert.rating > 0 && (
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium ml-1">{expert.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">{expert.bio}</p>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Expertise:</div>
                <div className="flex flex-wrap gap-1">
                  {expert.expertiseDomains.slice(0, 3).map((domain, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {domain}
                    </span>
                  ))}
                  {expert.expertiseDomains.length > 3 && (
                    <span className="text-xs text-gray-500">+{expert.expertiseDomains.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500 mb-4">
                <div>Projects completed: {expert.totalProjects}</div>
                {expert.hourlyRate && (
                  <div>Rate: ${expert.hourlyRate}/hour</div>
                )}
                <div>Timezone: {expert.timezone}</div>
                {expert.languages.length > 0 && (
                  <div>Languages: {expert.languages.join(', ')}</div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Added: {new Date(expert.createdAt).toLocaleDateString()}
              </div>
              
              <div className="pt-4 border-t flex space-x-2">
                <button className="btn btn-primary flex-1 text-sm">
                  View Profile
                </button>
                <button className="btn btn-secondary flex-1 text-sm">
                  Contact
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
