import { useEffect, useState } from "react";
import "../styles/Bv.css";
import {
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import CreateBvModal from "./CreateBvModal";

const API_BASE = "http://localhost:4000/api";
const PROJECTS_URL = `${API_BASE}/projects`;

const Bv = ({
  initialProjectId = null,
  onBack,
}) => {
  const [projectId, setProjectId] =
    useState(initialProjectId);

  const [projectList, setProjectList] =
    useState([]);

  const [project, setProject] =
    useState(null);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  // ==========================================
  // SET INITIAL PROJECT
  // ==========================================

  useEffect(() => {
    if (initialProjectId !== null) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // ==========================================
  // FETCH PROJECT
  // HANYA PROJECT YANG SUDAH MEMILIKI SURVEY
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchSurveyedProjects =
      async () => {
        setLoadingProjects(true);

        try {
          // ======================================
          // 1. AMBIL SEMUA PROJECT
          // ======================================

          const projectResponse =
            await fetch(PROJECTS_URL);

          if (!projectResponse.ok) {
            throw new Error(
              "Gagal mengambil daftar project."
            );
          }

          const projectData =
            await projectResponse.json();

          const projectsArray =
            Array.isArray(projectData)
              ? projectData
              : Array.isArray(
                  projectData?.data
                )
              ? projectData.data
              : [];

          // ======================================
          // 2. CEK SURVEY MASING-MASING PROJECT
          // ======================================

          const checkedProjects =
            await Promise.all(
              projectsArray.map(
                async (projectItem) => {
                  try {
                    const surveyResponse =
                      await fetch(
                        `${API_BASE}/projects/${projectItem.id}/surveys`
                      );

                    if (
                      !surveyResponse.ok
                    ) {
                      return null;
                    }

                    const surveys =
                      await surveyResponse.json();

                    const surveyArray =
                      Array.isArray(
                        surveys
                      )
                        ? surveys
                        : Array.isArray(
                            surveys?.data
                          )
                        ? surveys.data
                        : [];

                    // ==================================
                    // HANYA LULUS JIKA SURVEY > 0
                    // ==================================

                    if (
                      surveyArray.length >
                      0
                    ) {
                      return projectItem;
                    }

                    return null;
                  } catch (error) {
                    console.error(
                      `Gagal mengecek survey project ${projectItem.id}:`,
                      error
                    );

                    return null;
                  }
                }
              )
            );

          // ======================================
          // 3. BUANG PROJECT TANPA SURVEY
          // ======================================

          const surveyedProjects =
            checkedProjects.filter(
              Boolean
            );

          if (cancelled) return;

          setProjectList(
            surveyedProjects
          );

          // ======================================
          // 4. CEK PROJECT YANG SEDANG DIPILIH
          // ======================================

          if (
            initialProjectId &&
            !surveyedProjects.some(
              (item) =>
                item.id ===
                initialProjectId
            )
          ) {
            setProjectId(null);
          }
        } catch (error) {
          console.error(
            "Error mengambil project:",
            error
          );

          if (!cancelled) {
            setProjectList([]);
            setProjectId(null);
          }
        } finally {
          if (!cancelled) {
            setLoadingProjects(false);
          }
        }
      };

    fetchSurveyedProjects();

    return () => {
      cancelled = true;
    };
  }, [initialProjectId]);

  // ==========================================
  // FETCH DETAIL PROJECT
  // ==========================================

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    let cancelled = false;

    const fetchProjectDetail =
      async () => {
        try {
          const response =
            await fetch(
              `${PROJECTS_URL}/${projectId}`
            );

          if (!response.ok) {
            throw new Error(
              "Gagal mengambil detail project."
            );
          }

          const data =
            await response.json();

          if (!cancelled) {
            setProject(data);
          }
        } catch (error) {
          console.error(
            "Error detail project:",
            error
          );

          if (!cancelled) {
            setProject(null);
          }
        }
      };

    fetchProjectDetail();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ==========================================
  // HANDLE PROJECT CHANGE
  // ==========================================

  const handleProjectChange = (
    event
  ) => {
    const value =
      event.target.value;

    setProjectId(
      value || null
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="bv-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header
        className="bv-page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        {/* TOMBOL KEMBALI */}

        {onBack && (
          <button
            className="btn-back"
            onClick={onBack}
            style={{
              marginTop: "2px",
            }}
            type="button"
          >
            <ChevronLeft size={18} />
            Kembali
          </button>
        )}

        <div style={{ flex: 1 }}>        
          <h2 className="bv-page-title">
            BackUp Volume 
          </h2>

          <p className="bv-page-subtitle">
            Pilih project yang sudah memiliki
            laporan survey, lalu susun Group
            Pekerjaan dan Baris Pekerjaan.
          </p>
        </div>

        {/* ==================================
            PROJECT SELECT
        ================================== */}

        <div className="bv-project-picker">

          <select
            className="bv-project-select"
            value={projectId || ""}
            onChange={
              handleProjectChange
            }
            disabled={
              loadingProjects
            }
          >
            <option value="">
              {loadingProjects
                ? "Memuat project..."
                : "-- pilih project --"}
            </option>

            {projectList.map(
              (projectItem) => (
                <option
                  key={projectItem.id}
                  value={projectItem.id}
                >
                  {projectItem.name}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={14}
            className="bv-project-select-icon"
          />
        </div>
      </header>

      {/* ======================================
          BELUM PILIH PROJECT
      ====================================== */}

      {!projectId ? (
        <div className="bv-page-empty">

          {loadingProjects ? (
            "Memeriksa project yang sudah memiliki Survey..."
          ) : projectList.length ===
            0 ? (
            "Belum ada project yang memiliki laporan Survey. Isi laporan Survey terlebih dahulu di menu Perencanaan."
          ) : (
            "Pilih project yang sudah memiliki laporan Survey dari dropdown di atas."
          )}

        </div>
      ) : (
        <CreateBvModal
          isOpen={true}
          projectId={projectId}
          projectName={project?.name}
          hspkPeriodLabel={
            project?.hspkPeriod
              ? `HSPK ${project.hspkPeriod}`
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Bv;