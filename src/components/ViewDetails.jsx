import { useEffect, useState } from 'react';
import "../styles/ViewDetails.css";
import {
  ArrowLeft,
  MapPin,
  Building2,
  CalendarClock,
  TriangleAlert,
  Pencil,
} from 'lucide-react';

// Same base endpoint used in Dashboard.jsx; detail is fetched by appending /:id.
const API_URL = 'http://localhost:4000/api/projects';

const phaseLabelMap = {
  PLANNING: 'PLANNING',
  CONSTRUCTION: 'CONSTRUCTION',
  'ISSUE DETECTED': 'ISSUE DETECTED',
};

// projectId & onBack dioper dari App.jsx (pola state activeTab, bukan react-router).
const ViewDetail = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchProject = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL}/${projectId}`);
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const result = await res.json();
      setProject(result);
    } catch (err) {
      console.error('Error fetching project detail:', err);
      setFetchError('Failed to load project detail. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const phase = (project?.phase || 'PLANNING').toUpperCase();
  const isIssue = phase === 'ISSUE DETECTED';
  const progress = project?.progress ?? 0;

  return (
    <div className="vd-wrapper">

      {/* ================= HEADER ================= */}
      <header className="vd-header">
        <div className="vd-header-left">
          <button className="vd-back-btn" onClick={onBack} aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="vd-eyebrow">Project File</p>
            <h2 className="vd-title">
              {loading ? 'Loading project...' : project?.name || 'Project Detail'}
            </h2>
            <p className="vd-subtitle">PT. Dives Jaya Perkasa — project detail</p>
          </div>
        </div>

        <button className="vd-edit-btn">
          <Pencil size={14} />
          Edit
        </button>
      </header>

      {/* ================= CONTENT ================= */}
      <div className="vd-content">

        {loading ? (
          <p className="vd-state-msg">Loading project detail...</p>
        ) : fetchError ? (
          <p className="vd-state-msg is-error">{fetchError}</p>
        ) : !project ? (
          <p className="vd-state-msg">Project not found.</p>
        ) : (
          <>
            {/* Spec plates */}
            <div className="vd-stats-grid">
              <div className="vd-plate">
                <div className="vd-stat-header">
                  <Building2 size={18} className="vd-stat-icon" />
                  <span className="vd-stat-label">Client</span>
                </div>
                <div className="vd-stat-value">{project.client?.name || '—'}</div>
                <div className="vd-stat-desc">Client name</div>
              </div>

              <div className="vd-plate">
                <div className="vd-stat-header">
                  <MapPin size={18} className="vd-stat-icon" />
                  <span className="vd-stat-label">Location</span>
                </div>
                <div className="vd-stat-value">{project.location || '—'}</div>
                <div className="vd-stat-desc">Project location</div>
              </div>

              <div className="vd-plate">
                <div className="vd-stat-header">
                  <CalendarClock size={18} className="vd-stat-icon" />
                  <span className="vd-stat-label">Progress</span>
                </div>
                <div className="vd-stat-value is-mono">{progress}%</div>
                <div className="vd-stat-desc">Completion</div>
              </div>

              <div className={`vd-plate ${isIssue ? 'is-danger' : ''}`}>
                <div className="vd-stat-header">
                  <TriangleAlert size={18} className="vd-stat-icon" />
                  <span className="vd-stat-label">Phase</span>
                </div>
                <div className="vd-stat-value">
                  <span className={`vd-phase-badge ${isIssue ? 'is-issue' : ''}`}>
                    {phaseLabelMap[phase] || phase}
                  </span>
                </div>
                <div className="vd-stat-desc">Current phase</div>
              </div>
            </div>

            {/* Progress panel */}
            <div className="vd-plate">
              <div className="vd-section-title">
                <span className="vd-title-accent"></span>
                <h3>Project Progress</h3>
              </div>

              <div className="vd-progress-row">
                <div className="vd-progress-track">
                  <div className="vd-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="vd-progress-pct">{progress}%</span>
              </div>

              {project.description && (
                <>
                  <div className="vd-divider">
                    <span className="vd-divider-mark"></span>
                  </div>
                  <p className="vd-description">{project.description}</p>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ViewDetail;