'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  title: string;
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

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

// Function to get project image based on industry/domain
const getProjectImage = (industry: string, domain: string) => {
  const seed = `${industry}-${domain}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/1200/600`;
};

// Function to get difficulty color
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'bg-green-500';
    case 'intermediate': return 'bg-yellow-500';
    case 'advanced': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export default function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setImageLoaded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative bg-gray-900 rounded-2xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Hero Image Section */}
          <div className="relative h-80 overflow-hidden">
            <img
              src={getProjectImage(project.industry, project.domain)}
              alt={project.title}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Project Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-3 h-3 rounded-full ${getDifficultyColor(project.difficulty)}`} />
                    <span className="text-sm uppercase tracking-wide text-gray-300 font-medium">
                      {project.difficulty} • {project.estimatedHours}h
                    </span>
                    {project.aiGenerated && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold mb-3 leading-tight">{project.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>{project.industry}</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span>{project.domain}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 ml-6">
                  <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Start Project
                  </button>
                  <button className="px-6 py-3 bg-gray-700/50 text-white font-semibold rounded-lg hover:bg-gray-600/50 transition-colors duration-200 backdrop-blur-sm">
                    Save for Later
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">{project.description}</p>
                </div>

                {project.scope && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Scope</h3>
                    <p className="text-gray-300 leading-relaxed">{project.scope}</p>
                  </div>
                )}

                {project.learningObjectives && project.learningObjectives.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Learning Objectives</h3>
                    <ul className="space-y-2">
                      {project.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold mb-4">Deliverables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.deliverables.map((deliverable, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <span className="text-gray-300">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Status</div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        project.status === 'draft' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Duration</div>
                      <div className="text-white">{project.estimatedHours} hours</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Created</div>
                      <div className="text-white">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {project.tags.length > 0 && (
                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm border border-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-3">
                <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors">
                  More Info
                </button>
                <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
