import { useState, useEffect } from "react";
import "../styles/CreateProjectModal.css";
import { X } from "lucide-react";

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [selectedComboIndex, setSelectedComboIndex] = useState("");
  const [hspkOptions, setHspkOptions] = useState([]);
  const [hspkLoading, setHspkLoading] = useState(true);

  // Combos have no id field, just period/discipline/grade - selection is
  // tracked by array position, resolved back to the real combo on submit.
  useEffect(() => {
    const fetchHspk = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/hspk/available-combos");
        if (!res.ok) throw new Error("Failed to fetch HSPK data");
        const result = await res.json();
        setHspkOptions(result);
      } catch (err) {
        console.error(err);
        setHspkOptions([]);
      } finally {
        setHspkLoading(false);
      }
    };
    fetchHspk();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedCombo = hspkOptions[Number(selectedComboIndex)];

    if (!selectedCombo?.period) {
      alert('Pilih data HSPK dulu.');
      return;
    }
    if (!projectName.trim() || !location.trim() || !client.trim()) {
      alert('Semua field wajib diisi.');
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName.trim(),
          clientName: client.trim(),
          location: location.trim(),
          hspkPeriod: selectedCombo?.period,
          discipline: selectedCombo?.discipline,
          grade: selectedCombo?.grade,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      alert("Project berhasil dibuat!");

      setProjectName("");
      setClient("");
      setLocation("");
      setSelectedComboIndex("");

      if (onProjectCreated) {
        onProjectCreated();
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert("Gagal membuat project");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="close-btn" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="card">
            <h2>Basic Information</h2>
            <div className="grid">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full">
                <label>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full">
                <label htmlFor="hspkCombo">Pilih Data HSPK</label>
                <select
                  id="hspkCombo"
                  value={selectedComboIndex}
                  onChange={(e) => setSelectedComboIndex(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {hspkLoading ? "-- memuat --" : "-- pilih --"}
                  </option>
                  {hspkOptions.map((combo, index) => (
                    <option key={index} value={index}>
                      {combo.period} — {combo.discipline} — Grade {combo.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;