import { useEffect, useState, Fragment } from "react";
import "../styles/CreateBvModal.css";

// ============================================================================
// API
// ============================================================================
const API_BASE = "http://localhost:4000/api";

// ============================================================================
// MODE HITUNG
// ============================================================================
const MODE_HITUNG_OPTIONS = [
  { value: "auto", label: "Auto (ikutin satuan)" },
  { value: "P", label: "P (Panjang)" },
  { value: "L", label: "L (Lebar)" },
  { value: "T", label: "T (Tinggi)" },
  { value: "PxL", label: "P × L" },
  { value: "PxT", label: "P × T" },
  { value: "Luas", label: "Luas" },
  { value: "Kel", label: "Keliling" },
];

// ============================================================================
// RAB COMPONENT SECTION
// ============================================================================
const COMPONENT_SECTION_OPTIONS = [
  { value: "BAHAN", label: "Bahan" },
  { value: "UPAH", label: "Upah" },
  { value: "ALAT", label: "Alat" },
];

// ============================================================================
// BREAKDOWN
// ============================================================================
const emptyBreakdown = () => ({
  keterangan: "",
  modeHitung: "auto",
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

// ============================================================================
// RAB COMPONENT
// ============================================================================
const emptyRabComponent = () => ({
  name: "",
  unit: "",
  section: "BAHAN",
  coefficient: "",
  unitPrice: "",
});

// ============================================================================
// PREVIEW SUBTOTAL
// ============================================================================
function calcSubtotal(b) {
  const w = b.waste !== "" && b.waste != null ? Number(b.waste) / 100 : 0;
  const sisi = b.jumlahSisi !== "" && b.jumlahSisi != null ? Number(b.jumlahSisi) : 1;
  const bh = b.jumlahBh !== "" && b.jumlahBh != null ? Number(b.jumlahBh) : 1;
  const jumlah = sisi * bh;

  const p = b.panjang !== "" && b.panjang != null ? Number(b.panjang) : 1;
  const t = b.tinggi !== "" && b.tinggi != null ? Number(b.tinggi) : 1;

  if (b.berat !== "" && b.berat != null) {
    return p * t * Number(b.berat) * jumlah * (1 + w);
  }
  if (b.luas !== "" && b.luas != null) {
    return Number(b.luas) * jumlah * (1 + w);
  }
  if (b.keliling !== "" && b.keliling != null) {
    return Number(b.keliling) * jumlah * (1 + w);
  }
  if (b.diameter !== "" && b.diameter != null) {
    return Number(b.diameter) * jumlah * (1 + w);
  }

  const l = b.lebar !== "" && b.lebar != null ? Number(b.lebar) : 1;
  return p * l * t * jumlah * (1 + w);
}

// ============================================================================
// EMPTY ITEM
// ============================================================================
const emptyItemForm = () => ({
  name: "",
  paymentUnit: "",
  keterangan: "",
  ecommerceLink: "",
  isHeaderOnly: false,
  groupId: "",
  parentBvItemId: "",
  sourceJobTypeId: null,
  breakdowns: [emptyBreakdown()],
});

// ============================================================================
// NUMBER
// ============================================================================
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function CreateBvModal({ isOpen, onClose, projectId, projectName, hspkPeriodLabel, hspkFilters = {} }) {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================
  // MODALS
  // ==========================================================
  const [itemModal, setItemModal] = useState(null);
  const [nameModal, setNameModal] = useState(null);

  /*
    Format:
    {
      item,
      rabUnitPrice,
      groupId,
      category,
      reference,
      overhead,
      components: [...]
    }
  */
  const [linkModal, setLinkModal] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ==========================================================
  // HSPK SEARCH
  // ==========================================================
  const [jobTypeQuery, setJobTypeQuery] = useState("");
  const [jobTypeResults, setJobTypeResults] = useState([]);
  const [jobTypeSearching, setJobTypeSearching] = useState(false);
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);

  // ==========================================================
  // SEARCH HSPK
  // ==========================================================
  useEffect(() => {
    if (!showJobTypeDropdown || jobTypeQuery.trim().length < 2) {
      setJobTypeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setJobTypeSearching(true);
      try {
        const params = new URLSearchParams({ q: jobTypeQuery.trim() });

        if (hspkFilters.period) params.set("period", hspkFilters.period);
        if (hspkFilters.category) params.set("category", hspkFilters.category);
        if (hspkFilters.discipline) params.set("discipline", hspkFilters.discipline);
        if (hspkFilters.grade) params.set("grade", hspkFilters.grade);

        const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
        if (res.ok) {
          setJobTypeResults(await res.json());
        }
      } catch {
        // tidak fatal
      } finally {
        setJobTypeSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [jobTypeQuery, showJobTypeDropdown, hspkFilters.period, hspkFilters.category, hspkFilters.discipline, hspkFilters.grade]);

  // ==========================================================
  // SELECT HSPK
  // ==========================================================
  const selectJobType = (jt) => {
    updateItemForm({
      name: jt.name,
      paymentUnit: jt.paymentUnit || "",
      sourceJobTypeId: jt.id,
    });
    setJobTypeQuery(jt.name);
    setShowJobTypeDropdown(false);
  };

  // ==========================================================
  // TYPE NAME
  // ==========================================================
  const handleNameTyping = (value) => {
    setJobTypeQuery(value);
    setShowJobTypeDropdown(true);
    updateItemForm({
      name: value,
      sourceJobTypeId: null,
    });
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

      setGroups(await groupsRes.json());
      setItems(await itemsRes.json());
    } catch (err) {
      setError(err.message || "Gagal memuat data BV.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD
  // ==========================================================
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!isOpen) return null;

  // ==========================================================
  // GROUP
  // ==========================================================
  const topGroups = groups.filter((g) => !g.parentId);
  const itemsOfGroup = (groupId) => items.filter((it) => it.groupId === groupId);
  const totalItemCount = items.length;

  // ==========================================================
  // ADD GROUP
  // ==========================================================
  const openAddGroup = () => {
    setNameModal({ value: "" });
  };

  const submitNameModal = async () => {
    if (!nameModal?.value.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/rab-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameModal.value.trim(),
          parentId: null,
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json())?.error || "Gagal menambah group.");
      }

      setNameModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // DELETE GROUP
  // ==========================================================
  const deleteGroup = async (groupId) => {
    if (!confirm("Hapus group ini beserta isinya?")) return;

    try {
      const res = await fetch(`${API_BASE}/rab-groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error((await res.json())?.error || "Gagal menghapus group.");
      }
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // ADD ITEM
  // ==========================================================
  const openAddItem = (groupId, parentBvItemId = "", isCustom = false) => {
    setJobTypeQuery("");
    setItemModal({
      editingId: null,
      isCustomMode: isCustom,
      isSubItemMode: false,
      form: { ...emptyItemForm(), groupId, parentBvItemId },
    });
  };

  // ==========================================================
  // ADD SUB ITEM (DARI HEADER GROUP)
  // ==========================================================
  const openAddSubItem = (groupId, isCustom = false) => {
    setJobTypeQuery("");
    setItemModal({
      editingId: null,
      isCustomMode: isCustom,
      isSubItemMode: true, // Memunculkan dropdown Pilih Induk
      form: { ...emptyItemForm(), groupId, parentBvItemId: "" },
    });
  };

  // ==========================================================
  // EDIT ITEM
  // ==========================================================
  const openEditItem = (item) => {
    setJobTypeQuery(item.name || "");
    setItemModal({
      editingId: item.id,
      isCustomMode: !item.sourceJobTypeId,
      isSubItemMode: !!item.parentBvItemId, // Jika dia punya parent, munculkan dropdown parent saat diedit
      form: {
        name: item.name || "",
        paymentUnit: item.paymentUnit || "",
        keterangan: item.keterangan || "",
        ecommerceLink: item.ecommerceLink || "",
        isHeaderOnly: !!item.isHeaderOnly,
        groupId: item.groupId || "",
        parentBvItemId: item.parentBvItemId || "",
        sourceJobTypeId: item.sourceJobTypeId || null,
        breakdowns: item.breakdowns?.length > 0
          ? item.breakdowns.map((b) => ({
              keterangan: b.keterangan || "",
              modeHitung: b.modeHitung || "auto",
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
            }))
          : [emptyBreakdown()],
      },
    });
  };

  // ==========================================================
  // UPDATE ITEM FORM
  // ==========================================================
  const updateItemForm = (patch) => {
    setItemModal((prev) => ({ ...prev, form: { ...prev.form, ...patch } }));
  };

  // ==========================================================
  // UPDATE BREAKDOWN
  // ==========================================================
  const updateBreakdown = (index, patch) => {
    setItemModal((prev) => {
      const breakdowns = prev.form.breakdowns.map((b, i) => (i === index ? { ...b, ...patch } : b));
      return { ...prev, form: { ...prev.form, breakdowns } };
    });
  };

  // ==========================================================
  // ADD BREAKDOWN
  // ==========================================================
  const addBreakdownRow = () => {
    setItemModal((prev) => ({
      ...prev,
      form: { ...prev.form, breakdowns: [...prev.form.breakdowns, emptyBreakdown()] },
    }));
  };

  // ==========================================================
  // REMOVE BREAKDOWN
  // ==========================================================
  const removeBreakdownRow = (index) => {
    setItemModal((prev) => ({
      ...prev,
      form: { ...prev.form, breakdowns: prev.form.breakdowns.filter((_, i) => i !== index) },
    }));
  };

  // ==========================================================
  // SAVE ITEM
  // ==========================================================
  const submitItemModal = async () => {
    const f = itemModal.form;

    if (!f.isHeaderOnly && !f.name.trim()) return alert("Nama item wajib diisi.");
    if (!f.isHeaderOnly && !f.paymentUnit.trim()) return alert("Satuan wajib diisi.");
    
    // Validasi pemilihan induk jika dalam mode sub-item
    if (itemModal.isSubItemMode && !f.parentBvItemId) {
      alert("Pilih Induk Pekerjaan terlebih dahulu.");
      return;
    }

    const payload = {
      name: f.name.trim(),
      paymentUnit: f.paymentUnit.trim() || null,
      keterangan: f.keterangan.trim() || null,
      ecommerceLink: f.ecommerceLink.trim() || null,
      isHeaderOnly: f.isHeaderOnly,
      groupId: f.groupId || null,
      parentBvItemId: f.parentBvItemId || null,
      sourceJobTypeId: f.sourceJobTypeId || null,
      breakdowns: f.isHeaderOnly
        ? []
        : f.breakdowns.map((b) => ({
            keterangan: b.keterangan || null,
            modeHitung: b.modeHitung || "auto",
            panjang: numOrNull(b.panjang),
            lebar: numOrNull(b.lebar),
            tinggi: numOrNull(b.tinggi),
            luas: numOrNull(b.luas),
            keliling: numOrNull(b.keliling),
            diameter: numOrNull(b.diameter),
            berat: numOrNull(b.berat),
            jumlahSisi: numOrNull(b.jumlahSisi),
            jumlahBh: numOrNull(b.jumlahBh),
            waste: numOrNull(b.waste),
          })),
    };

    try {
      const url = itemModal.editingId
        ? `${API_BASE}/bv-items/${itemModal.editingId}`
        : `${API_BASE}/projects/${projectId}/bv-items`;

      const res = await fetch(url, {
        method: itemModal.editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error((await res.json())?.error || "Gagal menyimpan item BV.");
      }

      setItemModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // DELETE ITEM
  // ==========================================================
  const deleteItem = async (itemId) => {
    if (!confirm("Hapus item BV ini?")) return;

    try {
      const res = await fetch(`${API_BASE}/bv-items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error((await res.json())?.error || "Gagal menghapus item.");
      }
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // LINK TO RAB
  // ==========================================================
  const openLink = (item) => {
    setLinkModal({
      item,
      rabUnitPrice: item.rabUnitPrice != null ? String(item.rabUnitPrice) : "",
      groupId: item.groupId || "",
      category: "Pekerjaan Custom",
      reference: "",
      overhead: "0.1",
      components: [emptyRabComponent()],
    });
  };

  // ==========================================================
  // UPDATE LINK MODAL
  // ==========================================================
  const updateLinkModal = (patch) => {
    setLinkModal((prev) => ({ ...prev, ...patch }));
  };

  // ==========================================================
  // ADD RAB COMPONENT
  // ==========================================================
  const addRabComponent = () => {
    setLinkModal((prev) => ({ ...prev, components: [...prev.components, emptyRabComponent()] }));
  };

  // ==========================================================
  // UPDATE RAB COMPONENT
  // ==========================================================
  const updateRabComponent = (index, patch) => {
    setLinkModal((prev) => ({
      ...prev,
      components: prev.components.map((component, i) => (i === index ? { ...component, ...patch } : component)),
    }));
  };

  // ==========================================================
  // DELETE RAB COMPONENT
  // ==========================================================
  const removeRabComponent = (index) => {
    setLinkModal((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  // ==========================================================
  // CALCULATE COMPONENT TOTAL
  // ==========================================================
  const calculateComponentTotal = (component) => {
    const coefficient = Number(component.coefficient) || 0;
    const unitPrice = Number(component.unitPrice) || 0;
    return coefficient * unitPrice;
  };

  // ==========================================================
  // CALCULATE ALL COMPONENT TOTAL
  // ==========================================================
  const calculateComponentsTotal = () => {
    if (!linkModal?.components) return 0;
    return linkModal.components.reduce((total, component) => total + calculateComponentTotal(component), 0);
  };

  // ==========================================================
  // SUBMIT LINK
  // ==========================================================
  const submitLink = async () => {
    if (!linkModal) return;

    const { item, rabUnitPrice, groupId, category, reference, overhead, components } = linkModal;

    if (rabUnitPrice === "" || Number(rabUnitPrice) < 0) {
      alert("Harga Satuan RAB wajib diisi.");
      return;
    }

    if (!groupId) {
      alert("Group RAB wajib dipilih.");
      return;
    }

    const cleanedComponents = components
      .filter((component) => component.name.trim() !== "")
      .map((component) => ({
        name: component.name.trim(),
        unit: component.unit.trim(),
        section: component.section,
        coefficient: Number(component.coefficient),
        unitPrice: Number(component.unitPrice),
      }));

    for (let i = 0; i < cleanedComponents.length; i++) {
      const component = cleanedComponents[i];
      if (!component.name) {
        alert(`Nama komponen nomor ${i + 1} wajib diisi.`);
        return;
      }
      if (!component.unit) {
        alert(`Satuan komponen "${component.name}" wajib diisi.`);
        return;
      }
      if (!Number.isFinite(component.coefficient) || component.coefficient < 0) {
        alert(`Coefficient komponen "${component.name}" tidak valid.`);
        return;
      }
      if (!Number.isFinite(component.unitPrice) || component.unitPrice < 0) {
        alert(`Harga komponen "${component.name}" tidak valid.`);
        return;
      }
    }

    const overheadNumber = Number(overhead);
    if (!Number.isFinite(overheadNumber) || overheadNumber < 0) {
      alert("Overhead harus berupa angka >= 0.");
      return;
    }

    const payload = {
      rabUnitPrice: rabUnitPrice === "" ? null : Number(rabUnitPrice),
      groupId,
      category: category?.trim() || null,
      reference: reference?.trim() || null,
      overhead: overhead === "" ? null : Number(overhead),
      components: item.sourceJobTypeId ? [] : cleanedComponents,
    };

    try {
      const res = await fetch(`${API_BASE}/bv-items/${item.id}/link-to-rab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Gagal link BV ke RAB.");
      }

      alert(json?.message || "BV berhasil di-link ke RAB.");
      setLinkModal(null);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // SYNC
  // ==========================================================
  const syncItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/bv-items/${itemId}/sync`, { method: "POST" });
      if (!res.ok) {
        throw new Error((await res.json())?.error || "Gagal sync ke RAB.");
      }
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================================
  // EXPORT EXCEL
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
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="bv-panel-header">
        <div>
          <h2 className="bv-title">BV — BACK UP VOLUME</h2>
          <p className="bv-subtitle">
            Project: {projectName || "-"} ({hspkPeriodLabel || "-"}) — {totalItemCount} item BV
          </p>
        </div>
        {onClose && (
          <button className="bv-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}
      <div className="bv-toolbar">
        <button className="bv-btn bv-btn-primary" onClick={openAddGroup}>
          + Tambah Group Pekerjaan
        </button>
        <button className="bv-btn" onClick={() => openAddItem(topGroups[0]?.id)} disabled={topGroups.length === 0}>
          + Tambah Baris Pekerjaan
        </button>
        <button className="bv-btn bv-btn-export" onClick={exportExcel} disabled={exporting || totalItemCount === 0}>
          {exporting ? "Mengekspor..." : "⬇ Export Excel"}
        </button>
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}
      {loading && <p className="bv-empty">Memuat data BV...</p>}
      {error && <p className="bv-empty" style={{ color: "#c0392b" }}>{error}</p>}

      {/* ======================================================
          BODY
      ====================================================== */}
      {!loading && !error && (
        <div className="bv-body">
          {topGroups.length === 0 && (
            <p className="bv-empty">
              Belum ada group pekerjaan. Klik "+ Tambah Group Pekerjaan" untuk mulai.
            </p>
          )}

          {topGroups.map((group, gIndex) => (
            <div className="bv-group" key={group.id}>
              <div className="bv-group-header">
                <span className="bv-group-title">
                  {gIndex + 1}. {group.name}
                </span>

                <div className="bv-group-actions">
                  <button className="bv-btn bv-btn-xs" onClick={() => openAddItem(group.id, "", false)}>
                    + Baris
                  </button>
                  <button className="bv-btn bv-btn-xs bv-btn-custom" onClick={() => openAddItem(group.id, "", true)}>
                    + Baris Custom
                  </button>
                  
                  {/* --- TOMBOL SUB BARIS --- */}
                  <button className="bv-btn bv-btn-xs" onClick={() => openAddSubItem(group.id, false)}>
                    + Sub Baris
                  </button>
                  <button className="bv-btn bv-btn-xs bv-btn-custom" onClick={() => openAddSubItem(group.id, true)}>
                    + Sub Baris Custom
                  </button>

                  <button className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => deleteGroup(group.id)}>
                    Hapus
                  </button>
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
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          GROUP MODAL
      ====================================================== */}
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
              <button className="bv-btn" onClick={() => setNameModal(null)}>Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitNameModal}>Tambah</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ITEM MODAL
      ====================================================== */}
      {itemModal && (
        <div className="bv-inner-overlay">
          <div className="bv-inner-modal bv-inner-modal-wide">
            <h3>{itemModal.editingId ? "Edit Baris Pekerjaan" : "Tambah Baris Pekerjaan"}</h3>

            <label className="bv-form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={itemModal.form.isHeaderOnly}
                onChange={(e) => updateItemForm({ isHeaderOnly: e.target.checked })}
              />
              Header saja (tanpa volume)
            </label>

            {/* ==========================================================
                DROPDOWN INDUK PEKERJAAN (HANYA MUNCUL JIKA KLIK + SUB)
            ========================================================== */}
            {itemModal.isSubItemMode && (
              <label className="bv-form-label">
                Pilih Induk Pekerjaan (Parent)
                <select
                  className="bv-form-input"
                  value={itemModal.form.parentBvItemId}
                  onChange={(e) => updateItemForm({ parentBvItemId: e.target.value })}
                >
                  <option value="">-- Pilih Baris Induk --</option>
                  {items
                    .filter((it) => it.groupId === itemModal.form.groupId && !it.parentBvItemId)
                    .map((parentItem) => (
                      <option key={parentItem.id} value={parentItem.id}>
                        {parentItem.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label className="bv-form-label">
              Uraian Pekerjaan
              {/* Badge penanda status HSPK / Custom */}
              {itemModal.isCustomMode && (
                <span className="bv-hspk-badge" style={{ borderColor: 'var(--bv-ok)', color: 'var(--bv-ok)', background: 'var(--bv-ok-soft)' }}>
                  Custom
                </span>
              )}
              {!itemModal.isCustomMode && itemModal.form.sourceJobTypeId && (
                <span className="bv-hspk-badge">dari HSPK</span>
              )}

              {itemModal.isCustomMode ? (
                /* ==========================================================
                   TAMPILAN JIKA MODE CUSTOM (INPUT BIASA, TANPA HSPK)
                   ========================================================== */
                <input
                  className="bv-form-input"
                  placeholder="Ketik uraian pekerjaan custom..."
                  value={itemModal.form.name}
                  onChange={(e) => updateItemForm({ name: e.target.value })}
                  autoFocus
                />
              ) : (
                /* ==========================================================
                   TAMPILAN JIKA MODE HSPK (DENGAN AUTOCOMPLETE)
                   ========================================================== */
                <div className="bv-autocomplete">
                  <input
                    className="bv-form-input"
                    placeholder="Ketik buat cari dari HSPK..."
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

            {!itemModal.form.isHeaderOnly && (
              <label className="bv-form-label">
                Satuan
                <input
                  className="bv-form-input"
                  value={itemModal.form.paymentUnit}
                  disabled={!!itemModal.form.sourceJobTypeId}
                  onChange={(e) => updateItemForm({ paymentUnit: e.target.value })}
                />
              </label>
            )}

            <label className="bv-form-label">
              Keterangan
              <input
                className="bv-form-input"
                value={itemModal.form.keterangan}
                onChange={(e) => updateItemForm({ keterangan: e.target.value })}
              />
            </label>

            <label className="bv-form-label">
              Link E-Commerce
              <input
                className="bv-form-input"
                placeholder="https://..."
                value={itemModal.form.ecommerceLink}
                onChange={(e) => updateItemForm({ ecommerceLink: e.target.value })}
              />
            </label>

            {!itemModal.form.isHeaderOnly && (
              <>
                <p className="bv-form-label" style={{ marginBottom: 4 }}>Baris Breakdown Dimensi</p>
                {itemModal.form.breakdowns.map((b, idx) => (
                  <div key={idx} className="bv-breakdown-row">
                    <input className="bv-form-input" placeholder="Keterangan" value={b.keterangan} onChange={(e) => updateBreakdown(idx, { keterangan: e.target.value })} />
                    <select className="bv-form-input" value={b.modeHitung} onChange={(e) => updateBreakdown(idx, { modeHitung: e.target.value })}>
                      {MODE_HITUNG_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input type="number" className="bv-form-input" placeholder="Panjang" value={b.panjang} onChange={(e) => updateBreakdown(idx, { panjang: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Lebar" value={b.lebar} onChange={(e) => updateBreakdown(idx, { lebar: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Tinggi" value={b.tinggi} onChange={(e) => updateBreakdown(idx, { tinggi: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Luas" value={b.luas} onChange={(e) => updateBreakdown(idx, { luas: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Keliling" value={b.keliling} onChange={(e) => updateBreakdown(idx, { keliling: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Diameter" value={b.diameter} onChange={(e) => updateBreakdown(idx, { diameter: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Berat" value={b.berat} onChange={(e) => updateBreakdown(idx, { berat: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Jml Sisi" value={b.jumlahSisi} onChange={(e) => updateBreakdown(idx, { jumlahSisi: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Jml Bh" value={b.jumlahBh} onChange={(e) => updateBreakdown(idx, { jumlahBh: e.target.value })} />
                    <input type="number" className="bv-form-input" placeholder="Waste %" value={b.waste} onChange={(e) => updateBreakdown(idx, { waste: e.target.value })} />
                    <span className="bv-breakdown-subtotal">= {calcSubtotal(b).toFixed(2)}</span>
                    <button className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => removeBreakdownRow(idx)} disabled={itemModal.form.breakdowns.length === 1}>
                      Hapus
                    </button>
                  </div>
                ))}
                <button className="bv-btn bv-btn-xs" onClick={addBreakdownRow}>+ Baris Breakdown</button>
              </>
            )}

            <div className="bv-inner-modal-actions">
              <button className="bv-btn" onClick={() => setItemModal(null)}>Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitItemModal}>
                {itemModal.editingId ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LINK TO RAB MODAL
      ====================================================== */}
      {linkModal && (
        <div className="bv-inner-overlay">
          <div className="bv-inner-modal bv-inner-modal-wide bv-link-rab-modal">
            <h3>Link ke RAB</h3>
            <p className="bv-form-hint">Item BV: <strong> {linkModal.item?.name}</strong></p>

            <label className="bv-form-label">
              Harga Satuan RAB
              <input
                type="number"
                min="0"
                className="bv-form-input"
                placeholder="Contoh: 200000"
                value={linkModal.rabUnitPrice}
                onChange={(e) => updateLinkModal({ rabUnitPrice: e.target.value })}
              />
            </label>

            <label className="bv-form-label">
              Group RAB
              <select
                className="bv-form-input"
                value={linkModal.groupId}
                onChange={(e) => updateLinkModal({ groupId: e.target.value })}
              >
                <option value="">-- pilih group --</option>
                {topGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </label>

            <label className="bv-form-label">
              Category
              <input
                type="text"
                className="bv-form-input"
                placeholder="Contoh: Pekerjaan Custom"
                value={linkModal.category}
                onChange={(e) => updateLinkModal({ category: e.target.value })}
              />
            </label>

            <label className="bv-form-label">
              Reference
              <input
                type="text"
                className="bv-form-input"
                placeholder="Contoh: HSPK 2026 / AHSP / custom"
                value={linkModal.reference}
                onChange={(e) => updateLinkModal({ reference: e.target.value })}
              />
            </label>

            <label className="bv-form-label">
              Overhead
              <input
                type="number"
                min="0"
                step="0.01"
                className="bv-form-input"
                placeholder="Contoh: 0.1 = 10%"
                value={linkModal.overhead}
                onChange={(e) => updateLinkModal({ overhead: e.target.value })}
              />
              <span className="bv-form-hint">
                Gunakan 0.1 untuk overhead 10%, 0.15 untuk 15%, dan seterusnya.
              </span>
            </label>

            <div className="bv-rab-components-header">
              <div>
                <h4>Komponen RAB</h4>
                <p className="bv-form-hint">
                  Masukkan bahan, upah, dan alat pembentuk harga pelaksanaan.
                </p>
              </div>
              <button type="button" className="bv-btn bv-btn-xs bv-btn-primary" onClick={addRabComponent}>
                + Tambah Komponen
              </button>
            </div>

            <div className="bv-rab-components">
              {linkModal.components.map((component, index) => (
                <div className="bv-rab-component-row" key={index}>
                  <input
                    type="text"
                    className="bv-form-input"
                    placeholder="Nama komponen"
                    value={component.name}
                    onChange={(e) => updateRabComponent(index, { name: e.target.value })}
                  />
                  <input
                    type="text"
                    className="bv-form-input"
                    placeholder="Satuan"
                    value={component.unit}
                    onChange={(e) => updateRabComponent(index, { unit: e.target.value })}
                  />
                  <select
                    className="bv-form-input"
                    value={component.section}
                    onChange={(e) => updateRabComponent(index, { section: e.target.value })}
                  >
                    {COMPONENT_SECTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    className="bv-form-input"
                    placeholder="Coefficient"
                    value={component.coefficient}
                    onChange={(e) => updateRabComponent(index, { coefficient: e.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    className="bv-form-input"
                    placeholder="Harga Satuan"
                    value={component.unitPrice}
                    onChange={(e) => updateRabComponent(index, { unitPrice: e.target.value })}
                  />
                  <div className="bv-component-total">
                    Rp {new Intl.NumberFormat("id-ID").format(calculateComponentTotal(component))}
                  </div>
                  <button type="button" className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => removeRabComponent(index)}>
                    Hapus
                  </button>
                </div>
              ))}
              {linkModal.components.length === 0 && (
                <div className="bv-form-hint">
                  Belum ada komponen. Klik "+ Tambah Komponen".
                </div>
              )}
            </div>

            <div className="bv-rab-component-summary">
              <span>Total Komponen:</span>
              <strong>Rp {new Intl.NumberFormat("id-ID").format(calculateComponentsTotal())}</strong>
            </div>

            <div className="bv-inner-modal-actions">
              <button className="bv-btn" onClick={() => setLinkModal(null)}>Batal</button>
              <button className="bv-btn bv-btn-primary" onClick={submitLink}>Link ke RAB</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BV TABLE
// ============================================================================
function BvTable({ groupNo, items, onEdit, onDelete, onLink, onSync }) {
  const statusLabel = (status) => {
    if (status === "SUDAH_SINKRON") return "Sudah di-link";
    if (status === "BELUM_SINKRON") return "Belum sinkron";
    return "Belum di-link";
  };

  const statusClass = (status) => {
    return status === "SUDAH_SINKRON" ? "bv-status-ok" : "bv-status-warn";
  };

  // ==========================================================
  // RENDER ITEM
  // ==========================================================
  const renderItem = (item, parentNo, indexInParent) => {
    const no = `${parentNo}.${indexInParent}`;
    const breakdowns = item.breakdowns || [];
    const inlineBreakdown = breakdowns.length === 1 ? breakdowns[0] : null;
    const detailBreakdowns = inlineBreakdown ? [] : breakdowns;
    const displayKeterangan = item.keterangan || inlineBreakdown?.keterangan || "";

    return (
      <Fragment key={item.id}>
        <tr>
          <td>{no}</td>
          <td>{item.name}</td>
          <td>{item.isHeaderOnly ? "" : item.paymentUnit || ""}</td>
          <td>{item.isHeaderOnly ? "" : Number(item.totalVolume).toFixed(2)}</td>
          <td>{displayKeterangan}</td>
          <td>{inlineBreakdown?.panjang ?? ""}</td>
          <td>{inlineBreakdown?.lebar ?? ""}</td>
          <td>{inlineBreakdown?.tinggi ?? ""}</td>
          <td>{inlineBreakdown?.luas ?? ""}</td>
          <td>{inlineBreakdown?.keliling ?? ""}</td>
          <td>{inlineBreakdown?.diameter ?? ""}</td>
          <td>{inlineBreakdown?.berat ?? ""}</td>
          <td>{inlineBreakdown?.jumlahSisi ?? ""}</td>
          <td>{inlineBreakdown?.jumlahBh ?? ""}</td>
          <td>{inlineBreakdown?.waste ?? ""}</td>
          <td>{item.isHeaderOnly ? "" : Number(item.totalVolume).toFixed(2)}</td>
          <td>{item.isHeaderOnly ? "" : item.paymentUnit || ""}</td>
          <td>{item.ecommerceLink || ""}</td>
          <td>
            {!item.isHeaderOnly && (
              <span className={`bv-status ${statusClass(item.linkStatus)}`}>
                {statusLabel(item.linkStatus)}
              </span>
            )}
          </td>
          <td className="bv-row-actions">
            <button className="bv-btn bv-btn-xs" onClick={() => onEdit(item)}>Edit</button>

            {!item.isHeaderOnly && item.linkStatus === "BELUM_DILINK" && (
              <button className="bv-btn bv-btn-xs" onClick={() => onLink(item)}>Link</button>
            )}
            {item.linkStatus === "BELUM_SINKRON" && (
              <button className="bv-btn bv-btn-xs" onClick={() => onSync(item.id)}>Sync</button>
            )}
            <button className="bv-btn bv-btn-xs bv-btn-danger" onClick={() => onDelete(item.id)}>Hapus</button>
          </td>
        </tr>

        {/* ====================================================
            DETAIL BREAKDOWN
        ==================================================== */}
        {detailBreakdowns.map((b, i) => (
          <tr key={`${item.id}-b${i}`} className="bv-detail-row">
            <td />
            <td className="bv-detail-label">- {b.keterangan || ""}</td>
            <td />
            <td />
            <td />
            <td>{b.panjang ?? ""}</td>
            <td>{b.lebar ?? ""}</td>
            <td>{b.tinggi ?? ""}</td>
            <td>{b.luas ?? ""}</td>
            <td>{b.keliling ?? ""}</td>
            <td>{b.diameter ?? ""}</td>
            <td>{b.berat ?? ""}</td>
            <td>{b.jumlahSisi ?? ""}</td>
            <td>{b.jumlahBh ?? ""}</td>
            <td>{b.waste ?? ""}</td>
            <td>{Number(b.subTotal ?? 0).toFixed(2)}</td>
            <td />
            <td />
            <td />
            <td />
          </tr>
        ))}

        {/* ====================================================
            CHILD
        ==================================================== */}
        {(item.children || []).map((child, ci) => renderItem(child, no, ci + 1))}
      </Fragment>
    );
  };

  return (
    <table className="bv-table">
      <thead>
        <tr>
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
          <th colSpan={2}>Jumlah</th>
          <th rowSpan={2}>Waste<br />(%)</th>
          <th colSpan={2}>TOTAL</th>
          <th rowSpan={2}>LINK<br />E-COMMERCE INFO</th>
          <th rowSpan={2}>Status</th>
          <th rowSpan={2} />
        </tr>
        <tr>
          <th>Sat.</th>
          <th>Vol.</th>
          <th>(Sisi)</th>
          <th>(Bh)</th>
          <th>Vol.</th>
          <th>Sat.</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => renderItem(item, groupNo, i + 1))}
      </tbody>
    </table>
  );
}

export default CreateBvModal;