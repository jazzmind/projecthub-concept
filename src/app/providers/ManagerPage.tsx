'use client';

import { useState, useEffect } from 'react';
import Carousel from '@/components/Carousel';

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

// Function to get partner image based on focus areas and name
const getPartnerImage = (focusAreas: string[], name: string) => {
  const seed = `${focusAreas[0] || 'business'}-${name}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/600/400`;
};

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-500';
    case 'prospective': return 'bg-blue-500';
    case 'inactive': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

// Function to get experience level color
const getExperienceColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'executive': return 'bg-purple-500';
    case 'senior': return 'bg-blue-500';
    case 'mid': return 'bg-green-500';
    case 'junior': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<IndustryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<IndustryPartner | null>(null);
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

  // Demo partners for featured section
  const demoPartners: IndustryPartner[] = [
    {
      id: 'demo-1',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      title: 'VP of Innovation',
      organizationId: 'techcorp-001',
      focusAreas: ['AI/ML', 'Cloud Computing', 'Digital Transformation'],
      experienceLevel: 'executive',
      timezone: 'PST',
      status: 'active',
      lastContactedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-2',
      name: 'Marcus Johnson',
      email: 'marcus@greenenergy.com',
      title: 'Head of Partnerships',
      organizationId: 'greenenergy-002',
      focusAreas: ['Sustainability', 'Clean Energy', 'Environmental Tech'],
      experienceLevel: 'senior',
      timezone: 'EST',
      status: 'active',
      lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-3',
      name: 'Dr. Emily Rodriguez',
      email: 'e.rodriguez@healthtech.com',
      title: 'Director of Strategic Alliances',
      organizationId: 'healthtech-003',
      focusAreas: ['Healthcare Technology', 'Medical Devices', 'Digital Health'],
      experienceLevel: 'senior',
      timezone: 'CST',
      status: 'prospective',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

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

  const handlePartnerClick = (partner: IndustryPartner) => {
    setSelectedPartner(partner);
    // Could open a detail modal here similar to projects
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
      <div className="min-h-screen bg-background dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-border/20 dark:border-white/20 border-t-foreground dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-foreground dark:text-white">Loading industry partners...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-white">
      {/* Hero Section with Featured Partner */}
      {(partners.length > 0 || demoPartners.length > 0) && (
        <Carousel 
          heroMode={true} 
          autoPlay={true} 
          interval={7000}
          showProgress={true}
          itemWidthClass="w-full"
        >
          {(partners.length > 0 ? partners.slice(0, 3) : demoPartners).map((partner) => (
            <div key={partner.id} className="hero-project">
              <img
                src={getPartnerImage(partner.focusAreas, partner.name)}
                alt={partner.name}
                className="hero-project-image"
              />
              <div className="hero-project-overlay" />
              <div className="hero-project-content">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(partner.status)}`} />
                    <span className={`w-3 h-3 rounded-full ${getExperienceColor(partner.experienceLevel)}`} />
                    <span className="text-sm uppercase tracking-wide text-gray-300 font-medium">
                      {partner.experienceLevel} • {partner.status}
                    </span>
                  </div>
                  <h1 className="text-6xl font-bold mb-4 leading-tight">{partner.name}</h1>
                  <h2 className="text-2xl text-gray-300 mb-6">{partner.title}</h2>
                  <div className="flex items-center gap-4 mb-6 text-lg text-gray-400">
                    <span>{partner.focusAreas[0]}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span>{partner.timezone}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {partner.focusAreas.slice(0, 4).map((area, index) => (
                      <span key={index} className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handlePartnerClick(partner)}
                      className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-3 text-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <button className="px-6 py-4 bg-gray-700/50 text-white font-semibold rounded-lg hover:bg-gray-600/50 transition-all duration-200 backdrop-blur-sm text-lg">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      )}

      {/* Content Sections */}
      <div className="px-8 pb-8 space-y-12">
        {/* Action Bar */}
        <div className="flex justify-between items-center pt-8">
          <h2 className="text-3xl font-bold text-foreground dark:text-white">Industry Partners</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Add Partner
          </button>
        </div>

        {/* Featured Partners */}
        <Carousel title="Expert Partners" itemWidthClass="w-80">
          {demoPartners.map((partner) => (
            <div 
              key={partner.id} 
              className="project-card"
              onClick={() => handlePartnerClick(partner)}
            >
              <img
                src={getPartnerImage(partner.focusAreas, partner.name)}
                alt={partner.name}
                className="project-card-image"
              />
              <div className="project-card-overlay" />
              <div className="project-card-content">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(partner.status)}`} />
                  <span className={`w-2 h-2 rounded-full ${getExperienceColor(partner.experienceLevel)}`} />
                  <span className="text-xs text-gray-300 uppercase tracking-wide">
                    {partner.experienceLevel} • {partner.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{partner.name}</h3>
                <p className="text-sm text-gray-300 mb-2">{partner.title}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {partner.focusAreas.slice(0, 2).map((area) => (
                    <span key={area} className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                      {area}
                    </span>
                  ))}
                  {partner.focusAreas.length > 2 && (
                    <span className="text-xs text-gray-400">+{partner.focusAreas.length - 2}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {partner.lastContactedAt ? 
                    `Last contact: ${new Date(partner.lastContactedAt).toLocaleDateString()}` :
                    'Never contacted'
                  }
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Filters */}
        <div className="bg-card/50 dark:bg-gray-900/50 rounded-2xl p-6 border border-border dark:border-gray-800 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-6 text-foreground dark:text-white">Find the Right Partners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Partnership Status</label>
              <select
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="active">🟢 Active</option>
                <option value="inactive">🔴 Inactive</option>
                <option value="prospective">🔵 Prospective</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Experience Level</label>
              <select
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
              >
                <option value="">All Levels</option>
                <option value="junior">🟡 Junior</option>
                <option value="mid">🟢 Mid-level</option>
                <option value="senior">🔵 Senior</option>
                <option value="executive">🟣 Executive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Focus Area</label>
              <input
                type="text"
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Search by expertise area"
                value={filters.focusArea}
                onChange={(e) => setFilters({ ...filters, focusArea: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* User Partners */}
        {filteredPartners.length > 0 && (
          <Carousel title="Your Partners" itemWidthClass="w-80">
            {filteredPartners.map((partner) => (
              <div 
                key={partner.id} 
                className="project-card"
                onClick={() => handlePartnerClick(partner)}
              >
                <img
                  src={getPartnerImage(partner.focusAreas, partner.name)}
                  alt={partner.name}
                  className="project-card-image"
                />
                <div className="project-card-overlay" />
                <div className="project-card-content">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(partner.status)}`} />
                    <span className={`w-2 h-2 rounded-full ${getExperienceColor(partner.experienceLevel)}`} />
                    <span className="text-xs text-gray-300 uppercase tracking-wide">
                      {partner.experienceLevel} • {partner.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{partner.name}</h3>
                  <p className="text-sm text-gray-300 mb-2">{partner.title}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {partner.focusAreas.slice(0, 2).map((area) => (
                      <span key={area} className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                        {area}
                      </span>
                    ))}
                    {partner.focusAreas.length > 2 && (
                      <span className="text-xs text-gray-400">+{partner.focusAreas.length - 2}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {partner.lastContactedAt ? 
                      `Last contact: ${new Date(partner.lastContactedAt).toLocaleDateString()}` :
                      'Never contacted'
                    }
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        )}

        {/* Empty State */}
        {filteredPartners.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-muted-foreground dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-muted-foreground dark:text-gray-300 mb-2">No partners found</h3>
            <p className="text-muted-foreground dark:text-gray-500 mb-6">Add your first industry partner or adjust your filters</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Add Your First Partner
            </button>
          </div>
        )}
      </div>

      {/* Create Partner Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card dark:bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Add New Industry Partner</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreatePartner} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter partner's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@company.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Job Title</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Director of Partnerships"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Organization ID</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    placeholder="org-123"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground dark:text-gray-300">Focus Areas</label>
                {formData.focusAreas.map((area, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={area}
                      onChange={(e) => updateFocusArea(index, e.target.value)}
                      placeholder={`Focus area ${index + 1}`}
                    />
                    {formData.focusAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFocusArea(index)}
                        className="px-3 py-3 bg-muted dark:bg-gray-700 hover:bg-muted/80 dark:hover:bg-gray-600 text-foreground dark:text-white rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFocusArea}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  + Add Another Focus Area
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Experience Level</label>
                  <select
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  >
                    <option value="junior">🟡 Junior</option>
                    <option value="mid">🟢 Mid-level</option>
                    <option value="senior">🔵 Senior</option>
                    <option value="executive">🟣 Executive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Timezone</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="e.g. UTC, EST, PST"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Add Partner
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-muted dark:bg-gray-700 hover:bg-muted/80 dark:hover:bg-gray-600 text-foreground dark:text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}