'use client';

import { useState, useEffect } from 'react';

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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Industry Projects</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAiForm(true)}
            className="btn btn-secondary"
          >
            🤖 Generate with AI
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Project
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filter Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Difficulty</label>
            <select
              className="input"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="label">Industry</label>
            <input
              type="text"
              className="input"
              placeholder="Search by industry"
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Domain</label>
            <input
              type="text"
              className="input"
              placeholder="Search by domain"
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* AI Generation Form */}
      {showAiForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Generate Project with AI</h2>
          <form onSubmit={handleGenerateAI} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Industry</label>
                <input
                  type="text"
                  className="input"
                  value={aiFormData.industry}
                  onChange={(e) => setAiFormData({ ...aiFormData, industry: e.target.value })}
                  placeholder="e.g. fintech, healthcare"
                  required
                />
              </div>
              <div>
                <label className="label">Technical Domain</label>
                <input
                  type="text"
                  className="input"
                  value={aiFormData.domain}
                  onChange={(e) => setAiFormData({ ...aiFormData, domain: e.target.value })}
                  placeholder="e.g. web development, AI/ML"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Learning Objectives</label>
              {aiFormData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={objective}
                    onChange={(e) => {
                      const objectives = [...aiFormData.learningObjectives];
                      objectives[index] = e.target.value;
                      setAiFormData({ ...aiFormData, learningObjectives: objectives });
                    }}
                    placeholder={`Learning objective ${index + 1}`}
                  />
                  {aiFormData.learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const objectives = aiFormData.learningObjectives.filter((_, i) => i !== index);
                        setAiFormData({ ...aiFormData, learningObjectives: objectives });
                      }}
                      className="btn btn-secondary px-3"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAiFormData({
                  ...aiFormData,
                  learningObjectives: [...aiFormData.learningObjectives, '']
                })}
                className="btn btn-secondary text-sm"
              >
                Add Objective
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input"
                  value={aiFormData.difficulty}
                  onChange={(e) => setAiFormData({ ...aiFormData, difficulty: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Hours</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="500"
                  value={aiFormData.estimatedHours}
                  onChange={(e) => setAiFormData({ ...aiFormData, estimatedHours: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Generate Project
              </button>
              <button
                type="button"
                onClick={() => setShowAiForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Creation Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="label">Project Title</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Project Scope</label>
              <textarea
                className="input min-h-20 resize-none"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Industry</label>
                <input
                  type="text"
                  className="input"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Technical Domain</label>
                <input
                  type="text"
                  className="input"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Hours</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="500"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No projects found. Create your first project!</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                  {project.aiGenerated && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      AI Generated
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div><strong>Industry:</strong> {project.industry}</div>
                <div><strong>Domain:</strong> {project.domain}</div>
                <div><strong>Difficulty:</strong> {project.difficulty}</div>
                <div><strong>Estimated Hours:</strong> {project.estimatedHours}</div>
                <div><strong>Skills:</strong> {project.requiredSkills.slice(0, 3).join(', ')}{project.requiredSkills.length > 3 ? '...' : ''}</div>
              </div>

              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{project.tags.length - 3} more</span>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t">
                <button className="btn btn-primary w-full">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
