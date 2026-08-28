import { useState, useEffect } from "react";
import "../styles/SurveyForm.css";

const API_BASE = "http://localhost:4000/api";
const IMAGE_BASE_URL = "http://localhost:4000";

const MAX_PHOTOS_PER_AREA = 20;

// ==========================================================
// HELPER API CRUD SURVEY
// Bisa dipakai oleh App.jsx / komponen lain
// ==========================================================

export const fetchSurveyById = async (
  projectId,
  surveyId
) => {
  if (!projectId || !surveyId) {
    throw new Error(
      "Project ID dan Survey ID wajib tersedia."
    );
  }

  const response = await fetch(
    `${API_BASE}/projects/${projectId}/surveys`
  );

  const result =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        "Gagal mengambil data survey."
    );
  }

  const surveys = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
    ? result.data
    : [];

  const survey = surveys.find(
    (item) =>
      String(item.id) ===
      String(surveyId)
  );

  if (!survey) {
    throw new Error(
      "Data survey tidak ditemukan."
    );
  }

  return survey;
};

// ==========================================================
// DELETE SURVEY
// ==========================================================

export const deleteSurvey = async (
  surveyId
) => {
  if (!surveyId) {
    throw new Error(
      "Survey ID wajib tersedia."
    );
  }

  const confirmed = window.confirm(
    "Apakah Anda yakin ingin menghapus laporan survey ini?\n\nSemua data area, dimensi, dan foto akan dihapus secara permanen."
  );

  if (!confirmed) {
    return {
      cancelled: true,
    };
  }

  const response = await fetch(
    `${API_BASE}/surveys/${surveyId}`,
    {
      method: "DELETE",
    }
  );

  const result =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Gagal menghapus survey."
    );
  }

  return {
    cancelled: false,
    data: result,
  };
};

// ==========================================================
// UPDATE SURVEY
// ==========================================================

export const updateSurvey = async (
  surveyId,
  formData
) => {
  if (!surveyId) {
    throw new Error(
      "Survey ID wajib tersedia."
    );
  }

  const response = await fetch(
    `${API_BASE}/surveys/${surveyId}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  const result =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Gagal memperbarui survey."
    );
  }

  return result;
};

// ==========================================================
// CREATE SURVEY
// ==========================================================

export const createSurvey = async (
  projectId,
  formData
) => {
  if (!projectId) {
    throw new Error(
      "Project ID wajib tersedia."
    );
  }

  const response = await fetch(
    `${API_BASE}/projects/${projectId}/surveys`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Gagal membuat survey."
    );
  }

  return result;
};

// ==========================================================
// EMPTY DIMENSION
// ==========================================================

const emptyDimension = () => ({
  keterangan: "",
  panjang: "",
  lebar: "",
  tinggi: "",
  luasan: "",
});

// ==========================================================
// EMPTY AREA
// ==========================================================

const emptyArea = () => ({
  areaName: "",
  analisa: "",
  penanganan: "",
  informasiTambahan: "",
  photoCaption: "",

  // Foto baru
  photos: [],

  // Preview foto baru
  previewUrls: [],

  // Foto lama dari database
  existingPhotoUrls: [],

  // Dimensi
  dimensions: [
    emptyDimension(),
  ],
});

// ==========================================================
// INITIAL FORM
// ==========================================================

const createInitialForm = () => ({
  surveyDate:
    new Date()
      .toISOString()
      .slice(0, 10),

  surveyorName: "",

  notes: "",
});

// ==========================================================
// COMPONENT
// ==========================================================

export default function SurveyForm({
  projectId,
  surveyIdToEdit = null,
  onSaved,
  onDeleted,
  onCancel,
}) {
  const [form, setForm] =
    useState(
      createInitialForm()
    );

  const [areas, setAreas] =
    useState([
      emptyArea(),
    ]);

  const [submitting, setSubmitting] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [loadingEdit, setLoadingEdit] =
    useState(false);

  const [error, setError] =
    useState(null);

  // ==========================================================
  // MODE
  // ==========================================================

  const isEditMode =
    !!surveyIdToEdit;

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    areas.forEach((area) => {
      area.previewUrls?.forEach(
        (url) => {
          URL.revokeObjectURL(
            url
          );
        }
      );
    });

    setForm(
      createInitialForm()
    );

    setAreas([
      emptyArea(),
    ]);

    setError(null);
  };

  // ==========================================================
  // LOAD DATA EDIT
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadEditData = async () => {
      if (
        !surveyIdToEdit ||
        !projectId
      ) {
        return;
      }

      setLoadingEdit(true);
      setError(null);

      try {
        const targetSurvey =
          await fetchSurveyById(
            projectId,
            surveyIdToEdit
          );

        if (cancelled) {
          return;
        }

        // ------------------------------------------
        // FORM UTAMA
        // ------------------------------------------

        setForm({
          surveyDate:
            targetSurvey.surveyDate
              ? new Date(
                  targetSurvey.surveyDate
                )
                  .toISOString()
                  .slice(0, 10)
              : "",

          surveyorName:
            targetSurvey.surveyorName ||
            "",

          notes:
            targetSurvey.notes ||
            "",
        });

        // ------------------------------------------
        // AREA
        // ------------------------------------------

        if (
          Array.isArray(
            targetSurvey.areas
          ) &&
          targetSurvey.areas.length >
            0
        ) {
          const loadedAreas =
            targetSurvey.areas.map(
              (area) => ({
                areaName:
                  area.areaName ||
                  "",

                analisa:
                  area.analisa ||
                  "",

                penanganan:
                  area.penanganan ||
                  "",

                informasiTambahan:
                  area.informasiTambahan ||
                  "",

                photoCaption:
                  area.photoCaption ||
                  "",

                photos: [],

                previewUrls: [],

                existingPhotoUrls:
                  Array.isArray(
                    area.photos
                  )
                    ? area.photos.map(
                        (photo) =>
                          photo.url
                      )
                    : [],

                dimensions:
                  Array.isArray(
                    area.dimensions
                  ) &&
                  area.dimensions
                    .length > 0
                    ? area.dimensions.map(
                        (
                          dimension
                        ) => ({
                          keterangan:
                            dimension.keterangan ||
                            "",

                          panjang:
                            dimension.panjang ??
                            "",

                          lebar:
                            dimension.lebar ??
                            "",

                          tinggi:
                            dimension.tinggi ??
                            "",

                          luasan:
                            dimension.luasan ??
                            "",
                        })
                      )
                    : [
                        emptyDimension(),
                      ],
              })
            );

          setAreas(
            loadedAreas
          );
        } else {
          setAreas([
            emptyArea(),
          ]);
        }
      } catch (err) {
        console.error(
          "Gagal load survey edit:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Gagal mengambil data survey."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEdit(false);
        }
      }
    };

    loadEditData();

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    surveyIdToEdit,
  ]);

  // ==========================================================
  // CLEANUP OBJECT URL
  // ==========================================================

  useEffect(() => {
    return () => {
      areas.forEach((area) => {
        area.previewUrls?.forEach(
          (url) => {
            URL.revokeObjectURL(
              url
            );
          }
        );
      });
    };

    // Hanya saat unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  const updateForm = (
    patch
  ) => {
    setForm((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  // ==========================================================
  // AREA
  // ==========================================================

  const addArea = () => {
    setAreas((prev) => [
      ...prev,
      emptyArea(),
    ]);
  };

  const removeArea = (
    index
  ) => {
    const area =
      areas[index];

    area?.previewUrls?.forEach(
      (url) => {
        URL.revokeObjectURL(
          url
        );
      }
    );

    setAreas((prev) =>
      prev.filter(
        (_, i) =>
          i !== index
      )
    );
  };

  const updateArea = (
    index,
    patch
  ) => {
    setAreas((prev) =>
      prev.map(
        (area, i) =>
          i === index
            ? {
                ...area,
                ...patch,
              }
            : area
      )
    );
  };

  // ==========================================================
  // FOTO BARU
  // ==========================================================

  const handlePhotosChange = (
    index,
    files
  ) => {
    const area =
      areas[index];

    if (!area) {
      return;
    }

    const existingCount =
      (
        area.existingPhotoUrls ||
        []
      ).length;

    const availableSlots =
      Math.max(
        0,
        MAX_PHOTOS_PER_AREA -
          existingCount
      );

    const selectedFiles =
      Array.from(
        files || []
      )
        .filter((file) =>
          file.type.startsWith(
            "image/"
          )
        )
        .slice(
          0,
          availableSlots
        );

    area.previewUrls?.forEach(
      (url) => {
        URL.revokeObjectURL(
          url
        );
      }
    );

    const previews =
      selectedFiles.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    updateArea(index, {
      photos:
        selectedFiles,

      previewUrls:
        previews,
    });
  };

  const removePhoto = (
    areaIndex,
    photoIndex
  ) => {
    const area =
      areas[areaIndex];

    if (!area) {
      return;
    }

    const preview =
      area.previewUrls?.[
        photoIndex
      ];

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    updateArea(
      areaIndex,
      {
        photos:
          area.photos.filter(
            (_, index) =>
              index !==
              photoIndex
          ),

        previewUrls:
          area.previewUrls.filter(
            (_, index) =>
              index !==
              photoIndex
          ),
      }
    );
  };

  // ==========================================================
  // FOTO LAMA
  //
  // Hanya menghapus dari daftar
  // foto yang ingin dipertahankan.
  //
  // Saat PUT, existingPhotoUrls
  // dikirim ke backend.
  // ==========================================================

  const removeExistingPhoto = (
    areaIndex,
    photoIndex
  ) => {
    const area =
      areas[areaIndex];

    if (!area) {
      return;
    }

    updateArea(
      areaIndex,
      {
        existingPhotoUrls:
          area.existingPhotoUrls.filter(
            (_, index) =>
              index !==
              photoIndex
          ),
      }
    );
  };

  // ==========================================================
  // DIMENSI
  // ==========================================================

  const addDimension = (
    areaIndex
  ) => {
    setAreas((prev) =>
      prev.map(
        (area, index) => {
          if (
            index !==
            areaIndex
          ) {
            return area;
          }

          return {
            ...area,

            dimensions: [
              ...area.dimensions,

              emptyDimension(),
            ],
          };
        }
      )
    );
  };

  const removeDimension = (
    areaIndex,
    dimensionIndex
  ) => {
    setAreas((prev) =>
      prev.map(
        (area, index) => {
          if (
            index !==
            areaIndex
          ) {
            return area;
          }

          // Minimal satu baris
          if (
            area.dimensions
              .length <= 1
          ) {
            return area;
          }

          return {
            ...area,

            dimensions:
              area.dimensions.filter(
                (
                  _,
                  currentIndex
                ) =>
                  currentIndex !==
                  dimensionIndex
              ),
          };
        }
      )
    );
  };

  const updateDimension = (
    areaIndex,
    dimensionIndex,
    patch
  ) => {
    setAreas((prev) =>
      prev.map(
        (area, index) => {
          if (
            index !==
            areaIndex
          ) {
            return area;
          }

          return {
            ...area,

            dimensions:
              area.dimensions.map(
                (
                  dimension,
                  currentIndex
                ) =>
                  currentIndex ===
                  dimensionIndex
                    ? {
                        ...dimension,
                        ...patch,
                      }
                    : dimension
              ),
          };
        }
      )
    );
  };

  // ==========================================================
  // BUILD FORMDATA
  // ==========================================================

  const buildFormData = () => {
    const validAreas =
      areas.filter(
        (area) =>
          area.areaName.trim() !==
          ""
      );

    const formatNum = (
      value
    ) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return null;
      }

      const parsed =
        Number(
          String(value).replace(
            ",",
            "."
          )
        );

      return Number.isNaN(
        parsed
      )
        ? null
        : parsed;
    };

    const surveyDataPayload = {
      surveyDate:
        form.surveyDate,

      surveyorName:
        form.surveyorName.trim(),

      notes:
        form.notes.trim() ||
        null,

      areas:
        validAreas.map(
          (area) => {
            const validDimensions =
              area.dimensions.filter(
                (dimension) =>
                  dimension.keterangan.trim() !==
                    "" ||
                  dimension.panjang !==
                    "" ||
                  dimension.lebar !==
                    "" ||
                  dimension.tinggi !==
                    "" ||
                  dimension.luasan !==
                    ""
              );

            return {
              areaName:
                area.areaName.trim(),

              analisa:
                area.analisa.trim() ||
                null,

              penanganan:
                area.penanganan.trim() ||
                null,

              informasiTambahan:
                area.informasiTambahan.trim() ||
                null,

              photoCaption:
                area.photoCaption.trim() ||
                null,

              // Penting untuk mode edit
              existingPhotoUrls:
                area.existingPhotoUrls ||
                [],

              dimensions:
                validDimensions.map(
                  (dimension) => ({
                    keterangan:
                      dimension.keterangan.trim() ||
                      null,

                    panjang:
                      formatNum(
                        dimension.panjang
                      ),

                    lebar:
                      formatNum(
                        dimension.lebar
                      ),

                    tinggi:
                      formatNum(
                        dimension.tinggi
                      ),

                    luasan:
                      formatNum(
                        dimension.luasan
                      ),
                  })
                ),
            };
          }
        ),
    };

    const formData =
      new FormData();

    formData.append(
      "surveyData",
      JSON.stringify(
        surveyDataPayload
      )
    );

    // Foto baru
    validAreas.forEach(
      (area, areaIndex) => {
        area.photos.forEach(
          (
            file,
            photoIndex
          ) => {
            formData.append(
              `photo_${areaIndex}_${photoIndex}`,
              file
            );
          }
        );
      }
    );

    return formData;
  };

  // ==========================================================
  // SUBMIT
  // CREATE / UPDATE
  // ==========================================================

  const handleSubmit = async () => {
    if (
      !form.surveyDate ||
      !form.surveyorName.trim()
    ) {
      setError(
        "Tanggal survey dan Nama Surveyor wajib diisi."
      );

      return;
    }

    const validAreas =
      areas.filter(
        (area) =>
          area.areaName.trim() !==
          ""
      );

    if (
      validAreas.length ===
      0
    ) {
      setError(
        "Minimal isi satu nama Area."
      );

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData =
        buildFormData();

      let result;

      if (isEditMode) {
        result =
          await updateSurvey(
            surveyIdToEdit,
            formData
          );
      } else {
        result =
          await createSurvey(
            projectId,
            formData
          );
      }

      alert(
        isEditMode
          ? "Laporan Survey berhasil diperbarui!"
          : "Laporan Survey berhasil disimpan!"
      );

      resetForm();

      onSaved?.(
        result?.data?.id ||
          surveyIdToEdit ||
          null
      );
    } catch (err) {
      console.error(
        "Error submit survey:",
        err
      );

      setError(
        err.message ||
          "Terjadi kesalahan saat menyimpan survey."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // DELETE DARI FORM
  //
  // Ini tersedia sebagai fungsi CRUD,
  // tetapi tombol utama Delete tetap
  // bisa dikendalikan dari SurveyPage/App.
  // ==========================================================

  const handleDeleteSurvey =
    async () => {
      if (!isEditMode) {
        return;
      }

      setDeleting(true);
      setError(null);

      try {
        const result =
          await deleteSurvey(
            surveyIdToEdit
          );

        if (
          result?.cancelled
        ) {
          return;
        }

        alert(
          "Laporan Survey berhasil dihapus."
        );

        resetForm();

        onDeleted?.(
          surveyIdToEdit
        );
      } catch (err) {
        console.error(
          "Error delete survey:",
          err
        );

        setError(
          err.message ||
            "Gagal menghapus survey."
        );
      } finally {
        setDeleting(false);
      }
    };

  // ==========================================================
  // LOADING EDIT
  // ==========================================================

  if (
    loadingEdit
  ) {
    return (
      <div className="survey-form">

        <div className="survey-form-loading">
          Memuat data survey
          untuk diedit...
        </div>

      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="survey-form">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="survey-form-header">

        <div>
          <h2 className="survey-form-title">
            {isEditMode
              ? "Edit Laporan Survey Lapangan"
              : "Input Laporan Survey Lapangan"}
          </h2>

          <p className="survey-form-mode">
            {isEditMode
              ? "Mode Edit"
              : "Mode Input Baru"}
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            className="survey-form-cancel-top"
            onClick={
              onCancel
            }
          >
            Kembali
          </button>
        )}

      </div>

      {/* ==================================================
          DATA UTAMA
      ================================================== */}

      <div className="survey-main-grid">

        <label className="survey-form-label">
          Tanggal Survey

          <input
            type="date"
            className="survey-form-input"
            value={
              form.surveyDate
            }
            onChange={(e) =>
              updateForm({
                surveyDate:
                  e.target
                    .value,
              })
            }
          />
        </label>

        <label className="survey-form-label">
          Nama Surveyor

          <input
            className="survey-form-input"
            value={
              form.surveyorName
            }
            onChange={(e) =>
              updateForm({
                surveyorName:
                  e.target
                    .value,
              })
            }
          />
        </label>

      </div>

      <label className="survey-form-label survey-general-notes">
        Catatan Umum

        <textarea
          className="survey-form-input survey-form-textarea"
          rows={2}
          value={
            form.notes
          }
          onChange={(e) =>
            updateForm({
              notes:
                e.target
                  .value,
            })
          }
        />
      </label>

      {/* ==================================================
          AREA
      ================================================== */}

      <h3 className="survey-area-title">
        Daftar Area Pekerjaan
      </h3>

      {areas.map(
        (
          area,
          areaIndex
        ) => {
          const totalPhotos =
            (
              area.photos
                ?.length ||
              0
            ) +
            (
              area
                .existingPhotoUrls
                ?.length ||
              0
            );

          return (
            <div
              key={
                areaIndex
              }
              className="survey-area-form-card"
            >

              {/* AREA HEADER */}

              <div className="survey-area-header">

                <h4>
                  Area #
                  {areaIndex +
                    1}
                </h4>

                {areas.length >
                  1 && (
                  <button
                    type="button"
                    className="survey-delete-area-button"
                    onClick={() =>
                      removeArea(
                        areaIndex
                      )
                    }
                  >
                    Hapus Area
                  </button>
                )}

              </div>

              {/* NAMA + FOTO */}

              <div className="survey-area-input-grid">

                <label className="survey-form-label">
                  Nama Area /
                  Ruangan

                  <input
                    className="survey-form-input"
                    value={
                      area.areaName
                    }
                    onChange={(
                      e
                    ) =>
                      updateArea(
                        areaIndex,
                        {
                          areaName:
                            e.target
                              .value,
                        }
                      )
                    }
                  />
                </label>

                <label className="survey-form-label">
                  Foto Area
                  (Maks{" "}
                  {
                    MAX_PHOTOS_PER_AREA
                  })

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="survey-form-input"
                    onChange={(
                      e
                    ) =>
                      handlePhotosChange(
                        areaIndex,
                        e.target
                          .files
                      )
                    }
                    disabled={
                      totalPhotos >=
                      MAX_PHOTOS_PER_AREA
                    }
                  />

                  <span
                    className={`survey-photo-count ${
                      totalPhotos >=
                      MAX_PHOTOS_PER_AREA
                        ? "is-full"
                        : ""
                    }`}
                  >
                    {totalPhotos >
                    0
                      ? `✓ Total ${totalPhotos} foto`
                      : "Belum ada foto"}
                  </span>

                </label>

              </div>

              {/* FOTO PREVIEW */}

              {(area
                .existingPhotoUrls
                ?.length >
                0 ||
                area.previewUrls
                  ?.length >
                  0) && (
                <div className="survey-photo-preview-list">

                  {/* FOTO LAMA */}

                  {area.existingPhotoUrls?.map(
                    (
                      url,
                      index
                    ) => (
                      <div
                        key={`existing-${index}`}
                        className="survey-photo-preview-item is-existing"
                      >

                        <img
                          src={`${IMAGE_BASE_URL}${url}`}
                          alt={`Foto Lama ${
                            index +
                            1
                          }`}
                        />

                        <button
                          type="button"
                          className="survey-photo-delete"
                          onClick={() =>
                            removeExistingPhoto(
                              areaIndex,
                              index
                            )
                          }
                        >
                          ×
                        </button>

                        <span>
                          Lama{" "}
                          {index +
                            1}
                        </span>

                      </div>
                    )
                  )}

                  {/* FOTO BARU */}

                  {area.previewUrls?.map(
                    (
                      url,
                      index
                    ) => (
                      <div
                        key={`new-${index}`}
                        className="survey-photo-preview-item"
                      >

                        <img
                          src={url}
                          alt={`Foto Baru ${
                            index +
                            1
                          }`}
                        />

                        <button
                          type="button"
                          className="survey-photo-delete"
                          onClick={() =>
                            removePhoto(
                              areaIndex,
                              index
                            )
                          }
                        >
                          ×
                        </button>

                        <span>
                          Baru{" "}
                          {index +
                            1}
                        </span>

                      </div>
                    )
                  )}

                </div>
              )}

              {/* CAPTION */}

              <label className="survey-form-label survey-caption-field">
                Caption / Judul
                Foto

                <input
                  className="survey-form-input"
                  value={
                    area.photoCaption
                  }
                  onChange={(e) =>
                    updateArea(
                      areaIndex,
                      {
                        photoCaption:
                          e.target
                            .value,
                      }
                    )
                  }
                />
              </label>

              {/* ANALISA */}

              <div className="survey-analysis-grid">

                <label className="survey-form-label">
                  Analisa

                  <textarea
                    className="survey-form-input"
                    rows={3}
                    value={
                      area.analisa
                    }
                    onChange={(
                      e
                    ) =>
                      updateArea(
                        areaIndex,
                        {
                          analisa:
                            e.target
                              .value,
                        }
                      )
                    }
                  />
                </label>

                <label className="survey-form-label">
                  Rencana
                  Penanganan

                  <textarea
                    className="survey-form-input"
                    rows={3}
                    value={
                      area.penanganan
                    }
                    onChange={(
                      e
                    ) =>
                      updateArea(
                        areaIndex,
                        {
                          penanganan:
                            e.target
                              .value,
                        }
                      )
                    }
                  />
                </label>

                <label className="survey-form-label">
                  Informasi
                  Tambahan

                  <textarea
                    className="survey-form-input"
                    rows={3}
                    value={
                      area.informasiTambahan
                    }
                    onChange={(
                      e
                    ) =>
                      updateArea(
                        areaIndex,
                        {
                          informasiTambahan:
                            e.target
                              .value,
                        }
                      )
                    }
                  />
                </label>

              </div>

              {/* DIMENSI */}

              <div className="survey-dimension-box">

                <span className="survey-dimension-title">
                  Rincian Dimensi /
                  Volume Lapangan
                </span>

                {area.dimensions.map(
                  (
                    dimension,
                    dimensionIndex
                  ) => (

                    <div
                      key={
                        dimensionIndex
                      }
                      className="survey-dimension-row"
                    >

                      <input
                        className="survey-form-input"
                        placeholder="Keterangan"
                        value={
                          dimension.keterangan
                        }
                        onChange={(
                          e
                        ) =>
                          updateDimension(
                            areaIndex,
                            dimensionIndex,
                            {
                              keterangan:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        type="number"
                        className="survey-form-input"
                        placeholder="P"
                        value={
                          dimension.panjang
                        }
                        onChange={(
                          e
                        ) =>
                          updateDimension(
                            areaIndex,
                            dimensionIndex,
                            {
                              panjang:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        type="number"
                        className="survey-form-input"
                        placeholder="L"
                        value={
                          dimension.lebar
                        }
                        onChange={(
                          e
                        ) =>
                          updateDimension(
                            areaIndex,
                            dimensionIndex,
                            {
                              lebar:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        type="number"
                        className="survey-form-input"
                        placeholder="T"
                        value={
                          dimension.tinggi
                        }
                        onChange={(
                          e
                        ) =>
                          updateDimension(
                            areaIndex,
                            dimensionIndex,
                            {
                              tinggi:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        type="number"
                        className="survey-form-input"
                        placeholder="Luas"
                        value={
                          dimension.luasan
                        }
                        onChange={(
                          e
                        ) =>
                          updateDimension(
                            areaIndex,
                            dimensionIndex,
                            {
                              luasan:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <button
                        type="button"
                        className="survey-delete-dimension-button"
                        onClick={() =>
                          removeDimension(
                            areaIndex,
                            dimensionIndex
                          )
                        }
                        disabled={
                          area
                            .dimensions
                            .length <=
                          1
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

                <button
                  type="button"
                  className="survey-add-dimension-button"
                  onClick={() =>
                    addDimension(
                      areaIndex
                    )
                  }
                >
                  + Tambah Baris
                  Dimensi
                </button>

              </div>

            </div>
          );
        }
      )}

      {/* ==================================================
          ADD AREA
      ================================================== */}

      <button
        type="button"
        className="survey-add-area-button"
        onClick={addArea}
      >
        + Tambah Area /
        Ruangan Baru
      </button>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <p className="survey-form-error">
          {error}
        </p>
      )}

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="survey-form-actions">

        {onCancel && (
          <button
            type="button"
            className="survey-form-cancel-button"
            onClick={
              onCancel
            }
            disabled={
              submitting ||
              deleting
            }
          >
            Batal
          </button>
        )}

        {isEditMode && (
          <button
            type="button"
            className="survey-form-delete-button"
            onClick={
              handleDeleteSurvey
            }
            disabled={
              submitting ||
              deleting
            }
          >
            {deleting
              ? "Menghapus..."
              : "Hapus Survey"}
          </button>
        )}

        <button
          type="button"
          className="survey-form-submit"
          onClick={
            handleSubmit
          }
          disabled={
            submitting ||
            deleting
          }
        >
          {submitting
            ? "Memproses..."
            : isEditMode
            ? "UPDATE LAPORAN SURVEY"
            : "SIMPAN LAPORAN SURVEY"}
        </button>

      </div>

    </div>
  );
}