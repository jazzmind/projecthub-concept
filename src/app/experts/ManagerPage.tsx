'use client';

import { useState, useEffect } from 'react';
import Carousel from '@/components/Carousel';

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

// Function to get expert image based on expertise domains and name
const getExpertImage = (expertiseDomains: string[], name: string) => {
  const seed = `${expertiseDomains[0] || 'expert'}-${name}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/600/400`;
};

// Function to get availability color
const getAvailabilityColor = (availability: string) => {
  switch (availability.toLowerCase()) {
    case 'available': return 'bg-green-500';
    case 'limited': return 'bg-yellow-500';
    case 'unavailable': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

// Function to get rating stars
const getRatingStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  if (hasHalfStar) {
    stars.push('☆');
  }
  return stars.join('');
};

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
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

  // Demo experts for featured section
  const demoExperts: Expert[] = [
    {
      id: 'demo-1',
      name: 'Dr. Alex Chen',
      email: 'alex.chen@aiexperts.com',
      bio: 'Leading AI researcher and consultant with 15+ years experience in machine learning, natural language processing, and computer vision. Published 50+ papers and led teams at major tech companies.',
      expertiseDomains: ['Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'NLP'],
      organizationId: 'ai-experts-001',
      availability: 'available',
      hourlyRate: 200,
      rating: 4.9,
      totalProjects: 47,
      languages: ['English', 'Mandarin', 'Python'],
      timezone: 'PST',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-2',
      name: 'Maria Gonzalez',
      email: 'maria@cybersecpro.com',
      bio: 'Cybersecurity architect and ethical hacker with expertise in penetration testing, security audits, and compliance frameworks. CISSP and CEH certified.',
      expertiseDomains: ['Cybersecurity', 'Penetration Testing', 'Cloud Security', 'Compliance'],
      availability: 'available',
      hourlyRate: 175,
      rating: 4.8,
      totalProjects: 32,
      languages: ['English', 'Spanish'],
      timezone: 'EST',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-3',
      name: 'James Wright',
      email: 'james@blockchaindev.io',
      bio: 'Blockchain architect and smart contract developer specializing in DeFi protocols, NFT platforms, and enterprise blockchain solutions. Early Bitcoin and Ethereum contributor.',
      expertiseDomains: ['Blockchain', 'Smart Contracts', 'DeFi', 'Web3'],
      availability: 'limited',
      hourlyRate: 225,
      rating: 4.7,
      totalProjects: 28,
      languages: ['English', 'Solidity', 'Rust'],
      timezone: 'GMT',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

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

  const handleExpertClick = (expert: Expert) => {
    setSelectedExpert(expert);
    // Could open a detail modal here similar to projects
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
      <div className="min-h-screen bg-background dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-border/20 dark:border-white/20 border-t-foreground dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-foreground dark:text-white">Loading domain experts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-white">
      {/* Hero Section with Featured Expert */}
      {(experts.length > 0 || demoExperts.length > 0) && (
        <Carousel 
          heroMode={true} 
          autoPlay={true} 
          interval={8000}
          showProgress={true}
          itemWidthClass="w-full"
        >
          {(experts.length > 0 ? experts.slice(0, 3) : demoExperts).map((expert) => (
            <div key={expert.id} className="hero-project">
              <img
                src={getExpertImage(expert.expertiseDomains, expert.name)}
                alt={expert.name}
                className="hero-project-image"
              />
              <div className="hero-project-overlay" />
              <div className="hero-project-content">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${getAvailabilityColor(expert.availability)}`} />
                    <span className="text-sm uppercase tracking-wide text-gray-300 font-medium">
                      {expert.availability} • {expert.totalProjects} projects
                    </span>
                    {expert.rating > 0 && (
                      <span className="text-yellow-400 text-lg">
                        {getRatingStars(expert.rating)} {expert.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-6xl font-bold mb-4 leading-tight">{expert.name}</h1>
                  <p className="text-xl text-gray-300 mb-6 leading-relaxed line-clamp-3">
                    {expert.bio}
                  </p>
                  <div className="flex items-center gap-4 mb-6 text-lg text-gray-400">
                    <span>{expert.expertiseDomains[0]}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span>{expert.timezone}</span>
                    {expert.hourlyRate && (
                      <>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>${expert.hourlyRate}/hr</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {expert.expertiseDomains.slice(0, 4).map((domain, index) => (
                      <span key={index} className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                        {domain}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleExpertClick(expert)}
                      className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-3 text-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <button className="px-6 py-4 bg-gray-700/50 text-white font-semibold rounded-lg hover:bg-gray-600/50 transition-all duration-200 backdrop-blur-sm text-lg">
                      Hire Expert
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
          <h2 className="text-3xl font-bold text-foreground dark:text-white">Domain Experts</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Add Expert
          </button>
        </div>

        {/* Featured Experts */}
        <Carousel title="Top Rated Experts" itemWidthClass="w-80">
          {demoExperts.map((expert) => (
            <div 
              key={expert.id} 
              className="project-card"
              onClick={() => handleExpertClick(expert)}
            >
              <img
                src={getExpertImage(expert.expertiseDomains, expert.name)}
                alt={expert.name}
                className="project-card-image"
              />
              <div className="project-card-overlay" />
              <div className="project-card-content">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${getAvailabilityColor(expert.availability)}`} />
                  <span className="text-xs text-gray-300 uppercase tracking-wide">
                    {expert.availability}
                  </span>
                  {expert.rating > 0 && (
                    <span className="text-yellow-400 text-xs">
                      ★ {expert.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-1">{expert.name}</h3>
                <p className="text-sm text-gray-300 mb-2 line-clamp-2">{expert.bio}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {expert.expertiseDomains.slice(0, 2).map((domain) => (
                    <span key={domain} className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                      {domain}
                    </span>
                  ))}
                  {expert.expertiseDomains.length > 2 && (
                    <span className="text-xs text-gray-400">+{expert.expertiseDomains.length - 2}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{expert.totalProjects} projects</span>
                  {expert.hourlyRate && <span>${expert.hourlyRate}/hr</span>}
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Filters */}
        <div className="bg-card/50 dark:bg-gray-900/50 rounded-2xl p-6 border border-border dark:border-gray-800 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-6 text-foreground dark:text-white">Find the Right Expert</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Availability</label>
              <select
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filters.availability}
                onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
              >
                <option value="">All Availability</option>
                <option value="available">🟢 Available</option>
                <option value="limited">🟡 Limited</option>
                <option value="unavailable">🔴 Unavailable</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Expertise Domain</label>
              <input
                type="text"
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Search by domain expertise"
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-gray-300">Minimum Rating</label>
              <select
                className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              >
                <option value={0}>Any Rating</option>
                <option value={3}>⭐⭐⭐ 3+ Stars</option>
                <option value={4}>⭐⭐⭐⭐ 4+ Stars</option>
                <option value={4.5}>⭐⭐⭐⭐⭐ 4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Experts */}
        {filteredExperts.length > 0 && (
          <Carousel title="Your Experts" itemWidthClass="w-80">
            {filteredExperts.map((expert) => (
              <div 
                key={expert.id} 
                className="project-card"
                onClick={() => handleExpertClick(expert)}
              >
                <img
                  src={getExpertImage(expert.expertiseDomains, expert.name)}
                  alt={expert.name}
                  className="project-card-image"
                />
                <div className="project-card-overlay" />
                <div className="project-card-content">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${getAvailabilityColor(expert.availability)}`} />
                    <span className="text-xs text-gray-300 uppercase tracking-wide">
                      {expert.availability}
                    </span>
                    {expert.rating > 0 && (
                      <span className="text-yellow-400 text-xs">
                        ★ {expert.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{expert.name}</h3>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{expert.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {expert.expertiseDomains.slice(0, 2).map((domain) => (
                      <span key={domain} className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                        {domain}
                      </span>
                    ))}
                    {expert.expertiseDomains.length > 2 && (
                      <span className="text-xs text-gray-400">+{expert.expertiseDomains.length - 2}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{expert.totalProjects} projects</span>
                    {expert.hourlyRate && <span>${expert.hourlyRate}/hr</span>}
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        )}

        {/* Empty State */}
        {filteredExperts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-muted-foreground dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-muted-foreground dark:text-gray-300 mb-2">No experts found</h3>
            <p className="text-muted-foreground dark:text-gray-500 mb-6">Add your first domain expert or adjust your filters</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Add Your First Expert
            </button>
          </div>
        )}
      </div>

      {/* Create Expert Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card dark:bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Add New Expert</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateExpert} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter expert's full name"
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
                    placeholder="expert@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground dark:text-gray-300">Bio</label>
                <textarea
                  className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-24 resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief professional bio and expertise summary"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground dark:text-gray-300">Expertise Domains</label>
                {formData.expertiseDomains.map((domain, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={domain}
                      onChange={(e) => updateExpertiseDomain(index, e.target.value)}
                      placeholder={`Expertise domain ${index + 1}`}
                    />
                    {formData.expertiseDomains.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExpertiseDomain(index)}
                        className="px-3 py-3 bg-muted dark:bg-gray-700 hover:bg-muted/80 dark:hover:bg-gray-600 text-foreground dark:text-white rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExpertiseDomain}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  + Add Another Domain
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-gray-300">Organization ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-input dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg px-4 py-3 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    placeholder="Leave blank if independent"
                  />
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
                  Add Expert
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