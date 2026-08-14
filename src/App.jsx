import React, { useState } from "react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProjectBoard from "./components/ProjectBoard";
import ViewDetail from "./components/ViewDetails";
import Rab from "./components/Rab";
import UploadHspk from "./components/UploadHspk";
import Bv from "./components/Bv";
import TimeSchedulePage from "./components/TimeSchedulePage";
import JoinOpnamePage from "./components/JoinOpname";

function App() {
  // ============================================================
  // STATE
  // ============================================================

  // Menentukan halaman/menu yang sedang aktif
  const [activeTab, setActiveTab] = useState("dashboard");

  // Project yang sedang dipilih
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Project yang sedang digunakan untuk RAB
  // Format: { id, name }
  const [rabProject, setRabProject] = useState(null);

  // Project yang sedang digunakan untuk BV
  // Format: { id, name }
  const [bvProject, setBvProject] = useState(null);

  // ============================================================
  // HANDLER PROJECT
  // ============================================================

  /**
   * Dipanggil ketika user membuka detail project
   */
  const handleViewDetails = (projectId) => {
    console.log("View Project:", projectId);

    setSelectedProjectId(projectId);
    setActiveTab("project-detail");
  };

  /**
   * Dipanggil ketika user membuat / membuka RAB project
   */
  const handleCreateRab = (projectId, projectName) => {
    console.log("Open RAB Project:", projectId);

    setSelectedProjectId(projectId);

    setRabProject({
      id: projectId,
      name: projectName,
    });

    setActiveTab("rab");
  };

  /**
   * Dipanggil ketika user membuat / membuka BV project
   */
  const handleCreateBv = (projectId, projectName) => {
    console.log("Open BV Project:", projectId);

    setSelectedProjectId(projectId);

    setBvProject({
      id: projectId,
      name: projectName,
    });

    setActiveTab("bv");
  };

  /**
   * Membuka halaman Time Schedule
   *
   * Project ID yang digunakan berasal dari selectedProjectId.
   */
  const handleOpenTimeSchedule = () => {
    console.log("Open Time Schedule:", selectedProjectId);

    setActiveTab("time-schedule");
  };

  /**
   * Kembali ke dashboard
   */
  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#111111",
      }}
    >
      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          minWidth: 0,
        }}
      >

        {/* ======================================================
            DASHBOARD
        ====================================================== */}

        {activeTab === "dashboard" && (
          <Dashboard
            onViewDetails={handleViewDetails}
            onCreateRab={handleCreateRab}
            onCreateBv={handleCreateBv}
          />
        )}

        {/* ======================================================
            PROJECT BOARD
        ====================================================== */}

        {activeTab === "project-board" && (
          <ProjectBoard />
        )}

        {/* ======================================================
            PROJECT DETAIL
        ====================================================== */}

        {activeTab === "project-detail" && (
          <ViewDetail
            projectId={selectedProjectId}
            onBack={handleBackToDashboard}
          />
        )}

        {/* ======================================================
            RAB
        ====================================================== */}

        {activeTab === "rab" && (
          <Rab
            initialProjectId={rabProject?.id || selectedProjectId}
          />
        )}

        {/* ======================================================
            UPLOAD HSPK
        ====================================================== */}

        {activeTab === "upload-hspk" && (
          <UploadHspk />
        )}

        {/* ======================================================
            BV
        ====================================================== */}

        {activeTab === "bv" && (
          <Bv
            initialExpandedProjectId={
              bvProject?.id || selectedProjectId
            }
          />
        )}

        {/* ======================================================
            TIME SCHEDULE
        ====================================================== */}

        {activeTab === "time-schedule" && (
          <TimeSchedulePage
            projectId={selectedProjectId}
            apiBaseUrl="http://localhost:4000/api"
          />
        )}

        {activeTab === "join-opname" && (
        <JoinOpnamePage
          initialProjectId={selectedProjectId}
          apiBaseUrl="http://localhost:4000/api"
        />
      )}

        {/* ======================================================
            FALLBACK
        ====================================================== */}

        {![
          "dashboard",
          "project-board",
          "project-detail",
          "rab",
          "upload-hspk",
          "bv",
          "time-schedule",
        ].includes(activeTab) && (
          <div
            style={{
              padding: "30px",
              color: "white",
            }}
          >
            <h2>Halaman Sedang Dibuat</h2>
            <p>
              Menu <strong>{activeTab}</strong> belum tersedia.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;

