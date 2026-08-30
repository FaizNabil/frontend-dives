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
import SurveyForm from "./components/SurveyForm";
import SurveyPage from "./components/SurveyPage";

function App() {
  // ============================================================
  // STATE
  // ============================================================

  // Menu/halaman aktif
  const [activeTab, setActiveTab] = useState("dashboard");

  // Project aktif
  const [selectedProjectId, setSelectedProjectId] =
    useState(null);

  // Status survey
  const [hasDataSurvey, setHasDataSurvey] =
    useState(false);

  // Project RAB
  const [rabProject, setRabProject] =
    useState(null);

  // Project BV
  const [bvProject, setBvProject] =
    useState(null);

  // Project Survey
  const [surveyProject, setSurveyProject] =
    useState(null);

    // Tambahkan state ini untuk menyimpan ID survey yang mau diedit
const [editingSurveyId, setEditingSurveyId] = useState(null);

  // ============================================================
  // HANDLER PROJECT
  // ============================================================

  const handleViewDetails = (projectId) => {
    console.log(
      "View Project:",
      projectId
    );

    setSelectedProjectId(projectId);
    setActiveTab("project-detail");
  };

  // ============================================================
  // OPEN RAB
  // ============================================================

  const handleCreateRab = (
    projectId,
    projectName
  ) => {
    console.log(
      "Open RAB Project:",
      projectId
    );

    setSelectedProjectId(projectId);

    setRabProject({
      id: projectId,
      name: projectName,
    });

    setActiveTab("rab");
  };

  // ============================================================
  // OPEN BV
  // ============================================================

  const handleCreateBv = (
    projectId,
    projectName
  ) => {
    console.log(
      "Open BV Project:",
      projectId
    );

    setSelectedProjectId(projectId);

    setBvProject({
      id: projectId,
      name: projectName,
    });

    setActiveTab("bv");
  };

  // ============================================================
  // OPEN SURVEY
  // ============================================================

  const handleCreateSurvey = (
    projectId,
    projectName
  ) => {
    console.log(
      "Open Survey Project:",
      projectId
    );

    setSelectedProjectId(projectId);

    setSurveyProject({
      id: projectId,
      name: projectName,
    });

    // Masuk ke halaman daftar survey
    setActiveTab("data-survey");
  };

  // ============================================================
  // OPEN SURVEY FORM
  // ============================================================

  // ============================================================
  // OPEN SURVEY FORM
  // ============================================================

  // TAMBAHKAN parameter surveyId = null di dalam kurung:
  const handleOpenSurveyForm = (surveyId = null) => {
    console.log(
      "Open Survey Form:",
      selectedProjectId,
      "Edit ID:", surveyId
    );

    if (!selectedProjectId) {
      console.warn(
        "Tidak ada project yang dipilih."
      );
      return;
    } 
    
    setEditingSurveyId(surveyId); // Sekarang surveyId-nya dikenali!
  
    setActiveTab("survey-form"); // Pastikan namanya pakai strip (-)
  };  

  // ============================================================
  // BACK
  // ============================================================

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
  };

  const handleBackToSurveyPage = () => {
    setActiveTab("data-survey");
  };

  // ============================================================
  // SURVEY SAVED
  // ============================================================

  const handleSurveySaved = (
    surveyId
  ) => {
    console.log(
      "Survey berhasil disimpan:",
      surveyId
    );

    setHasDataSurvey(true);

    // Setelah submit, kembali ke daftar survey
    setActiveTab("data-survey");
  };

  // ============================================================
  // TIME SCHEDULE
  // ============================================================

  const handleOpenTimeSchedule =
    () => {
      console.log(
        "Open Time Schedule:",
        selectedProjectId
      );

      setActiveTab(
        "time-schedule"
      );
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

        {activeTab ===
          "dashboard" && (
          <Dashboard
            onViewDetails={
              handleViewDetails
            }
            onCreateRab={
              handleCreateRab
            }
            onCreateBv={
              handleCreateBv
            }
            onCreateSurvey={
              handleCreateSurvey
            }
          />
        )}

        {/* ======================================================
            PROJECT BOARD
        ====================================================== */}

        {activeTab ===
          "project-board" && (
          <ProjectBoard />
        )}

        {/* ======================================================
            PROJECT DETAIL
        ====================================================== */}

        {activeTab ===
          "project-detail" && (
          <ViewDetail
            projectId={
              selectedProjectId
            }
            onBack={
              handleBackToDashboard
            }
          />
        )}

        {/* ======================================================
            RAB
        ====================================================== */}

        {activeTab === "rab" && (
          <Rab
            initialProjectId={
              rabProject?.id ||
              selectedProjectId
            }
            onBack={() =>
              setActiveTab(
                "dashboard"
              )
            }
          />
        )}

        {/* ======================================================
            UPLOAD HSPK
        ====================================================== */}

        {activeTab ===
          "upload-hspk" && (
          <UploadHspk />
        )}

        {/* ======================================================
            DATA SURVEY
            HANYA MENAMPILKAN LAPORAN
        ====================================================== */}

        {activeTab ===
          "data-survey" && (
          <SurveyPage
            projectId={
              selectedProjectId
            }
            projectName={
              surveyProject?.name ||
              rabProject?.name ||
              bvProject?.name ||
              "Project Aktif"
            }
            onBack={
              handleBackToDashboard
            }
            onOpenSurveyForm={
              handleOpenSurveyForm
            }
            // onGenerateAi={(
            //   survey
            // ) => {
            //   console.log(
            //     "Generate AI:",
            //     survey
            //   );

            //   // Endpoint AI nanti bisa
            //   // dihubungkan di sini.
            // }}
          />
        )}

        {/* ======================================================
            SURVEY FORM
            HANYA MENAMPILKAN FORM INPUT
        ====================================================== */}

        {/* Pastikan prop surveyIdToEdit dimasukkan seperti ini */}
{activeTab === "survey-form" && (
          <SurveyForm 
            projectId={selectedProjectId} 
            surveyIdToEdit={editingSurveyId}
            onSaved={() => {
              setEditingSurveyId(null); 
              setActiveTab("data-survey"); // Ganti jadi "data-survey" untuk balik ke list
            }}
onCancel={() => {
      // Fungsi ini yang memicu tombol kembali muncul
      setEditingSurveyId(null); 
      setActiveTab("data-survey"); 
    }} 
          />
        )}

        {/* ======================================================
            BV
        ====================================================== */}

        {activeTab === "bv" && (
          <Bv
            initialProjectId={
              bvProject?.id ||
              selectedProjectId
            }
            onBack={() =>
              setActiveTab(
                "dashboard"
              )
            }
          />
        )}

        {/* ======================================================
            TIME SCHEDULE
        ====================================================== */}

        {activeTab ===
          "time-schedule" && (
          <TimeSchedulePage
            projectId={
              selectedProjectId
            }
            apiBaseUrl="http://localhost:4000/api"
          />
        )}

        {/* ======================================================
            JOIN OPNAME
        ====================================================== */}

        {activeTab ===
          "join-opname" && (
          <JoinOpnamePage
            initialProjectId={
              selectedProjectId
            }
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
          "data-survey",
          "survey-form",
          "bv",
          "time-schedule",
          "join-opname",
        ].includes(
          activeTab
        ) && (
          <div
            style={{
              padding: "30px",
              color: "white",
            }}
          >
            <h2>
              Halaman Sedang Dibuat
            </h2>

            <p>
              Menu{" "}
              <strong>
                {activeTab}
              </strong>{" "}
              belum tersedia.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;