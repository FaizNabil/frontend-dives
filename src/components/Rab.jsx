import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  ClipboardList,
  Scale,
  TrendingUp,
  Search,
  ChevronDown,
} from 'lucide-react';
import "../styles/Rab.css"

const API_ROOT = 'http://localhost:4000/api';
const API_URL = `${API_ROOT}/projects`;

const fmtRp = (n) =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });

const emptyComp = () => ({ section: 'UPAH', name: '', unit: '', coefficient: '', unitPrice: '' });

// RAB TIDAK bisa tambah group / tambah baris pekerjaan di sini - itu cuma
// lewat "Buat BV" (CreateBvModal) terus di-link. Yang bisa dilakukan di
// halaman ini: lihat tree Group > Sub-Group > Item, EDIT harga per item
// (RAP/RAB manual, toggle By Owner, toggle Stip, ganti sumber HSPK item),
// hapus group/item, dan export.
//
// initialProjectId (opsional): dikirim App.jsx kalau ada konteks project
// aktif. Kalau kosong, user pilih sendiri dari dropdown di halaman ini.
const Rab = ({ initialProjectId = null }) => {
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectList, setProjectList] = useState([]);
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);

  useEffect(() => {
    if (initialProjectId !== null) setProjectId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then(setProjectList)
      .catch(() => setProjectList([]));
  }, []);

  const loadTree = async () => {
    if (!projectId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [projectRes, groupsRes] = await Promise.all([
        fetch(`${API_URL}/${projectId}`),
        fetch(`${API_URL}/${projectId}/rab-groups`),
      ]);
      if (!projectRes.ok) throw new Error('Gagal memuat project.');
      if (!groupsRes.ok) throw new Error('Gagal memuat RAB.');
      setProject(await projectRes.json());
      setGroups(await groupsRes.json());
    } catch (err) {
      setFetchError(err.message || 'Gagal memuat data RAB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ---------- Helper rekursif: flatten semua item (buat stats) & subtotal per group ----------
  const flattenItems = (groupList) =>
    (groupList || []).flatMap((g) => [...(g.items || []), ...flattenItems(g.children)]);

  const allItems = useMemo(() => flattenItems(groups), [groups]);

  const sumGroupRecursive = (g) => {
    let total = (g.items || []).reduce((s, it) => s + Number(it.rabTotalPrice || 0), 0);
    for (const child of g.children || []) total += sumGroupRecursive(child);
    return total;
  };

  const totalRab = allItems.reduce((s, it) => s + Number(it.rabTotalPrice || 0), 0);
  const totalRap = allItems.reduce((s, it) => s + Number(it.rapTotalPrice || 0), 0);
  const selisih = totalRap - totalRab;

  // Filter tree by search - group ikut kesembunyi kalau semua item di
  // dalamnya (termasuk children) gak match, tapi group tetap muncul kalau
  // ada 1 aja item yang match di manapun turunannya.
  const matchesQuery = (it, q) =>
    it.name?.toLowerCase().includes(q) ||
    it.category?.toLowerCase().includes(q) ||
    it.reference?.toLowerCase().includes(q);

  const filterGroups = (groupList, q) => {
    if (!q) return groupList;
    return (groupList || [])
      .map((g) => {
        const filteredItems = (g.items || []).filter((it) => matchesQuery(it, q));
        const filteredChildren = filterGroups(g.children, q);
        if (filteredItems.length === 0 && filteredChildren.length === 0) return null;
        return { ...g, items: filteredItems, children: filteredChildren };
      })
      .filter(Boolean);
  };

  const visibleGroups = useMemo(
    () => filterGroups(groups, search.trim().toLowerCase()),
    [groups, search]
  );

  // ---------- Delete ----------
  const deleteGroup = async (id) => {
    if (!confirm('Hapus group ini? Semua sub-group dan baris pekerjaan di dalamnya akan ikut terhapus.')) return;
    try {
      const res = await fetch(`${API_ROOT}/rab-groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json())?.error || 'Gagal menghapus group.');
      loadTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Hapus baris pekerjaan ini?')) return;
    try {
      const res = await fetch(`${API_ROOT}/rab-items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json())?.error || 'Gagal menghapus item.');
      loadTree();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Edit item (RAP/RAB manual, By Owner, Stip, komponen, switch job) ----------
  const openEdit = (item) => {
    setEditModal({
      item,
      rapUnitPrice: item.rapUnitPrice ?? 0,
      rabUnitPrice: item.rabUnitPrice ?? 0,
      isByOwner: !!item.isByOwner,
      isStip: !!item.isStip,
      components: (item.components || []).map((c) => ({
        section: c.section,
        name: c.name,
        unit: c.unit,
        coefficient: c.coefficient,
        unitPrice: c.unitPrice,
      })),
      switchJobOpen: false,
      switchQuery: '',
      switchResults: [],
    });
  };

  const toggleByOwner = () => {
    setEditModal((prev) => {
      const next = !prev.isByOwner;
      return { ...prev, isByOwner: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice, rabUnitPrice: next ? 0 : prev.rabUnitPrice };
    });
  };

  const toggleStip = () => {
    setEditModal((prev) => {
      const next = !prev.isStip;
      return { ...prev, isStip: next, rapUnitPrice: next ? 0 : prev.rapUnitPrice, rabUnitPrice: next ? 0 : prev.rabUnitPrice };
    });
  };

  const updateComp = (idx, patch) =>
    setEditModal((prev) => ({
      ...prev,
      components: prev.components.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));

  const addCompRow = () =>
    setEditModal((prev) => ({ ...prev, components: [...prev.components, emptyComp()] }));

  const removeCompRow = (idx) =>
    setEditModal((prev) => ({ ...prev, components: prev.components.filter((_, i) => i !== idx) }));

  const submitEdit = async () => {
    const { item, isByOwner, isStip } = editModal;
    const rabUnitPrice = isByOwner || isStip ? 0 : Number(editModal.rabUnitPrice);

    if (!isByOwner && !isStip && (!rabUnitPrice || rabUnitPrice <= 0)) {
      alert('Harga RAB wajib diisi.');
      return;
    }

    const rows = editModal.components
      .map((c) => ({
        section: c.section,
        name: c.name.trim(),
        unit: c.unit.trim(),
        coefficient: Number(c.coefficient),
        unitPrice: Number(c.unitPrice),
      }))
      .filter((c) => c.name && c.unit);

    const body = { rabUnitPrice, isByOwner, isStip };
    if (rows.length > 0) {
      body.components = rows;
    } else if (!isByOwner) {
      const rapUnitPrice = Number(editModal.rapUnitPrice);
      if (rapUnitPrice > 0) body.rapUnitPrice = rapUnitPrice;
    } else {
      body.rapUnitPrice = 0;
    }

    try {
      const res = await fetch(`${API_ROOT}/rab-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Gagal menyimpan.');
      setEditModal(null);
      loadTree();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Switch job type (ganti sumber HSPK item yang udah ada) ----------
  const searchSwitchJobs = async (q) => {
    setEditModal((prev) => ({ ...prev, switchQuery: q }));
    if (q.trim().length < 2) {
      setEditModal((prev) => ({ ...prev, switchResults: [] }));
      return;
    }
    try {
      const params = new URLSearchParams({ q: q.trim() });
      const res = await fetch(`${API_ROOT}/jobs?${params.toString()}`);
      if (res.ok) {
        const results = await res.json();
        setEditModal((prev) => ({ ...prev, switchResults: results }));
      }
    } catch {
      // diem aja, bukan fatal
    }
  };

  const confirmSwitchJob = async (newJobTypeId) => {
    if (!confirm('Ganti jenis pekerjaan ini? Semua data (nama, satuan, komponen, RAP) akan diambil ulang dari master baru.')) return;
    try {
      const res = await fetch(`${API_ROOT}/rab-items/${editModal.item.id}/switch-job`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newJobTypeId }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Gagal mengganti.');
      setEditModal(null);
      loadTree();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Export ----------
  const exportRabExcel = () => { window.location.href = `${API_ROOT}/projects/${projectId}/rab-items/export`; };
  const exportBvExcel = () => { window.location.href = `${API_ROOT}/projects/${projectId}/bv-items/export`; };
  const exportFullExcel = () => { window.location.href = `${API_ROOT}/projects/${projectId}/export-full`; };
  const scheduleExport = () => { window.location.href = `${API_ROOT}/projects/${projectId}/time-schedule/export`; };
  const viewRab = () => { window.open(`${API_ROOT}/projects/${projectId}/rab-items/view`, '_blank'); };

  return (
    <div className="rab-wrapper">

      {/* ================= HEADER ================= */}
      <header className="rab-header">
        <div>
          <p className="rab-eyebrow">
            {project?.name ? `Project: ${project.name}` : 'Financial Control'}
          </p>
          <h2 className="rab-title">RAB & Budgeting</h2>
          <p className="rab-subtitle">
            Rencana Anggaran Biaya (RAB) vs Rencana Anggaran Pelaksanaan (RAP) — hasil link dari BV
          </p>
          {project?.pairedProjectId && project?.pairedProject && (
            <button className="rab-pair-link" onClick={() => setProjectId(project.pairedProjectId)}>
              Buka versi {project.pairedProject.discipline === 'SIPIL' ? 'Interior' : 'Civil'} →
            </button>
          )}
        </div>

        <div className="rab-project-picker">
          <select
            className="rab-project-select"
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">-- pilih project --</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="rab-project-select-icon" />
        </div>
      </header>

      <div className="rab-content">

        {!projectId ? (
          <div className="rab-plate rab-text-center rab-text-muted" style={{ padding: '32px' }}>
            Pilih project dari dropdown di atas buat lihat RAB-nya.
          </div>
        ) : (
          <>
            {/* ================= TOOLBAR EXPORT ================= */}
            <div className="rab-toolbar">
              <button className="rab-btn" onClick={exportRabExcel}>⬇ Export RAB</button>
              <button className="rab-btn" onClick={exportBvExcel}>⬇ Export BV</button>
              <button className="rab-btn" onClick={scheduleExport}>⬇ Export Schedule</button>
              <button className="rab-btn" onClick={exportFullExcel}>⬇ Export Lengkap</button>
              <button className="rab-btn" onClick={viewRab}>👁 View RAB</button>
            </div>

            {/* ================= SUMMARY PLATES ================= */}
            <div className="rab-stats-grid">
              <div className="rab-plate">
                <div className="rab-stat-header">
                  <Wallet size={18} className="rab-stat-icon" />
                  <span className="rab-stat-label">Total RAB</span>
                </div>
                <div className="rab-stat-value is-mono">{fmtRp(totalRab)}</div>
                <div className="rab-stat-desc">Rencana Anggaran Biaya</div>
              </div>

              <div className="rab-plate">
                <div className="rab-stat-header">
                  <ClipboardList size={18} className="rab-stat-icon" />
                  <span className="rab-stat-label">Total RAP</span>
                </div>
                <div className="rab-stat-value is-mono">{fmtRp(totalRap)}</div>
                <div className="rab-stat-desc">Rencana Anggaran Pelaksanaan</div>
              </div>

              <div className={`rab-plate ${selisih > 0 ? 'is-danger' : ''}`}>
                <div className="rab-stat-header">
                  <Scale size={18} className="rab-stat-icon" />
                  <span className="rab-stat-label">Selisih</span>
                </div>
                <div className="rab-stat-value is-mono">
                  {selisih > 0 ? '+' : ''}{fmtRp(selisih)}
                </div>
                <div className="rab-stat-desc">RAP dikurangi RAB</div>
              </div>

              <div className="rab-plate">
                <div className="rab-stat-header">
                  <TrendingUp size={18} className="rab-stat-icon" />
                  <span className="rab-stat-label">Item</span>
                </div>
                <div className="rab-stat-value is-mono">{allItems.length}</div>
                <div className="rab-stat-desc">Jumlah item pekerjaan</div>
              </div>
            </div>

            {/* ================= SEARCH ================= */}
            <div className="rab-plate" style={{ padding: '12px 16px' }}>
              <div className="rab-search-box">
                <Search size={15} className="rab-search-icon" />
                <input
                  type="text"
                  placeholder="Cari nama, kategori, atau reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* ================= TREE ================= */}
            <div className="rab-plate rab-tree-plate">
              {loading ? (
                <p className="rab-text-center rab-text-muted" style={{ padding: 24 }}>Memuat data RAB...</p>
              ) : fetchError ? (
                <p className="rab-text-center rab-text-danger" style={{ padding: 24 }}>{fetchError}</p>
              ) : visibleGroups.length === 0 ? (
                <p className="rab-text-center rab-text-muted" style={{ padding: 24 }}>
                  Belum ada Group Pekerjaan. Bikin dari halaman "Buat BV" dulu.
                </p>
              ) : (
                visibleGroups.map((g) => (
                  <RabGroupNode
                    key={g.id}
                    group={g}
                    depth={0}
                    sumGroupRecursive={sumGroupRecursive}
                    onDeleteGroup={deleteGroup}
                    onEditItem={openEdit}
                    onDeleteItem={deleteItem}
                  />
                ))
              )}
            </div>
          </>
        )}

      </div>

      {/* ================= EDIT MODAL ================= */}
      {editModal && (
        <div className="rab-modal-overlay">
          <div className="rab-modal">
            <h3>Edit Baris Pekerjaan</h3>
            <p className="rab-edit-label">
              {editModal.item.name} — {editModal.item.paymentUnit} — Vol: {editModal.item.volume}
            </p>

            <div className="rab-toggle-row">
              <button
                type="button"
                className={`rab-btn rab-btn-small ${editModal.isByOwner ? 'rab-btn-active' : ''}`}
                onClick={toggleByOwner}
              >
                {editModal.isByOwner ? '✓ By Owner' : 'Set By Owner'}
              </button>
              <button
                type="button"
                className={`rab-btn rab-btn-small ${editModal.isStip ? 'rab-btn-active' : ''}`}
                onClick={toggleStip}
              >
                {editModal.isStip ? 'Batal Set Stip' : 'Set Harga Stip (-)'}
              </button>
            </div>

            <label className="rab-form-label">
              Harga RAP (Satuan, manual)
              <input
                type="number"
                className="rab-form-input"
                value={editModal.isByOwner || editModal.isStip ? '' : editModal.rapUnitPrice}
                placeholder={editModal.isByOwner || editModal.isStip ? '-' : ''}
                disabled={editModal.isByOwner || editModal.isStip}
                onChange={(e) => setEditModal({ ...editModal, rapUnitPrice: e.target.value })}
              />
            </label>

            <label className="rab-form-label">
              Harga RAB (Satuan, manual)
              <input
                type="number"
                className="rab-form-input"
                value={editModal.isByOwner || editModal.isStip ? '' : editModal.rabUnitPrice}
                placeholder={editModal.isByOwner || editModal.isStip ? '-' : ''}
                disabled={editModal.isByOwner || editModal.isStip}
                onChange={(e) => setEditModal({ ...editModal, rabUnitPrice: e.target.value })}
              />
            </label>

            {/* Switch job type - cuma relevan kalau item ini dari master HSPK */}
            {editModal.item.sourceJobTypeId && (
              <div className="rab-switch-job">
                <button
                  type="button"
                  className="rab-btn rab-btn-small"
                  onClick={() => setEditModal({ ...editModal, switchJobOpen: !editModal.switchJobOpen })}
                >
                  🔄 Ganti Jenis Pekerjaan
                </button>

                {editModal.switchJobOpen && (
                  <div className="rab-switch-job-box">
                    <label className="rab-form-label">
                      Cari Jenis Pekerjaan Baru
                      <input
                        className="rab-form-input"
                        placeholder="ketik nama pekerjaan..."
                        value={editModal.switchQuery}
                        onChange={(e) => searchSwitchJobs(e.target.value)}
                      />
                    </label>
                    {editModal.switchResults.length > 0 && (
                      <select
                        className="rab-form-input"
                        size={4}
                        onChange={(e) => confirmSwitchJob(e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>-- pilih lalu otomatis ganti --</option>
                        {editModal.switchResults.map((j) => (
                          <option key={j.id} value={j.id}>{j.reference ? `${j.reference} — ` : ''}{j.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="rab-form-label" style={{ marginTop: 14 }}>
              Komponen — dipakai buat hitung RAP otomatis (kosongkan semua baris = pakai harga manual di atas)
            </p>
            {editModal.components.map((c, idx) => (
              <div key={idx} className="rab-comp-row">
                <select className="rab-form-input" value={c.section} onChange={(e) => updateComp(idx, { section: e.target.value })}>
                  <option value="UPAH">Upah</option>
                  <option value="BAHAN">Bahan</option>
                  <option value="ALAT">Alat</option>
                </select>
                <input className="rab-form-input" placeholder="nama" value={c.name} onChange={(e) => updateComp(idx, { name: e.target.value })} />
                <input className="rab-form-input" placeholder="satuan" value={c.unit} onChange={(e) => updateComp(idx, { unit: e.target.value })} />
                <input type="number" className="rab-form-input" placeholder="koef" value={c.coefficient} onChange={(e) => updateComp(idx, { coefficient: e.target.value })} />
                <input type="number" className="rab-form-input" placeholder="harga" value={c.unitPrice} onChange={(e) => updateComp(idx, { unitPrice: e.target.value })} />
                <button className="rab-btn rab-btn-small rab-btn-danger" onClick={() => removeCompRow(idx)}>×</button>
              </div>
            ))}
            <button className="rab-btn rab-btn-small" onClick={addCompRow}>+ Komponen</button>

            <div className="rab-modal-actions">
              <button className="rab-btn" onClick={() => setEditModal(null)}>Batal</button>
              <button className="rab-btn rab-btn-primary" onClick={submitEdit}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Node tree recursive: Group -> (Item table) + (Sub-Group children) ----------
function RabGroupNode({ group, depth, sumGroupRecursive, onDeleteGroup, onEditItem, onDeleteItem }) {
  const subtotal = sumGroupRecursive(group);

  return (
    <div className="rab-group-block" style={{ marginLeft: depth > 0 ? 18 : 0 }}>
      <div className={depth === 0 ? 'rab-group-row' : 'rab-subgroup-row'}>
        <div>
          {group.reference && <span className="rab-ref">{group.reference}</span>}
          <span className="rab-group-label">{group.name}</span>
        </div>
        <div className="rab-group-actions">
          <span className="rab-group-subtotal">{fmtRp(subtotal)}</span>
          <button className="rab-btn rab-btn-small rab-btn-danger" onClick={() => onDeleteGroup(group.id)}>Hapus</button>
        </div>
      </div>

      {(group.items || []).length > 0 && (
        <RabItemsTable items={group.items} onEdit={onEditItem} onDelete={onDeleteItem} />
      )}

      {(group.children || []).map((sg) => (
        <RabGroupNode
          key={sg.id}
          group={sg}
          depth={depth + 1}
          sumGroupRecursive={sumGroupRecursive}
          onDeleteGroup={onDeleteGroup}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
}

function RabItemsTable({ items, onEdit, onDelete }) {
  let counter = 0;
  return (
    <table className="rab-items-table">
      <thead>
        <tr>
          <th>Ref</th>
          <th>Uraian Pekerjaan</th>
          <th>Disiplin</th>
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
        {items.map((it) => {
          const isChild = !!it.bvItem?.parentBvItemId;
          const no = isChild ? '' : ++counter;
          const special = it.isByOwner ? 'By Owner' : it.isStip ? '-' : null;

          return (
            <tr key={it.id}>
              <td>{it.reference || no || ''}</td>
              <td>{isChild ? '— ' : ''}{it.name}</td>
              <td>{it.discipline ? `${it.discipline}${it.grade ? '-' + it.grade : ''}` : '-'}</td>
              <td>{it.paymentUnit}</td>
              <td className="rab-mono">{Number(it.volume)}</td>
              {special ? (
                <>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                  <td className="rab-text-center rab-special-cell">{special}</td>
                </>
              ) : (
                <>
                  <td className="rab-mono">{fmtRp(it.rapUnitPrice)}</td>
                  <td className="rab-mono">{fmtRp(it.rapTotalPrice)}</td>
                  <td className="rab-mono">{fmtRp(it.rabUnitPrice)}</td>
                  <td className="rab-mono rab-fw-bold">{fmtRp(it.rabTotalPrice)}</td>
                </>
              )}
              <td className="rab-row-actions">
                <button className="rab-btn rab-btn-small" onClick={() => onEdit(it)}>Edit</button>
                <button className="rab-btn rab-btn-small rab-btn-danger" onClick={() => onDelete(it.id)}>Hapus</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Rab;