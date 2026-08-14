import { useState } from 'react';
import '../styles/UploadHspk.css';

const GRADE_OPTIONS = {
  SIPIL: ['A', 'B'],
  INTERIOR: ['A', 'B', 'C'],
};

function UploadHspk() {
  const [file, setFile] = useState(null);
  const [period, setPeriod] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [grade, setGrade] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const gradeChoices = discipline ? GRADE_OPTIONS[discipline] : [];

  const handleDisciplineChange = (e) => {
    setDiscipline(e.target.value);
    setGrade(''); // reset grade tiap ganti disiplin
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Pilih file Excel dulu.');
      return;
    }
    if (!period) {
      setError('Isi tahun (period).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('file', file);
    form.append('period', period);
    form.append('discipline', discipline);
    form.append('grade', grade);

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Upload gagal.');
      }

      setResult(data);
    } catch (err) {
      setError('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hspk-upload">
      <h2 className="hspk-title">UPLOAD HSPK / AHSP</h2>
      <h2 className="hspk-note">Upload hspk hanya sekali jika tidak ada perubahan</h2>

      <div className="hspk-field">
        <label className="hspk-label">File Excel (.xlsx)</label>
        <div className="hspk-file-input">
          <label className="hspk-choose-btn">
            Choose File
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0] || null)}
              hidden
            />
          </label>
          <span className="hspk-file-name">
            {file ? file.name : 'No file chosen'}
          </span>
        </div>
      </div>

      <div className="hspk-field">
        <label className="hspk-label">Tahun (Period)</label>
        <input
          type="number"
          className="hspk-input"
          placeholder="mis. 2026"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </div>

      <div className="hspk-field">
        <label className="hspk-label">Disiplin</label>
        <select
          className="hspk-select"
          value={discipline}
          onChange={handleDisciplineChange}
        >
          <option value="">-- pilih disiplin --</option>
          <option value="SIPIL">Sipil</option>
          <option value="INTERIOR">Interior</option>
        </select>
      </div>

      <div className="hspk-field">
        <label className="hspk-label">Grade</label>
        <select
          className="hspk-select"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">-- pilih grade --</option>
          {gradeChoices.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <button
        className="hspk-upload-btn"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? 'Mengupload…' : 'Upload'}
      </button>

      {error && <div className="hspk-error">{error}</div>}

      {result && (
        <pre className="hspk-result">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default UploadHspk;