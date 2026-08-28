import { useState, useEffect } from "react";
import "../styles/Sidebar.css";
import {
  LayoutDashboard,
  KanbanSquare,
  Wallet,
  FileText,
  Plus,
  Settings,
  HelpCircle,
  Upload,
  ClipboardList,
  Timeline,
  ClipboardCheck,
  CopyMinus,
  Map,
  ChevronDown,
  ChevronRight,
  Layers,
  Wrench
} from "lucide-react";

import CreateProjectModal from "./CreateProjectModal";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ============================================================
  // DROPDOWN MENU STATE
  // ============================================================
  const [isPerencanaanOpen, setIsPerencanaanOpen] = useState(false);
  const [isPelaksanaanOpen, setIsPelaksanaanOpen] = useState(false);

  useEffect(() => {
    if (["data-survey", "bv", "rab"].includes(activeTab)) {
      setIsPerencanaanOpen(true);
    }
    if (["time-schedule", "join-opname"].includes(activeTab)) {
      setIsPelaksanaanOpen(true);
    }
  }, [activeTab]);

  // ============================================================
  // Helper untuk pindah halaman (Tanpa Lock)
  // ============================================================
  const handleNavigation = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <aside className="sidebar">

      {/* ========================================================
          HEADER / BRAND
      ======================================================== */}
      <div className="sidebar-header">
        <div className="logo-title">
          DIVES CORP.
        </div>
        <div className="logo-subtitle">
          INTERIOR & CONTRACTOR
        </div>
      </div>

      {/* ========================================================
          NAVIGATION
      ======================================================== */}
      <nav className="sidebar-nav">
        <ul className="nav-list">

          {/* ====================================================
              DASHBOARD
          ==================================================== */}
          <li className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}>
            <a href="#dashboard" className="nav-link" onClick={(e) => handleNavigation(e, "dashboard")}>
              <LayoutDashboard className="nav-icon" />
              <span>Dashboard</span>
            </a>
          </li>

          {/* ====================================================
              PROJECT BOARD
          ==================================================== */}
          <li className={`nav-item ${activeTab === "project-board" ? "active" : ""}`}>
            <a href="#project-board" className="nav-link" onClick={(e) => handleNavigation(e, "project-board")}>
              <KanbanSquare className="nav-icon" />
              <span>Project Board</span>
            </a>
          </li>

          {/* ====================================================
              UPLOAD HSPK
          ==================================================== */}
          <li className={`nav-item ${activeTab === "upload-hspk" ? "active" : ""}`}>
            <a href="#upload-hspk" className="nav-link" onClick={(e) => handleNavigation(e, "upload-hspk")}>
              <Upload className="nav-icon" />
              <span>Upload HSPK</span>
            </a>
          </li>
          
          {/* ====================================================
              1. DROPDOWN PERENCANAAN
          ==================================================== */}
          <li className="nav-item has-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isPerencanaanOpen ? "dropdown-open" : ""}`} 
              onClick={() => setIsPerencanaanOpen(!isPerencanaanOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Layers className="nav-icon" />
                <span>Perencanaan</span>
              </div>
              {isPerencanaanOpen ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
            </button>

            {/* Isi Dropdown Perencanaan */}
            <ul className={`sub-nav-list ${isPerencanaanOpen ? "open" : ""}`}>
              <li className={`sub-nav-item ${activeTab === "data-survey" ? "active" : ""}`}>
                <a href="#data-survey" className="sub-nav-link" onClick={(e) => handleNavigation(e, "data-survey")}>
                  <Map className="nav-icon" size={18} />
                  <span>Data Survey</span>
                </a>
              </li>
              <li className={`sub-nav-item ${activeTab === "bv" ? "active" : ""}`}>
                <a href="#bv" className="sub-nav-link" onClick={(e) => handleNavigation(e, "bv")}>
                  <ClipboardList className="nav-icon" size={18} />
                  <span>BackUp Volume</span>
                </a>
              </li>
              <li className={`sub-nav-item ${activeTab === "rab" ? "active" : ""}`}>
                <a href="#rab" className="sub-nav-link" onClick={(e) => handleNavigation(e, "rab")}>
                  <Wallet className="nav-icon" size={18} />
                  <span>RAB & Budgeting</span>
                </a>
              </li>
            </ul>
          </li>

          {/* ====================================================
              2. DROPDOWN PELAKSANAAN
          ==================================================== */}
          <li className="nav-item has-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isPelaksanaanOpen ? "dropdown-open" : ""}`} 
              onClick={() => setIsPelaksanaanOpen(!isPelaksanaanOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Wrench className="nav-icon" />
                <span>Pelaksana</span>
              </div>
              {isPelaksanaanOpen ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
            </button>

            {/* Isi Dropdown Pelaksana */}
            <ul className={`sub-nav-list ${isPelaksanaanOpen ? "open" : ""}`}>
              <li className={`sub-nav-item ${activeTab === "time-schedule" ? "active" : ""}`}>
                <a href="#time-schedule" className="sub-nav-link" onClick={(e) => handleNavigation(e, "time-schedule")}>
                  <Timeline className="nav-icon" size={18} />
                  <span>Time Schedule</span>
                </a>
              </li>
              <li className={`sub-nav-item ${activeTab === "join-opname" ? "active" : ""}`}>
                <a href="#join-opname" className="sub-nav-link" onClick={(e) => handleNavigation(e, "join-opname")}>
                  <ClipboardCheck className="nav-icon" size={18} />
                  <span>Join Opname</span>
                </a>
              </li>

                <li className={`sub-nav-item ${activeTab === "complain" ? "active" : ""}`}>
                <a href="#complain" className="sub-nav-link" onClick={(e) => handleNavigation(e, "complain")}>
                  <ClipboardCheck className="nav-icon" size={18} />
                  <span>Complain</span>
                </a>
              </li>
            </ul>
          </li>
          
          {/* ====================================================
              AI DOCUMENT GENERATOR
          ==================================================== */}
          <li className="nav-item">
            <a href="#docs" className="nav-link" onClick={(e) => e.preventDefault()}>
              <FileText className="nav-icon" />
              <span>AI Document Generator</span>
            </a>
          </li>

        </ul>

        {/* ======================================================
            CREATE PROJECT
        ====================================================== */}
        <button type="button" className="create-btn" onClick={() => setIsModalOpen(true)}>
          <Plus className="btn-icon" />
          <span>Create Project</span>
        </button>

      </nav>

      {/* ========================================================
          CREATE PROJECT MODAL
      ======================================================== */}
      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ========================================================
          FOOTER
      ======================================================== */}
      <div className="sidebar-footer">
        <ul className="nav-list">
          {/* PROFILE SETTINGS */}
          <li className="nav-item">
            <a href="#settings" className="nav-link" onClick={(e) => e.preventDefault()}>
              <Settings className="nav-icon" />
              <span>Profile Settings</span>
            </a>
          </li>

          {/* SUPPORT */}
          <li className="nav-item">
            <a href="#support" className="nav-link" onClick={(e) => e.preventDefault()}>
              <HelpCircle className="nav-icon" />
              <span>Support</span>
            </a>
          </li>
        </ul>
      </div>

    </aside>
  );
};

export default Sidebar;