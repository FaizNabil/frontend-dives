import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/TimeSchedulePage.css";

// ============================================================================
// API CONFIG
// ============================================================================
const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

// ============================================================================
// HELPERS
// ============================================================================
function buildApiUrl(apiBaseUrl, path, params) {
  const base = (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const url = new URL(`${base}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWeight(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN COMPONENT: TimeSchedulePage
// ============================================================================
function TimeSchedulePage({ projectId: initialProjectId = null, apiBaseUrl = DEFAULT_API_BASE_URL }) {
  // ==========================================================
  // STATE: PROJECT
  // ==========================================================
  const [projectId, setProjectId] = useState(initialProjectId || null);
  const [projectList, setProjectList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState(null);

  // ==========================================================
  // STATE: TIME SCHEDULE DATA
  // ==========================================================
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // ==========================================================
  // STATE: START DATE & DISCIPLINE FILTER
  // ==========================================================
  const [startDateInput, setStartDateInput] = useState("");
  const [savingStartDate, setSavingStartDate] = useState(false);
  const [disciplineInput, setDisciplineInput] = useState("");
  const [appliedDiscipline, setAppliedDiscipline] = useState("");

  // ==========================================================
  // STATE: ITEM SCHEDULE DRAFTS & CHART
  // ==========================================================
  const [editDrafts, setEditDrafts] = useState({});
  const [busyItems, setBusyItems] = useState({});
  const [hoverPoint, setHoverPoint] = useState(null);

  // ==========================================================
  // UTILS: NOTIFICATION
  // ==========================================================
  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  }, []);

  // ==========================================================
  // FETCH: PROJECT LIST
  // ==========================================================
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectError(null);

    try {
      const url = buildApiUrl(apiBaseUrl, "/projects");
      const res = await fetch(url);
      const json = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(json?.error || json?.message || `Gagal mengambil project (status ${res.status})`);
      }

      const projects = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.projects)
        ? json.projects
        : [];

      setProjectList(projects);

      if (!projectId && projects.length > 0) {
        setProjectId(projects[0].id);
      }
    } catch (err) {
      console.error("Error Fetch Projects:", err);
      setProjectError(err.message || "Gagal mengambil daftar project.");
    } finally {
      setLoadingProjects(false);
    }
  }, [apiBaseUrl, projectId]);

  // Load project list on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync initial project ID
  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  // ==========================================================
  // FETCH: TIME SCHEDULE
  // ==========================================================
  const fetchSchedule = useCallback(async (selectedProjectId, discipline = "") => {
    if (!selectedProjectId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = buildApiUrl(apiBaseUrl, `/projects/${selectedProjectId}/time-schedule`, {
        discipline: discipline || undefined,
      });
      const res = await fetch(url);
      const json = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(json?.error || json?.message || `Gagal memuat data (status ${res.status})`);
      }

      setData(json);
      setStartDateInput(json?.startDate ? String(json.startDate).slice(0, 10) : "");
      setEditDrafts({}); // Reset drafts on load
    } catch (err) {
      console.error("Error Fetch Time Schedule:", err);
      setError(err.message || "Terjadi kesalahan saat memuat Time Schedule.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Trigger fetch when project or discipline filter changes
  useEffect(() => {
    if (projectId) {
      fetchSchedule(projectId, appliedDiscipline);
    } else {
      setData(null);
    }
  }, [projectId, appliedDiscipline, fetchSchedule]);

  // ==========================================================
  // HANDLERS: PROJECT & FILTERS
  // ==========================================================
  const handleProjectChange = (e) => {
    const newProjectId = e.target.value || null;
    setProjectId(newProjectId);
    setData(null);
    setError(null);
    setEditDrafts({});
    setHoverPoint(null);
    setAppliedDiscipline("");
    setDisciplineInput("");
  };

  const handleApplyFilter = () => setAppliedDiscipline(disciplineInput.trim());
  const handleResetFilter = () => {
    setDisciplineInput("");
    setAppliedDiscipline("");
  };

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================
  const handleExportExcel = () => {
    if (!projectId) {
      return showNotice("error", "Pilih project terlebih dahulu untuk di-export.");
    }

    // Membangun URL untuk endpoint export tunggal
    const url = buildApiUrl(apiBaseUrl, `/projects/${projectId}/time-schedule/export`);
    
    // Membuka URL di tab baru agar browser otomatis memulai proses download file Excel
    window.open(url, "_blank");
  };

  // (Opsional) Jika Anda ingin tombol untuk export combined (Sipil + Interior)
  const handleExportCombined = () => {
    if (!projectId) {
      return showNotice("error", "Pilih project terlebih dahulu untuk di-export.");
    }
    const url = buildApiUrl(apiBaseUrl, `/projects/${projectId}/time-schedule/export-combined`);
    window.open(url, "_blank");
  };

  // ==========================================================
  // HANDLERS: START DATE
  // ==========================================================
  const handleSaveStartDate = async () => {
    if (!projectId) return showNotice("error", "Pilih project terlebih dahulu.");
    if (!startDateInput) return showNotice("error", "Pilih tanggal mulai proyek terlebih dahulu.");

    setSavingStartDate(true);
    try {
      const url = buildApiUrl(apiBaseUrl, `/projects/${projectId}/start-date`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDateInput }),
      });
      const json = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(json?.error || json?.message || `Gagal menyimpan tanggal (status ${res.status})`);
      }

      showNotice("success", json?.message || "Tanggal mulai proyek berhasil disimpan.");
      await fetchSchedule(projectId, appliedDiscipline);
    } catch (err) {
      showNotice("error", err.message || "Gagal menyimpan tanggal mulai.");
    } finally {
      setSavingStartDate(false);
    }
  };

  // ==========================================================
  // DRAFTS & VALIDATION
  // ==========================================================
  const getDraft = (item) => {
    const currentDraft = editDrafts[item.rabItemId] || {};
    return {
      startWeek: currentDraft.startWeek ?? (item.startWeek != null ? String(item.startWeek) : ""),
      endWeek: currentDraft.endWeek ?? (item.endWeek != null ? String(item.endWeek) : ""),
    };
  };

  const updateDraft = (rabItemId, patch) => {
    setEditDrafts((prev) => ({
      ...prev,
      [rabItemId]: { ...(prev[rabItemId] || {}), ...patch },
    }));
  };

  const validateDraft = (draft) => {
    const start = Number(draft.startWeek);
    const end = Number(draft.endWeek);

    if (!Number.isInteger(start) || !Number.isInteger(end)) return "Minggu mulai dan selesai wajib berupa angka bulat.";
    if (start < 1) return "Minggu mulai minimal 1.";
    if (end < start) return "Minggu selesai tidak boleh lebih kecil dari minggu mulai.";
    return null;
  };

  // ==========================================================
  // HANDLERS: ITEM SCHEDULE
  // ==========================================================
  const setItemBusy = (id, busy) => setBusyItems((prev) => ({ ...prev, [id]: busy }));

  const handleSaveItemSchedule = async (item) => {
    const draft = getDraft(item);
    const validationError = validateDraft(draft);

    if (validationError) return showNotice("error", validationError);

    setItemBusy(item.rabItemId, true);
    try {
      const url = buildApiUrl(apiBaseUrl, `/rab-items/${item.rabItemId}/schedule`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startWeek: Number(draft.startWeek),
          endWeek: Number(draft.endWeek),
        }),
      });
      const json = await parseJsonSafe(res);

      if (!res.ok) throw new Error(json?.error || json?.message || `Gagal menyimpan jadwal (status ${res.status})`);

      showNotice("success", json?.message || `Jadwal "${item.name}" berhasil disimpan.`);
      await fetchSchedule(projectId, appliedDiscipline);
    } catch (err) {
      showNotice("error", err.message || "Gagal menyimpan jadwal.");
    } finally {
      setItemBusy(item.rabItemId, false);
    }
  };

  const handleDeleteItemSchedule = async (item) => {
    setItemBusy(item.rabItemId, true);
    try {
      const url = buildApiUrl(apiBaseUrl, `/rab-items/${item.rabItemId}/schedule`);
      const res = await fetch(url, { method: "DELETE" });
      const json = await parseJsonSafe(res);

      if (!res.ok) throw new Error(json?.error || json?.message || `Gagal menghapus jadwal (status ${res.status})`);

      showNotice("success", json?.message || `Jadwal "${item.name}" berhasil dihapus.`);
      setEditDrafts((prev) => {
        const next = { ...prev };
        delete next[item.rabItemId];
        return next;
      });
      await fetchSchedule(projectId, appliedDiscipline);
    } catch (err) {
      showNotice("error", err.message || "Gagal menghapus jadwal.");
    } finally {
      setItemBusy(item.rabItemId, false);
    }
  };

  // ==========================================================
  // DERIVED DATA (MEMO)
  // ==========================================================
  const maxWeek = data?.maxWeek || 0;
  const weekDates = data?.weekDates || [];
  const items = data?.items || [];
  const cumulativeTotal = data?.cumulativeTotal || {};

  const scheduledCount = useMemo(() => items.filter((it) => it.startWeek != null && it.endWeek != null).length, [items]);

  const lastProgress = useMemo(() => {
    if (!maxWeek) return 0;
    const raw = Number(cumulativeTotal[String(maxWeek)] ?? cumulativeTotal[maxWeek] ?? 0);
    if (!Number.isFinite(raw)) return 0;
    return Math.min(100, Math.max(0, raw));
  }, [cumulativeTotal, maxWeek]);

  const groupedItems = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.groupName || "Tanpa Group";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  const weekRange = useMemo(() => Array.from({ length: maxWeek }, (_, i) => i + 1), [maxWeek]);

  // ==========================================================
  // S-CURVE CHART CALCULATION
  // ==========================================================
  const chart = useMemo(() => {
    const width = 720;
    const height = 260;
    const padding = { top: 16, right: 20, bottom: 34, left: 46 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    if (!maxWeek || maxWeek < 1) {
      return { width, height, padding, points: [], areaPath: "", linePath: "", innerW, innerH };
    }

    const xFor = (week) => padding.left + (maxWeek === 1 ? innerW / 2 : ((week - 1) / (maxWeek - 1)) * innerW);
    const yFor = (pct) => padding.top + innerH - (Math.min(100, Math.max(0, pct)) / 100) * innerH;

    const points = weekRange.map((week) => {
      const raw = Number(cumulativeTotal[String(week)] ?? cumulativeTotal[week] ?? 0);
      const pct = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
      const weekInfo = weekDates.find((w) => w.week === week);

      return {
        week,
        pct,
        x: xFor(week),
        y: yFor(pct),
        start: weekInfo?.start ?? null,
        end: weekInfo?.end ?? null,
      };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const areaPath = points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${yFor(0)} L${points[0].x},${yFor(0)} Z`
      : "";

    return { width, height, padding, points, areaPath, linePath, innerW, innerH, xFor, yFor };
  }, [maxWeek, weekRange, cumulativeTotal, weekDates]);

  // ==========================================================
  // NO PROJECT ERROR STATE
  // ==========================================================
  if (!loadingProjects && projectList.length === 0 && projectError) {
    return (
      <div className="tsp-page">
        <div className="tsp-card tsp-empty-state tsp-error-state">
          <h2>Gagal Memuat Project</h2>
          <p>{projectError}</p>
          <button className="tsp-btn tsp-btn-primary" onClick={fetchProjects}>Coba Lagi</button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="tsp-page">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="tsp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="tsp-title">Time Schedule Proyek</h1>
          <p className="tsp-subtitle">
            Kelola jadwal pelaksanaan tiap item pekerjaan dan pantau progres rencana melalui Kurva S.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Badge Minggu */}
          <div className="tsp-badge">
            {loading ? "Memuat..." : `${maxWeek} Minggu Proyek`}
          </div>

          {/* Tombol Export - Hanya muncul jika ada project yang dipilih */}
          {projectId && (
            <button 
              className="tsp-btn tsp-btn-primary" 
              onClick={handleExportExcel}
              disabled={loading}
            >
              ⬇ Export Excel
            </button>
          )}
        </div>
      </header>

      {/* ======================================================
          NOTICE
      ====================================================== */}
      {notice && (
        <div className={`tsp-notice tsp-notice-${notice.type}`}>
          {notice.message}
        </div>
      )}

      {/* ======================================================
          PROJECT SELECTOR
      ====================================================== */}
      <div className="tsp-card tsp-project-card">
        <h2 className="tsp-card-title">Pilih Project</h2>
        <div className="rab-project-picker">
          <select className="rab-project-select" value={projectId || ""} onChange={handleProjectChange} disabled={loadingProjects}>
            <option value="">{loadingProjects ? "Memuat project..." : "-- pilih project --"}</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {/* Chevron dibuat dengan CSS supaya tidak membutuhkan import icon tambahan */}
          <span className="rab-project-select-icon">▼</span>
        </div>
        {projectError && <div className="tsp-field-error">{projectError}</div>}
      </div>

      {/* ======================================================
          JIKA BELUM PILIH PROJECT
      ====================================================== */}
      {!projectId ? (
        <div className="tsp-card tsp-empty-state">
          <h2>Pilih Project Terlebih Dahulu</h2>
          <p>Pilih project pada dropdown di atas untuk melihat Time Schedule.</p>
        </div>
      ) : (
        <>
          {/* ==================================================
              LOADING & ERROR STATES
          ================================================== */}
          {loading && !data ? (
            <div className="tsp-card tsp-empty-state">
              <div className="tsp-spinner" />
              <p>Memuat data Time Schedule...</p>
            </div>
          ) : error ? (
            <div className="tsp-card tsp-empty-state tsp-error-state">
              <p>{error}</p>
              <button className="tsp-btn tsp-btn-primary" onClick={() => fetchSchedule(projectId, appliedDiscipline)}>
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {/* ==============================================
                  START DATE + DISCIPLINE
              ============================================== */}
              <div className="tsp-controls-row">
                {/* START DATE */}
                <div className="tsp-card tsp-control-card">
                  <h2 className="tsp-card-title">Tanggal Mulai Proyek</h2>
                  <div className="tsp-control-row">
                    <input type="date" className="tsp-input" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} />
                    <button className="tsp-btn tsp-btn-primary" onClick={handleSaveStartDate} disabled={savingStartDate}>
                      {savingStartDate ? "Menyimpan..." : "Simpan Tanggal Mulai"}
                    </button>
                  </div>
                </div>

                {/* DISCIPLINE */}
                <div className="tsp-card tsp-control-card">
                  <h2 className="tsp-card-title">Filter Disiplin</h2>
                  <div className="tsp-control-row">
                    <input type="text" className="tsp-input" placeholder="mis. Sipil, Arsitektur..." value={disciplineInput} onChange={(e) => setDisciplineInput(e.target.value)} />
                    <button className="tsp-btn tsp-btn-secondary" onClick={handleApplyFilter}>Terapkan Filter</button>
                    <button className="tsp-btn tsp-btn-ghost" onClick={handleResetFilter}>Reset</button>
                  </div>
                </div>
              </div>

              {/* ==============================================
                  SUMMARY
              ============================================== */}
              <div className="tsp-summary-grid">
                <div className="tsp-card tsp-summary-card">
                  <span className="tsp-summary-label">Jumlah Item RAB</span>
                  <span className="tsp-summary-value">{items.length}</span>
                </div>
                <div className="tsp-card tsp-summary-card">
                  <span className="tsp-summary-label">Item Sudah Dijadwalkan</span>
                  <span className="tsp-summary-value">{scheduledCount}</span>
                </div>
                <div className="tsp-card tsp-summary-card">
                  <span className="tsp-summary-label">Jumlah Minggu</span>
                  <span className="tsp-summary-value">{maxWeek}</span>
                </div>
                <div className="tsp-card tsp-summary-card">
                  <span className="tsp-summary-label">Progress Rencana Terakhir</span>
                  <span className="tsp-summary-value">{formatWeight(lastProgress)}%</span>
                </div>
              </div>

              {/* ==============================================
                  S-CURVE CHART
              ============================================== */}
              <div className="tsp-card tsp-chart-card">
                <h2 className="tsp-card-title">Kurva S — Progress Rencana Kumulatif</h2>
                {maxWeek < 1 || chart.points.length === 0 ? (
                  <div className="tsp-empty-state tsp-chart-empty">
                    <p>Belum ada data jadwal untuk ditampilkan pada kurva.</p>
                  </div>
                ) : (
                  <div className="tsp-chart-wrap">
                    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="tsp-chart-svg" role="img" aria-label="Grafik Kurva S progress rencana">
                      {/* GRID */}
                      {[0, 25, 50, 75, 100].map((pct) => (
                        <g key={pct}>
                          <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={chart.yFor(pct)} y2={chart.yFor(pct)} className="tsp-grid-line" />
                          <text x={chart.padding.left - 8} y={chart.yFor(pct)} className="tsp-axis-label" textAnchor="end" dominantBaseline="middle">
                            {pct}%
                          </text>
                        </g>
                      ))}

                      {/* X AXIS */}
                      {chart.points.filter((_, i) => i % Math.ceil(maxWeek / 12 || 1) === 0).map((p) => (
                        <text key={`x-${p.week}`} x={p.x} y={chart.height - chart.padding.bottom + 18} className="tsp-axis-label" textAnchor="middle">
                          M{p.week}
                        </text>
                      ))}

                      {/* AREA */}
                      {chart.areaPath && <path d={chart.areaPath} className="tsp-area-path" />}

                      {/* LINE */}
                      {chart.linePath && <path d={chart.linePath} className="tsp-line-path" />}

                      {/* POINT */}
                      {chart.points.map((p) => (
                        <circle
                          key={p.week}
                          cx={p.x}
                          cy={p.y}
                          r={hoverPoint?.week === p.week ? 5 : 3}
                          className="tsp-point"
                          onMouseEnter={() => setHoverPoint(p)}
                          onMouseLeave={() => setHoverPoint(null)}
                        />
                      ))}
                    </svg>

                    {/* TOOLTIP */}
                    {hoverPoint && (
                      <div className="tsp-tooltip" style={{ left: `${(hoverPoint.x / chart.width) * 100}%`, top: `${(hoverPoint.y / chart.height) * 100}%` }}>
                        <strong>Minggu {hoverPoint.week}</strong>
                        <span>{formatDate(hoverPoint.start)} — {formatDate(hoverPoint.end)}</span>
                        <span>Kumulatif: {formatWeight(hoverPoint.pct)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ==============================================
                  GANTT TABLE
              ============================================== */}
              <div className="tsp-card tsp-gantt-card">
                <h2 className="tsp-card-title">Tabel Jadwal Pekerjaan</h2>
                {items.length === 0 ? (
                  <div className="tsp-empty-state">
                    <p>Belum ada item pekerjaan untuk ditampilkan.</p>
                  </div>
                ) : (
                  <div className="tsp-gantt-scroll">
                    <table className="tsp-gantt-table">
                      <thead>
                        <tr>
                          <th className="tsp-sticky-col tsp-col-group">Group</th>
                          <th className="tsp-sticky-col tsp-col-name">Nama Pekerjaan</th>
                          <th className="tsp-sticky-col tsp-col-unit">Satuan</th>
                          <th className="tsp-sticky-col tsp-col-volume">Volume</th>
                          <th className="tsp-sticky-col tsp-col-price">Nilai RAB</th>
                          <th className="tsp-sticky-col tsp-col-weight">Bobot</th>
                          <th className="tsp-sticky-col tsp-col-range">Rentang Minggu</th>
                          <th className="tsp-sticky-col tsp-col-action">Aksi</th>
                          {weekRange.map((w) => {
                            const wd = weekDates.find((x) => x.week === w);
                            return (
                              <th key={w} className="tsp-week-col">
                                <div>Minggu {w}</div>
                                {wd && (wd.start || wd.end) && (
                                  <div className="tsp-week-date">
                                    {formatDate(wd.start)} - {formatDate(wd.end)}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {groupedItems.map(([groupName, groupItems]) => (
                          <React.Fragment key={groupName}>
                            {/* GROUP ROW */}
                            <tr className="tsp-group-heading-row">
                              <td className="tsp-sticky-col tsp-group-heading" colSpan={8}>
                                {groupName}
                              </td>
                              {weekRange.map((w) => (
                                <td key={w} className="tsp-week-col tsp-group-heading-cell" />
                              ))}
                            </tr>

                            {/* ITEM ROWS */}
                            {groupItems.map((item) => {
                              const draft = getDraft(item);
                              const busy = !!busyItems[item.rabItemId];
                              const disabled = item.hasChildren;
                              const hasSchedule = item.startWeek != null && item.endWeek != null;
                              const draftErr = validateDraft(draft);

                              return (
                                <tr key={item.rabItemId} className={item.hasChildren ? "tsp-parent-row" : ""}>
                                  {/* GROUP */}
                                  <td className="tsp-sticky-col tsp-col-group">{item.groupName || "-"}</td>

                                  {/* NAME */}
                                  <td className="tsp-sticky-col tsp-col-name">
                                    {item.isChild && <span className="tsp-child-indent">↳ </span>}
                                    {item.name}
                                    {item.isByOwner && <span className="tsp-owner-tag">By Owner</span>}
                                    {item.isStip && <span className="tsp-stip-tag">Stip</span>}
                                    {item.hasChildren && <span className="tsp-parent-tag">Parent / tidak dihitung sebagai bobot langsung</span>}
                                  </td>

                                  {/* UNIT */}
                                  <td className="tsp-sticky-col tsp-col-unit">{item.paymentUnit || "-"}</td>

                                  {/* VOLUME */}
                                  <td className="tsp-sticky-col tsp-col-volume">{item.volume ?? 0}</td>

                                  {/* PRICE */}
                                  <td className="tsp-sticky-col tsp-col-price">{formatCurrency(item.rabTotalPrice)}</td>

                                  {/* WEIGHT */}
                                  <td className="tsp-sticky-col tsp-col-weight">{formatWeight(item.weight)}%</td>

                                  {/* WEEK RANGE */}
                                  <td className="tsp-sticky-col tsp-col-range">
                                    {disabled ? (
                                      <span className="tsp-muted">Tidak dapat diedit</span>
                                    ) : (
                                      <div className="tsp-range-inputs">
                                        <input
                                          type="number"
                                          min={1}
                                          className="tsp-week-input"
                                          value={draft.startWeek}
                                          onChange={(e) => updateDraft(item.rabItemId, { startWeek: e.target.value })}
                                          disabled={busy}
                                        />
                                        <span>-</span>
                                        <input
                                          type="number"
                                          min={1}
                                          className="tsp-week-input"
                                          value={draft.endWeek}
                                          onChange={(e) => updateDraft(item.rabItemId, { endWeek: e.target.value })}
                                          disabled={busy}
                                        />
                                      </div>
                                    )}
                                    {!disabled && draftErr && <div className="tsp-field-error">{draftErr}</div>}
                                  </td>

                                  {/* ACTION */}
                                  <td className="tsp-sticky-col tsp-col-action">
                                    {!disabled && (
                                      <div className="tsp-action-buttons">
                                        <button className="tsp-btn tsp-btn-primary tsp-btn-sm" onClick={() => handleSaveItemSchedule(item)} disabled={busy}>
                                          {busy ? "..." : "Simpan Jadwal"}
                                        </button>
                                        {hasSchedule && (
                                          <button className="tsp-btn tsp-btn-danger tsp-btn-sm" onClick={() => handleDeleteItemSchedule(item)} disabled={busy}>
                                            Hapus
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* WEEK CELLS */}
                                  {weekRange.map((w) => {
                                    const inRange = hasSchedule && w >= item.startWeek && w <= item.endWeek;
                                    return (
                                      <td key={w} className="tsp-week-col">
                                        {inRange && <div className={`tsp-bar ${item.hasChildren ? "tsp-bar-parent" : ""}`} title={`${item.name} — Minggu ${w}`} />}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TimeSchedulePage;