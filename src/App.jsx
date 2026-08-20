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
import SurveyForm from "./components/SurveyForm"; // <-- Tambahan Import Survey

function App() {
  // ============================================================
  // STATE
  // ============================================================

  // Menentukan halaman/menu yang sedang aktif
  const [activeTab, setActiveTab] = useState("dashboard");

  // Project yang sedang dipilih
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Project yang sedang digunakan untuk RAB
  const [rabProject, setRabProject] = useState(null);

  // Project yang sedang digunakan untuk BV
  const [bvProject, setBvProject] = useState(null);

  // Project yang sedang digunakan untuk Survey
  const [surveyProject, setSurveyProject] = useState(null); // <-- Tambahan state

  // ============================================================
  // HANDLER PROJECT
  // ============================================================

  const handleViewDetails = (projectId) => {
    console.log("View Project:", projectId);
    setSelectedProjectId(projectId);
    setActiveTab("project-detail");
  };

  const handleCreateRab = (projectId, projectName) => {
    console.log("Open RAB Project:", projectId);
    setSelectedProjectId(projectId);
    setRabProject({ id: projectId, name: projectName });
    setActiveTab("rab");
  };

  const handleCreateBv = (projectId, projectName) => {
    console.log("Open BV Project:", projectId);
    setSelectedProjectId(projectId);
    setBvProject({ id: projectId, name: projectName });
    setActiveTab("bv");
  };

  // <-- Tambahan Handler untuk membuka form Survey
  const handleCreateSurvey = (projectId, projectName) => {
    console.log("Open Survey Project:", projectId);
    setSelectedProjectId(projectId);
    setSurveyProject({ id: projectId, name: projectName });
    setActiveTab("data-survey");
  };

  const handleOpenTimeSchedule = () => {
    console.log("Open Time Schedule:", selectedProjectId);
    setActiveTab("time-schedule");
  };

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

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <Dashboard
            onViewDetails={handleViewDetails}
            onCreateRab={handleCreateRab}
            onCreateBv={handleCreateBv}
            onCreateSurvey={handleCreateSurvey} // <-- Mengirim prop ke Dashboard
          />
        )}

        {/* PROJECT BOARD */}
        {activeTab === "project-board" && <ProjectBoard />}

        {/* PROJECT DETAIL */}
        {activeTab === "project-detail" && (
          <ViewDetail
            projectId={selectedProjectId}
            onBack={handleBackToDashboard}
          />
        )}

        {/* RAB */}
        {activeTab === "rab" && (
          <Rab initialProjectId={rabProject?.id || selectedProjectId} />
        )}

        {/* UPLOAD HSPK */}
        {activeTab === "upload-hspk" && <UploadHspk />}

        {/* DATA SURVEY */}
        {/* <-- Render Komponen Survey Form di sini */}
        {activeTab === "data-survey" && (
          <div style={{ padding: "20px" }}>
             {/* Header kecil untuk memberi tahu user proyek mana yang sedang dikerjakan */}
             <h3 style={{ color: "#d4af6a", marginBottom: "15px" }}>
               Project: {surveyProject?.name || "Memuat..."}
             </h3>
             <SurveyForm 
                projectId={selectedProjectId} 
                onSaved={() => setActiveTab("dashboard")} // Kembali ke dashboard setelah simpan
             />
          </div>
        )}

        {/* BV */}
        {activeTab === "bv" && (
          <Bv initialExpandedProjectId={bvProject?.id || selectedProjectId} />
        )}

        {/* TIME SCHEDULE */}
        {activeTab === "time-schedule" && (
          <TimeSchedulePage
            projectId={selectedProjectId}
            apiBaseUrl="http://localhost:4000/api"
          />
        )}

        {/* JOIN OPNAME */}
        {activeTab === "join-opname" && (
          <JoinOpnamePage
            initialProjectId={selectedProjectId}
            apiBaseUrl="http://localhost:4000/api"
          />
        )}

        {/* FALLBACK PAGE */}
        {/* <-- Menambahkan "data-survey" dan "join-opname" agar tidak memicu error fallback */}
        {![
          "dashboard",
          "project-board",
          "project-detail",
          "rab",
          "upload-hspk",
          "data-survey",
          "bv",
          "time-schedule",
          "join-opname"
        ].includes(activeTab) && (
          <div style={{ padding: "30px", color: "white" }}>
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