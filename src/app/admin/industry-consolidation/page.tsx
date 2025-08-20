'use client';

import { useState, useEffect } from 'react';
import { useAuth, ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface IndustryItem {
  name: string;
  count: number;
  projectIds: string[];
}

interface IndustryGroup {
  id: string;
  category: string;
  industries: IndustryItem[];
  totalProjects: number;
}

export default function IndustryConsolidationPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<IndustryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedIndustry, setDraggedIndustry] = useState<{
    industry: IndustryItem;
    sourceGroupId: string;
  } | null>(null);

  // Check permissions
  useEffect(() => {
    if (!loading && (!user || !hasRole(ROLES.PLATFORM_ADMIN))) {
      router.push('/dashboard');
    }
  }, [user, hasRole, router, loading]);

  useEffect(() => {
    fetchIndustryGroups();
  }, []);

  const fetchIndustryGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/projects/consolidate-industries');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.groups);
      } else {
        setError(`Failed to fetch industry groups: ${data.error}`);
        console.error('Failed to fetch industry groups:', data.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error fetching industry groups: ${message}`);
      console.error('Error fetching industry groups:', error);
    } finally {
      setLoading(false);
    }
  };



  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDragStart = (industry: IndustryItem, sourceGroupId: string) => {
    setDraggedIndustry({ industry, sourceGroupId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    
    if (!draggedIndustry || draggedIndustry.sourceGroupId === targetGroupId) {
      setDraggedIndustry(null);
      return;
    }

    // Move industry from source group to target group
    setGroups(prev => {
      const newGroups = [...prev];
      
      // Remove from source group
      const sourceGroup = newGroups.find(g => g.id === draggedIndustry.sourceGroupId);
      if (sourceGroup) {
        sourceGroup.industries = sourceGroup.industries.filter(
          i => i.name !== draggedIndustry.industry.name
        );
        sourceGroup.totalProjects = sourceGroup.industries.reduce(
          (sum, i) => sum + i.count, 0
        );
      }
      
      // Add to target group
      const targetGroup = newGroups.find(g => g.id === targetGroupId);
      if (targetGroup) {
        targetGroup.industries.push(draggedIndustry.industry);
        targetGroup.totalProjects = targetGroup.industries.reduce(
          (sum, i) => sum + i.count, 0
        );
      }
      
      // Remove empty groups
      return newGroups.filter(group => group.industries.length > 0);
    });

    setDraggedIndustry(null);
  };

  const createNewGroup = (industry: IndustryItem, sourceGroupId: string) => {
    setGroups(prev => {
      const newGroups = [...prev];
      
      // Remove from source group
      const sourceGroup = newGroups.find(g => g.id === sourceGroupId);
      if (sourceGroup) {
        sourceGroup.industries = sourceGroup.industries.filter(
          i => i.name !== industry.name
        );
        sourceGroup.totalProjects = sourceGroup.industries.reduce(
          (sum, i) => sum + i.count, 0
        );
      }
      
      // Create new group
      const newGroup: IndustryGroup = {
        id: `new-${Date.now()}`,
        category: industry.name,
        industries: [industry],
        totalProjects: industry.count,
      };
      
      newGroups.push(newGroup);
      
      // Remove empty groups and sort by project count
      return newGroups
        .filter(group => group.industries.length > 0)
        .sort((a, b) => b.totalProjects - a.totalProjects);
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Transform the groups data to the format expected by the API
      const consolidationData = {
        groups: groups.map(group => ({
          category: group.category,
          industryNames: group.industries.map(industry => industry.name)
        }))
      };
      
      console.log('Sending consolidation data:', consolidationData);
      
      const response = await fetch('/api/projects/consolidate-industries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consolidationData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully updated ${data.updatedProjects} projects across ${data.processedGroups} industry groups.`);
        // Refresh the data to show the consolidated results
        await fetchIndustryGroups();
      } else {
        alert(`Failed to save changes: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading industry data and grouping with AI...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasRole(ROLES.PLATFORM_ADMIN)) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchIndustryGroups}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Industry Consolidation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Group and consolidate similar industries. Drag industries between groups or create new groups.
            The primary name will be applied to all projects in the group.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {groups.length}
            </div>
            <div className="text-blue-800 dark:text-blue-300">Industry Groups</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {groups.reduce((sum, group) => sum + group.industries.length, 0)}
            </div>
            <div className="text-green-800 dark:text-green-300">Total Industries</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {groups.reduce((sum, group) => sum + group.totalProjects, 0)}
            </div>
            <div className="text-purple-800 dark:text-purple-300">Total Projects</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Industry Categories - Collapsed/Expandable List */}
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            return (
              <div
                key={group.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all ${
                  draggedIndustry && !isExpanded ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, group.id)}
              >
                {/* Category Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {/* Expand/Collapse Icon */}
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        
                        {/* Category Name - Editable */}
                        {editingCategory === group.id ? (
                          <input
                            type="text"
                            value={group.category}
                            onChange={(e) => {
                              // Update the category name without closing the edit
                              setGroups(prev => prev.map(g => 
                                g.id === group.id 
                                  ? { ...g, category: e.target.value }
                                  : g
                              ));
                            }}
                            onBlur={() => setEditingCategory(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCategory(null);
                              if (e.key === 'Escape') setEditingCategory(null);
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-lg font-semibold bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-white min-w-[200px]"
                            autoFocus
                          />
                        ) : (
                          <h3
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(group.id);
                            }}
                          >
                            {group.category}
                          </h3>
                        )}
                      </div>
                      
                      {/* Drop Zone Indicator */}
                      {draggedIndustry && !isExpanded && (
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                          Drop here to add
                        </div>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{group.industries.length} industries</span>
                      <span>{group.totalProjects} projects</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Industries List */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                      {group.industries.map((industry) => (
                        <div
                          key={industry.name}
                          draggable
                          onDragStart={() => handleDragStart(industry, group.id)}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {industry.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {industry.count} projects
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Drag Handle */}
                              <div className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              
                              {/* Create New Group Button */}
                              {group.industries.length > 1 && (
                                <button
                                  onClick={() => createNewGroup(industry, group.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                  title="Move to new group"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bulk Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setExpandedGroups(new Set(groups.map(g => g.id)))}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedGroups(new Set())}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to Use:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Click category headers</strong> to expand/collapse and see industries inside</li>
            <li>• <strong>Click category names</strong> to rename them</li>
            <li>• <strong>Drag industries</strong> from expanded groups to collapsed ones - they'll highlight when you can drop</li>
            <li>• <strong>Use the arrow icon</strong> to move an industry to its own new category</li>
            <li>• <strong>Categories are sorted</strong> by total project count (highest first)</li>
            <li>• <strong>When you save</strong>, all projects will be updated to use their category name</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
