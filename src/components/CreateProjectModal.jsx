import { useState, useEffect } from "react";
import "../styles/CreateProjectModal.css";
import { X } from "lucide-react";

const API_BASE = "http://localhost:4000/api";

const CreateProjectModal = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");

  // ==========================================================
  // DISCIPLINE
  // ==========================================================

  const [selectedDiscipline, setSelectedDiscipline] =
    useState("");

  // ==========================================================
  // HSPK
  // ==========================================================

  const [selectedComboIndex, setSelectedComboIndex] =
    useState("");

  const [hspkOptions, setHspkOptions] = useState([]);
  const [hspkLoading, setHspkLoading] = useState(true);

  // ==========================================================
  // FETCH HSPK
  // ==========================================================

  useEffect(() => {
    const fetchHspk = async () => {
      setHspkLoading(true);

      try {
        const res = await fetch(
          `${API_BASE}/hspk/available-combos`
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch HSPK data: ${res.status}`
          );
        }

        const result = await res.json();

        setHspkOptions(
          Array.isArray(result) ? result : []
        );
      } catch (err) {
        console.error("Gagal mengambil data HSPK:", err);
        setHspkOptions([]);
      } finally {
        setHspkLoading(false);
      }
    };

    if (isOpen) {
      fetchHspk();
    }
  }, [isOpen]);

  // ==========================================================
  // FILTER HSPK BERDASARKAN DISCIPLINE
  // ==========================================================

  const filteredHspkOptions = hspkOptions.filter((combo) => {
    if (!selectedDiscipline) {
      return false;
    }

    return (
      combo.discipline?.toUpperCase() ===
      selectedDiscipline.toUpperCase()
    );
  });

  // ==========================================================
  // DISCIPLINE CHANGE
  // ==========================================================

  const handleDisciplineChange = (e) => {
    const value = e.target.value;

    setSelectedDiscipline(value);

    // Reset pilihan HSPK
    setSelectedComboIndex("");
  };

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setProjectName("");
    setClient("");
    setLocation("");
    setSelectedDiscipline("");
    setSelectedComboIndex("");
  };

  // ==========================================================
  // SUBMIT CREATE PROJECT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ambil combo HSPK berdasarkan index hasil filter
    const selectedCombo =
      filteredHspkOptions[Number(selectedComboIndex)];

    // Validasi HSPK
    if (!selectedCombo?.period) {
      alert("Pilih data HSPK terlebih dahulu.");
      return;
    }

    // Validasi field
    if (
      !projectName.trim() ||
      !client.trim() ||
      !location.trim()
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName.trim(),

            clientName: client.trim(),

            location: location.trim(),

            hspkPeriod: selectedCombo.period,

            discipline: selectedCombo.discipline,

            grade: selectedCombo.grade,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Gagal membuat project."
        );
      }

      alert("Project berhasil dibuat!");

      // Reset form
      resetForm();

      // Refresh project di Dashboard
      if (onProjectCreated) {
        await onProjectCreated();
      }

      // Tutup modal
      onClose();
    } catch (err) {
      console.error("Error create project:", err);

      alert(
        err.message ||
          "Gagal membuat project."
      );
    }
  };

  // ==========================================================
  // JANGAN RENDER KALAU MODAL TIDAK AKTIF
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="modal-overlay">

      <div className="modal-content">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="modal-header">

          <h3>Create New Project</h3>

          <button
            className="close-btn"
            type="button"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>

        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >

          <div className="card">

            <h2>Basic Information</h2>

            <div className="grid">

              {/* ==================================================
                  PROJECT NAME
              ================================================== */}

              <div className="form-group">

                <label>
                  Project Name
                </label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  placeholder="Nama project"
                  required
                />

              </div>

              {/* ==================================================
                  CLIENT
              ================================================== */}

              <div className="form-group">

                <label>
                  Client Name
                </label>

                <input
                  type="text"
                  value={client}
                  onChange={(e) =>
                    setClient(e.target.value)
                  }
                  placeholder="Nama client"
                  required
                />

              </div>

              {/* ==================================================
                  LOCATION
              ================================================== */}

              <div className="form-group full">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder="Lokasi project"
                  required
                />

              </div>

              {/* ==================================================
                  DISCIPLINE
              ================================================== */}

              <div className="form-group full">

                <label>
                  Kategori Pekerjaan
                </label>

                <select
                  value={selectedDiscipline}
                  onChange={handleDisciplineChange}
                  required
                >

                  <option value="" disabled>
                    -- Pilih Kategori --
                  </option>

                  <option value="SIPIL">
                    Sipil
                  </option>

                  <option value="INTERIOR">
                    Interior
                  </option>

                </select>

              </div>

              {/* ==================================================
                  HSPK
              ================================================== */}

              <div className="form-group full">

                <label>
                  Pilih Data HSPK
                </label>

                <select
                  value={selectedComboIndex}
                  onChange={(e) =>
                    setSelectedComboIndex(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    !selectedDiscipline ||
                    hspkLoading
                  }
                >

                  <option value="" disabled>

                    {hspkLoading
                      ? "-- Memuat data HSPK --"
                      : !selectedDiscipline
                      ? "-- Pilih kategori pekerjaan dulu --"
                      : "-- Pilih data HSPK --"}

                  </option>

                  {filteredHspkOptions.map(
                    (combo, index) => (
                      <option
                        key={`${combo.period}-${combo.discipline}-${combo.grade}-${index}`}
                        value={index}
                      >
                        {combo.period} —{" "}
                        {combo.discipline} — Grade{" "}
                        {combo.grade}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="actions">

            <button
              type="button"
              className="cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create"
            >
              Create Project
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateProjectModal;