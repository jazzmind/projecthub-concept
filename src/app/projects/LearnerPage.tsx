'use client';

import { useState, useEffect } from 'react';
import Carousel from '@/components/Carousel';
import ProjectDetailModal from '@/components/ProjectDetailModal';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {/* Hero Section with Featured Project */}
      {(projects.length > 0 || demoProjects.length > 0) && (
        <div className="relative">
          <Carousel 
            heroMode={true} 
            autoPlay={true} 
            interval={10000}
            showProgress={true}
            itemWidthClass="w-full"
          >
            {(projects.length > 0 ? projects.slice(0, 3) : demoProjects.slice(0, 3)).map((project, index) => {
              const isDemo = projects.length === 0;
              const projectData = isDemo ? {
                id: `demo-${index}`,
                title: (project as any).title,
                image: (project as any).image,
                description: (project as any).summary,
                industry: (project as any).tags[0] || 'Technology',
                domain: (project as any).tags[1] || 'Software Development',
                difficulty: ['beginner', 'intermediate', 'advanced'][index % 3] as 'beginner' | 'intermediate' | 'advanced',
                estimatedHours: 20 + (index * 10),
                aiGenerated: index % 2 === 0,
                tags: (project as any).tags,
                requiredSkills: (project as any).tags,
                deliverables: ['Project deliverable 1', 'Project deliverable 2'],
                status: 'active',
                createdAt: new Date().toISOString(),
                scope: 'Build a comprehensive solution that addresses real-world challenges.',
                learningObjectives: ['Learn modern development practices', 'Gain hands-on experience']
              } : project as Project;

              return (
                <div key={projectData.id} className="hero-project">
                  <img
                    src={projectData.image || getProjectImage(projectData.industry, projectData.domain)}
                    alt={projectData.title}
                    className="hero-project-image"
                  />
                  <div className="hero-project-overlay" />
                  <div className="hero-project-content">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-3 mb-6">
                        <span className={`w-3 h-3 rounded-full ${getDifficultyColor(projectData.difficulty)}`} />
                        <span className="text-sm uppercase tracking-wide text-gray-300 font-medium">
                          {projectData.difficulty} • {projectData.estimatedHours}h
                        </span>
                        {projectData.aiGenerated && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                            AI Generated
                          </span>
                        )}
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                          Available Now
                        </span>
                      </div>
                      <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-white">{projectData.title}</h1>
                      <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed line-clamp-3 max-w-2xl">
                        {projectData.description}
                      </p>
                      <div className="flex items-center gap-4 mb-8 text-lg text-gray-400">
                        <span>{projectData.industry}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>{projectData.domain}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                                                    handleProjectClick(projectData);
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
      <div className="px-4 lg:px-8 pb-8 pt-16 space-y-20 max-w-full overflow-hidden">
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
            <div className="py-0">         
              <Carousel itemWidthClass="w-72">
              {demoProjects.slice(0, 8).map((project, index) => (
                <div 
                  key={project.title} 
                                     className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:z-20 h-80 flex flex-col"
                onClick={() => {
                  const mockProject: Project = {
                    id: `demo-${index}`,
                    title: project.title,
                    image: project.image,
                    description: project.summary,
                    industry: project.tags[0] || 'Technology',
                    domain: project.tags[1] || 'Software Development',
                    difficulty: ['beginner', 'intermediate', 'advanced'][index % 3],
                    estimatedHours: 20 + (index * 10),
                    requiredSkills: project.tags,
                    deliverables: ['Project deliverable 1', 'Project deliverable 2'],
                    status: 'active',
                    tags: project.tags,
                    aiGenerated: index % 2 === 0,
                    createdAt: new Date().toISOString(),
                    scope: 'Build a comprehensive solution that addresses real-world challenges.',
                    learningObjectives: ['Learn modern development practices', 'Gain hands-on experience', 'Build portfolio projects']
                  };
                  handleProjectClick(mockProject);
                }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={project.image || getProjectImage(project.tags[0] || 'technology', project.tags[1] || 'software')}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getDifficultyColor(['beginner', 'intermediate', 'advanced'][index % 3])}`} />
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                      {['beginner', 'intermediate', 'advanced'][index % 3]}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs text-white bg-green-500/80 px-2 py-1 rounded-full">
                      Available
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                    {project.summary}
                  </p>
                  <div className="flex items-center justify-between text-sm mt-auto">
                    <span className="text-gray-500 dark:text-gray-400">
                      {20 + (index * 10)} hours
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>

          {/* Technology Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Technology & Development</h2>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg font-medium transition-colors">
                See All
              </button>
            </div>
            <div className="py-0">
              <Carousel itemWidthClass="w-72">
              {demoProjects.filter(p => p.tags.some(tag => ['Technology', 'Software', 'AI', 'Web', 'Mobile'].some(tech => tag.includes(tech)))).map((project, index) => (
              <div 
                key={`tech-${project.title}`} 
                                   className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:z-20 h-80 flex flex-col"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={project.image || getProjectImage(project.tags[0] || 'technology', project.tags[1] || 'software')}
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
                    {project.summary}
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

          {/* Business & Finance */}
          <div>
            <div className="flex items-center justify-between 2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Business & Finance</h2>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg font-medium transition-colors">
                See All
              </button>
            </div>
            <div className="py-0">
              <Carousel itemWidthClass="w-72">
            {demoProjects.filter(p => p.tags.some(tag => ['Finance', 'Business', 'Analytics', 'Marketing'].some(biz => tag.includes(biz)))).map((project, index) => (
              <div 
                key={`biz-${project.title}`} 
                                   className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:z-20 h-80 flex flex-col"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={project.image || getProjectImage('business', 'finance')}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                    {project.summary}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Beginner Friendly
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      30-50 hours
                    </span>
                  </div>
                </div>
              </div>
            ))}
            </Carousel>
          </div>
          </div>
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
