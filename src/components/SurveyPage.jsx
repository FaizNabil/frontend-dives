import React, { useEffect, useState } from "react";
import "../styles/SurveyPage.css";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Map,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Ruler,
  Sparkles,
  Loader2,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";
const IMAGE_BASE_URL = "http://localhost:4000";

export default function SurveyPage({
  projectId,
  projectName, // (Opsional) Jika parent yang mengatur nama project. Tapi bisa juga diambil dari list.
  onBack,
  onOpenSurveyForm = () => {},
  onGenerateAi = async () => {},
  onChangeProject = () => {},
}) {
  // --- STATE UNTUK PROJECT LIST ---
  const [projectList, setProjectList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // --- STATE UNTUK SURVEY LIST ---
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingAiId, setGeneratingAiId] = useState(null);

  // ==========================================================
  // FETCH PROJECTS (Untuk Dropdown)
  // ==========================================================
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`${API_BASE}/projects`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Gagal mengambil data list project.");
      }

      // Pastikan format responsenya sesuai (berupa array)
      const projectsData = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
        
      setProjectList(projectsData);
    } catch (err) {
      console.error("Fetch projects error:", err);
      // Opsional: tampilkan alert atau biarkan dropdown kosong
    } finally {
      setLoadingProjects(false);
    }
  };

  // Panggil fetchProjects saat komponen pertama kali dimuat
  useEffect(() => {
    fetchProjects();
  }, []);

  // ==========================================================
  // FETCH SURVEY (Berdasarkan Project Terpilih)
  // ==========================================================
  const fetchSurveys = async () => {
    if (!projectId) {
      setSurveys([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/surveys`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Gagal mengambil data survey.");
      }

      const surveyData = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setSurveys(surveyData);
    } catch (err) {
      console.error("Fetch survey error:", err);
      setError(err.message || "Gagal mengambil data survey.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [projectId]);

  // ==========================================================
  // FORMATTERS
  // ==========================================================
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "-";

    return numberValue.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }
    return `${IMAGE_BASE_URL}${photoUrl}`;
  };

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const handleOpenSurveyForm = () => onOpenSurveyForm();
  const handleEditSurvey = (surveyId) => onOpenSurveyForm(surveyId);
  const handleProjectChange = (e) => onChangeProject(e.target.value);

  const handleDeleteSurvey = async (surveyId) => {
    if (!surveyId) return;
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus laporan survey ini?\n\nSemua area, dimensi, dan foto yang terkait akan dihapus."
    );
    if (!confirmed) return;

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/surveys/${surveyId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || result?.message || "Gagal menghapus survey.");
      }
      alert(result?.message || "Laporan Survey berhasil dihapus.");
      await fetchSurveys();
    } catch (err) {
      console.error("Delete survey error:", err);
      setError(err.message || "Gagal menghapus survey.");
    }
  };

  const handleViewPdf = (surveyId) => {
    if (!surveyId) return;
    window.open(`${API_BASE}/surveys/${surveyId}/pdf/view`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = (surveyId) => {
    if (!surveyId) return;
    window.location.href = `${API_BASE}/surveys/${surveyId}/pdf/download`;
  };

  const handleGenerateAi = async (survey) => {
    if (!survey?.id) return;
    try {
      setGeneratingAiId(survey.id);
      await onGenerateAi(survey);
    } catch (err) {
      console.error("Generate AI error:", err);
      alert(err.message || "Gagal menjalankan Generate AI.");
    } finally {
      setGeneratingAiId(null);
    }
  };

  // --- MENCARI NAMA PROJECT OTOMATIS JIKA projectName KOSONG ---
  const currentProjectName = projectName || projectList.find((p) => p.id === projectId)?.name || "-";

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="survey-page-wrapper">
      
      {/* HEADER */}
      <header className="survey-page-header">
        <div className="survey-header-left">
          <button className="btn-back" onClick={onBack} type="button">
            <ChevronLeft size={18} />
            Kembali
          </button>
          <div className="survey-page-heading">
            <h2>Data Laporan Survey Lapangan</h2>
            <span className="survey-project-name">
              Project: <strong>{currentProjectName}</strong>
            </span>
          </div>
        </div>

        <div className="survey-header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* ==================================
              PROJECT SELECT (Di-fetch dari API)
          ================================== */}
          <div className="bv-project-picker">
            <select
              className="bv-project-select"
              value={projectId || ""}
              onChange={handleProjectChange}
              disabled={loadingProjects}
            >
              <option value="">
                {loadingProjects ? "Memuat project..." : "-- pilih project --"}
              </option>
              {projectList.map((projectItem) => (
                <option key={projectItem.id} value={projectItem.id}>
                  {projectItem.name || projectItem.projectName}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="bv-project-select-icon" />
          </div>

          <button
            type="button"
            className="survey-input-button"
            onClick={handleOpenSurveyForm}
            disabled={!projectId}
            style={!projectId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <Plus size={17} />
            Input Survey
          </button>
        </div>
      </header>

      {/* STATE: LOADING SURVEY */}
      {loading && (
        <div className="survey-state-box">
          <Loader2 size={20} className="survey-loading-spinner" />
          <span>Memuat data survey...</span>
        </div>
      )}

      {/* STATE: ERROR */}
      {!loading && error && (
        <div className="survey-error-box">
          <FileText size={18} />
          <span>{error}</span>
          <button type="button" className="survey-retry-button" onClick={fetchSurveys}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* STATE: NO PROJECT SELECTED */}
      {!loading && !error && !projectId && (
        <div className="survey-empty-state">
          <Map size={48} className="survey-empty-icon" style={{ opacity: 0.5 }} />
          <h3>Pilih Project Terlebih Dahulu</h3>
          <p>Silakan pilih project pada menu dropdown di pojok kanan atas.</p>
        </div>
      )}

      {/* STATE: EMPTY (Project Terpilih Tapi Belum Ada Survey) */}
      {!loading && !error && surveys.length === 0 && projectId && (
        <div className="survey-empty-state">
          <Map size={48} className="survey-empty-icon" />
          <h3>Belum Ada Laporan Survey</h3>
          <p>Project ini belum memiliki data survey lapangan.</p>
          <button type="button" className="survey-input-button" onClick={handleOpenSurveyForm}>
            <Plus size={16} />
            Buat Laporan Survey
          </button>
        </div>
      )}

      {/* LIST SURVEY */}
      {!loading && !error && surveys.map((survey) => (
        <div key={survey.id} className="survey-card">
          
          <div className="survey-info-top">
            <div className="survey-info-item">
              <Calendar size={18} />
              <span>Tanggal: <strong>{formatDate(survey.surveyDate)}</strong></span>
            </div>
            <div className="survey-info-item">
              <User size={18} />
              <span>Surveyor: <strong>{survey.surveyorName || "-"}</strong></span>
            </div>

            <div className="survey-card-actions">
              <button
                type="button"
                className="survey-action-button survey-action-edit"
                onClick={() => handleEditSurvey(survey.id)}
                title="Edit survey"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                type="button"
                className="survey-action-button survey-action-delete"
                onClick={() => handleDeleteSurvey(survey.id)}
                title="Hapus survey"
              >
                <Trash2 size={14} /> Hapus
              </button>
              <button
                type="button"
                className="survey-action-button survey-action-view"
                onClick={() => handleViewPdf(survey.id)}
                title="Lihat PDF"
              >
                <Eye size={14} /> Lihat PDF
              </button>
              <button
                type="button"
                className="survey-action-button survey-action-download"
                onClick={() => handleDownloadPdf(survey.id)}
                title="Download PDF"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                type="button"
                className="survey-action-button survey-action-ai"
                onClick={() => handleGenerateAi(survey)}
                disabled={generatingAiId === survey.id}
              >
                {generatingAiId === survey.id ? (
                  <><Loader2 size={14} className="survey-ai-spinner" /> AI...</>
                ) : (
                  <><Sparkles size={14} /> Generate AI</>
                )}
              </button>
            </div>

            {survey.notes && (
              <div className="survey-info-full">
                <FileText size={18} />
                <span>Catatan Umum: <strong>{survey.notes}</strong></span>
              </div>
            )}
          </div>

          <div className="survey-areas-grid">
            {survey.areas?.map((area, areaIndex) => (
              <div key={area.id} className="area-card">
                <div className="area-content">
                  
                  <div className="area-header">
                    <h4>Area #{areaIndex + 1}</h4>
                    <span className="area-photo-count">{area.photos?.length || 0} Foto</span>
                  </div>

                  <div className="area-photo-wrapper">
                    {area.photos && area.photos.length > 0 ? (
                      <div className={area.photos.length === 1 ? "area-photo-grid area-photo-grid-single" : "area-photo-grid"}>
                        {[...area.photos]
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .map((photo, photoIndex) => {
                            const imageUrl = getImageUrl(photo.url);
                            return (
                              <div key={photo.id || `${area.id}-${photoIndex}`} className="area-photo-item">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={`${area.areaName || "Area"} - Foto ${photoIndex + 1}`}
                                    className="area-photo"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="no-photo">
                                    <ImageIcon size={28} />
                                    <span>Foto tidak tersedia</span>
                                  </div>
                                )}
                                <div className="area-photo-label">Foto {photoIndex + 1}</div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="no-photo">
                        <ImageIcon size={32} />
                        <span>Tidak ada foto</span>
                      </div>
                    )}
                  </div>

                  {area.photoCaption && <div className="area-photo-caption">{area.photoCaption}</div>}
                  <h4 className="area-name">{area.areaName || "-"}</h4>

                  <div className="area-detail-group">
                    <label>Analisa Kondisi</label>
                    <p>{area.analisa || "-"}</p>
                  </div>
                  <div className="area-detail-group">
                    <label>Rencana Penanganan</label>
                    <p>{area.penanganan || "-"}</p>
                  </div>
                  {area.informasiTambahan && (
                    <div className="area-detail-group">
                      <label>Informasi Tambahan</label>
                      <p>{area.informasiTambahan}</p>
                    </div>
                  )}

                  {area.dimensions && area.dimensions.length > 0 && (
                    <div className="dimension-section">
                      <div className="dimension-title">
                        <Ruler size={15} />
                        <span>Data Dimensi Lapangan</span>
                      </div>
                      <div className="dimension-table-wrapper">
                        <table className="dimensi-table">
                          <thead>
                            <tr>
                              <th>Keterangan</th>
                              <th>P</th>
                              <th>L</th>
                              <th>T</th>
                              <th>Luas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {area.dimensions.map((dimension) => (
                              <tr key={dimension.id}>
                                <td>{dimension.keterangan || "-"}</td>
                                <td>{formatNumber(dimension.panjang)}</td>
                                <td>{formatNumber(dimension.lebar)}</td>
                                <td>{formatNumber(dimension.tinggi)}</td>
                                <td>{formatNumber(dimension.luasan)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}