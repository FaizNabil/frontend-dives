import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";

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
  Pencil,
  Trash2,
  RefreshCw,
  Lock,
  X,
  Save,
} from "lucide-react";

import CreateProjectModal from "./CreateProjectModal";

const API_BASE = "http://localhost:4000/api";
const PROJECTS_URL = `${API_BASE}/projects`;

const Dashboard = ({
  onViewDetails,
  onCreateBv,
  onCreateSurvey,
}) => {
  // ==========================================================
  // PROJECT DATA
  // ==========================================================

  const [data, setData] = useState([]);

  // ==========================================================
  // SURVEY STATUS
  // ==========================================================

  const [surveyStatus, setSurveyStatus] = useState({});

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  const [fetchError, setFetchError] = useState(null);

  // ==========================================================
  // CREATE MODAL
  // ==========================================================

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================================
  // EDIT PROJECT
  // ==========================================================

  const [editProject, setEditProject] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    hspkPeriod: "",
    discipline: "",
    grade: "",
    clientName: "",
  });

  const [savingEdit, setSavingEdit] = useState(false);

  const [editError, setEditError] = useState(null);

  // ==========================================================
  // GRADE OPTIONS
  // ==========================================================

  const gradeOptions = {
    SIPIL: ["A", "B", "C", "D"],
    INTERIOR: ["A", "B", "C", "D"],
  };

  // ==========================================================
  // CHECK SURVEY STATUS
  // ==========================================================

  const checkSurveyStatus = async (projects) => {
    if (
      !Array.isArray(projects) ||
      projects.length === 0
    ) {
      setSurveyStatus({});
      return;
    }

    setLoadingSurvey(true);

    try {
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(
              `${API_BASE}/projects/${project.id}/surveys`
            );

            if (!response.ok) {
              return {
                projectId: project.id,
                hasSurvey: false,
              };
            }

            const result = await response.json();

            const surveys = Array.isArray(result)
              ? result
              : Array.isArray(result?.data)
              ? result.data
              : [];

            return {
              projectId: project.id,
              hasSurvey: surveys.length > 0,
            };
          } catch (error) {
            console.error(
              `Gagal mengecek survey project ${project.id}:`,
              error
            );

            return {
              projectId: project.id,
              hasSurvey: false,
            };
          }
        })
      );

      const statusMap = {};

      results.forEach((item) => {
        statusMap[item.projectId] =
          item.hasSurvey;
      });

      setSurveyStatus(statusMap);
    } finally {
      setLoadingSurvey(false);
    }
  };

  // ==========================================================
  // FETCH PROJECT
  // ==========================================================

  const fetchProjects = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(
        PROJECTS_URL
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status}`
        );
      }

      const result = await response.json();

      const projects = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      setData(projects);

      await checkSurveyStatus(projects);
    } catch (error) {
      console.error(
        "Error fetching projects:",
        error
      );

      setData([]);
      setSurveyStatus({});

      setFetchError(
        "Failed to load projects. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL FETCH
  // ==========================================================

  useEffect(() => {
    fetchProjects();

    const handleFocus = () => {
      fetchProjects();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  // ==========================================================
  // DELETE PROJECT
  // ==========================================================

  const handleDeleteProject = async (
    projectId,
    projectName
  ) => {
    const confirmed = window.confirm(
      `Hapus project "${projectName}" beserta seluruh datanya?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${PROJECTS_URL}/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => null);

        throw new Error(
          body?.error ||
            "Gagal menghapus project."
        );
      }

      await fetchProjects();
    } catch (error) {
      console.error(
        "Error delete project:",
        error
      );

      alert(error.message);
    }
  };

  // ==========================================================
  // OPEN EDIT MODAL
  // ==========================================================

  const openEditProjectModal = (project) => {
    console.log(
      "Edit Project:",
      project
    );

    setEditError(null);

    setEditProject(project);

    setEditForm({
      name: project?.name || "",

      location: project?.location || "",

      hspkPeriod:
        project?.hspkPeriod !== null &&
        project?.hspkPeriod !== undefined
          ? String(project.hspkPeriod)
          : "",

      discipline:
        project?.discipline || "",

      grade:
        project?.grade || "",

      clientName:
        project?.client?.name || "",
    });
  };

  // ==========================================================
  // CLOSE EDIT MODAL
  // ==========================================================

  const closeEditProjectModal = () => {
    if (savingEdit) {
      return;
    }

    setEditProject(null);

    setEditForm({
      name: "",
      location: "",
      hspkPeriod: "",
      discipline: "",
      grade: "",
      clientName: "",
    });

    setEditError(null);
  };

  // ==========================================================
  // HANDLE EDIT INPUT
  // ==========================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    // Jika discipline berubah,
    // grade dikosongkan supaya user memilih ulang.
    if (name === "discipline") {
      setEditForm((prev) => ({
        ...prev,
        discipline: value,
        grade: "",
      }));

      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================================
  // SAVE EDIT PROJECT
  // ==========================================================

  const handleSaveEditProject = async (e) => {
    e?.preventDefault();

    // Validasi project
    if (!editProject?.id) {
      setEditError(
        "Project tidak ditemukan."
      );

      return;
    }

    // Validasi nama
    if (!editForm.name.trim()) {
      setEditError(
        "Nama project wajib diisi."
      );

      return;
    }

    // Validasi lokasi
    if (!editForm.location.trim()) {
      setEditError(
        "Location wajib diisi."
      );

      return;
    }

    // Validasi discipline
    if (!editForm.discipline) {
      setEditError(
        "Kategori pekerjaan wajib dipilih."
      );

      return;
    }

    // Validasi grade
    if (!editForm.grade) {
      setEditError(
        "Grade wajib dipilih."
      );

      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const response = await fetch(
        `${PROJECTS_URL}/${editProject.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: editForm.name.trim(),

            location:
              editForm.location.trim(),

            discipline:
              editForm.discipline,

            grade:
              editForm.grade,

            clientName:
              editForm.clientName.trim(),

            hspkPeriod:
              editForm.hspkPeriod === ""
                ? null
                : Number(
                    editForm.hspkPeriod
                  ),
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Gagal memperbarui project."
        );
      }

      // Tutup modal
      setEditProject(null);

      setEditForm({
        name: "",
        location: "",
        hspkPeriod: "",
        discipline: "",
        grade: "",
        clientName: "",
      });

      setEditError(null);

      // Refresh data
      await fetchProjects();
    } catch (error) {
      console.error(
        "Error update project:",
        error
      );

      setEditError(
        error.message ||
          "Terjadi kesalahan saat memperbarui project."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalActive = data.length;

  const planningCount = data.filter(
    (project) =>
      (project.phase || "PLANNING")
        .toUpperCase() === "PLANNING"
  ).length;

  const constructionCount = data.filter(
    (project) =>
      (project.phase || "")
        .toUpperCase() === "CONSTRUCTION"
  ).length;

  const issueCount = data.filter(
    (project) =>
      (project.phase || "")
        .toUpperCase() === "ISSUE DETECTED"
  ).length;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="dashboard-wrapper">

      {/* ======================================================
          TOP NAVBAR
      ====================================================== */}

      <header className="top-navbar">

        <div className="navbar-greeting">

          <h2>
            Welcome back, Jimmy.
          </h2>

          <p>
            Here is the summary of
            PT. Dives Jaya Perkasa
            projects today.
          </p>

        </div>

        <div className="navbar-actions">

          <div className="search-bar">

            <Search
              className="search-icon"
              size={18}
            />

            <input
              type="text"
              placeholder="Search projects..."
            />

          </div>

          <button
            className="icon-btn position-relative"
            type="button"
          >
            <Bell size={20} />

            <span className="notification-dot" />
          </button>

          <button
            className="icon-btn"
            type="button"
          >
            <Grid size={20} />
          </button>

          <div className="user-avatar">

            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="User Avatar"
            />

          </div>

        </div>

      </header>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="dashboard-content">

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="stats-grid">

          <div className="stat-card">

            <div className="stat-header">

              <div className="stat-icon-wrapper">

                <Network
                  size={20}
                  className="text-yellow"
                />

              </div>

              <span className="stat-label">
                ALL ACTIVE
              </span>

            </div>

            <div className="stat-value">
              {totalActive}
            </div>

            <div className="stat-desc">
              Active Projects
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-header">

              <div className="stat-icon-wrapper">

                <Compass
                  size={20}
                  className="text-gray"
                />

              </div>

              <span className="stat-label">
                PHASE 1
              </span>

            </div>

            <div className="stat-value">
              {planningCount}
            </div>

            <div className="stat-desc">
              In Planning Phase
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-header">

              <div className="stat-icon-wrapper">

                <UserCog
                  size={20}
                  className="text-gray"
                />

              </div>

              <span className="stat-label">
                PHASE 2
              </span>

            </div>

            <div className="stat-value">
              {constructionCount}
            </div>

            <div className="stat-desc">
              In Construction Phase
            </div>

          </div>

          <div className="stat-card danger-card">

            <div className="stat-header">

              <div className="stat-icon-wrapper danger-icon">

                <TriangleAlert size={20} />

              </div>

              <span className="stat-label danger-text">
                ACTION REQUIRED
              </span>

            </div>

            <div className="stat-value danger-text">
              {issueCount}
            </div>

            <div className="stat-desc">
              Unresolved Issues
            </div>

          </div>

        </div>

        {/* ====================================================
            PROJECTS
        ==================================================== */}

        <div className="projects-section">

          <div className="projects-header">

            <div className="projects-title">

              <div className="title-accent" />

              <h3>
                Recent Active Projects
              </h3>

            </div>

            <div className="projects-actions">

              <button
                className="icon-btn refresh-btn"
                onClick={fetchProjects}
                title="Refresh Data"
                disabled={
                  loading ||
                  loadingSurvey
                }
                type="button"
              >

                <RefreshCw
                  size={18}
                  className={
                    loading ||
                    loadingSurvey
                      ? "refresh-spinning"
                      : ""
                  }
                />

              </button>

              <button
                className="icon-btn new-project-btn"
                onClick={() =>
                  setIsModalOpen(true)
                }
                type="button"
              >

                <Plus size={18} />

                New Project

              </button>

              <button
                className="icon-btn"
                type="button"
              >
                <Filter size={18} />
              </button>

              <button
                className="icon-btn"
                type="button"
              >
                <MoreVertical size={18} />
              </button>

            </div>

          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="table-container">

            <table className="projects-table">

              <thead>

                <tr>

                  <th>
                    PROJECT NAME
                  </th>

                  <th>
                    CLIENT
                  </th>

                  <th>
                    LOCATION
                  </th>

                  <th>
                    PROGRESS
                  </th>

                  <th>
                    CURRENT PHASE
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center text-gray"
                    >
                      Loading projects...
                    </td>

                  </tr>

                ) : fetchError ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center text-danger"
                    >
                      {fetchError}
                    </td>

                  </tr>

                ) : data.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center text-gray"
                    >
                      No projects yet. Click
                      "New Project" to add one.
                    </td>

                  </tr>

                ) : (

                  data.map(
                    (
                      project,
                      index
                    ) => {

                      const hasSurvey =
                        surveyStatus[
                          project.id
                        ] === true;

                      const surveyChecking =
                        surveyStatus[
                          project.id
                        ] === undefined ||
                        loadingSurvey;

                      const bvDisabled =
                        surveyChecking ||
                        !hasSurvey;

                      return (
                        <tr
                          key={
                            project.id ??
                            index
                          }
                        >

                          {/* PROJECT NAME */}

                          <td className="fw-bold">

                            {project.name}

                          </td>

                          {/* CLIENT */}

                          <td className="text-gray">

                            {project.client?.name ||
                              "-"}

                          </td>

                          {/* LOCATION */}

                          <td className="text-gray">

                            {project.location ||
                              "-"}

                          </td>

                          {/* PROGRESS */}

                          <td>

                            <div className="progress-container">

                              <div className="progress-bar">

                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${project.progress ?? 0}%`,
                                  }}
                                />

                              </div>

                              <span className="progress-text">

                                {project.progress ??
                                  0}
                                %

                              </span>

                            </div>

                          </td>

                          {/* PHASE */}

                          <td>

                            <span
                              className={`phase-badge ${
                                project.phaseClass ||
                                "phase-planning"
                              }`}
                            >

                              {project.phase ||
                                "PLANNING"}

                            </span>

                          </td>

                          {/* ACTION */}

                          <td className="project-actions-cell">

                            {/* VIEW */}

                            <button
                              className="btn-view-details"
                              onClick={() =>
                                onViewDetails?.(
                                  project.id
                                )
                              }
                              type="button"
                            >
                              VIEW DETAILS
                            </button>

                            {/* SURVEY */}

                            <button
                              className="btn-create-survey"
                              onClick={() =>
                                onCreateSurvey?.(
                                  project.id,
                                  project.name
                                )
                              }
                              type="button"
                            >
                              CREATE SURVEY
                            </button>

                            {/* BV */}

                            <button
                              className={`btn-create-bv ${
                                hasSurvey
                                  ? "bv-enabled"
                                  : "bv-locked"
                              }`}
                              onClick={() => {

                                if (!hasSurvey) {
                                  return;
                                }

                                onCreateBv?.(
                                  project.id,
                                  project.name
                                );

                              }}
                              disabled={
                                bvDisabled
                              }
                              title={
                                surveyChecking
                                  ? "Sedang memeriksa data Survey..."
                                  : !hasSurvey
                                  ? "Survey harus diinput terlebih dahulu"
                                  : "Create BV"
                              }
                              type="button"
                            >

                              {surveyChecking ? (

                                <>
                                  <RefreshCw
                                    size={14}
                                    className="button-spinner"
                                  />

                                  CHECK...
                                </>

                              ) : hasSurvey ? (

                                "CREATE BV"

                              ) : (

                                <>
                                  <Lock
                                    size={14}
                                  />

                                  LOCKED
                                </>

                              )}

                            </button>

                            {/* EDIT / DELETE */}

                            <div className="project-row-tools">

                              <button
                                className="project-tool-btn edit-btn"
                                onClick={() =>
                                  openEditProjectModal(
                                    project
                                  )
                                }
                                title="Edit Project"
                                type="button"
                              >

                                <Pencil
                                  size={18}
                                />

                              </button>

                              <button
                                className="project-tool-btn delete-btn"
                                onClick={() =>
                                  handleDeleteProject(
                                    project.id,
                                    project.name
                                  )
                                }
                                title="Hapus Project"
                                type="button"
                              >

                                <Trash2
                                  size={18}
                                />

                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="projects-footer">

            <span className="text-gray text-sm">

              {loading
                ? "Loading..."
                : `Showing ${data.length} project${
                    data.length === 1
                      ? ""
                      : "s"
                  }`}

            </span>

            <div className="pagination">

              <button
                className="icon-btn"
                type="button"
              >
                <ChevronLeft
                  size={16}
                />
              </button>

              <button
                className="icon-btn"
                type="button"
              >
                <ChevronRight
                  size={16}
                />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          CREATE PROJECT MODAL
      ====================================================== */}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        onProjectCreated={
          fetchProjects
        }
      />

      {/* ======================================================
          EDIT PROJECT MODAL
      ====================================================== */}

      {editProject && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeEditProjectModal();
            }

          }}
        >

          <div className="modal-content">

            {/* HEADER */}

            <div className="modal-header">

              <h3>
                Edit Project
              </h3>

              <button
                className="close-btn"
                type="button"
                onClick={
                  closeEditProjectModal
                }
                disabled={savingEdit}
                title="Tutup"
              >

                <X size={20} />

              </button>

            </div>

            {/* ERROR */}

            {editError && (

              <div
                className="edit-modal-error"
                style={{
                  padding:
                    "12px 24px",
                  color:
                    "#e74c3c",
                  marginBottom:
                    "1rem",
                }}
              >
                {editError}
              </div>

            )}

            {/* EDIT FORM */}

            <form
              className="project-form"
              onSubmit={
                handleSaveEditProject
              }
            >

              <div className="card">

                <h2>
                  Basic Information
                </h2>

                <div className="grid">

                  {/* PROJECT NAME */}

                  <div className="form-group">

                    <label>
                      Project Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        editForm.name
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit
                      }
                      placeholder="Nama project"
                      required
                    />

                  </div>

                  {/* CLIENT */}

                  <div className="form-group">

                    <label>
                      Client Name
                    </label>

                    <input
                      type="text"
                      name="clientName"
                      value={
                        editForm.clientName
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit
                      }
                      placeholder="Nama client"
                    />

                  </div>

                  {/* LOCATION */}

                  <div className="form-group full">

                    <label>
                      Location
                    </label>

                    <input
                      type="text"
                      name="location"
                      value={
                        editForm.location
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit
                      }
                      placeholder="Lokasi project"
                      required
                    />

                  </div>

                  {/* DISCIPLINE */}

                  <div className="form-group full">

                    <label>
                      Kategori Pekerjaan
                    </label>

                    <select
                      name="discipline"
                      value={
                        editForm.discipline
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit
                      }
                      required
                    >

                      <option
                        value=""
                        disabled
                      >
                        -- Pilih Kategori --
                      </option>

                      <option value="SIPIL">
                        Sipil
                      </option>

                      <option value="INTERIOR">
                        Interior
                      </option>

                    </select>

                  </div>

                  {/* HSPK PERIOD */}

                  <div className="form-group full">

                    <label>
                      HSPK Period
                    </label>

                    <input
                      type="number"
                      name="hspkPeriod"
                      value={
                        editForm.hspkPeriod
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit
                      }
                      placeholder="Contoh: 2026"
                    />

                  </div>

                  {/* GRADE */}

                  <div className="form-group full">

                    <label>
                      Grade
                    </label>

                    <select
                      name="grade"
                      value={
                        editForm.grade
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={
                        savingEdit ||
                        !editForm.discipline
                      }
                      required
                    >

                      <option
                        value=""
                        disabled
                      >
                        {!editForm.discipline
                          ? "-- Pilih kategori pekerjaan dulu --"
                          : "-- Pilih Grade --"}
                      </option>

                      {(
                        gradeOptions[
                          editForm
                            .discipline
                        ] || []
                      ).map((grade) => (

                        <option
                          key={grade}
                          value={grade}
                        >
                          Grade {grade}
                        </option>

                      ))}

                    </select>

                  </div>

                </div>

              </div>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div className="actions">

                <button
                  type="button"
                  className="cancel"
                  onClick={
                    closeEditProjectModal
                  }
                  disabled={
                    savingEdit
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create"
                  disabled={
                    savingEdit
                  }
                >

                  {savingEdit ? (

                    <>
                      <RefreshCw
                        size={16}
                        className="button-spinner"
                      />

                      Saving...
                    </>

                  ) : (

                    <>
                      <Save
                        size={16}
                        style={{
                          marginRight:
                            "8px",
                        }}
                      />

                      Save Changes
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Dashboard;