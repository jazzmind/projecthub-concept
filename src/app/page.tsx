'use client';

import { useState, useEffect } from 'react';
import { useAuth, ROLES } from '@/lib/auth-context';
import Carousel from '@/components/Carousel';
import { demoProjects, projectCategories, participatingCompanies } from '@/lib/demo/projects';
import Link from 'next/link';

// Function to get project image based on industry/domain
const getProjectImage = (industry: string, domain: string) => {
  const seed = `${industry}-${domain}`.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/800/450`;
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


export default function HomePage() {
  const { user, hasRole } = useAuth();
  const [heroProject, setHeroProject] = useState(demoProjects[0]);

  useEffect(() => {
    // Rotate hero project every 10 seconds
    const interval = setInterval(() => {
      setHeroProject(demoProjects[Math.floor(Math.random() * demoProjects.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
    <section id="companies" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">For Companies</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get projects completed by top students, find and mentor future talent, and stay on top of the latest in AI and workforce changes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {projectCategories.map((category) => (
            <div key={category.name} className="card hover:scale-105 transition-transform cursor-pointer">
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
              <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                {category.projects} Projects
          </div>
        </div>
      ))}
    </div>
        
        <div className="text-center">
          <Link
            href="/campaigns"
            className="btn btn-primary"
          >
            View All Campaigns →
          </Link>
        </div>
      </div>
    </section>
  );

  // For Educators Section
  const EducatorsSection = () => (
    <section id="educators" className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">For Educators</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get real industry projects for your students that are aligned to your learning outcomes and needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {participatingCompanies.map((company) => (
            <div key={company.name} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{company.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{company.projects}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Projects</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.categories.map((category) => (
                  <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link
            href="/providers"
            className="btn btn-primary"
          >
            View All Providers →
          </Link>
        </div>
      </div>
      </section>
  );

  // For Students Section  
  const StudentsSection = () => (
    <section id="students" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">For Students</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
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
              <div key={project.title} className="project-card h-80 flex flex-col cursor-pointer hover:z-20 transition-all duration-300">
                <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                  <img
                    src={project.image || getProjectImage('technology', 'software')}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${getDifficultyColor('intermediate')}`} />
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      AI Generated
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-1 line-clamp-3">{project.summary}</p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>Technology</span>
                      <span>20h</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
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
        
        <div className="text-center">
          <Link
            href="/projects"
            className="btn btn-primary"
          >
            View All Projects →
          </Link>
        </div>
      </div>
      </section>
  );

  return (
    <div className="min-h-screen">
      <HeroSection />
      <CompaniesSection />
      <EducatorsSection />
      <StudentsSection />
    </div>
  );
}