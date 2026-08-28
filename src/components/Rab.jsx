import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ClipboardList,
  Scale,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import "../styles/Rab.css";

const API_ROOT = "http://localhost:4000/api";
const API_URL = `${API_ROOT}/projects`;

const fmtRp = (n) =>
  "Rp " +
  Number(n || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  });

const Rab = ({ initialProjectId = null, onBack }) => {
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectList, setProjectList] = useState([]);
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  
  // State untuk Edit Individual
  const [editModal, setEditModal] = useState(null);

  // State untuk Hapus Massal
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  
  // State untuk Update Harga Massal (Bentuknya dibuat sama persis dengan Edit Individual)
  const [bulkModal, setBulkModal] = useState(null);

  // ==========================================================
  // INITIAL PROJECT
  // ==========================================================
  useEffect(() => {
    if (initialProjectId !== null) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // ==========================================================
  // LOAD PROJECT LIST
  // ==========================================================
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Gagal memuat daftar project.");

      const result = await response.json();
      const projects = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];

      const checkedProjects = await Promise.all(
        projects.map(async (projectItem) => {
          try {
            const surveyResponse = await fetch(`${API_ROOT}/projects/${projectItem.id}/surveys`);
            if (!surveyResponse.ok) return null;
            const surveyResult = await surveyResponse.json();
            const surveys = Array.isArray(surveyResult) ? surveyResult : Array.isArray(surveyResult?.data) ? surveyResult.data : [];
            if (surveys.length === 0) return null;
            return projectItem;
          } catch {
            return null;
          }
        })
      );

      const surveyedProjects = checkedProjects.filter(Boolean);
      setProjectList(surveyedProjects);

      if (initialProjectId && !surveyedProjects.some((item) => item.id === initialProjectId)) {
        setProjectId(null);
      }
    } catch (error) {
      setProjectList([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [initialProjectId]);

  // ==========================================================
  // FETCH RAB DATA (Pengganti loadTree)
  // ==========================================================
  const fetchRabData = async () => {
    if (!projectId) {
      setProject(null);
      setGroups([]);
      setSelectedItemIds([]);
      return;
    }
    setLoading(true);
    setFetchError(null);

    try {
      const [projectResponse, groupsResponse] = await Promise.all([
        fetch(`${API_URL}/${projectId}`),
        fetch(`${API_URL}/${projectId}/rab-groups`),
      ]);

      if (!projectResponse.ok) throw new Error("Gagal memuat project.");
      if (!groupsResponse.ok) throw new Error("Gagal memuat RAB.");

      const projectData = await projectResponse.json();
      const groupsData = await groupsResponse.json();

      setProject(projectData);
      setGroups(Array.isArray(groupsData) ? groupsData : Array.isArray(groupsData?.data) ? groupsData.data : []);
      setSelectedItemIds([]);
    } catch (error) {
      setFetchError(error.message || "Gagal memuat data RAB.");
      setProject(null);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRabData();
  }, [projectId]);

  // ==========================================================
  // FLATTEN ITEM & SUBTOTAL
  // ==========================================================
  const flattenItems = (groupList) =>
    (groupList || []).flatMap((group) => [
      ...(group.items || []),
      ...flattenItems(group.children),
    ]);

  const allItems = useMemo(() => flattenItems(groups), [groups]);

  const sumGroupRecursive = (group) => {
    let total = (group.items || []).reduce((sum, item) => sum + Number(item.rabTotalPrice || 0), 0);
    for (const child of group.children || []) {
      total += sumGroupRecursive(child);
    }
    return total;
  };

  const totalRab = allItems.reduce((sum, item) => sum + Number(item.rabTotalPrice || 0), 0);
  const totalRap = allItems.reduce((sum, item) => sum + Number(item.rapTotalPrice || 0), 0);
  const selisih = totalRap - totalRab;

  // ==========================================================
  // SEARCH & FILTER
  // ==========================================================
  const matchesQuery = (item, query) =>
    item.name?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    item.reference?.toLowerCase().includes(query);

  const filterGroups = (groupList, query) => {
    if (!query) return groupList;
    return (groupList || []).map((group) => {
      const filteredItems = (group.items || []).filter((item) => matchesQuery(item, query));
      const filteredChildren = filterGroups(group.children, query);
      if (filteredItems.length === 0 && filteredChildren.length === 0) return null;
      return { ...group, items: filteredItems, children: filteredChildren };
    }).filter(Boolean);
  };

  const visibleGroups = useMemo(() => filterGroups(groups, search.trim().toLowerCase()), [groups, search]);

  // ==========================================================
  // DELETE ACTIONS (SINGLE & BULK)
  // ==========================================================
  const deleteGroup = async (id) => {
    if (!window.confirm("Hapus group ini? Semua sub-group dan baris pekerjaan di dalamnya akan ikut terhapus.")) return;
    try {
      const response = await fetch(`${API_ROOT}/rab-groups/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus group.");
      await fetchRabData();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Hapus baris pekerjaan ini?")) return;
    try {
      const response = await fetch(`${API_ROOT}/rab-items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus item.");
      await fetchRabData();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleSelection = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedItemIds.length} item terpilih?`)) return;

    try {
      const response = await fetch(`${API_ROOT}/rab-items/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedItemIds }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal menghapus massal.");
      }
      setSelectedItemIds([]); 
      await fetchRabData();
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================================
  // EDIT ITEM INDIVIDUAL (MODAL LOGIC)
  // ==========================================================
  const openEdit = (item) => {
    setEditModal({
      item,
      pricingMode: "manual",
      rapUnitPrice: item.rapUnitPrice ?? 0,
      overheadPercent: item.overheadPercent ?? item.overhead ?? 0,
      isByOwner: !!item.isByOwner,
      isStip: !!item.isStip,
      sourceJobId: "",
      switchQuery: "",
      switchResults: [],
    });
  };

  const toggleByOwner = () => {
    setEditModal((prev) => {
      const next = !prev.isByOwner;
      return { ...prev, isByOwner: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice };
    });
  };

  const toggleStip = () => {
    setEditModal((prev) => {
      const next = !prev.isStip;
      return { ...prev, isStip: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice };
    });
  };

  const searchSwitchJobs = async (query) => {
    setEditModal((prev) => ({ ...prev, switchQuery: query }));
    if (query.trim().length < 2) {
      setEditModal((prev) => ({ ...prev, switchResults: [] }));
      return;
    }
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const response = await fetch(`${API_ROOT}/jobs?${params.toString()}`);
      if (response.ok) {
        const results = await response.json();
        setEditModal((prev) => ({
          ...prev,
          switchResults: Array.isArray(results) ? results : [],
        }));
      }
    } catch {}
  };

  const handleSaveEdit = async () => {
    const { item, pricingMode, isByOwner, isStip, overheadPercent, rapUnitPrice, sourceJobId } = editModal;
    const editingItemId = item.id;

    if (pricingMode === "manual") {
      const finalRapUnitPrice = isByOwner || isStip ? 0 : Number(rapUnitPrice);
      try {
        const res = await fetch(`${API_ROOT}/rab-items/${editingItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rapUnitPrice: finalRapUnitPrice,
            overheadPercent: Number(overheadPercent),
            isByOwner,
            isStip,
          }),
        });
        if (!res.ok) throw new Error("Gagal menyimpan data ke server.");
        
        setEditModal(null);
        fetchRabData(); 
      } catch (err) {
        alert("Gagal menyimpan harga manual: " + err.message);
      }
    } 
    else if (pricingMode === "ahsp") {
      if (!sourceJobId) return alert("Pilih Master Pekerjaan (AHSP) dari daftar!");
      try {
        const res = await fetch(`${API_ROOT}/rab-items/${editingItemId}/switch-job`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newJobTypeId: sourceJobId,
            customOverhead: Number(overheadPercent),
            isByOwner,
            isStip,
          }),
        });
        if (!res.ok) throw new Error("Gagal menghubungkan data AHSP.");
        
        setEditModal(null);
        fetchRabData();
      } catch (err) {
        alert("Gagal menarik data Master AHSP: " + err.message);
      }
    }
  };

  // ==========================================================
  // BULK UPDATE (MODAL LOGIC BARU - IDENTIK DENGAN INDIVIDUAL)
  // ==========================================================
  const openBulkModal = () => {
    setBulkModal({
      name: "",
      pricingMode: "manual",
      rapUnitPrice: 0,
      overheadPercent: 0,
      isByOwner: false,
      isStip: false,
      sourceJobId: "",
      switchQuery: "",
      switchResults: [],
    });
  };

  const toggleBulkByOwner = () => {
    setBulkModal((prev) => {
      const next = !prev.isByOwner;
      return { ...prev, isByOwner: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice };
    });
  };

  const toggleBulkStip = () => {
    setBulkModal((prev) => {
      const next = !prev.isStip;
      return { ...prev, isStip: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice };
    });
  };

  const searchBulkSwitchJobs = async (query) => {
    setBulkModal((prev) => ({ ...prev, switchQuery: query }));
    if (query.trim().length < 2) {
      setBulkModal((prev) => ({ ...prev, switchResults: [] }));
      return;
    }
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const response = await fetch(`${API_ROOT}/jobs?${params.toString()}`);
      if (response.ok) {
        const results = await response.json();
        setBulkModal((prev) => ({
          ...prev,
          switchResults: Array.isArray(results) ? results : [],
        }));
      }
    } catch {}
  };

  const handleBulkUpdateSubmit = async () => {
    if (!projectId) return alert("Pilih project terlebih dahulu.");
    if (!bulkModal.name.trim()) return alert("Nama item wajib diisi.");

    const { pricingMode, isByOwner, isStip, overheadPercent, rapUnitPrice, sourceJobId } = bulkModal;

    // 1. Filter Item yang namanya sama persis
    const matchedItems = allItems.filter(
      (item) => item.name.trim().toLowerCase() === bulkModal.name.trim().toLowerCase()
    );

    if (matchedItems.length === 0) {
      return alert(`Tidak ditemukan item dengan nama "${bulkModal.name}" di project ini.`);
    }

    if (!window.confirm(`Ditemukan ${matchedItems.length} item "${bulkModal.name}". Terapkan perubahan ke semuanya?`)) return;

    try {
      // 2. Loop update menggunakan endpoint individual agar Support AHSP & Manual secara utuh
      if (pricingMode === "manual") {
        const finalRapUnitPrice = isByOwner || isStip ? 0 : Number(rapUnitPrice);
        const payload = {
          rapUnitPrice: finalRapUnitPrice,
          overheadPercent: Number(overheadPercent),
          isByOwner,
          isStip,
        };

        await Promise.all(
          matchedItems.map(async (item) => {
            const res = await fetch(`${API_ROOT}/rab-items/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Gagal update manual: ${item.name}`);
          })
        );
      } 
      else if (pricingMode === "ahsp") {
        if (!sourceJobId) return alert("Pilih Master Pekerjaan (AHSP) dari daftar pencarian terlebih dahulu!");

        await Promise.all(
          matchedItems.map(async (item) => {
            const res = await fetch(`${API_ROOT}/rab-items/${item.id}/switch-job`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                newJobTypeId: sourceJobId,
                customOverhead: Number(overheadPercent),
                isByOwner,
                isStip,
              }),
            });
            if (!res.ok) throw new Error(`Gagal tarik AHSP massal: ${item.name}`);
          })
        );
      }

      alert(`Berhasil memperbarui ${matchedItems.length} item secara massal!`);
      setBulkModal(null);
      fetchRabData(); 
    } catch (error) {
      alert("Kesalahan saat update massal: " + error.message);
    }
  };

  // ==========================================================
  // EXPORT & VIEW
  // ==========================================================
  const exportRabExcel = () => projectId && (window.location.href = `${API_ROOT}/projects/${projectId}/rab-items/export`);
  const exportBvExcel = () => projectId && (window.location.href = `${API_ROOT}/projects/${projectId}/bv-items/export`);
  const exportFullExcel = () => projectId && (window.location.href = `${API_ROOT}/projects/${projectId}/export-full`);
  const scheduleExport = () => projectId && (window.location.href = `${API_ROOT}/projects/${projectId}/time-schedule/export`);
  const viewRab = () => projectId && window.open(`${API_ROOT}/projects/${projectId}/rab-items/view`, "_blank");

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="rab-wrapper">
      <header className="rab-header">
        {onBack && (
          <button className="rab-back-btn" onClick={onBack} type="button">
            <ChevronLeft size={18} /> Kembali
          </button>
        )}
        <div className="rab-header-main">
          <p className="rab-eyebrow">{project?.name ? `Project: ${project.name}` : "Financial Control"}</p>
          <h2 className="rab-title">RAB &amp; Budgeting</h2>
          <p className="rab-subtitle">Rencana Anggaran Biaya (RAB) vs Rencana Anggaran Pelaksanaan (RAP) — hasil link dari BV</p>
        </div>
        <div className="rab-project-picker">
          <select
            className="rab-project-select"
            value={projectId || ""}
            onChange={(event) => setProjectId(event.target.value || null)}
            disabled={loadingProjects}
          >
            <option value="">{loadingProjects ? "Memuat project..." : "-- pilih project --"}</option>
            {projectList.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <ChevronDown size={15} className="rab-project-select-icon" />
        </div>
      </header>

      <main className="rab-content">
        {!projectId ? (
          <div className="rab-empty-state">
            <ClipboardList size={42} className="rab-empty-icon" />
            <h3>Belum ada project yang dipilih</h3>
            <p>Pilih project yang sudah memiliki laporan Survey dari dropdown di atas untuk melihat RAB.</p>
          </div>
        ) : (
          <>
            <div className="rab-toolbar">
              <button className="rab-btn" onClick={exportRabExcel}>⬇ Export RAB</button>
              <button className="rab-btn" onClick={exportBvExcel}>⬇ Export BV</button>
              <button className="rab-btn" onClick={scheduleExport}>⬇ Export Schedule</button>
              <button className="rab-btn" onClick={exportFullExcel}>⬇ Export Lengkap</button>
              <button className="rab-btn" onClick={viewRab}>👁 View RAB</button>
              
              {/* TOMBOL UPDATE HARGA MASSAL */}
              <button className="rab-btn" onClick={openBulkModal}>🪄 Update Harga Global</button>
              
              {/* TOMBOL DELETE TERPILIH */}
              {selectedItemIds.length > 0 && (
                <button className="rab-btn rab-btn-danger" onClick={handleBulkDelete}>
                  🗑 Hapus Terpilih ({selectedItemIds.length})
                </button>
              )}

              <button className="rab-btn rab-refresh-btn" onClick={loadProjects} type="button">
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            <div className="rab-stats-grid">
              <div className="rab-plate">
                <div className="rab-stat-header"><Wallet size={18} className="rab-stat-icon" /><span className="rab-stat-label">Total RAB</span></div>
                <div className="rab-stat-value is-mono">{fmtRp(totalRab)}</div>
                <div className="rab-stat-desc">Harga Jual / Kontrak</div>
              </div>
              <div className="rab-plate">
                <div className="rab-stat-header"><ClipboardList size={18} className="rab-stat-icon" /><span className="rab-stat-label">Total RAP</span></div>
                <div className="rab-stat-value is-mono">{fmtRp(totalRap)}</div>
                <div className="rab-stat-desc">Modal Pelaksanaan Murni</div>
              </div>
              <div className={`rab-plate ${selisih > 0 ? "is-danger" : ""}`}>
                <div className="rab-stat-header"><Scale size={18} className="rab-stat-icon" /><span className="rab-stat-label">Selisih</span></div>
                <div className="rab-stat-value is-mono">{selisih > 0 ? "+" : ""}{fmtRp(selisih)}</div>
                <div className="rab-stat-desc">RAP dikurangi RAB</div>
              </div>
              <div className="rab-plate">
                <div className="rab-stat-header"><TrendingUp size={18} className="rab-stat-icon" /><span className="rab-stat-label">Item</span></div>
                <div className="rab-stat-value is-mono">{allItems.length}</div>
                <div className="rab-stat-desc">Jumlah item pekerjaan</div>
              </div>
            </div>

            <div className="rab-plate rab-search-plate">
              <div className="rab-search-box">
                <Search size={15} className="rab-search-icon" />
                <input type="text" placeholder="Cari nama, kategori, atau reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="rab-plate rab-tree-plate">
              {loading ? (
                <p className="rab-state-message">Memuat data RAB...</p>
              ) : fetchError ? (
                <p className="rab-state-message rab-state-error">{fetchError}</p>
              ) : visibleGroups.length === 0 ? (
                <p className="rab-state-message">Belum ada Group Pekerjaan. Bikin dari halaman "Buat BV" dulu.</p>
              ) : (
                visibleGroups.map((group) => (
                  <RabGroupNode
                    key={group.id} group={group} depth={0}
                    sumGroupRecursive={sumGroupRecursive}
                    onDeleteGroup={deleteGroup}
                    onEditItem={openEdit}
                    onDeleteItem={deleteItem}
                    selectedItemIds={selectedItemIds}
                    onToggleSelect={toggleSelection}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* ================= MODAL UPDATE HARGA MASSAL (Sapu Jagat) ================= */}
      {bulkModal && (
        <div className="rab-modal-overlay">
          <div className="rab-modal">
            <h3>Update Harga Massal (Sapu Jagat)</h3>
            <p className="rab-form-hint" style={{ marginBottom: "16px" }}>
              Update massal item RAB berdasarkan <b>Nama Uraian Pekerjaan</b> yang sama.
            </p>

            <label className="rab-form-label">
              Nama Uraian Pekerjaan (Target)
              <input
                type="text"
                className="rab-form-input"
                placeholder="Ketik nama item yang mau diupdate..."
                value={bulkModal.name}
                onChange={(e) => setBulkModal({ ...bulkModal, name: e.target.value })}
              />
            </label>

            <div className="rab-toggle-row" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className={`rab-btn rab-btn-small ${bulkModal.isByOwner ? "rab-btn-active" : ""}`}
                onClick={toggleBulkByOwner}
              >
                {bulkModal.isByOwner ? "✓ By Owner" : "Set By Owner"}
              </button>
              <button
                type="button"
                className={`rab-btn rab-btn-small ${bulkModal.isStip ? "rab-btn-active" : ""}`}
                onClick={toggleBulkStip}
              >
                {bulkModal.isStip ? "Batal Set Stip" : "Set Harga Stip (-)"}
              </button>
            </div>

            <label className="rab-form-label" style={{ marginTop: '16px' }}>
              Persentase Overhead / Profit (%)
              <input
                type="number"
                step="0.01"
                className="rab-form-input"
                value={bulkModal.isByOwner || bulkModal.isStip ? "" : bulkModal.overheadPercent}
                disabled={bulkModal.isByOwner || bulkModal.isStip}
                onChange={(e) => setBulkModal({ ...bulkModal, overheadPercent: e.target.value })}
              />
            </label>

            {/* TAB SYSTEM: MANUAL VS AHSP */}
            <div className="rab-toggle-row" style={{ marginBottom: '16px', marginTop: '16px', background: '#222', padding: '4px', borderRadius: '6px' }}>
              <button
                type="button"
                style={{ flex: 1, border: 'none', background: bulkModal.pricingMode === "manual" ? '#444' : 'transparent', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setBulkModal({ ...bulkModal, pricingMode: "manual" })}
              >
                📝 Input Manual
              </button>
              <button
                type="button"
                style={{ flex: 1, border: 'none', background: bulkModal.pricingMode === "ahsp" ? '#444' : 'transparent', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setBulkModal({ ...bulkModal, pricingMode: "ahsp" })}
              >
                🔄 Tarik Master AHSP
              </button>
            </div>

            {/* KONTEN TAB MANUAL */}
            {bulkModal.pricingMode === "manual" && (
              <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                <label className="rab-form-label">
                  Harga Modal / RAP (Satuan)
                  <input
                    type="number"
                    className="rab-form-input"
                    value={bulkModal.isByOwner || bulkModal.isStip ? "" : bulkModal.rapUnitPrice}
                    disabled={bulkModal.isByOwner || bulkModal.isStip}
                    onChange={(e) => setBulkModal({ ...bulkModal, rapUnitPrice: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* KONTEN TAB AHSP */}
            {bulkModal.pricingMode === "ahsp" && (
              <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                <label className="rab-form-label">
                  Cari Jenis Pekerjaan Master
                  <input
                    className="rab-form-input"
                    placeholder="Ketik nama pekerjaan dari AHSP..."
                    value={bulkModal.switchQuery}
                    onChange={(e) => searchBulkSwitchJobs(e.target.value)}
                  />
                </label>

                {bulkModal.switchResults.length > 0 && (
                  <label className="rab-form-label" style={{ marginTop: '12px' }}>
                    Pilih Hasil Pencarian:
                    <select
                      className="rab-form-input"
                      size={4}
                      value={bulkModal.sourceJobId || ""}
                      onChange={(e) => setBulkModal({ ...bulkModal, sourceJobId: e.target.value })}
                    >
                      <option value="" disabled>-- Klik salah satu Master AHSP di bawah ini --</option>
                      {bulkModal.switchResults.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.reference ? `${job.reference} — ` : ""}
                          {job.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            <div className="rab-modal-actions" style={{ marginTop: '24px' }}>
              <button className="rab-btn" onClick={() => setBulkModal(null)} type="button">
                Batal
              </button>
              <button className="rab-btn rab-btn-primary" onClick={handleBulkUpdateSubmit} type="button">
                Terapkan Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL INDIVIDUAL ================= */}
      {editModal && (
        <div className="rab-modal-overlay">
          <div className="rab-modal">
            <h3>Edit Baris Pekerjaan</h3>
            <p className="rab-edit-label">
              {editModal.item.name} — {editModal.item.paymentUnit} — Vol: {Number(editModal.item.volume).toFixed(2)}
            </p>

            <div className="rab-toggle-row">
              <button
                type="button"
                className={`rab-btn rab-btn-small ${editModal.isByOwner ? "rab-btn-active" : ""}`}
                onClick={toggleByOwner}
              >
                {editModal.isByOwner ? "✓ By Owner" : "Set By Owner"}
              </button>
              <button
                type="button"
                className={`rab-btn rab-btn-small ${editModal.isStip ? "rab-btn-active" : ""}`}
                onClick={toggleStip}
              >
                {editModal.isStip ? "Batal Set Stip" : "Set Harga Stip (-)"}
              </button>
            </div>

            <label className="rab-form-label" style={{ marginTop: '16px' }}>
              Persentase Overhead / Profit (%)
              <input
                type="number"
                step="0.01"
                className="rab-form-input"
                value={editModal.isByOwner || editModal.isStip ? "" : editModal.overheadPercent}
                disabled={editModal.isByOwner || editModal.isStip}
                onChange={(e) => setEditModal({ ...editModal, overheadPercent: e.target.value })}
              />
            </label>

            <p className="rab-form-hint" style={{ marginBottom: '24px' }}>
              Profit ini akan digunakan di Mode Manual maupun Tarik AHSP.
            </p>

            {/* TAB SYSTEM: MANUAL VS AHSP */}
            <div className="rab-toggle-row" style={{ marginBottom: '16px', background: '#222', padding: '4px', borderRadius: '6px' }}>
              <button
                type="button"
                style={{ flex: 1, border: 'none', background: editModal.pricingMode === "manual" ? '#444' : 'transparent', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setEditModal({ ...editModal, pricingMode: "manual" })}
              >
                📝 Input Manual
              </button>
              <button
                type="button"
                style={{ flex: 1, border: 'none', background: editModal.pricingMode === "ahsp" ? '#444' : 'transparent', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setEditModal({ ...editModal, pricingMode: "ahsp" })}
              >
                🔄 Tarik Master AHSP
              </button>
            </div>

            {/* KONTEN TAB MANUAL */}
            {editModal.pricingMode === "manual" && (
              <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                <label className="rab-form-label">
                  Harga Modal / RAP (Satuan)
                  <input
                    type="number"
                    className="rab-form-input"
                    value={editModal.isByOwner || editModal.isStip ? "" : editModal.rapUnitPrice}
                    disabled={editModal.isByOwner || editModal.isStip}
                    onChange={(e) => setEditModal({ ...editModal, rapUnitPrice: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* KONTEN TAB AHSP */}
            {editModal.pricingMode === "ahsp" && (
              <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                <label className="rab-form-label">
                  Cari Jenis Pekerjaan Master
                  <input
                    className="rab-form-input"
                    placeholder="Ketik nama pekerjaan dari AHSP..."
                    value={editModal.switchQuery}
                    onChange={(e) => searchSwitchJobs(e.target.value)}
                  />
                </label>

                {editModal.switchResults.length > 0 && (
                  <label className="rab-form-label" style={{ marginTop: '12px' }}>
                    Pilih Hasil Pencarian:
                    <select
                      className="rab-form-input"
                      size={4}
                      value={editModal.sourceJobId || ""}
                      onChange={(e) => setEditModal({ ...editModal, sourceJobId: e.target.value })}
                    >
                      <option value="" disabled>-- Klik salah satu Master AHSP di bawah ini --</option>
                      {editModal.switchResults.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.reference ? `${job.reference} — ` : ""}
                          {job.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            <div className="rab-modal-actions" style={{ marginTop: '24px' }}>
              <button className="rab-btn" onClick={() => setEditModal(null)} type="button">
                Batal
              </button>
              <button className="rab-btn rab-btn-primary" onClick={handleSaveEdit} type="button">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================
// GROUP NODE & ITEMS TABLE
// ==========================================================
function RabGroupNode({ group, depth, sumGroupRecursive, onDeleteGroup, onEditItem, onDeleteItem, selectedItemIds, onToggleSelect }) {
  const subtotal = sumGroupRecursive(group);
  return (
    <div className="rab-group-block" style={{ marginLeft: depth > 0 ? 18 : 0 }}>
      <div className={depth === 0 ? "rab-group-row" : "rab-subgroup-row"}>
        <div>
          {group.reference && <span className="rab-ref">{group.reference}</span>}
          <span className="rab-group-label">{group.name}</span>
        </div>
        <div className="rab-group-actions">
          <span className="rab-group-subtotal">{fmtRp(subtotal)}</span>
          <button className="rab-btn rab-btn-small rab-btn-danger" onClick={() => onDeleteGroup(group.id)} type="button">Hapus</button>
        </div>
      </div>
      {(group.items || []).length > 0 && (
        <RabItemsTable 
          items={group.items} 
          onEdit={onEditItem} 
          onDelete={onDeleteItem} 
          selectedItemIds={selectedItemIds}
          onToggleSelect={onToggleSelect}
        />
      )}
      {(group.children || []).map((child) => (
        <RabGroupNode
          key={child.id} group={child} depth={depth + 1}
          sumGroupRecursive={sumGroupRecursive}
          onDeleteGroup={onDeleteGroup}
          onEditItem={onEditItem} onDeleteItem={onDeleteItem}
          selectedItemIds={selectedItemIds}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

function RabItemsTable({ items, onEdit, onDelete, selectedItemIds, onToggleSelect }) {
  let counter = 0;

  return (
    <table className="rab-items-table">
      <thead>
        <tr>
          <th style={{ width: "30px", textAlign: "center" }}>✓</th>
          <th>Ref</th>
          <th>Uraian Pekerjaan</th>
          <th>Satuan</th>
          <th>Volume</th>
          <th>RAP Satuan</th>
          <th>RAP Total</th>
          <th>RAB Satuan</th>
          <th>RAB Total</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => {
          const isChild = !!item.parentId;
          const no = isChild ? "" : ++counter;
          const special = item.isByOwner ? "By Owner" : item.isStip ? "-" : null;

          return (
            <tr key={item.id} className={selectedItemIds.includes(item.id) ? "rab-row-selected" : ""}>
              <td style={{ textAlign: "center" }}>
                <input 
                  type="checkbox" 
                  style={{ cursor: "pointer" }}
                  checked={selectedItemIds.includes(item.id)} 
                  onChange={() => onToggleSelect(item.id)} 
                />
              </td>
              <td>{item.reference || no || ""}</td>
              <td>
                {isChild ? "— " : ""}
                {item.name}
              </td>
              <td>{item.paymentUnit}</td>
              <td className="rab-mono">
                {item.volume != null ? Number(item.volume).toFixed(2) : ""}
              </td>
              {special ? (
                <>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                </>
              ) : (
                <>
                  <td className="rab-mono">{fmtRp(item.rapUnitPrice)}</td>
                  <td className="rab-mono">{fmtRp(item.rapTotalPrice)}</td>
                  <td className="rab-mono">{fmtRp(item.rabUnitPrice)}</td>
                  <td className="rab-mono rab-fw-bold">{fmtRp(item.rabTotalPrice)}</td>
                </>
              )}
              <td className="rab-row-actions">
                <button className="rab-btn rab-btn-small" onClick={() => onEdit(item)} type="button">Edit</button>
                <button className="rab-btn rab-btn-small rab-btn-danger" onClick={() => onDelete(item.id)} type="button">Hapus</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Rab;