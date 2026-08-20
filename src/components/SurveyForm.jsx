import { useState } from 'react';
import "../styles/SurveyForm.css";

const API_BASE = 'http://localhost:4000/api';

// ==========================================
// INISIALISASI STATE KOSONG
// ==========================================
const emptyDimension = () => ({
  keterangan: '',
  panjang: '',
  lebar: '',
  tinggi: '',
  luasan: ''
});

const emptyArea = () => ({
  areaName: '',
  analisa: '',
  penanganan: '',
  informasiTambahan: '',
  photo: null, // Menyimpan 1 file foto spesifik untuk area ini
  dimensions: [emptyDimension()]
});

export default function SurveyForm({ projectId, onSaved }) {
  // State Utama Laporan
  const [form, setForm] = useState({
    surveyDate: new Date().toISOString().slice(0, 10), // Default hari ini
    surveyorName: '',
    notes: '',
  });

  // State Array Area yang berisi detail & dimensi
  const [areas, setAreas] = useState([emptyArea()]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // HANDLERS
  // ==========================================
  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // Handler Area
  const addArea = () => setAreas((prev) => [...prev, emptyArea()]);
  
  const removeArea = (index) => {
    setAreas((prev) => prev.filter((_, i) => i !== index));
  };
  
  const updateArea = (index, patch) => {
    setAreas((prev) => prev.map((area, i) => (i === index ? { ...area, ...patch } : area)));
  };

  const handlePhotoChange = (index, file) => {
    updateArea(index, { photo: file });
  };

  // Handler Dimensi per Area
  const addDimension = (areaIndex) => {
    setAreas((prev) => prev.map((area, i) => {
      if (i === areaIndex) {
        return { ...area, dimensions: [...area.dimensions, emptyDimension()] };
      }
      return area;
    }));
  };

  const removeDimension = (areaIndex, dimIndex) => {
    setAreas((prev) => prev.map((area, i) => {
      if (i === areaIndex) {
        return { ...area, dimensions: area.dimensions.filter((_, dIdx) => dIdx !== dimIndex) };
      }
      return area;
    }));
  };

  const updateDimension = (areaIndex, dimIndex, patch) => {
    setAreas((prev) => prev.map((area, i) => {
      if (i === areaIndex) {
        const newDimensions = area.dimensions.map((dim, dIdx) => (dIdx === dimIndex ? { ...dim, ...patch } : dim));
        return { ...area, dimensions: newDimensions };
      }
      return area;
    }));
  };

  // ==========================================
  // SUBMIT (POST DATA + MULTIPART)
  // ==========================================
  const handleSubmit = async () => {
    // Validasi Basic
    if (!form.surveyDate || !form.surveyorName.trim()) {
      setError('Tanggal survey dan Nama Surveyor wajib diisi.');
      return;
    }

    // Pastikan minimal ada 1 area dengan nama
    if (areas.length === 0 || !areas[0].areaName.trim()) {
      setError('Minimal isi satu nama Area (misal: Ruang Tamu).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Susun JSON data persis seperti expected Backend
      const surveyDataPayload = {
        surveyDate: form.surveyDate,
        surveyorName: form.surveyorName.trim(),
        notes: form.notes.trim() || null,
        areas: areas.map((a) => ({
          areaName: a.areaName.trim(),
          analisa: a.analisa.trim() || null,
          penanganan: a.penanganan.trim() || null,
          informasiTambahan: a.informasiTambahan.trim() || null,
          dimensions: a.dimensions.map((d) => ({
            keterangan: d.keterangan.trim() || null,
            panjang: d.panjang || null,
            lebar: d.lebar || null,
            tinggi: d.tinggi || null,
            luasan: d.luasan || null,
          }))
        }))
      };

      const formData = new FormData();
      // Menggunakan key "surveyData" sesuai req.body.surveyData di Backend
      formData.append('surveyData', JSON.stringify(surveyDataPayload));

      // 2. Append file foto per area dengan index yang tepat (photo_0, photo_1)
      areas.forEach((area, index) => {
        if (area.photo) {
          formData.append(`photo_${index}`, area.photo);
        }
      });

      const res = await fetch(`${API_BASE}/projects/${projectId}/surveys`, {
        method: 'POST',
        // Biarkan browser yang set header boundary form-data
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Gagal menyimpan survey.');
      }

      alert('Laporan Survey berhasil disimpan!');
      
      // Reset form
      setForm({ surveyDate: new Date().toISOString().slice(0, 10), surveyorName: '', notes: '' });
      setAreas([emptyArea()]);
      onSaved?.();

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-form">
      <h2 className="survey-form-title" style={{ color: '#d4af6a', marginBottom: '20px' }}>Input Laporan Survey</h2>

      {/* --- DATA UTAMA SURVEY --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <label className="survey-form-label">
          Tanggal Survey
          <input
            type="date"
            className="survey-form-input"
            value={form.surveyDate}
            onChange={(e) => updateForm({ surveyDate: e.target.value })}
          />
        </label>

        <label className="survey-form-label">
          Nama Surveyor
          <input
            className="survey-form-input"
            placeholder="mis. Trio Adhi"
            value={form.surveyorName}
            onChange={(e) => updateForm({ surveyorName: e.target.value })}
          />
        </label>
      </div>

      <label className="survey-form-label" style={{ marginBottom: '30px' }}>
        Catatan Umum (Opsional)
        <textarea
          className="survey-form-input survey-form-textarea"
          rows={2}
          placeholder="Catatan keseluruhan project..."
          value={form.notes}
          onChange={(e) => updateForm({ notes: e.target.value })}
        />
      </label>

      {/* --- LOOPING DATA AREA --- */}
      <h3 style={{ color: '#ece3d2', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Daftar Area Pekerjaan</h3>
      
      {areas.map((area, aIndex) => (
        <div key={aIndex} style={{ background: '#1c1a17', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #333' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#d4af6a' }}>Area #{aIndex + 1}</h4>
            {areas.length > 1 && (
              <button type="button" onClick={() => removeArea(aIndex)} style={{ background: 'none', border: 'none', color: '#c96b62', cursor: 'pointer', fontSize: '14px' }}>
                Hapus Area
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label className="survey-form-label">
              Nama Area / Ruangan
              <input
                className="survey-form-input"
                placeholder="mis. Ruang Tamu Utama"
                value={area.areaName}
                onChange={(e) => updateArea(aIndex, { areaName: e.target.value })}
              />
            </label>
            <label className="survey-form-label">
              Foto Area (1 Foto Utama)
              <input
                type="file"
                accept="image/*"
                className="survey-form-input"
                onChange={(e) => handlePhotoChange(aIndex, e.target.files[0])}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <label className="survey-form-label">
              Analisa Kerusakan/Kondisi
              <textarea className="survey-form-input" rows={2} value={area.analisa} onChange={(e) => updateArea(aIndex, { analisa: e.target.value })} />
            </label>
            <label className="survey-form-label">
              Rencana Penanganan
              <textarea className="survey-form-input" rows={2} value={area.penanganan} onChange={(e) => updateArea(aIndex, { penanganan: e.target.value })} />
            </label>
            <label className="survey-form-label">
              Informasi Tambahan
              <textarea className="survey-form-input" rows={2} value={area.informasiTambahan} onChange={(e) => updateArea(aIndex, { informasiTambahan: e.target.value })} />
            </label>
          </div>

          {/* --- LOOPING DIMENSI PER AREA --- */}
          <div style={{ marginTop: '15px', padding: '10px', background: '#111', borderRadius: '4px' }}>
            <span style={{ fontSize: '12px', color: '#8f8672', display: 'block', marginBottom: '10px' }}>Rincian Dimensi / Volume Lapangan:</span>
            
            {area.dimensions.map((dim, dIndex) => (
              <div key={dIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input className="survey-form-input" style={{ flex: 2 }} placeholder="Keterangan (Sisi A, dll)" value={dim.keterangan} onChange={(e) => updateDimension(aIndex, dIndex, { keterangan: e.target.value })} />
                <input type="number" className="survey-form-input" style={{ flex: 1 }} placeholder="P (m)" value={dim.panjang} onChange={(e) => updateDimension(aIndex, dIndex, { panjang: e.target.value })} />
                <input type="number" className="survey-form-input" style={{ flex: 1 }} placeholder="L (m)" value={dim.lebar} onChange={(e) => updateDimension(aIndex, dIndex, { lebar: e.target.value })} />
                <input type="number" className="survey-form-input" style={{ flex: 1 }} placeholder="T (m)" value={dim.tinggi} onChange={(e) => updateDimension(aIndex, dIndex, { tinggi: e.target.value })} />
                <input type="number" className="survey-form-input" style={{ flex: 1 }} placeholder="Luas (m2)" value={dim.luasan} onChange={(e) => updateDimension(aIndex, dIndex, { luasan: e.target.value })} />
                
                <button type="button" onClick={() => removeDimension(aIndex, dIndex)} disabled={area.dimensions.length === 1} style={{ background: 'none', border: 'none', color: '#c96b62', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }}>
                  &times;
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addDimension(aIndex)} style={{ background: 'none', border: '1px dashed #d4af6a', color: '#d4af6a', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '3px', marginTop: '5px' }}>
              + Tambah Baris Dimensi
            </button>
          </div>

        </div>
      ))}

      <button type="button" onClick={addArea} style={{ background: 'transparent', border: '1px solid #7fae6e', color: '#7fae6e', padding: '10px', width: '100%', borderRadius: '4px', cursor: 'pointer', marginBottom: '25px', fontWeight: 'bold' }}>
        + Tambah Area / Ruangan Baru
      </button>

      {error && <p className="survey-form-error" style={{ color: '#c96b62', marginBottom: '15px' }}>{error}</p>}

      <button 
        className="survey-form-submit" 
        onClick={handleSubmit} 
        disabled={submitting}
        style={{ background: '#d4af6a', color: '#000', padding: '12px 20px', width: '100%', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? 'Menyimpan Laporan...' : 'SIMPAN LAPORAN SURVEY'}
      </button>
    </div>
  );
}