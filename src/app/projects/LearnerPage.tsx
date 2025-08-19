'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Carousel from '@/components/Carousel';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { useAuth, ROLES } from '@/lib/auth-context';
import { demoProjects } from '@/lib/demo/projects';

interface Project {
  id: string;
  title: string;
  image: string;
  description: string;
  industry: string;
  domain: string;
  difficulty: string;
  estimatedHours: number;
  requiredSkills: string[];
  deliverables: string[];
  status: string;
  tags: string[];
  aiGenerated: boolean;
  createdAt: string;
  scope?: string;
  learningObjectives?: string[];
}

// Function to get project image based on industry/domain
const getProjectImage = (industry: string, domain: string) => {
  const seed = `${industry}-${domain}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/800/450`;
};

// Function to get difficulty color
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 'bg-green-500';
    case 'intermediate': return 'bg-yellow-500';
    case 'advanced': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user, viewAsRole, setViewAsRole, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groupedProjects, setGroupedProjects] = useState<{ [key: string]: Project[] }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    industry: '',
    domain: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    scope: '',
    learningObjectives: [''],
    industry: '',
    domain: '',
    difficulty: 'beginner',
    estimatedHours: 20,
    requiredSkills: [''],
    deliverables: ['']
  });
  const [aiFormData, setAiFormData] = useState({
    industry: '',
    domain: '',
    learningObjectives: [''],
    difficulty: 'beginner',
    estimatedHours: 20
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchProjects(1, false);
  }, [filters]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProjects();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, currentPage]);

  const fetchProjects = async (page: number = 1, appendToExisting: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      // Add filters
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.domain) params.append('domain', filters.domain);

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        let allProjects = data.projects || [];
        
        if (appendToExisting && page > 1) {
          allProjects = [...projects, ...allProjects];
          setProjects(allProjects);
        } else {
          setProjects(allProjects);
        }

        // Group projects by industry
        const grouped = allProjects.reduce((acc: { [key: string]: Project[] }, project: Project) => {
          acc[project.industry] = acc[project.industry] || [];
          acc[project.industry].push(project);
          return acc;
        }, {});
        setGroupedProjects(grouped);
        
        setHasMore(data.pagination?.hasMore || false);
        setTotalProjects(data.pagination?.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProjects = () => {
    if (!loadingMore && hasMore) {
      fetchProjects(currentPage + 1, true);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const objectives = formData.learningObjectives.filter(obj => obj.trim() !== '');
      const skills = formData.requiredSkills.filter(skill => skill.trim() !== '');
      const deliverables = formData.deliverables.filter(del => del.trim() !== '');

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          learningObjectives: objectives,
          requiredSkills: skills,
          deliverables: deliverables
        })
      });

      if (response.ok) {
        await fetchProjects();
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const objectives = aiFormData.learningObjectives.filter(obj => obj.trim() !== '');

      const response = await fetch('/api/projects/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aiFormData,
          learningObjectives: objectives
        })
      });

      if (response.ok) {
        await fetchProjects();
        setShowAiForm(false);
        setAiFormData({
          industry: '',
          domain: '',
          learningObjectives: [''],
          difficulty: 'beginner',
          estimatedHours: 20
        });
      }
    } catch (error) {
      console.error('Failed to generate AI project:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      scope: '',
      learningObjectives: [''],
      industry: '',
      domain: '',
      difficulty: 'beginner',
      estimatedHours: 20,
      requiredSkills: [''],
      deliverables: ['']
    });
  };

  const addArrayField = (field: keyof typeof formData, value: string = '') => {
    const current = formData[field] as string[];
    setFormData({
      ...formData,
      [field]: [...current, value]
    });
  };

  const updateArrayField = (field: keyof typeof formData, index: number, value: string) => {
    const current = formData[field] as string[];
    const updated = [...current];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const removeArrayField = (field: keyof typeof formData, index: number) => {
    const current = formData[field] as string[];
    const updated = current.filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updated });
  };

  const filteredProjects = projects.filter(project => {
    return (
      (!filters.difficulty || project.difficulty === filters.difficulty) &&
      (!filters.industry || project.industry.toLowerCase().includes(filters.industry.toLowerCase())) &&
      (!filters.domain || project.domain.toLowerCase().includes(filters.domain.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 dark:border-white/20 border-black/20 dark:border-t-white border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-black dark:text-white">Loading amazing projects...</div>
        </div>
      </div>
    );
  }

  // Check if user is viewing as learner but is actually a manager
  const isViewingAsLearner = viewAsRole === ROLES.LEARNER && 
    (hasRole(ROLES.EDUCATOR) || hasRole(ROLES.MANAGER) || hasRole(ROLES.PLATFORM_ADMIN));

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {/* Back to Manager View Banner */}
      {isViewingAsLearner && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-blue-600 text-white px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">You're viewing as a Learner</span>
            </div>
            <button
              onClick={() => {
                setViewAsRole(null);
                router.push('/projects');
              }}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Back to Manager View
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section with Featured Project */}
      {projects.length > 0 && (
        <div className="relative">
          <Carousel 
            heroMode={true} 
            autoPlay={true} 
            interval={10000}
            showProgress={true}
            itemWidthClass="w-full"
          >
            {projects.slice(0, 3).map((project, index) => {

              return (
                <div key={project.id} className="hero-project">
                  <img
                    src={project.image || getProjectImage(project.industry, project.domain)}
                    alt={project.title}
                    className="hero-project-image"
                  />
                  <div className="hero-project-overlay" />
                  <div className="hero-project-content">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-3 mb-6">
                        <span className={`w-3 h-3 rounded-full ${getDifficultyColor(project.difficulty)}`} />
                        <span className="text-sm uppercase tracking-wide text-gray-300 font-medium">
                          {project.difficulty} • {project.estimatedHours}h
                        </span>
                        {project.aiGenerated && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                            AI Generated
                          </span>
                        )}
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                          Available Now
                        </span>
                      </div>
                      <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight text-white break-words hyphens-auto max-w-4xl">{project.title}</h1>
                      <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed line-clamp-3 max-w-2xl">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4 mb-8 text-lg text-gray-400">
                        <span>{project.industry}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>{project.domain}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            handleProjectClick(project);
                          }}
                          className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-3 text-lg shadow-lg"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Apply Now
                        </button>
                        <button className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm text-lg border border-white/20">
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>
      )}

      {/* Content Sections */}
      <div className={`px-4 lg:px-8 pb-8 space-y-20 max-w-full overflow-hidden ${isViewingAsLearner ? 'pt-24' : 'pt-16'}`}>
        {/* Categories Section */}
        <div className="space-y-20">
          {/* Popular Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Popular Projects</h2>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg font-medium transition-colors">
                See All
              </button>
            </div>
                        {projects.length > 0 && (
              <div className="py-0">         
                <Carousel itemWidthClass="w-72">
                {projects.slice(0, 8).map((project, index) => (
                  <div 
                    key={project.id} 
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:z-20 h-90 flex flex-col"
                    onClick={() => handleProjectClick(project)}
                  >
                <div className="relative h-40 overflow-hidden  flex-shrink-0">
                  <img
                    src={project.image || getProjectImage(project.industry, project.domain)}
                    alt={project.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getDifficultyColor(project.difficulty)}`} />
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                      {project.difficulty}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-white bg-green-500/80 px-2 py-1 rounded-full">
                      {project.status === 'active' ? 'Available' : project.status}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm mt-auto">
                    <span className="text-gray-500 dark:text-gray-400">
                      {project.estimatedHours} hours
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        {project.industry}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        {project.domain}
                      </span>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        )}
        </div>

        { /* for each grouped project, show a carousel of projects */}
        {Object.entries(groupedProjects).map(([industry, projects]) => (
          <div key={industry}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{industry}</h2>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg font-medium transition-colors">
                See All
              </button>
            </div>
            <div className="py-0">
              <Carousel itemWidthClass="w-72">
              {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:z-20 h-80 flex flex-col"
                onClick={() => handleProjectClick(project)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={project.image || getProjectImage(project.industry, project.domain)}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <button className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors">
                      Apply Now
                    </button>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                      Learn More →
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm">4.{index + 5}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </Carousel>
          </div>
        </div>
        ))}
        
        {/* Load More Button / Loading Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
              Loading more projects...
            </div>
          </div>
        )}
        
        {hasMore && !loadingMore && projects.length > 0 && (
          <div className="flex justify-center py-12">
            <button
              onClick={loadMoreProjects}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Load More Projects
            </button>
          </div>
        )}
        
        {!hasMore && projects.length > 0 && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              You've explored all {totalProjects} available projects!
            </div>
          </div>
        )}
        
        {projects.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-gray-500 dark:text-gray-400 text-xl mb-4">
              No projects available yet.
            </div>
            <p className="text-gray-400 dark:text-gray-500">
              Check back soon for exciting new projects!
            </p>
          </div>
        )}
        
        </div>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}
