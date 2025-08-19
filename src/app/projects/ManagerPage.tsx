'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ROLES } from '@/lib/auth-context';
import FileDropZone from '@/components/FileDropZone';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  industry: string;
  domain: string;
  difficulty: string;
  estimatedHours: number;
  deliverables: string[];
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  scope?: string;
  learningObjectives?: string[];
}

interface ProjectFormData {
  title: string;
  description: string;
  image: string;
  industry: string;
  domain: string;
  difficulty: string;
  estimatedHours: number;
  deliverables: string[];
  scope?: string;
  learningObjectives?: string[];
}

// Function to get project image based on industry/domain
const getProjectImage = (industry: string, domain: string) => {
  const seed = `${industry}-${domain}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/600/340`;
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

export default function ManagerProjectsPage() {
  const router = useRouter();
  const { setViewAsRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    domain: '',
    status: ''
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFileDropZone, setShowFileDropZone] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    image: '',
    industry: '',
    domain: '',
    difficulty: 'beginner',
    estimatedHours: 20,
    deliverables: [],
    scope: '',
    learningObjectives: [],
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
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) {
        return;
      }
      loadMoreProjects();
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
        limit: '10'
      });

      // Add filters
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (appendToExisting && page > 1) {
          setProjects(prev => [...prev, ...data.projects]);
        } else {
          setProjects(data.projects || []);
        }
        setHasMore(data.pagination?.hasMore || false);
        setTotalProjects(data.pagination?.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch projects');
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

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          project: `project-${Date.now()}`, // Generate unique project ID
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to create project: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchProjects();
        setShowEditModal(false);
        setSelectedProject(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to update project: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
        setShowDeleteModal(false);
        setSelectedProject(null);
      } else {
        const error = await response.json();
        alert(`Failed to delete project: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const openEditModal = (project: Project) => {
    // Switch to new detail modal for view/edit inline
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      industry: '',
      domain: '',
      difficulty: 'beginner',
      estimatedHours: 20,
      deliverables: [],
      scope: '',
      learningObjectives: [],
    });
  };

  const handleFilesSelected = async (files: File[]) => {
    try {
      console.log(`Processing ${files.length} files for project extraction`);
      // Files are processed by the FileDropZone component
      // Refresh the projects list to show newly extracted projects
      await fetchProjects();
      setShowFileDropZone(false);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Failed to process files. Please try again.');
    }
  };

  const handleArrayFieldChange = (field: keyof ProjectFormData, value: string, action: 'add' | 'remove') => {
    const currentArray = formData[field] as string[];
    if (action === 'add' && value.trim() && !currentArray.includes(value.trim())) {
      setFormData({
        ...formData,
        [field]: [...currentArray, value.trim()]
      });
    } else if (action === 'remove') {
      setFormData({
        ...formData,
        [field]: currentArray.filter(item => item !== value)
      });
    }
  };

  // No need for client-side filtering since we're doing server-side filtering

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-900 dark:text-white">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-16 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create, edit, and manage project templates
                {totalProjects > 0 && (
                  <span className="ml-2 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {totalProjects} total projects
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setViewAsRole(ROLES.LEARNER);
                  // Store in localStorage for persistence across page loads
                  localStorage.setItem('viewAsRole', ROLES.LEARNER);
                  // Use Next.js router for navigation
                  router.push('/projects');
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View as Learner
              </button>
              <button
                onClick={() => setShowFileDropZone(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import from Files
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {viewMode === 'grid' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Media">Media</option>
              <option value="Energy">Energy</option>
              <option value="Transportation">Transportation</option>
              <option value="Real Estate">Real Estate</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {projects.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No projects found. Create your first project!
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {projects.map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => openEditModal(project)}
                onKeyDown={(e) => { if (e.key === 'Enter') openEditModal(project); }}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 ${
                  viewMode === 'list' ? 'flex items-center p-6' : 'flex flex-col h-[28rem]'
                }`}
              >
                {viewMode === 'grid' && (
                  <div className="relative h-40 overflow-hidden flex-shrink-0">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getDifficultyColor(project.difficulty)}`} />
                      <span className="text-[11px] text-white/90 bg-black/40 px-2 py-0.5 rounded-full">
                        {project.difficulty}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-[11px] text-white px-2 py-0.5 rounded-full shadow ${
                        project.status === 'active' ? 'bg-green-500/80' :
                        project.status === 'draft' ? 'bg-yellow-500/80' : 'bg-gray-500/80'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                )}

                <div className={`p-5 ${viewMode === 'grid' ? 'flex flex-col flex-1' : 'flex-1'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[1.05rem] font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 pr-2">
                      {project.title}
                    </h3>
                    {/* <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                        className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="View / Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal(project); }}
                        className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div> */}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-[13px] mb-4 line-clamp-3 flex-1">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px] mb-4">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/60 dark:text-blue-200">
                      {project.industry}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900/60 dark:text-purple-200">
                      {project.domain}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(project.difficulty)} text-white`}>
                      {project.difficulty}
                    </span>
                  </div>

                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-auto">
                    <p>Est. Hours: {project.estimatedHours}</p>
                    <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button / Loading Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                Loading more projects...
              </div>
            </div>
          )}
          
          {hasMore && !loadingMore && projects.length > 0 && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMoreProjects}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Load More Projects
              </button>
            </div>
          )}
          
          {!hasMore && projects.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                You've reached the end! All {totalProjects} projects loaded.
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {showCreateModal ? 'Create New Project' : 'Edit Project'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Technology, Healthcare"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domain *
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Web Development, AI/ML"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Hours *
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe the project objectives and goals"
                  required
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Scope
                </label>
                <textarea
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Define the project scope and boundaries"
                />
              </div>

              {/* Required Skills
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {skill}
                      <button
                        onClick={() => handleArrayFieldChange('requiredSkills', skill, 'remove')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a skill and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayFieldChange('requiredSkills', e.currentTarget.value, 'add');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div> */}

              {/* Deliverables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deliverables
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.deliverables.map((deliverable, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2 dark:bg-green-900 dark:text-green-200"
                    >
                      {deliverable}
                      <button
                        onClick={() => handleArrayFieldChange('deliverables', deliverable, 'remove')}
                        className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a deliverable and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayFieldChange('deliverables', e.currentTarget.value, 'add');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Learning Objectives
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.learningObjectives?.map((objective, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {objective}
                      <button
                        onClick={() => handleArrayFieldChange('learningObjectives', objective, 'remove')}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a learning objective and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayFieldChange('learningObjectives', e.currentTarget.value, 'add');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Tags */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {tag}
                      <button
                        onClick={() => handleArrayFieldChange('tags', tag, 'remove')}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleArrayFieldChange('tags', e.currentTarget.value, 'add');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div> */}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedProject(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Cancel
              </button>
              {showCreateModal && (
                <button
                  onClick={handleCreateProject}
                  disabled={!formData.title || !formData.description || !formData.industry || !formData.domain}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Drop Zone Modal */}
      {showFileDropZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Import Projects from Documents
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Upload PDF or Word documents to automatically extract project specifications
                  </p>
                </div>
                <button
                  onClick={() => setShowFileDropZone(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <FileDropZone 
                onFilesSelected={handleFilesSelected}
                className="mb-6"
              />
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">✨ AI Processing Features:</h3>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Automatically extracts project title, description, and scope</li>
                    <li>• Determines industry, domain, and difficulty level</li>
                    <li>• Identifies deliverables and estimates completion time</li>
                    <li>• Removes company names and personal information</li>
                    <li>• Generates educational project images</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">📋 Best Results Tips:</h3>
                  <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                    <li>• Include project descriptions, requirements, and objectives</li>
                    <li>• Documents with technical specifications work best</li>
                    <li>• SOWs, RFPs, and project briefs are ideal sources</li>
                    <li>• Multiple files will create separate projects</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Delete Project
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "<strong>{selectedProject.title}</strong>"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail View/Edit Modal */}
      {showDetailModal && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          // @ts-ignore - extended props supported in component
          onUpdated={(updated: any) => {
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
            setSelectedProject(updated);
          }}
        />
      )}
    </div>
  );
}