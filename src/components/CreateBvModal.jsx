import { useEffect, useState, Fragment } from "react";
import "../styles/CreateBvModal.css";

// ============================================================================
// API
// ============================================================================
const API_BASE = "http://localhost:4000/api";

// ============================================================================
// BREAKDOWN & DIMENSION MODELS
// ============================================================================
const emptyDim = () => ({
  isPChecked: false,
  isLChecked: false,
  isTChecked: false,
  isLuasChecked: false,
  isKelChecked: false,
  isBeratChecked: false,

  panjang: "",
  lebar: "",
  tinggi: "",
  luas: "",
  keliling: "",
  diameter: "",
  berat: "",
  jumlahSisi: "",
  jumlahBh: "",
  waste: "",
});

const emptyKetGroup = () => ({
  keterangan: "",
  dimensions: [emptyDim()],
});

// ============================================================================
// PREVIEW SUBTOTAL
// ============================================================================
function calcSubtotal(b) {
  const p = b.panjang !== "" && b.panjang != null ? Number(b.panjang) : 0;
  const l = b.lebar !== "" && b.lebar != null ? Number(b.lebar) : 0;
  const t = b.tinggi !== "" && b.tinggi != null ? Number(b.tinggi) : 0;
  const luas = b.luas !== "" && b.luas != null ? Number(b.luas) : 0;
  const keliling = b.keliling !== "" && b.keliling != null ? Number(b.keliling) : 0;
  const berat = b.berat !== "" && b.berat != null ? Number(b.berat) : 0;

  let baseVolume = 1;
  let adaYangDicentang = false;

  if (b.isPChecked) { baseVolume *= p; adaYangDicentang = true; }
  if (b.isLChecked) { baseVolume *= l; adaYangDicentang = true; }
  if (b.isTChecked) { baseVolume *= t; adaYangDicentang = true; }
  if (b.isLuasChecked) { baseVolume *= luas; adaYangDicentang = true; }
  if (b.isKelChecked) { baseVolume *= keliling; adaYangDicentang = true; }
  if (b.isBeratChecked) { baseVolume *= berat; adaYangDicentang = true; }

  if (!adaYangDicentang) { baseVolume = 1; }

  const sisi = b.jumlahSisi !== "" && b.jumlahSisi != null ? Number(b.jumlahSisi) : 1;
  const bh = b.jumlahBh !== "" && b.jumlahBh != null ? Number(b.jumlahBh) : 1;
  const totalJumlah = sisi * bh;

  const w = b.waste !== "" && b.waste != null ? Number(b.waste) / 100 : 0;
  const wasteMultiplier = 1 + w;

  return baseVolume * totalJumlah * wasteMultiplier;
}

// ============================================================================
// EMPTY ITEM
// ============================================================================
const emptyItemForm = () => ({
  name: "",
  paymentUnit: "",
  ecommerceLink: "",
  isHeaderOnly: false,
  groupId: "",
  parentBvItemId: "",
  sourceJobTypeId: null,
  ketGroups: [emptyKetGroup()],
});

const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function CreateBvModal({ isOpen, onClose, projectId, projectName, hspkPeriodLabel, hspkFilters = {} }) {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemModal, setItemModal] = useState(null);
  const [nameModal, setNameModal] = useState(null);
  const [linkModal, setLinkModal] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ==========================================================
  // BULK SELECTION (bulk delete & bulk link-to-rab)
  // ==========================================================
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // ==========================================================
  // HSPK SEARCH
  // ==========================================================
  const [jobTypeQuery, setJobTypeQuery] = useState("");
  const [jobTypeResults, setJobTypeResults] = useState([]);
  const [jobTypeSearching, setJobTypeSearching] = useState(false);
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);

  const {
    period,
    category,
    discipline,
    grade,
  } = hspkFilters || {};

  useEffect(() => {
    if (!showJobTypeDropdown || jobTypeQuery.trim().length < 2) {
      setJobTypeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setJobTypeSearching(true);

      try {
        const params = new URLSearchParams({
          q: jobTypeQuery.trim(),
        });

        if (period) params.set("period", period);
        if (category) params.set("category", category);
        if (discipline) params.set("discipline", discipline);
        if (grade) params.set("grade", grade);

        const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);

        if (res.ok) {
          const result = await res.json();
          setJobTypeResults(Array.isArray(result) ? result : []);
        } else {
          setJobTypeResults([]);
        }
      } catch {
        setJobTypeResults([]);
      } finally {
        setJobTypeSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [jobTypeQuery, showJobTypeDropdown, period, category, discipline, grade]);

  const selectJobType = (jt) => {
    updateItemForm({
      name: jt.name,
      paymentUnit: jt.paymentUnit || "",
      sourceJobTypeId: jt.id,
    });
    setJobTypeQuery(jt.name);
    setShowJobTypeDropdown(false);
  };

  const handleNameTyping = (value) => {
    setJobTypeQuery(value);
    setShowJobTypeDropdown(true);
    updateItemForm({ name: value, sourceJobTypeId: null });
  };

  // ==========================================================
  // FETCH ALL
  // ==========================================================
  const fetchAll = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [groupsRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${projectId}/rab-groups`),
        fetch(`${API_BASE}/projects/${projectId}/bv-items`),
      ]);

      if (!groupsRes.ok) throw new Error("Gagal load groups");
      if (!itemsRes.ok) throw new Error("Gagal load bv-items");

      const groupsData = await groupsRes.json();
      const itemsData = await itemsRes.json();

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data BV.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [projectId]);

  if (!isOpen) return null;

  const topGroups = groups.filter((g) => !g.parentId);
  const itemsOfGroup = (groupId) => items.filter((it) => it.groupId === groupId);
  const totalItemCount = items.length;

  // ==========================================================
  // ADD & DELETE GROUP
  // ==========================================================
  const openAddGroup = () => setNameModal({ value: "" });

  const submitNameModal = async () => {
    if (!nameModal?.value.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/rab-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameModal.value.trim(), parentId: null }),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal menambah group.");
      }
      setNameModal(null);
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Hapus group ini beserta isinya?")) return;
    try {
      const res = await fetch(`${API_BASE}/rab-groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal menghapus group.");
      }
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // ADD & EDIT ITEM
  // ==========================================================
  const openAddItem = (groupId, parentBvItemId = "", isCustom = false) => {
    setJobTypeQuery("");
    setItemModal({
      editingId: null,
      isCustomMode: isCustom,
      isSubItemMode: !!parentBvItemId,
      form: { ...emptyItemForm(), groupId, parentBvItemId },
    });
  };

  const openAddSubItem = (groupId, isCustom = false) => {
    setJobTypeQuery("");
    setItemModal({
      editingId: null,
      isCustomMode: isCustom,
      isSubItemMode: true,
      form: { ...emptyItemForm(), groupId, parentBvItemId: "" },
    });
  };

  const openEditItem = (item) => {
    setJobTypeQuery(item.name || "");
    const breakdowns = item.breakdowns || [];
    const grouped = {};
    const order = [];

    breakdowns.forEach((b) => {
      const key = b.keterangan || "";
      if (!grouped[key]) {
        grouped[key] = [];
        order.push(key);
      }
      grouped[key].push({
        isPChecked: !!b.isPChecked,
        isLChecked: !!b.isLChecked,
        isTChecked: !!b.isTChecked,
        isLuasChecked: !!b.isLuasChecked,
        isKelChecked: !!(b.isKelChecked ?? b.isKelilingChecked),
        isBeratChecked: !!b.isBeratChecked,
        panjang: b.panjang ?? "",
        lebar: b.lebar ?? "",
        tinggi: b.tinggi ?? "",
        luas: b.luas ?? "",
        keliling: b.keliling ?? "",
        diameter: b.diameter ?? "",
        berat: b.berat ?? "",
        jumlahSisi: b.jumlahSisi ?? "",
        jumlahBh: b.jumlahBh ?? "",
        waste: b.waste ?? "",
      });
    });

    let initialKetGroups = [];
    if (order.length === 0) {
      initialKetGroups = [emptyKetGroup()];
    } else {
      initialKetGroups = order.map((key) => ({ keterangan: key, dimensions: grouped[key] }));
    }

    setItemModal({
      editingId: item.id,
      isCustomMode: !item.sourceJobTypeId,
      isSubItemMode: !!item.parentBvItemId,
      form: {
        name: item.name || "",
        paymentUnit: item.paymentUnit || "",
        ecommerceLink: item.ecommerceLink || "",
        isHeaderOnly: !!item.isHeaderOnly,
        groupId: item.groupId || "",
        parentBvItemId: item.parentBvItemId || "",
        sourceJobTypeId: item.sourceJobTypeId || null,
        ketGroups: initialKetGroups,
      },
    });
  };

  const updateItemForm = (patch) => {
    setItemModal((prev) => ({ ...prev, form: { ...prev.form, ...patch } }));
  };

  // ==========================================================
  // BREAKDOWN HELPERS
  // ==========================================================
  const updateKetGroup = (kgIdx, patch) => {
    setItemModal((prev) => {
      const ketGroups = [...prev.form.ketGroups];
      ketGroups[kgIdx] = { ...ketGroups[kgIdx], ...patch };
      return { ...prev, form: { ...prev.form, ketGroups } };
    });
  };

  const updateDimRow = (kgIdx, dimIdx, patch) => {
    setItemModal((prev) => {
      const ketGroups = [...prev.form.ketGroups];
      const dimensions = [...ketGroups[kgIdx].dimensions];
      dimensions[dimIdx] = { ...dimensions[dimIdx], ...patch };
      ketGroups[kgIdx] = { ...ketGroups[kgIdx], dimensions };
      return { ...prev, form: { ...prev.form, ketGroups } };
    });
  };

  const addKetGroup = () => {
    setItemModal((prev) => ({
      ...prev,
      form: { ...prev.form, ketGroups: [...prev.form.ketGroups, emptyKetGroup()] },
    }));
  };

  const removeKetGroup = (kgIdx) => {
    setItemModal((prev) => ({
      ...prev,
      form: { ...prev.form, ketGroups: prev.form.ketGroups.filter((_, i) => i !== kgIdx) },
    }));
  };

  const addDimRow = (kgIdx) => {
    setItemModal((prev) => {
      const ketGroups = [...prev.form.ketGroups];
      ketGroups[kgIdx].dimensions = [...ketGroups[kgIdx].dimensions, emptyDim()];
      return { ...prev, form: { ...prev.form, ketGroups } };
    });
  };

  const removeDimRow = (kgIdx, dimIdx) => {
    setItemModal((prev) => {
      const ketGroups = [...prev.form.ketGroups];
      ketGroups[kgIdx].dimensions = ketGroups[kgIdx].dimensions.filter((_, i) => i !== dimIdx);
      return { ...prev, form: { ...prev.form, ketGroups } };
    });
  };

  // ==========================================================
  // SUBMIT ITEM MODAL
  // ==========================================================
  const submitItemModal = async () => {
    const f = itemModal.form;

    if (!f.isHeaderOnly && !f.name.trim()) return alert("Nama item wajib diisi.");
    if (!f.isHeaderOnly && !f.paymentUnit.trim()) return alert("Satuan wajib diisi.");
    if (itemModal.isSubItemMode && !f.parentBvItemId) return alert("Pilih Induk Pekerjaan terlebih dahulu.");

    const flatBreakdowns = [];
    f.ketGroups.forEach((kg) => {
      kg.dimensions.forEach((dim) => {
        flatBreakdowns.push({
          keterangan: kg.keterangan || null,
          isPChecked: !!dim.isPChecked,
          isLChecked: !!dim.isLChecked,
          isTChecked: !!dim.isTChecked,
          isLuasChecked: !!dim.isLuasChecked,
          isKelChecked: !!dim.isKelChecked,
          isBeratChecked: !!dim.isBeratChecked,
          panjang: numOrNull(dim.panjang),
          lebar: numOrNull(dim.lebar),
          tinggi: numOrNull(dim.tinggi),
          luas: numOrNull(dim.luas),
          keliling: numOrNull(dim.keliling),
          diameter: numOrNull(dim.diameter),
          berat: numOrNull(dim.berat),
          jumlahSisi: numOrNull(dim.jumlahSisi),
          jumlahBh: numOrNull(dim.jumlahBh),
          waste: numOrNull(dim.waste),
        });
      });
    });

    const payload = {
      name: f.name.trim(),
      paymentUnit: f.paymentUnit.trim() || null,
      ecommerceLink: f.ecommerceLink.trim() || null,
      isHeaderOnly: f.isHeaderOnly,
      groupId: f.groupId || null,
      parentBvItemId: f.parentBvItemId || null,
      sourceJobTypeId: f.sourceJobTypeId || null,
      breakdowns: f.isHeaderOnly ? [] : flatBreakdowns,
    };

    try {
      const url = itemModal.editingId ? `${API_BASE}/bv-items/${itemModal.editingId}` : `${API_BASE}/projects/${projectId}/bv-items`;
      const res = await fetch(url, {
        method: itemModal.editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal menyimpan item BV.");
      }
      setItemModal(null);
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Hapus item BV ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/bv-items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal menghapus item.");
      }
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // BULK DELETE — DELETE /bv-items-bulk
  // ==========================================================
  const bulkDeleteItems = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} item BV terpilih? Aksi ini tidak bisa dibatalkan.`)) return;

    setBulkProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/bv-items-bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Gagal menghapus item massal.");
      alert(result?.message || "Item terpilih berhasil dihapus.");
      clearSelection();
      await fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  // ==========================================================
  // BULK LINK TO RAB — POST /bv-items-bulk/link-to-rab
  // Harga (rapUnitPrice/rabUnitPrice/overheadPercent) di-set 0 oleh
  // backend, cuma pindahin struktur BV -> RAB. Item yang udah linked
  // otomatis di-skip backend, jadi aman diklik ulang.
  // ==========================================================
  const bulkLinkToRab = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Link ${selectedIds.length} item BV terpilih ke RAB? Harga diatur nanti manual di RAB/Budgeting.`)) return;

    setBulkProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/bv-items-bulk/link-to-rab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Gagal link massal ke RAB.");
      alert(result?.message || "Item terpilih berhasil di-link ke RAB.");
      clearSelection();
      await fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  // ==========================================================
  // LINK TO RAB (SINGLE) — overhead selalu 0, harga diatur di RAB/Budgeting
  // ==========================================================
  const openLink = (item) => {
    setLinkModal({
      item,
      includeChildren: (item.children || []).length > 0,
    });
  };

  const updateLinkModal = (patch) => {
    setLinkModal((prev) => ({ ...prev, ...patch }));
  };

  // ==========================================================
  // LINK TO RAB (SINGLE) 
  // Menyesuaikan Payload berdasarkan Dokumentasi Link to RAB
  // ==========================================================
  const submitLink = async () => {
    if (!linkModal) return;
    const { item, includeChildren } = linkModal;

    // Cek apakah item ini bersumber dari HSPK/Master atau Custom
    const isFromMaster = !!item.sourceJobTypeId;

    const payload = {
      // Jika diisi, override harga jual final. Jika null, dihitung otomatis oleh backend.
      rabUnitPrice: item.rabUnitPrice != null ? Number(item.rabUnitPrice) : null,
      
      // Override group RAB tujuan (default mengikuti group saat ini)
      groupId: item.groupId || null,
      
      // Jika item adalah custom, kita set category. 
      // Jika dari Master AHSP, kita biarkan undefined agar backend menggunakan category/reference dari master.
      ...(isFromMaster ? {} : { category: "Pekerjaan Custom" }),

      // Persentase overhead. Jika dari Master AHSP, backend akan mengabaikan nilai ini.
      overhead: 0,
      
      // Rincian komponen custom. Dikosongkan agar diisi nanti melalui modul RAB/Budgeting.
      components: [],
      
      // Otomatis ikut me-link semua BV item anak yang belum ter-link
      includeChildren: !!includeChildren,
    };

    try {
      const res = await fetch(`${API_BASE}/bv-items/${item.id}/link-to-rab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const jsonRes = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(jsonRes?.error || jsonRes?.message || "Gagal link BV ke RAB.");
      }

      alert(jsonRes?.message || "Item BV berhasil di-link ke RAB.");
      setLinkModal(null);
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // SYNC & UNLINK
  // ==========================================================
  const syncItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/bv-items/${itemId}/sync`, { method: "POST" });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal sync ke RAB.");
      }
      alert("RAB berhasil disinkronkan dengan perubahan BV terbaru!");
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const unlinkItem = async (itemId) => {
    if (!window.confirm("Lepas link BV ini dari RAB?")) return;
    try {
      const res = await fetch(`${API_BASE}/bv-items/${itemId}/unlink`, { method: "POST" });
      if (res.status === 403) {
        const body = await res.json().catch(() => null);
        return alert(body?.error || "UNLINK DITOLAK: Item ini sudah dikerjakan/diberi harga oleh Estimator.");
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal unlink item.");
      }
      await fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // EXPORT
  // ==========================================================
  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/bv-items/export`);
      if (!res.ok) throw new Error("Gagal export Excel.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BV - ${projectName || "project"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="bv-panel">
      {/* HEADER */}
      <div className="bv-panel-header">
        <div>
          <h2 className="bv-title">BV — BACK UP VOLUME</h2>
          <p className="bv-subtitle">
            Project: {projectName || "-"} ({hspkPeriodLabel || "-"}) — {totalItemCount} item BV
          </p>
        </div>
        {onClose && (
          <button className="bv-close-btn" onClick={onClose} type="button">×</button>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bv-toolbar">
        <button className="bv-btn bv-btn-primary" onClick={openAddGroup} type="button">
          + Tambah Group Pekerjaan
        </button>
        <button className="bv-btn" onClick={() => openAddItem(topGroups[0]?.id)} disabled={topGroups.length === 0} type="button">
          + Tambah Baris Pekerjaan
        </button>
        <button className="bv-btn bv-btn-export" onClick={exportExcel} disabled={exporting || totalItemCount === 0} type="button">
          {exporting ? "Mengekspor..." : "⬇ Export Excel"}
        </button>

        {selectedIds.length > 0 && (
          <>
            <span className="bv-selected-count">{selectedIds.length} item dipilih</span>
            <button className="bv-btn bv-btn-link" onClick={bulkLinkToRab} disabled={bulkProcessing} type="button">
              {bulkProcessing ? "Memproses..." : "Link Massal ke RAB"}
            </button>
            <button className="bv-btn bv-btn-danger" onClick={bulkDeleteItems} disabled={bulkProcessing} type="button">
              {bulkProcessing ? "Memproses..." : "Hapus Massal"}
            </button>
            <button className="bv-btn" onClick={clearSelection} disabled={bulkProcessing} type="button">
              Batal Pilih
            </button>
          </>
        )}
      </div>

      {/* STATUS */}
      {loading && <p className="bv-empty">Memuat data BV...</p>}
      {error && <p className="bv-empty bv-error">{error}</p>}

      {/* BODY */}
      {!loading && !error && (
        <div className="bv-body">
          {topGroups.length === 0 && (
            <p className="bv-empty">Belum ada group pekerjaan. Klik "+ Tambah Group Pekerjaan" untuk mulai.</p>
          )}

          {topGroups.map((group, gIndex) => (
            <div className="bv-group" key={group.id}>
              <div className="bv-group-header">
                <span className="bv-group-title">
                  {gIndex + 1}. {group.name}
                </span>
                <div className="bv-group-actions">
                  <button className="bv-btn bv-btn-xs" onClick={() => openAddItem(group.id, "", false)} type="button">+ Baris</button>
                  <button className="bv-btn bv-btn-xs bv-btn-custom" onClick={() => openAddItem(group.id, "", true)} type="button">+ Baris Custom</button>
                  <button className="bv-btn bv-btn-xs" onClick={() => openAddSubItem(group.id, false)} type="button">+ Sub Baris</button>
                  <button className="bv-btn bv-btn-xs bv-btn-custom" onClick={() => openAddSubItem(group.id, true)} type="button">+ Sub Baris Custom</button>
                  <button className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => deleteGroup(group.id)} type="button">Hapus</button>
                </div>
              </div>

              {itemsOfGroup(group.id).length > 0 && (
                <BvTable
                  groupNo={gIndex + 1}
                  items={itemsOfGroup(group.id)}
                  onEdit={openEditItem}
                  onDelete={deleteItem}
                  onLink={openLink}
                  onSync={syncItem}
                  onUnlink={unlinkItem}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* GROUP MODAL */}
      {nameModal && (
        <div className="bv-inner-overlay">
          <div className="bv-inner-modal">
            <h3>Tambah Group Pekerjaan</h3>
            <label className="bv-form-label">
              Nama Group
              <input
                className="bv-form-input"
                autoFocus
                value={nameModal.value}
                onChange={(e) => setNameModal({ ...nameModal, value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submitNameModal()}
              />
            </label>
            <div className="bv-inner-modal-actions">
              <button className="bv-btn" onClick={() => setNameModal(null)} type="button">Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitNameModal} type="button">Tambah</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {itemModal && (
        <div className="bv-inner-overlay">
          <div className="bv-inner-modal bv-inner-modal-wide">
            <h3>{itemModal.editingId ? "Edit Baris Pekerjaan" : "Tambah Baris Pekerjaan"}</h3>

            <label className="bv-checkbox-label bv-header-checkbox">
              <input
                type="checkbox"
                checked={itemModal.form.isHeaderOnly}
                onChange={(e) => updateItemForm({ isHeaderOnly: e.target.checked })}
              />
              <span>Header saja (tanpa volume)</span>
            </label>

            {/* PARENT ITEM */}
            {itemModal.isSubItemMode && (
              <label className="bv-form-label">
                Pilih Induk Pekerjaan
                <select className="bv-form-input" value={itemModal.form.parentBvItemId} onChange={(e) => updateItemForm({ parentBvItemId: e.target.value })}>
                  <option value="">-- Pilih Baris Induk --</option>
                  {items.filter((it) => it.groupId === itemModal.form.groupId && !it.parentBvItemId).map((parentItem) => (
                    <option key={parentItem.id} value={parentItem.id}>{parentItem.name}</option>
                  ))}
                </select>
              </label>
            )}

            {/* NAMA PEKERJAAN */}
            <label className="bv-form-label">
              <span className="bv-label-with-badge">
                <span>Uraian Pekerjaan</span>
                {itemModal.isCustomMode && <span className="bv-hspk-badge bv-hspk-badge-custom">Custom</span>}
                {!itemModal.isCustomMode && itemModal.form.sourceJobTypeId && <span className="bv-hspk-badge">dari HSPK</span>}
              </span>

              {itemModal.isCustomMode ? (
                <input className="bv-form-input" value={itemModal.form.name} onChange={(e) => updateItemForm({ name: e.target.value })} autoFocus />
              ) : (
                <div className="bv-autocomplete">
                  <input
                    className="bv-form-input"
                    value={itemModal.form.name}
                    onChange={(e) => handleNameTyping(e.target.value)}
                    onFocus={() => setShowJobTypeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowJobTypeDropdown(false), 150)}
                    autoFocus
                  />
                  {showJobTypeDropdown && jobTypeQuery.trim().length >= 2 && (
                    <div className="bv-autocomplete-dropdown">
                      {jobTypeSearching ? (
                        <div className="bv-autocomplete-item bv-autocomplete-empty">Mencari...</div>
                      ) : jobTypeResults.length === 0 ? (
                        <div className="bv-autocomplete-item bv-autocomplete-empty">Tidak ditemukan di HSPK.</div>
                      ) : (
                        jobTypeResults.map((jt) => (
                          <div key={jt.id} className="bv-autocomplete-item" onMouseDown={() => selectJobType(jt)}>
                            <span>{jt.name}</span>
                            <span className="bv-autocomplete-unit">{jt.paymentUnit}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </label>

            {/* SATUAN & LINK */}
            {!itemModal.form.isHeaderOnly && (
              <label className="bv-form-label">
                Satuan
                <input className="bv-form-input" value={itemModal.form.paymentUnit} disabled={!!itemModal.form.sourceJobTypeId} onChange={(e) => updateItemForm({ paymentUnit: e.target.value })} />
              </label>
            )}
            <label className="bv-form-label">
              Link E-Commerce
              <input className="bv-form-input" value={itemModal.form.ecommerceLink} onChange={(e) => updateItemForm({ ecommerceLink: e.target.value })} />
            </label>

            {/* BREAKDOWN */}
            {!itemModal.form.isHeaderOnly && (
              <section className="bv-breakdown-section">
                <p className="bv-form-label bv-breakdown-title">Baris Breakdown Dimensi (Kelompokkan per Keterangan)</p>
                {itemModal.form.ketGroups.map((kg, kgIdx) => (
                  <div key={kgIdx} className="bv-breakdown-group">
                    <div className="bv-keterangan-row">
                      <input className="bv-form-input bv-keterangan-input" placeholder="Keterangan (mis. Partisi Area Waxing)" value={kg.keterangan} onChange={(e) => updateKetGroup(kgIdx, { keterangan: e.target.value })} />
                      <button type="button" className="bv-btn bv-btn-danger" onClick={() => removeKetGroup(kgIdx)} disabled={itemModal.form.ketGroups.length === 1}>Hapus Grup</button>
                    </div>

                    {kg.dimensions.map((dim, dimIdx) => (
                      <div key={dimIdx} className="bv-breakdown-row">
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="P" checked={dim.isPChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isPChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="P" value={dim.panjang} onChange={(e) => updateDimRow(kgIdx, dimIdx, { panjang: e.target.value })} />
                        </div>
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="L" checked={dim.isLChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isLChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="L" value={dim.lebar} onChange={(e) => updateDimRow(kgIdx, dimIdx, { lebar: e.target.value })} />
                        </div>
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="T" checked={dim.isTChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isTChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="T" value={dim.tinggi} onChange={(e) => updateDimRow(kgIdx, dimIdx, { tinggi: e.target.value })} />
                        </div>
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="Luas" checked={dim.isLuasChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isLuasChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="Luas" value={dim.luas} onChange={(e) => updateDimRow(kgIdx, dimIdx, { luas: e.target.value })} />
                        </div>
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="Keliling" checked={dim.isKelChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isKelChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="Kel" value={dim.keliling} onChange={(e) => updateDimRow(kgIdx, dimIdx, { keliling: e.target.value })} />
                        </div>
                        <input type="number" className="bv-form-input bv-dimension-input" placeholder="Dia" value={dim.diameter} onChange={(e) => updateDimRow(kgIdx, dimIdx, { diameter: e.target.value })} />
                        <div className="bv-dimension-control">
                          <input type="checkbox" title="Berat" checked={dim.isBeratChecked} onChange={(e) => updateDimRow(kgIdx, dimIdx, { isBeratChecked: e.target.checked })} />
                          <input type="number" className="bv-form-input bv-dimension-input" placeholder="Berat" value={dim.berat} onChange={(e) => updateDimRow(kgIdx, dimIdx, { berat: e.target.value })} />
                        </div>
                        <input type="number" className="bv-form-input bv-dimension-input-small" placeholder="Sisi" value={dim.jumlahSisi} onChange={(e) => updateDimRow(kgIdx, dimIdx, { jumlahSisi: e.target.value })} />
                        <input type="number" className="bv-form-input bv-dimension-input-small" placeholder="Bh" value={dim.jumlahBh} onChange={(e) => updateDimRow(kgIdx, dimIdx, { jumlahBh: e.target.value })} />
                        <input type="number" className="bv-form-input bv-dimension-input-small" placeholder="Waste %" value={dim.waste} onChange={(e) => updateDimRow(kgIdx, dimIdx, { waste: e.target.value })} />
                        <span className="bv-breakdown-subtotal">= {calcSubtotal(dim).toFixed(2)}</span>
                        <button type="button" className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => removeDimRow(kgIdx, dimIdx)} disabled={kg.dimensions.length === 1}>Hapus</button>
                      </div>
                    ))}
                    <button type="button" className="bv-btn bv-btn-xs bv-breakdown-add-button" onClick={() => addDimRow(kgIdx)}>+ Tambah Baris Dimensi</button>
                  </div>
                ))}
                <div className="bv-breakdown-add-wrapper">
                  <button type="button" className="bv-btn bv-btn-xs bv-add-keterangan-button" onClick={addKetGroup}>+ Tambah Grup Keterangan</button>
                </div>
              </section>
            )}

            <div className="bv-inner-modal-actions">
              <button className="bv-btn" onClick={() => setItemModal(null)} type="button">Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitItemModal} type="button">
                {itemModal.editingId ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LINK TO RAB MODAL (overhead selalu 0 — diatur di RAB/Budgeting)
      ====================================================== */}
      {linkModal && (
        <div className="bv-inner-overlay">
          <div className="bv-inner-modal">
            <h3>Link ke RAB</h3>
            <p className="bv-form-hint">
              Item BV: <strong>{linkModal.item?.name}</strong>
            </p>
            <p className="bv-form-hint">
              Harga (RAP/RAB/overhead) tidak diatur di sini — item hanya dipindah struktur ke RAB. Isi harga & profit nanti di modul RAB/Budgeting.
            </p>

            {(linkModal.item?.children || []).length > 0 && (
              <label className="bv-checkbox-label">
                <input
                  type="checkbox"
                  checked={linkModal.includeChildren}
                  onChange={(e) => updateLinkModal({ includeChildren: e.target.checked })}
                />
                <span>Sekalian link semua sub-item di bawahnya</span>
              </label>
            )}

            <div className="bv-inner-modal-actions">
              <button className="bv-btn" onClick={() => setLinkModal(null)} type="button">Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitLink} type="button">Link ke RAB</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// BV TABLE — ganti seluruh fungsi ini di CreateBvModal.jsx
// ============================================================================
function BvTable({ groupNo, items, onEdit, onDelete, onLink, onSync, onUnlink, selectedIds, onToggleSelect }) {
  const statusLabel = (status) => {
    if (status === "SUDAH_DILINK") return "Sudah di-link";
    if (status === "BELUM_SINKRON") return "Belum sinkron";
    return "Belum di-link";
  };

  const statusClass = (status) => (status === "SUDAH_DILINK" ? "bv-status-ok" : "bv-status-warn");

  const renderItem = (item, parentNo, indexInParent) => {
    const no = `${parentNo}.${indexInParent}`;
    const breakdowns = item.breakdowns || [];
    const hasChildren = (item.children || []).length > 0;
    const isSubItem = !!item.parentBvItemId;

    // Logika inline:
    // Item top-level (bukan sub), tidak punya anak, bukan header → breakdown[0] ditampilkan sejajar di baris item
    // Item sub (parentBvItemId ada) ATAU punya anak → breakdown tetap kebawah (baris terpisah)
    const showInline = !hasChildren && !item.isHeaderOnly && breakdowns.length > 0;
    const inlineB = showInline ? breakdowns[0] : null;
    const detailBreakdowns = showInline ? breakdowns.slice(1) : breakdowns;

    // Track keterangan untuk suppress-duplikat di detail rows
    let lastKeterangan = inlineB ? (inlineB.keterangan || "") : null;

    return (
      <Fragment key={item.id}>
        {/* ── BARIS UTAMA ITEM ── */}
        <tr>
          <td>
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggleSelect(item.id)}
            />
          </td>

          {/* NO: sub-item pakai "-" */}
          <td>{isSubItem ? "-" : no}</td>

          <td className="bv-item-name">{isSubItem ? "- " : ""}{item.name}</td>
          <td>{item.isHeaderOnly ? "" : item.paymentUnit || ""}</td>
          <td className="bv-number-cell">
            {item.isHeaderOnly ? "" : Number(item.totalVolume).toFixed(2)}
          </td>

          {/* KETERANGAN: jika inline → pakai keterangan breakdown[0], jika tidak → sumber HSPK/"-" */}
          <td>
            {inlineB
              ? (inlineB.keterangan || "")
              : item.sourceJobType
                ? `HSPK: ${item.sourceJobType.reference || ""}`
                : item.isHeaderOnly ? "" : "-"}
          </td>

          {/* DIMENSI: jika inline → data dari breakdown[0], jika tidak → satu sel kosong colSpan=10 */}
          {inlineB ? (
            <>
              <td className="bv-detail-dimension">
                {inlineB.isPChecked && <span className="bv-detail-checked">☑ </span>}
                {inlineB.panjang ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {inlineB.isLChecked && <span className="bv-detail-checked">☑ </span>}
                {inlineB.lebar ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {inlineB.isTChecked && <span className="bv-detail-checked">☑ </span>}
                {inlineB.tinggi ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {inlineB.isLuasChecked && <span className="bv-detail-checked">☑ </span>}
                {inlineB.luas ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {(inlineB.isKelChecked ?? inlineB.isKelilingChecked) && (
                  <span className="bv-detail-checked">☑ </span>
                )}
                {inlineB.keliling ?? ""}
              </td>
              <td className="bv-detail-dimension">{inlineB.diameter ?? ""}</td>
              <td className="bv-detail-dimension">
                {inlineB.isBeratChecked && <span className="bv-detail-checked">☑ </span>}
                {inlineB.berat ?? ""}
              </td>
              <td className="bv-detail-dimension">{inlineB.jumlahSisi ?? ""}</td>
              <td className="bv-detail-dimension">{inlineB.jumlahBh ?? ""}</td>
              <td className="bv-detail-dimension">{inlineB.waste ?? ""}</td>
            </>
          ) : (
            <td colSpan={10} className="bv-empty-data-cell" />
          )}

          <td className="bv-number-cell">
            {item.isHeaderOnly ? "" : Number(item.totalVolume).toFixed(2)}
          </td>
          <td>{item.isHeaderOnly ? "" : item.paymentUnit || ""}</td>
          <td>{item.ecommerceLink || "-"}</td>
          <td>
            {!item.isHeaderOnly && (
              <span className={`bv-status ${statusClass(item.linkStatus)}`}>
                {statusLabel(item.linkStatus)}
              </span>
            )}
          </td>
          <td className="bv-row-actions">
            <button className="bv-btn bv-btn-xs" onClick={() => onEdit(item)} type="button">Edit</button>
            {!item.isHeaderOnly && item.linkStatus === "BELUM_DILINK" && (
              <button className="bv-btn bv-btn-xs bv-btn-link" onClick={() => onLink(item)} type="button">Link</button>
            )}
            {item.linkStatus === "BELUM_SINKRON" && (
              <button className="bv-btn bv-btn-xs bv-btn-sync" onClick={() => onSync(item.id)} type="button">Sync</button>
            )}
            {(item.linkStatus === "SUDAH_DILINK" || item.linkStatus === "BELUM_SINKRON") && (
              <button className="bv-btn bv-btn-xs bv-btn-unlink" onClick={() => onUnlink(item.id)} type="button">Unlink</button>
            )}
            <button className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => onDelete(item.id)} type="button">Hapus</button>
          </td>
        </tr>

        {/* ── BARIS DETAIL BREAKDOWN ──
            • showInline=true  → hanya breakdown[1..] yang jadi detail rows
            • showInline=false → semua breakdown jadi detail rows (perilaku lama, untuk sub-item) */}
        {detailBreakdowns.map((b, i) => {
          const ketText = b.keterangan || "";
          const showKet = ketText !== lastKeterangan;
          lastKeterangan = ketText;

          return (
            <tr key={`${item.id}-b${showInline ? i + 1 : i}`} className="bv-detail-row">
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-label">{showKet && ketText ? `- ${ketText}` : ""}</td>
              <td className="bv-detail-dimension">
                {b.isPChecked && <span className="bv-detail-checked">☑ </span>}
                {b.panjang ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {b.isLChecked && <span className="bv-detail-checked">☑ </span>}
                {b.lebar ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {b.isTChecked && <span className="bv-detail-checked">☑ </span>}
                {b.tinggi ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {b.isLuasChecked && <span className="bv-detail-checked">☑ </span>}
                {b.luas ?? ""}
              </td>
              <td className="bv-detail-dimension">
                {(b.isKelChecked ?? b.isKelilingChecked) && (
                  <span className="bv-detail-checked">☑ </span>
                )}
                {b.keliling ?? ""}
              </td>
              <td className="bv-detail-dimension">{b.diameter ?? ""}</td>
              <td className="bv-detail-dimension">
                {b.isBeratChecked && <span className="bv-detail-checked">☑ </span>}
                {b.berat ?? ""}
              </td>
              <td className="bv-detail-dimension">{b.jumlahSisi ?? ""}</td>
              <td className="bv-detail-dimension">{b.jumlahBh ?? ""}</td>
              <td className="bv-detail-dimension">{b.waste ?? ""}</td>
              <td className="bv-detail-subtotal">{Number(b.subTotal ?? 0).toFixed(2)}</td>
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
              <td className="bv-detail-empty" />
            </tr>
          );
        })}

        {/* CHILDREN */}
        {(item.children || []).map((child, ci) => renderItem(child, no, ci + 1))}
      </Fragment>
    );
  };

  return (
    <div className="bv-table-wrapper">
      <table
        className="bv-table"
        style={{ tableLayout: "fixed", width: "100%", minWidth: 1400 }}
      >
        <colgroup>
          <col style={{ width: 32 }} />   {/* checkbox */}
          <col style={{ width: 44 }} />   {/* NO */}
          <col style={{ width: 180 }} />  {/* URAIAN PEKERJAAN */}
          <col style={{ width: 52 }} />   {/* SAT (vol) */}
          <col style={{ width: 64 }} />   {/* VOL (vol) */}
          <col style={{ width: 130 }} />  {/* KETERANGAN */}
          <col style={{ width: 62 }} />   {/* Panjang */}
          <col style={{ width: 58 }} />   {/* Lebar */}
          <col style={{ width: 58 }} />   {/* Tinggi */}
          <col style={{ width: 58 }} />   {/* Luas */}
          <col style={{ width: 62 }} />   {/* Keliling */}
          <col style={{ width: 48 }} />   {/* Dia */}
          <col style={{ width: 58 }} />   {/* Berat */}
          <col style={{ width: 42 }} />   {/* Sisi */}
          <col style={{ width: 42 }} />   {/* Bh */}
          <col style={{ width: 54 }} />   {/* Waste */}
          <col style={{ width: 64 }} />   {/* VOL (total) */}
          <col style={{ width: 52 }} />   {/* SAT (total) */}
          <col style={{ width: 100 }} />  {/* LINK E-COMMERCE */}
          <col style={{ width: 82 }} />   {/* Status */}
          <col style={{ width: 136 }} />  {/* Actions */}
        </colgroup>

        <thead>
          <tr>
            <th rowSpan={2} />
            <th rowSpan={2}>NO</th>
            <th rowSpan={2}>URAIAN PEKERJAAN</th>
            <th colSpan={2}>VOLUME</th>
            <th rowSpan={2}>KETERANGAN</th>
            <th rowSpan={2}>Panjang<br />(m)</th>
            <th rowSpan={2}>Lebar<br />(m)</th>
            <th rowSpan={2}>Tinggi<br />(m)</th>
            <th rowSpan={2}>Luas<br />(m2)</th>
            <th rowSpan={2}>Keliling<br />(m1)</th>
            <th rowSpan={2}>Dia<br />(m2)</th>
            <th rowSpan={2}>Berat<br />(Kg)</th>
            <th rowSpan={2}>Sisi</th>
            <th rowSpan={2}>Bh</th>
            <th rowSpan={2}>Waste<br />(%)</th>
            <th colSpan={2}>TOTAL</th>
            <th rowSpan={2}>LINK<br />E-COMMERCE</th>
            <th rowSpan={2}>Status</th>
            <th rowSpan={2} />
          </tr>
          <tr>
            <th>Sat.</th>
            <th>Vol.</th>
            <th>Vol.</th>
            <th>Sat.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => renderItem(item, groupNo, i + 1))}
        </tbody>
      </table>
    </div>
  );
}

export default CreateBvModal;