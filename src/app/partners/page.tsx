'use client';

import { useState, useEffect } from 'react';

interface IndustryPartner {
  id: string;
  name: string;
  email: string;
  title: string;
  organizationId: string;
  focusAreas: string[];
  experienceLevel: string;
  timezone: string;
  status: string;
  lastContactedAt?: string;
  linkedinUrl?: string;
  phoneNumber?: string;
  createdAt: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<IndustryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    experienceLevel: '',
    focusArea: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    organizationId: '',
    focusAreas: [''],
    experienceLevel: 'mid',
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/industry-partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const focusAreas = formData.focusAreas.filter(area => area.trim() !== '');
      const response = await fetch('/api/industry-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          focusAreas
        })
      });

      if (response.ok) {
        await fetchPartners();
        setShowCreateForm(false);
        setFormData({
          name: '',
          email: '',
          title: '',
          organizationId: '',
          focusAreas: [''],
          experienceLevel: 'mid',
          timezone: 'UTC'
        });
      }
    } catch (error) {
      console.error('Failed to create partner:', error);
    }
  };

  const addFocusArea = () => {
    setFormData({
      ...formData,
      focusAreas: [...formData.focusAreas, '']
    });
  };

  const updateFocusArea = (index: number, value: string) => {
    const areas = [...formData.focusAreas];
    areas[index] = value;
    setFormData({ ...formData, focusAreas: areas });
  };

  const removeFocusArea = (index: number) => {
    const areas = formData.focusAreas.filter((_, i) => i !== index);
    setFormData({ ...formData, focusAreas: areas });
  };

  const filteredPartners = partners.filter(partner => {
    return (
      (!filters.status || partner.status === filters.status) &&
      (!filters.experienceLevel || partner.experienceLevel === filters.experienceLevel) &&
      (!filters.focusArea || partner.focusAreas.some(area => 
        area.toLowerCase().includes(filters.focusArea.toLowerCase())
      ))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading industry partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Industry Partners</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Add Partner
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filter Partners</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospective">Prospective</option>
            </select>
          </div>
          <div>
            <label className="label">Experience Level</label>
            <select
              className="input"
              value={filters.experienceLevel}
              onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="label">Focus Area</label>
            <input
              type="text"
              className="input"
              placeholder="Search by focus area"
              value={filters.focusArea}
              onChange={(e) => setFilters({ ...filters, focusArea: e.target.value })}
            />
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Add New Industry Partner</h2>
          <form onSubmit={handleCreatePartner} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Job Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Organization ID</label>
                <input
                  type="text"
                  className="input"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  placeholder="Enter organization ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Focus Areas</label>
              {formData.focusAreas.map((area, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={area}
                    onChange={(e) => updateFocusArea(index, e.target.value)}
                    placeholder={`Focus area ${index + 1}`}
                  />
                  {formData.focusAreas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFocusArea(index)}
                      className="btn btn-secondary px-3"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFocusArea}
                className="btn btn-secondary text-sm"
              >
                Add Focus Area
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Experience Level</label>
                <select
                  className="input"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
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
                Add Partner
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
        {filteredPartners.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No industry partners found. Add your first partner!</p>
          </div>
        ) : (
          filteredPartners.map((partner) => (
            <div key={partner.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  partner.status === 'active' ? 'bg-green-100 text-green-800' :
                  partner.status === 'prospective' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {partner.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div><strong>Title:</strong> {partner.title}</div>
                <div><strong>Email:</strong> {partner.email}</div>
                <div><strong>Experience:</strong> {partner.experienceLevel}</div>
                <div><strong>Timezone:</strong> {partner.timezone}</div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</div>
                <div className="flex flex-wrap gap-1">
                  {partner.focusAreas.slice(0, 3).map((area, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {area}
                    </span>
                  ))}
                  {partner.focusAreas.length > 3 && (
                    <span className="text-xs text-gray-500">+{partner.focusAreas.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                {partner.lastContactedAt ? (
                  <div>Last contacted: {new Date(partner.lastContactedAt).toLocaleDateString()}</div>
                ) : (
                  <div>Never contacted</div>
                )}
                <div>Added: {new Date(partner.createdAt).toLocaleDateString()}</div>
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
