import { useState } from "react";
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
  Map // <-- Tambahan icon Map untuk Data Survey
} from "lucide-react";

import CreateProjectModal from "./CreateProjectModal";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ============================================================
  // Helper untuk pindah halaman
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

          <li
            className={`nav-item ${
              activeTab === "dashboard" ? "active" : ""
            }`}
          >
            <a
              href="#dashboard"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "dashboard")
              }
            >
              <LayoutDashboard className="nav-icon" />
              <span>Dashboard</span>
            </a>
          </li>

          {/* ====================================================
              PROJECT BOARD
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "project-board" ? "active" : ""
            }`}
          >
            <a
              href="#project-board"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "project-board")
              }
            >
              <KanbanSquare className="nav-icon" />
              <span>Project Board</span>
            </a>
          </li>

          {/* ====================================================
              UPLOAD HSPK
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "upload-hspk" ? "active" : ""
            }`}
          >
            <a
              href="#upload-hspk"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "upload-hspk")
              }
            >
              <Upload className="nav-icon" />
              <span>Upload HSPK</span>
            </a>
          </li>
          
          {/* ====================================================
              DATA SURVEY
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "data-survey" ? "active" : ""
            }`}
          >
            <a
              href="#data-survey"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "data-survey")
              }
            >
              <Map className="nav-icon" />
              <span>Data Survey</span>
            </a>
          </li>

          {/* ====================================================
              BUAT BV
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "bv" ? "active" : ""
            }`}
          >
            <a
              href="#bv"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "bv")
              }
            >
              <ClipboardList className="nav-icon" />
              <span>Buat BV</span>
            </a>
          </li>

          {/* ====================================================
              RAB & BUDGETING
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "rab" ? "active" : ""
            }`}
          >
            <a
              href="#rab"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "rab")
              }
            >
              <Wallet className="nav-icon" />
              <span>RAB & Budgeting</span>
            </a>
          </li>

          {/* ====================================================
              TIME SCHEDULE
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "time-schedule" ? "active" : ""
            }`}
          >
            <a
              href="#time-schedule"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "time-schedule")
              }
            >
              <Timeline className="nav-icon" />
              <span>Time Schedule</span>
            </a>
          </li>

          {/* ====================================================
              JOIN OPNAME
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "join-opname" ? "active" : ""
            }`}
          >
            <a
              href="#join-opname"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "join-opname")
              }
            >
              <ClipboardCheck className="nav-icon" />
              <span>Join Opname</span>
            </a>
          </li>
          
          {/* ====================================================
              COMPLAIN
          ==================================================== */}

          <li
            className={`nav-item ${
              activeTab === "complain" ? "active" : ""
            }`}
          >
            <a
              href="#complain"
              className="nav-link"
              onClick={(e) =>
                handleNavigation(e, "complain")
              }
            >
              <CopyMinus className="nav-icon" />
              <span>Complain</span>
            </a>
          </li>

          {/* ====================================================
              AI DOCUMENT GENERATOR
          ==================================================== */}

          <li className="nav-item">
            <a
              href="#docs"
              className="nav-link"
              onClick={(e) => e.preventDefault()}
            >
              <FileText className="nav-icon" />
              <span>AI Document Generator</span>
            </a>
          </li>

        </ul>

        {/* ======================================================
            CREATE PROJECT
        ====================================================== */}

        <button
          type="button"
          className="create-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="btn-icon" />
          <span>Create Project</span>
        </button>

      </nav>

      {/* ========================================================
          CREATE PROJECT MODAL
      ======================================================== */}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <div className="sidebar-footer">

        <ul className="nav-list">

          {/* PROFILE SETTINGS */}

          <li className="nav-item">
            <a
              href="#settings"
              className="nav-link"
              onClick={(e) => e.preventDefault()}
            >
              <Settings className="nav-icon" />
              <span>Profile Settings</span>
            </a>
          </li>

          {/* SUPPORT */}

          <li className="nav-item">
            <a
              href="#support"
              className="nav-link"
              onClick={(e) => e.preventDefault()}
            >
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