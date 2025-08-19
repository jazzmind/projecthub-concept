'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalTeams: number;
  activeTeams: number;
  totalProjects: number;
  totalPartners: number;
  totalExperts: number;
  totalAssignments: number;
  pendingApplications: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTeams: 0,
    activeTeams: 0,
    totalProjects: 0,
    totalPartners: 0,
    totalExperts: 0,
    totalAssignments: 0,
    pendingApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Simulate API calls for now
      // In a real implementation, these would be actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalCampaigns: 12,
        activeCampaigns: 5,
        totalTeams: 24,
        activeTeams: 18,
        totalProjects: 45,
        totalPartners: 67,
        totalExperts: 23,
        totalAssignments: 89,
        pendingApplications: 15
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64 min-h-screen bg-white dark:bg-gray-900 p-6">
        <div className="text-lg text-gray-900 dark:text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen bg-white dark:bg-gray-900 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your ProjectHub platform</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCampaigns}</p>
            </div>
            <div className="text-blue-500 dark:text-blue-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-600 dark:text-green-400 text-sm">
              {stats.activeCampaigns} active
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Teams</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeTeams}</p>
            </div>
            <div className="text-green-500 dark:text-green-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {stats.totalTeams} total teams
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Projects</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalProjects}</p>
            </div>
            <div className="text-purple-500 dark:text-purple-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Ready for assignment
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Applications</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingApplications}</p>
            </div>
            <div className="text-orange-500 dark:text-orange-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-red-600 dark:text-red-400 text-sm">
              Require review
            </span>
          </div>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Network Size</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Industry Partners</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">{stats.totalPartners}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{width: '67%'}}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Domain Experts</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">{stats.totalExperts}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full" style={{width: '23%'}}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Assignments</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">{stats.totalAssignments}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full" style={{width: '89%'}}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/campaigns/new" className="btn btn-primary text-center">
              Create Campaign
            </a>
            <a href="/teams/new" className="btn btn-secondary text-center">
              Form Team
            </a>
            <a href="/projects/generate" className="btn btn-secondary text-center">
              Generate Project
            </a>
            <a href="/partners/new" className="btn btn-secondary text-center">
              Add Partner
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-900 dark:text-white">New team formed for "AI Ethics in Healthcare" campaign</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-900 dark:text-white">5 new project applications received</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-900 dark:text-white">Expert Dr. Sarah Chen joined the platform</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-900 dark:text-white">New industry partner from TechCorp registered</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
