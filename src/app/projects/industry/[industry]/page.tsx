'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { useAuth, ROLES } from '@/lib/auth-context';

interface Project {
  id: string;
  title: string;
  image: string;
  description: string;
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

export default function IndustryProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, viewAsRole, setViewAsRole, hasRole } = useAuth();
  
  const industry = decodeURIComponent(params.industry as string);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isViewingAsLearner = viewAsRole === ROLES.LEARNER && 
    (hasRole(ROLES.EDUCATOR) || hasRole(ROLES.MANAGER) || hasRole(ROLES.PLATFORM_ADMIN));

  const fetchProjects = async (page: number = 1, appendToExisting: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12', // Show more projects per page
        industry: industry,
      });

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newProjects = data.projects || [];
        
        if (appendToExisting && page > 1) {
          setProjects(prev => [...prev, ...newProjects]);
        } else {
          setProjects(newProjects);
        }
        
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

  useEffect(() => {
    fetchProjects();
  }, [industry]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        if (!loadingMore && hasMore) {
          fetchProjects(currentPage + 1, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, currentPage]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 dark:border-white/20 border-black/20 dark:border-t-white border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-black dark:text-white">Loading {industry} projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground dark:text-white">
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
      
      {/* Header */}
      <div className={`px-4 lg:px-8 py-8 ${isViewingAsLearner ? 'pt-24' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Projects
            </button>
          </div>
          
          <div className="mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {industry} Projects
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Explore {totalProjects} projects in the {industry} industry
            </p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="px-4 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.image || getProjectImage(project.industry, project.domain)}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block w-3 h-3 rounded-full ${getDifficultyColor(project.difficulty)} ring-2 ring-white shadow-lg`} />
                    </div>
                    
                    {project.aiGenerated && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          AI Coach
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 min-h-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{project.difficulty}</span>
                        <span>•</span>
                        <span>{project.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm">4.{Math.floor(Math.random() * 5) + 5}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-500 dark:text-gray-400 text-xl mb-4">
                No projects found in {industry}.
              </div>
              <button
                onClick={() => router.push('/projects')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Explore Other Industries
              </button>
            </div>
          )}

          {/* Load More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                Loading more projects...
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && projects.length > 0 && (
            <div className="flex justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                You've explored all {totalProjects} {industry} projects!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
