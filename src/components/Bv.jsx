import { useEffect, useState } from 'react';
import "../styles/Bv.css";
import { ChevronDown } from 'lucide-react';
import CreateBvModal from './CreateBvModal';

const API_URL = 'http://localhost:4000/api/projects';

// Pola sama kayak Rab.jsx: pilih project dulu dari dropdown, baru panel
// BV (group + baris pekerjaan) muncul di bawahnya. Lebih simpel dibanding
// versi lama (list project + klik row buat expand).
//
// initialProjectId (opsional): dikirim App.jsx kalau masuk lewat tombol
// "CREATE BV" di Dashboard - project langsung terpilih.
const Bv = ({ initialProjectId = null }) => {
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectList, setProjectList] = useState([]);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (initialProjectId !== null) setProjectId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then(setProjectList)
      .catch(() => setProjectList([]));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    fetch(`${API_URL}/${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setProject)
      .catch(() => setProject(null));
  }, [projectId]);

  return (
    <div className="bv-page">
      <header className="bv-page-header">
        <div>
          <p className="bv-page-eyebrow">Bill of Volume</p>
          <h2 className="bv-page-title">Buat BV</h2>
          <p className="bv-page-subtitle">
            Pilih project, lalu susun Group Pekerjaan dan Baris Pekerjaan-nya.
          </p>
        </div>

        <div className="bv-project-picker">
          <select
            className="bv-project-select"
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">-- pilih project --</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="bv-project-select-icon" />
        </div>
      </header>

      {!projectId ? (
        <div className="bv-page-empty">
          Pilih project dari dropdown di atas buat mulai susun BV-nya.
        </div>
      ) : (
        <CreateBvModal
          isOpen={true}
          projectId={projectId}
          projectName={project?.name}
          hspkPeriodLabel={project?.hspkPeriod ? `HSPK ${project.hspkPeriod}` : undefined}
        />
      )}
    </div>
  );
};

export default Bv;