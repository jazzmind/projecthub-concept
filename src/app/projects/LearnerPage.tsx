'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Carousel from '@/components/Carousel';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import ProjectApplicationModal from '@/components/ProjectApplicationModal';
import SkeletonProjectCard, { SkeletonHeroCard } from '@/components/SkeletonProjectCard';
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
  deliverables: string[];
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  scope?: string;
  learningObjectives?: string[];
}

interface IndustryStats {
  industry: string;
  count: number;
}

interface IndustrySection {
  industry: string;
  count: number;
  projects: Project[];
  loading: boolean;
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

// Convert demo project to Project interface
const convertDemoToProject = (demoProject: any, index: number): Project => ({
  id: `demo-${index}`,
  title: demoProject.title,
  image: demoProject.image || getProjectImage('Technology', 'Software'),
  description: demoProject.description || demoProject.summary || 'Exciting project opportunity',
  industry: 'Technology',
  domain: 'Software Development',
  difficulty: 'intermediate',
  estimatedHours: 20,
  deliverables: ['Working prototype', 'Documentation'],
  status: 'active',
  aiGenerated: true,
  createdAt: new Date().toISOString(),
  scope: demoProject.summary || 'Project scope',
  learningObjectives: ['Apply modern development practices']
});

export default function ProjectsPage() {
  const router = useRouter();
  const { user, viewAsRole, setViewAsRole, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);
  const [industrySections, setIndustrySections] = useState<{ [key: string]: IndustrySection }>({});
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [showSkeletonSections, setShowSkeletonSections] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
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
    fetchIndustryStats();
  }, []);

  // Refetch when filters change (for now we'll disable filtering in the new approach)
  // useEffect(() => {
  //   fetchIndustryStats();
  // }, [filters]);

  // Lazy loading for industries when they come into view
  useEffect(() => {
    const handleScroll = () => {
      const industryElements = document.querySelectorAll('[data-industry]');
      industryElements.forEach((element) => {
        const industry = element.getAttribute('data-industry');
        if (!industry) return;
        
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInView) {
          const section = industrySections[industry];
          if (section && section.projects.length < 8 && !section.loading) {
            loadIndustryProjects(industry);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [industrySections]);

  // Phase 1: Fetch industry statistics
  const fetchIndustryStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects/stats');
      if (response.ok) {
        const data = await response.json();
        setIndustryStats(data.stats || []);
        setTotalProjects(data.totalProjects || 0);
        
        // Initialize industry sections
        const sections: { [key: string]: IndustrySection } = {};
        data.stats.forEach((stat: IndustryStats) => {
          sections[stat.industry] = {
            industry: stat.industry,
            count: stat.count,
            projects: [],
            loading: false,
          };
        });
        setIndustrySections(sections);
        
        // Load hero projects immediately (for top 3 industries, up to 12 projects total)
        loadHeroProjects(data.stats.slice(0, 3));
        
        // Hide skeleton sections once we have real data
        setShowSkeletonSections(false);
      }
    } catch (error) {
      console.error('Failed to fetch industry stats:', error);
      setShowSkeletonSections(false); // Hide skeletons on error too
    } finally {
      setLoading(false);
    }
  };

  // Load hero projects from multiple industries for immediate display
  const loadHeroProjects = async (topIndustries: IndustryStats[]) => {
    try {
      // Load 4 projects from each of the top 3 industries for hero carousel
      const heroPromises = topIndustries.map(async (stat) => {
        const params = new URLSearchParams({
          page: '1',
          limit: '4', // Load 4 projects per industry for hero
          industry: stat.industry,
        });
        
        const response = await fetch(`/api/projects?${params}`);
        if (response.ok) {
          const data = await response.json();
          return {
            industry: stat.industry,
            projects: data.projects || []
          };
        }
        return { industry: stat.industry, projects: [] };
      });

      const heroResults = await Promise.all(heroPromises);
      
      // Update industry sections with hero projects
      setIndustrySections(prev => {
        const updated = { ...prev };
        heroResults.forEach(result => {
          if (updated[result.industry]) {
            updated[result.industry] = {
              ...updated[result.industry],
              projects: result.projects,
              loading: false
            };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to load hero projects:', error);
    }
  };

  // Phase 2: Load projects for a specific industry (limited to 8 for carousel)
  const loadIndustryProjects = async (industry: string) => {
    const section = industrySections[industry];
    if (!section || section.loading) {
      return;
    }

    // If we already have projects (from hero loading), load additional ones
    const currentCount = section.projects.length;
    const targetCount = 8; // Total projects we want for carousel
    
    if (currentCount >= targetCount) {
      return; // Already have enough projects
    }

    try {
      // Update loading state
      setIndustrySections(prev => ({
        ...prev,
        [industry]: { ...prev[industry], loading: true },
      }));

      const additionalProjectsNeeded = targetCount - currentCount;
      const skipCount = currentCount; // Skip projects we already have
      
      const params = new URLSearchParams({
        page: (Math.floor(skipCount / 10) + 1).toString(), // Adjust page based on skip count
        limit: additionalProjectsNeeded.toString(),
        industry: industry,
      });

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newProjects = data.projects || [];
        
        setIndustrySections(prev => ({
          ...prev,
          [industry]: {
            ...prev[industry],
            projects: [...prev[industry].projects, ...newProjects], // Append new projects
            loading: false,
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch projects for ${industry}:`, error);
      setIndustrySections(prev => ({
        ...prev,
        [industry]: { ...prev[industry], loading: false },
      }));
    }
  };





  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleLearnMore = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleApplyNow = (project: Project) => {
    console.log('Apply Now clicked for project:', project);
    setSelectedProject(project);
    setShowApplicationModal(true);
    console.log('Modal state set to true');
  };



  // Remove the main loading screen since we show content immediately
  if (loading && showSkeletonSections && industryStats.length === 0) {
    // Only show loading for initial page load if there's really nothing to show
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
        <div className="relative">
          <Carousel 
            heroMode={true} 
            autoPlay={true} 
            interval={10000}
            showProgress={true}
            itemWidthClass="w-full"
          >
          {(() => {
            const allProjects = Object.values(industrySections).flatMap(section => section.projects);
            
            if (allProjects.length > 0) {
              return allProjects.slice(0, 3).map((project, index) => (
                <div key={project.id} className="hero-project">
                  <img
                    src={project.image || getProjectImage(project.industry, project.domain)}
                    alt={project.title}
                    className="hero-project-image"
                  />
                  <div className="hero-project-overlay" />
                  <div className="hero-project-content">
                    <div className="max-w-3xl h-full flex flex-col justify-between py-0">
                      {/* Main content area */}
                      <div className="flex-1 min-h-0">
                        <div className="flex items-center gap-3 mb-2 lg:mb-3">
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
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-3 leading-tight text-white break-words hyphens-auto max-w-4xl line-clamp-3">{project.title}</h1>
                        <p className="text-lg lg:text-xl text-gray-300 mb-2 lg:mb-3 leading-relaxed line-clamp-2 lg:line-clamp-3 max-w-2xl">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-4 mb-2 lg:mb-3 text-base lg:text-lg text-gray-400">
                          <span>{project.industry}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                          <span>{project.domain}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons - always at bottom */}
                      <div className="flex items-center gap-4 flex-shrink-0 pt-6 lg:pt-8">
                        <button 
                          onClick={() => handleApplyNow(project)}
                          className="px-6 lg:px-8 py-3 lg:py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 lg:gap-3 text-base lg:text-lg shadow-lg"
                        >
                          <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Apply Now
                        </button>
                        <button 
                          onClick={() => handleLearnMore(project)}
                          className="px-4 lg:px-6 py-3 lg:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm text-base lg:text-lg border border-white/20"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            } else {
              // Show demo projects as fallback
              return demoProjects.slice(0, 3).map((demoProject, index) => {
                const project = convertDemoToProject(demoProject, index);
                return <SkeletonHeroCard key={`demo-hero-${index}`} />;
              });
            }
          })()}
          </Carousel>
        </div>

      {/* Content Sections */}
      <div className={`px-4 lg:px-8 pb-8 space-y-20 max-w-full overflow-hidden ${isViewingAsLearner ? 'pt-24' : 'pt-16'}`}>
        {/* Categories Section */}
        <div className="space-y-20">
          {/* Popular Projects */}
          {/* <div>
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
                          });
          })()}
          </Carousel>
        </div>

        { /* Show skeleton sections while loading */}
        {showSkeletonSections && (
          <>
            {['Healthcare & Wellness', 'Technology & Software', 'Education & Training', 'Finance & Banking'].map((skeletonIndustry) => (
              <div key={`skeleton-${skeletonIndustry}`} data-industry={skeletonIndustry}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
                <div className="py-0">
                  <Carousel itemWidthClass="w-72">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <SkeletonProjectCard key={`skeleton-${skeletonIndustry}-${index}`} />
                    ))}
                  </Carousel>
                </div>
              </div>
            ))}
          </>
        )}

        { /* for each industry section, show a carousel of projects */}
        {!showSkeletonSections && industryStats.map((stat) => {
          const section = industrySections[stat.industry];
          if (!section) return null;
          
          return (
          <div key={stat.industry} data-industry={stat.industry}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.industry} ({stat.count} projects)
              </h2>
              <button 
                onClick={() => router.push(`/projects/industry/${encodeURIComponent(stat.industry)}`)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg font-medium transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="py-0">
              <Carousel itemWidthClass="w-72">
              {section.loading && section.projects.length === 0 ? (
                // Show skeleton cards while loading
                Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonProjectCard key={`skeleton-${stat.industry}-${index}`} />
                ))
              ) : section.projects.length > 0 ? (
                // Show real projects
                section.projects.map((project, index) => (
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
                  
                  {/* Rating in upper right corner */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>4.{index + 5}</span>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyNow(project);
                        }}
                        className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                      >
                        Apply Now
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLearnMore(project);
                        }}
                        className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 min-h-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-4 flex-1 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
                ))
              ) : (
                // Show placeholder when no projects and not loading
                <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                  <span>No projects available in {stat.industry}</span>
                </div>
              )}
            </Carousel>
          </div>
        </div>
          );
        })}
        
        {totalProjects > 0 && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {totalProjects} projects available across {industryStats.length} industries
            </div>
          </div>
        )}
        
        {totalProjects === 0 && !loading && (
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
        showEditButton={false}
        onApplyNow={handleApplyNow}
      />

      {/* Project Application Modal */}
      <ProjectApplicationModal
        project={selectedProject}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
      />
    </div>
  );
}
