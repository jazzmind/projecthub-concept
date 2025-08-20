'use client';

import { useState, useEffect } from 'react';
import { useAuth, ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Carousel from '@/components/Carousel';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { Project as ProjectType } from '@/types/project';
import { demoProjects, projectCategories, participatingCompanies } from '@/lib/demo/projects';
import Link from 'next/link';

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


interface ProjectForModal extends ProjectType {}

interface CategoryForModal {
  name: string;
  description: string;
  projects: number;
  sampleProjects: string[];
  image: string;
}

export default function HomePage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [heroProject, setHeroProject] = useState(demoProjects[0]);
  const [selectedProject, setSelectedProject] = useState<ProjectForModal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryForModal | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    // Rotate hero project every 10 seconds
    const interval = setInterval(() => {
      setHeroProject(demoProjects[Math.floor(Math.random() * demoProjects.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleProjectClick = (project: any) => {
    // Convert DemoProjectSpec to full Project interface for modal
    const fullProject = {
      id: project.title.toLowerCase().replace(/\s+/g, '-'),
      title: project.title,
      image: project.image,
      description: project.summary,
      industry: 'Technology',
      domain: 'Software Development',
      difficulty: 'intermediate',
      estimatedHours: 20,
      deliverables: ['Working prototype', 'Documentation', 'Presentation'],
      status: 'active',
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      scope: project.summary,
      learningObjectives: ['Apply modern development practices', 'Understand project requirements', 'Deliver functional solution']
    };
    setSelectedProject(fullProject);
    setShowDetailModal(true);
  };

  const handleCategoryClick = (category: any) => {
    // Create enhanced category with sample projects
    const enhancedCategory = {
      ...category,
      sampleProjects: generateSampleProjects(category),
      image: getCategoryImage(category.name)
    };
    setSelectedCategory(enhancedCategory);
    setShowCategoryModal(true);
  };

  const handleApplyNow = (project: ProjectForModal) => {
    // Close the modal first
    setShowDetailModal(false);
    setSelectedProject(null);
    
    // Navigate to projects page (this will trigger sign-in if needed via middleware)
    router.push('/projects');
  };

  const generateSampleProjects = (category: any): string[] => {
    const projectsByCategory: { [key: string]: string[] } = {
      'AI & Machine Learning': [
        'Customer Support Chatbot with RAG',
        'Predictive Analytics Dashboard',
        'Computer Vision Quality Control'
      ],
      'Data Analytics': [
        'Customer Churn Prediction Model',
        'Sales Performance Dashboard',
        'Market Trend Analysis Tool'
      ],
      'Web Development': [
        'E-commerce Platform',
        'Content Management System',
        'Real-time Collaboration Tool'
      ],
      'Mobile Development': [
        'Cross-platform Mobile App',
        'IoT Device Controller',
        'Location-based Service App'
      ]
    };
    return projectsByCategory[category.name] || ['Custom Industry Project', 'Business Process Automation', 'Digital Transformation Initiative'];
  };

  const getCategoryImage = (categoryName: string) => {
    const seed = categoryName.toLowerCase().replace(/\s+/g, '-');
    return `https://picsum.photos/seed/${seed}/400/300`;
  };

  // Hero Section
  const HeroSection = () => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src='/images/home/hero-background.jpg'
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          ProjectHub
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-200">
          Connecting students with real-world projects from industry partners
        </p>
        <p className="text-lg mb-12 text-gray-300 max-w-2xl mx-auto">
          Bridge the gap between academic learning and professional experience through meaningful project-based collaboration
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#companies"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors min-w-48"
          >
            For Companies
          </a>
          <a
            href="#educators"
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors min-w-48"
          >
            For Educators
          </a>
          <a
            href="#students"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors min-w-48"
          >
            For Students
          </a>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">500+</div>
            <div className="text-sm text-gray-300">Active Projects</div>
          </div>
          <div>
            <div className="text-3xl font-bold">150+</div>
            <div className="text-sm text-gray-300">Partner Companies</div>
          </div>
          <div>
            <div className="text-3xl font-bold">50+</div>
            <div className="text-sm text-gray-300">Universities</div>
          </div>
        </div>
    </div>
    </section>
  );

  // For Companies Section
  const CompaniesSection = () => (
    <section id="companies" className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">For Companies</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Get projects completed by top students, find and mentor future talent, and stay on top of the latest in AI and workforce changes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {projectCategories.map((category, index) => (
            <div 
              key={category.name} 
              className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => handleCategoryClick(category)}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Category Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={getCategoryImage(category.name)}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
              </div>
              
              <div className="relative z-10 p-6">
                <h3 className="text-xl font-bold text-white mb-3">{category.name}</h3>
                <p className="text-sm text-blue-100 mb-6 line-clamp-3">{category.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {category.projects}
                  </div>
                  <div className="text-xs text-blue-200 uppercase tracking-wide font-medium">
                    Projects
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link
            href="/campaigns"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
          >
            View All Campaigns
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
      </section>
  );

  // For Educators Section
  const EducatorsSection = () => {
    // Enhanced companies with placeholder data
    const enhancedCompanies = participatingCompanies.map((company, index) => ({
      ...company,
      logo: `https://picsum.photos/seed/logo-${company.name.toLowerCase().replace(/\s+/g, '-')}/120/60`,
      contactPerson: {
        name: ['Sarah Chen', 'Michael Rodriguez', 'Emily Johnson', 'David Kim', 'Lisa Wang', 'James Miller'][index % 6],
        title: ['Senior Project Manager', 'Head of University Relations', 'Engineering Manager', 'Director of Partnerships', 'Lead Data Scientist', 'VP of Innovation'][index % 6],
        photo: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${10 + (index % 20)}.jpg`
      }
    }));

    return (
      <section id="educators" className="relative py-24 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="educator-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#educator-grid)" />
          </svg>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">For Educators</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
          Get real industry projects for your students that are aligned to your learning outcomes and needs.
        </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {enhancedCompanies.map((company, index) => (
              <div 
                key={company.name} 
                className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl hover:bg-white/20 transition-all duration-300 overflow-hidden"
              >
                {/* Header with logo and stats */}
                <div className="bg-white/20 backdrop-blur-sm p-6 border-b border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                        <img 
                          src={company.logo} 
                          alt={`${company.name} logo`}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{company.name}</h3>
                        <p className="text-sm text-green-100">{company.sector}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{company.projects}</div>
                      <div className="text-xs text-green-100 uppercase tracking-wide">Projects</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {company.categories.map((category) => (
                      <span 
                        key={category} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Contact Person */}
                  <div className="flex items-center space-x-4 p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                    <img 
                      src={company.contactPerson.photo} 
                      alt={company.contactPerson.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50"
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {company.contactPerson.name}
                      </div>
                      <div className="text-xs text-green-100">
                        {company.contactPerson.title}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button className="text-white hover:text-green-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/providers"
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              View All Providers
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  // For Students Section  
  const StudentsSection = () => (
    <section id="students" className="relative py-24 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="student-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#student-grid)" />
        </svg>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">For Students</h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Get real world work experience. Get access through your university or join one of our open enrollment programs.
          </p>
        </div>
        
        <div className="py-8">
          <Carousel 
            title="Featured Projects" 
            itemWidthClass="w-80"
            autoPlay={false}
            showProgress={false}
          >
            {demoProjects.slice(0, 8).map((project) => (
              <div 
                key={project.title} 
                className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg hover:shadow-2xl hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden h-96 flex flex-col mx-2"
                onClick={() => handleProjectClick(project)}
              >
                <div className="relative h-40 overflow-hidden flex-shrink-0">
                  <img
                    src={project.image || getProjectImage('technology', 'software')}
                    alt={project.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Difficulty indicator */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${getDifficultyColor('intermediate')} ring-2 ring-white shadow-lg`} />
                  </div>
                  
                  {/* AI Generated badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 backdrop-blur-sm">
                      AI Coach
                    </span>
                  </div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-purple-100 mb-4 flex-1 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="mt-auto space-y-3">
                    {/* Project metadata */}
                    <div className="flex items-center justify-between text-xs text-purple-200">
                      <span className="font-medium">Technology</span>
                      <span className="font-medium">20h</span>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/20 text-white backdrop-blur-sm group-hover:bg-purple-200/30 group-hover:text-purple-100 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Hover effect indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        
        <div className="text-center mt-8">
          <Link
            href="/projects"
            className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            View All Projects
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
      </section>
  );

  // Category Detail Modal Component
  const CategoryDetailModal = () => {
    if (!showCategoryModal || !selectedCategory) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={selectedCategory.image}
              alt={selectedCategory.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{selectedCategory.name}</h2>
              <p className="text-blue-200">{selectedCategory.projects} available projects</p>
            </div>
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About {selectedCategory.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedCategory.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sample Project Types</h3>
              <div className="grid gap-3">
                {selectedCategory.sampleProjects.map((project: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">{project}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <Link
                href="/campaigns"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                onClick={() => setShowCategoryModal(false)}
              >
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      <CompaniesSection />
      <EducatorsSection />
      <StudentsSection />
      
      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          showEditButton={false}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
          onApplyNow={handleApplyNow}
        />
      )}

      {/* Category Detail Modal */}
      <CategoryDetailModal />
    </div>
  );
}