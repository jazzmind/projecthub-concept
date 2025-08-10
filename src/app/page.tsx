export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Connect Industry with Education
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          ProjectHub bridges the gap between industry partners and educational institutions, 
          creating meaningful project collaborations that prepare students for the real world.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-blue-600">0</h3>
          <p className="text-gray-600">Active Campaigns</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-green-600">0</h3>
          <p className="text-gray-600">Industry Partners</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-purple-600">0</h3>
          <p className="text-gray-600">Projects Available</p>
        </div>
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-orange-600">0</h3>
          <p className="text-gray-600">Teams Formed</p>
        </div>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Campaign Management</h3>
          <p className="text-gray-600 mb-4">
            Create and manage educational campaigns that connect students with industry projects.
          </p>
          <a href="/campaigns" className="btn btn-primary">
            View Campaigns
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
          <p className="text-gray-600 mb-4">
            Form teams with students, experts, and industry partners for collaborative learning.
          </p>
          <a href="/teams" className="btn btn-primary">
            Manage Teams
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Project Sourcing</h3>
          <p className="text-gray-600 mb-4">
            Access a library of industry projects or create custom ones for your students.
          </p>
          <a href="/projects" className="btn btn-primary">
            Browse Projects
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Industry Partners</h3>
          <p className="text-gray-600 mb-4">
            Connect with industry professionals and companies looking to mentor students.
          </p>
          <a href="/partners" className="btn btn-primary">
            Find Partners
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Expert Network</h3>
          <p className="text-gray-600 mb-4">
            Access domain experts who can provide guidance and feedback on projects.
          </p>
          <a href="/experts" className="btn btn-primary">
            Browse Experts
          </a>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Analytics & Insights</h3>
          <p className="text-gray-600 mb-4">
            Track progress, measure success, and gain insights into your programs.
          </p>
          <a href="/analytics" className="btn btn-primary">
            View Analytics
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/campaigns/new" className="btn btn-primary text-center">
            Create Campaign
          </a>
          <a href="/teams/new" className="btn btn-secondary text-center">
            Form Team
          </a>
          <a href="/projects/browse" className="btn btn-secondary text-center">
            Browse Projects
          </a>
        </div>
      </div>
    </div>
  )
}
