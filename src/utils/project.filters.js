// src/utils/projectFilters.js
// ============================================================
// UTILITY TERPUSAT — Filter project berdasarkan kelengkapan data
//
// Dipakai di: Bv.jsx, Rab.jsx, TimeSchedule.jsx, JoinOpname.jsx
//
// Mendukung berbagai bentuk response API:
//   - field boolean  : hasSurvey
//   - relasi array   : surveyReports[], surveys[], SurveyReport[]
//   - Prisma _count  : _count.surveyReports, _count.surveys
//   - foreign key    : surveyId
// ============================================================

/**
 * Cek apakah satu project sudah memiliki data survey.
 * @param {Object} project - satu objek project dari API
 * @returns {boolean}
 */
export const hasSurvey = (project) =>
  !!(
    project.hasSurvey === true                       ||
    project.surveyReports?.length > 0               ||
    project.surveys?.length > 0                     ||
    project.SurveyReport?.length > 0                ||
    (project._count?.surveyReports > 0)             ||
    (project._count?.surveys > 0)                   ||
    project.surveyId
  );

/**
 * Filter array project — hanya kembalikan yang sudah ada survey-nya.
 * @param {Array} projects
 * @returns {Array}
 */
export const filterBySurvey = (projects) =>
  Array.isArray(projects) ? projects.filter(hasSurvey) : [];

// ============================================================
// Pesan kosong yang konsisten di seluruh komponen
// ============================================================
export const EMPTY_MESSAGES = {
  noSurvey: 'Belum ada project yang di-survey. Buat Data Survey terlebih dahulu di menu Perencanaan.',
  pickProject: (label = 'BV') =>
    `Pilih project dari dropdown di atas untuk mulai susun ${label}-nya.`,
};