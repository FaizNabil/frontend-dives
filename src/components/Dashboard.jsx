import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import {
  Search,
  Bell,
  Grid,
  Network,
  Compass,
  UserCog,
  TriangleAlert,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import UploadHspk from './UploadHspk';
import CreateBvModal from './CreateBvModal';
// Single source of truth for the endpoint, used by both GET and POST below.
// Adjust this if your backend uses a different URL.
const API_URL = 'http://localhost:4000/api/projects';

// onViewDetails(projectId) dipanggil dari App.jsx untuk pindah ke halaman detail.
// onCreateBv(projectId, projectName) dipanggil dari App.jsx untuk pindah ke tab
// 'bv' (Buat BV), scoped ke project ini - sama pola kayak onViewDetails, bukan
// modal lokal lagi.
const Dashboard = ({ onViewDetails, onCreateBv }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setFetchError('Failed to load projects. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Derived from real data - empty list naturally gives 0 everywhere, and
  // these update automatically whenever fetchProjects runs again (e.g.
  // after a project is created). Phase matching assumes the same string
  // convention already used below for the table (PLANNING / CONSTRUCTION /
  // ISSUE DETECTED); adjust if your backend uses different phase values.
  const totalActive = data.length;
  const planningCount = data.filter(
    (p) => (p.phase || 'PLANNING').toUpperCase() === 'PLANNING'
  ).length;
  const constructionCount = data.filter(
    (p) => (p.phase || '').toUpperCase() === 'CONSTRUCTION'
  ).length;
  const issueCount = data.filter(
    (p) => (p.phase || '').toUpperCase() === 'ISSUE DETECTED'
  ).length;

  return (
    <div className="dashboard-wrapper">

      {/* ================= TOP NAVBAR ================= */}
      <header className="top-navbar">
        <div className="navbar-greeting">
          <h2>Welcome back, Jimmy.</h2>
          <p>Here is the summary of PT. Dives Jaya Perkasa projects today.</p>
        </div>

        <div className="navbar-actions">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input type="text" placeholder="Search projects..." />
          </div>

          <button className="icon-btn position-relative">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>

          <button className="icon-btn">
            <Grid size={20} />
          </button>

          <div className="user-avatar">
            <img src="https://i.pravatar.cc/150?img=11" alt="User Avatar" />
          </div>
        </div>
      </header>

      {/* ================= CONTENT AREA ================= */}
      <div className="dashboard-content">

        {/* Stats Cards Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper"><Network size={20} className="text-yellow" /></div>
              <span className="stat-label">ALL ACTIVE</span>
            </div>
            <div className="stat-value">{totalActive}</div>
            <div className="stat-desc">Active Projects</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper"><Compass size={20} className="text-gray" /></div>
              <span className="stat-label">PHASE 1</span>
            </div>
            <div className="stat-value">{planningCount}</div>
            <div className="stat-desc">In Planning Phase</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper"><UserCog size={20} className="text-gray" /></div>
              <span className="stat-label">PHASE 2</span>
            </div>
            <div className="stat-value">{constructionCount}</div>
            <div className="stat-desc">In Construction Phase</div>
          </div>

          <div className="stat-card danger-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper danger-icon"><TriangleAlert size={20} /></div>
              <span className="stat-label danger-text">ACTION REQUIRED</span>
            </div>
            <div className="stat-value danger-text">{issueCount}</div>
            <div className="stat-desc">Unresolved Issues</div>
          </div>
        </div>

        {/* Recent Active Projects Table */}
        <div className="projects-section">
          <div className="projects-header">
            <div className="projects-title">
              <div className="title-accent"></div>
              <h3>Recent Active Projects</h3>
            </div>
            <div className="projects-actions">
              <button className="icon-btn"><Filter size={18} /></button>
              <button className="icon-btn"><MoreVertical size={18} /></button>
            </div>
          </div>

          <div className="table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>PROJECT NAME</th>
                  <th>CLIENT</th>
                  <th>LOCATION</th>
                  <th>PROGRESS</th>
                  <th>CURRENT PHASE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray">Loading projects...</td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={6} className="text-center text-danger">{fetchError}</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray">No projects yet. Click "New Project" to add one.</td>
                  </tr>
                ) : (
                  data.map((project, index) => (
                    <tr key={project.id ?? index}>
                      <td className="fw-bold">{project.name}</td>
                      <td className="text-gray">{project.client?.name}</td>
                      <td className="text-gray">{project.location}</td>
                      <td>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${project.progress ?? 0}%` }}></div>
                          </div>
                          <span className="progress-text">{project.progress ?? 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`phase-badge ${project.phaseClass || 'phase-planning'}`}>
                          {project.phase || 'PLANNING'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-view-details"
                          onClick={() => onViewDetails?.(project.id)}
                        >
                          VIEW DETAILS
                        </button>
                        <button
                          className="btn-create-bv"
                          onClick={() => onCreateBv?.(project.id, project.name)}
                        >
                          CREATE BV
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="projects-footer">
            <span className="text-gray text-sm">
              {loading ? 'Loading...' : `Showing ${data.length} project${data.length === 1 ? '' : 's'}`}
            </span>
            <div className="pagination">
              <button className="icon-btn"><ChevronLeft size={16} /></button>
              <button className="icon-btn"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
};

export default Dashboard;