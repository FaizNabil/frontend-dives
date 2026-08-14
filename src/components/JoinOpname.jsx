// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import "../styles/JoinOpname.css";

// const DEFAULT_API_BASE_URL =
//   "http://localhost:4000/api";

// // ============================================================
// // HELPER
// // ============================================================

// function buildApiUrl(
//   apiBaseUrl,
//   path,
//   params = {}
// ) {
//   const base = (
//     apiBaseUrl || DEFAULT_API_BASE_URL
//   ).replace(/\/$/, "");

//   const cleanPath = path.startsWith("/")
//     ? path
//     : `/${path}`;

//   const url = new URL(
//     `${base}${cleanPath}`
//   );

//   Object.entries(params).forEach(
//     ([key, value]) => {
//       if (
//         value !== undefined &&
//         value !== null &&
//         value !== ""
//       ) {
//         url.searchParams.set(
//           key,
//           value
//         );
//       }
//     }
//   );

//   return url.toString();
// }

// async function parseJsonSafe(response) {
//   try {
//     return await response.json();
//   } catch {
//     return null;
//   }
// }

// function formatCurrency(value) {
//   const number = Number(value);

//   if (!Number.isFinite(number)) {
//     return "Rp 0";
//   }

//   return new Intl.NumberFormat(
//     "id-ID",
//     {
//       style: "currency",
//       currency: "IDR",
//       maximumFractionDigits: 0,
//     }
//   ).format(number);
// }

// function formatNumber(value) {
//   const number = Number(value);

//   if (!Number.isFinite(number)) {
//     return "0";
//   }

//   return new Intl.NumberFormat(
//     "id-ID",
//     {
//       maximumFractionDigits: 2,
//     }
//   ).format(number);
// }

// function formatPercent(value) {
//   const number = Number(value);

//   if (!Number.isFinite(number)) {
//     return "0.00";
//   }

//   return number.toFixed(2);
// }

// function formatDate(value) {
//   if (!value) {
//     return "-";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "-";
//   }

//   return date.toLocaleDateString(
//     "id-ID",
//     {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }
//   );
// }

// function toInputDate(value) {
//   if (!value) {
//     return "";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return date.toISOString().slice(0, 10);
// }

// // ============================================================
// // COMPONENT
// // ============================================================

// function JoinOpnamePage({
//   initialProjectId = null,
//   apiBaseUrl = DEFAULT_API_BASE_URL,
// }) {
//   // ==========================================================
//   // PROJECT
//   // ==========================================================

//   const [projectId, setProjectId] = useState(
//     initialProjectId || ""
//   );

//   const [projectList, setProjectList] =
//     useState([]);

//   const [loadingProjects, setLoadingProjects] =
//     useState(true);

//   const [projectError, setProjectError] =
//     useState(null);

//   // ==========================================================
//   // JOIN OPNAME DATA
//   // ==========================================================

//   const [data, setData] = useState(null);

//   const [loading, setLoading] =
//     useState(false);

//   const [error, setError] =
//     useState(null);

//   // ==========================================================
//   // FILTER
//   // ==========================================================

//   const [disciplineInput, setDisciplineInput] =
//     useState("");

//   const [appliedDiscipline, setAppliedDiscipline] =
//     useState("");

//   // ==========================================================
//   // SELECTED DATE
//   // ==========================================================

//   const [selectedDate, setSelectedDate] =
//     useState("");

//   // ==========================================================
//   // INPUT PROGRESS
//   // {
//   //   rabItemId: "40"
//   // }
//   // ==========================================================

//   const [progressInputs, setProgressInputs] =
//     useState({});

//   // ==========================================================
//   // BUSY ITEM
//   // ==========================================================

//   const [busyItems, setBusyItems] =
//     useState({});

//   // ==========================================================
//   // NOTICE
//   // ==========================================================

//   const [notice, setNotice] =
//     useState(null);

//   // ==========================================================
//   // LOAD PROJECT
//   // ==========================================================

//   const fetchProjects = useCallback(
//     async () => {
//       setLoadingProjects(true);
//       setProjectError(null);

//       try {
//         /**
//          * Diasumsikan backend project Anda
//          * memiliki:
//          *
//          * GET /projects
//          *
//          * dengan response:
//          *
//          * [
//          *   { id, name },
//          *   ...
//          * ]
//          *
//          * atau:
//          *
//          * { data: [...] }
//          */
//         const url = buildApiUrl(
//           apiBaseUrl,
//           "/projects"
//         );

//         const response = await fetch(url);

//         const json =
//           await parseJsonSafe(response);

//         if (!response.ok) {
//           throw new Error(
//             json?.error ||
//               json?.message ||
//               `Gagal mengambil project (${response.status})`
//           );
//         }

//         let projects = [];

//         if (Array.isArray(json)) {
//           projects = json;
//         } else if (
//           Array.isArray(json?.data)
//         ) {
//           projects = json.data;
//         } else if (
//           Array.isArray(json?.projects)
//         ) {
//           projects = json.projects;
//         }

//         setProjectList(projects);

//         if (
//           !projectId &&
//           projects.length > 0
//         ) {
//           setProjectId(
//             projects[0].id
//           );
//         }
//       } catch (err) {
//         console.error(
//           "Fetch Projects Error:",
//           err
//         );

//         setProjectError(
//           err.message ||
//             "Gagal mengambil daftar project."
//         );
//       } finally {
//         setLoadingProjects(false);
//       }
//     },
//     [
//       apiBaseUrl,
//       projectId,
//     ]
//   );

//   // ==========================================================
//   // INITIAL PROJECT SYNC
//   // ==========================================================

//   useEffect(() => {
//     if (initialProjectId) {
//       setProjectId(initialProjectId);
//     }
//   }, [initialProjectId]);

//   // ==========================================================
//   // LOAD PROJECT LIST
//   // ==========================================================

//   useEffect(() => {
//     fetchProjects();
//   }, [fetchProjects]);

//   // ==========================================================
//   // LOAD JOIN OPNAME
//   // ==========================================================

//   const fetchJoinOpname =
//     useCallback(
//       async (
//         selectedProjectId,
//         discipline = ""
//       ) => {
//         if (!selectedProjectId) {
//           setData(null);
//           return;
//         }

//         setLoading(true);
//         setError(null);

//         try {
//           const url = buildApiUrl(
//             apiBaseUrl,
//             `/projects/${selectedProjectId}/join-opname`,
//             {
//               discipline:
//                 discipline || undefined,
//             }
//           );

//           const response =
//             await fetch(url);

//           const json =
//             await parseJsonSafe(
//               response
//             );

//           if (!response.ok) {
//             throw new Error(
//               json?.error ||
//                 json?.message ||
//                 `Gagal memuat Join Opname (${response.status})`
//             );
//           }

//           setData(json);

//           // Set tanggal awal jika belum ada
//           if (
//             !selectedDate &&
//             json?.days?.length
//           ) {
//             setSelectedDate(
//               toInputDate(
//                 json.days[0].date
//               )
//             );
//           }

//           // Isi input progress dari
//           // progress tanggal yang dipilih
//           setProgressInputs(
//             buildProgressInputs(
//               json.items || [],
//               selectedDate
//             )
//           );
//         } catch (err) {
//           console.error(
//             "Fetch Join Opname Error:",
//             err
//           );

//           setError(
//             err.message ||
//               "Gagal memuat Join Opname."
//           );
//         } finally {
//           setLoading(false);
//         }
//       },
//       [
//         apiBaseUrl,
//         selectedDate,
//       ]
//     );

//   // ==========================================================
//   // EFFECT PROJECT / FILTER
//   // ==========================================================

//   useEffect(() => {
//     if (!projectId) {
//       setData(null);
//       return;
//     }

//     fetchJoinOpname(
//       projectId,
//       appliedDiscipline
//     );
//   }, [
//     projectId,
//     appliedDiscipline,
//     fetchJoinOpname,
//   ]);

//   // ==========================================================
//   // BUILD INPUT PROGRESS
//   // ==========================================================

//   function buildProgressInputs(
//     items,
//     date
//   ) {
//     const result = {};

//     if (!date) {
//       return result;
//     }

//     items.forEach((item) => {
//       const breakdown =
//         item.dailyBreakdown || [];

//       const target =
//         breakdown.find(
//           (day) =>
//             toInputDate(
//               day.date
//             ) === date
//         );

//       result[item.rabItemId] =
//         target
//           ? String(target.progress ?? 0)
//           : "0";
//     });

//     return result;
//   }

//   // ==========================================================
//   // PROJECT CHANGE
//   // ==========================================================

//   const handleProjectChange = (
//     event
//   ) => {
//     const value =
//       event.target.value;

//     setProjectId(value);

//     setData(null);

//     setError(null);

//     setProgressInputs({});

//     setSelectedDate("");
//   };

//   // ==========================================================
//   // DATE CHANGE
//   // ==========================================================

//   const handleDateChange = (
//     event
//   ) => {
//     const date =
//       event.target.value;

//     setSelectedDate(date);

//     setProgressInputs(
//       buildProgressInputs(
//         data?.items || [],
//         date
//       )
//     );
//   };

//   // ==========================================================
//   // DISCIPLINE FILTER
//   // ==========================================================

//   const handleApplyFilter =
//     () => {
//       setAppliedDiscipline(
//         disciplineInput.trim()
//       );
//     };

//   const handleResetFilter =
//     () => {
//       setDisciplineInput("");
//       setAppliedDiscipline("");
//     };

//   // ==========================================================
//   // PROGRESS INPUT
//   // ==========================================================

//   const handleProgressChange = (
//     rabItemId,
//     value
//   ) => {
//     let numericValue =
//       value.replace(/[^0-9.]/g, "");

//     if (numericValue !== "") {
//       const number =
//         Number(numericValue);

//       if (number > 100) {
//         numericValue = "100";
//       }
//     }

//     setProgressInputs(
//       (previous) => ({
//         ...previous,
//         [rabItemId]:
//           numericValue,
//       })
//     );
//   };

//   // ==========================================================
//   // SAVE PROGRESS
//   // ==========================================================

//   const handleSaveProgress =
//     async (item) => {
//       if (!projectId) {
//         return;
//       }

//       if (!selectedDate) {
//         setNotice({
//           type: "error",
//           message:
//             "Pilih tanggal progress terlebih dahulu.",
//         });

//         return;
//       }

//       const raw =
//         progressInputs[
//           item.rabItemId
//         ];

//       const progress =
//         Number(raw);

//       if (
//         !Number.isFinite(progress) ||
//         progress < 0 ||
//         progress > 100
//       ) {
//         setNotice({
//           type: "error",
//           message:
//             "Progress harus berada di antara 0 sampai 100.",
//         });

//         return;
//       }

//       setBusyItems(
//         (previous) => ({
//           ...previous,
//           [item.rabItemId]:
//             true,
//         })
//       );

//       try {
//         const url =
//           buildApiUrl(
//             apiBaseUrl,
//             `/rab-items/${item.rabItemId}/progress`
//           );

//         const response =
//           await fetch(url, {
//             method: "PUT",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               date:
//                 selectedDate,
//               progressPercent:
//                 progress,
//             }),
//           });

//         const json =
//           await parseJsonSafe(
//             response
//           );

//         if (!response.ok) {
//           throw new Error(
//             json?.error ||
//               json?.message ||
//               `Gagal menyimpan progress (${response.status})`
//           );
//         }

//         setNotice({
//           type: "success",
//           message:
//             json?.message ||
//             `Progress "${item.name}" berhasil disimpan.`,
//         });

//         await fetchJoinOpname(
//           projectId,
//           appliedDiscipline
//         );
//       } catch (err) {
//         console.error(
//           "Save Progress Error:",
//           err
//         );

//         setNotice({
//           type: "error",
//           message:
//             err.message ||
//             "Gagal menyimpan progress.",
//         });
//       } finally {
//         setBusyItems(
//           (previous) => ({
//             ...previous,
//             [item.rabItemId]:
//               false,
//           })
//         );
//       }
//     };

//   // ==========================================================
//   // AUTO HIDE NOTICE
//   // ==========================================================

//   useEffect(() => {
//     if (!notice) {
//       return;
//     }

//     const timer =
//       setTimeout(() => {
//         setNotice(null);
//       }, 4000);

//     return () =>
//       clearTimeout(timer);
//   }, [notice]);

//   // ==========================================================
//   // DERIVED DATA
//   // ==========================================================

//   const items =
//     data?.items || [];

//   const days =
//     data?.days || [];

//   const totalDays =
//     data?.totalDays || 0;

//   const startDate =
//     data?.startDate || null;

//   // ==========================================================
//   // GROUP ITEM
//   // ==========================================================

//   const groupedItems =
//     useMemo(() => {
//       const groups = new Map();

//       items.forEach((item) => {
//         const groupName =
//           item.groupName ||
//           "Tanpa Group";

//         if (!groups.has(groupName)) {
//           groups.set(
//             groupName,
//             []
//           );
//         }

//         groups
//           .get(groupName)
//           .push(item);
//       });

//       return Array.from(
//         groups.entries()
//       );
//     }, [items]);

//   // ==========================================================
//   // SELECTED DAY INFO
//   // ==========================================================

//   const selectedDay =
//     useMemo(() => {
//       return days.find(
//         (day) =>
//           toInputDate(
//             day.date
//           ) === selectedDate
//       );
//     }, [
//       days,
//       selectedDate,
//     ]);

//   // ==========================================================
//   // SUMMARY
//   // ==========================================================

//   const summary = useMemo(() => {
//     if (!items.length) {
//       return {
//         totalItems: 0,
//         completed: 0,
//         onProgress: 0,
//         notStarted: 0,
//         averageProgress: 0,
//       };
//     }

//     let completed = 0;
//     let onProgress = 0;
//     let notStarted = 0;
//     let total = 0;

//     items.forEach((item) => {
//       const progress =
//         Number(
//           item.rekapProgress
//         ) || 0;

//       total += progress;

//       if (progress === 0) {
//         notStarted += 1;
//       } else if (
//         progress >= 100
//       ) {
//         completed += 1;
//       } else {
//         onProgress += 1;
//       }
//     });

//     return {
//       totalItems:
//         items.length,
//       completed,
//       onProgress,
//       notStarted,
//       averageProgress:
//         total / items.length,
//     };
//   }, [items]);

//   // ==========================================================
//   // RENDER
//   // ==========================================================

//   return (
//     <div className="join-opname-page">

//       {/* ======================================================
//           HEADER
//       ====================================================== */}

//       <div className="join-opname-header">

//         <div>
//           <h1>
//             Join Opname
//           </h1>

//           <p>
//             Input progress aktual
//             pekerjaan lapangan
//             berdasarkan tanggal
//             opname.
//           </p>
//         </div>

//         <div className="join-opname-header-badge">
//           {loading
//             ? "Memuat..."
//             : `${totalDays} Hari`}
//         </div>

//       </div>

//       {/* ======================================================
//           NOTICE
//       ====================================================== */}

//       {notice && (
//         <div
//           className={`jo-notice jo-notice-${notice.type}`}
//         >
//           {notice.message}
//         </div>
//       )}

//       {/* ======================================================
//           PROJECT SELECTOR
//       ====================================================== */}

//       <div className="jo-card jo-project-card">

//         <div className="jo-section-title">
//           Pilih Project
//         </div>

//         <div className="rab-project-picker">

//           <select
//             className="rab-project-select"
//             value={
//               projectId || ""
//             }
//             onChange={
//               handleProjectChange
//             }
//             disabled={
//               loadingProjects
//             }
//           >
//             <option value="">
//               {loadingProjects
//                 ? "Memuat project..."
//                 : "-- pilih project --"}
//             </option>

//             {projectList.map(
//               (project) => (
//                 <option
//                   key={
//                     project.id
//                   }
//                   value={
//                     project.id
//                   }
//                 >
//                   {project.name}
//                 </option>
//               )
//             )}
//           </select>

//           <span className="rab-project-select-icon">
//             ▼
//           </span>

//         </div>

//         {projectError && (
//           <div className="jo-error-text">
//             {projectError}
//           </div>
//         )}

//       </div>

//       {/* ======================================================
//           NO PROJECT
//       ====================================================== */}

//       {!projectId ? (
//         <div className="jo-card jo-empty">

//           <h2>
//             Pilih Project Terlebih Dahulu
//           </h2>

//           <p>
//             Pilih project untuk
//             melihat data Join
//             Opname.
//           </p>

//         </div>
//       ) : (

//         <>
//           {/* ==================================================
//               FILTER BAR
//           ================================================== */}

//           <div className="jo-card jo-filter-card">

//             <div className="jo-filter-group">

//               <label>
//                 Tanggal Opname
//               </label>

//               <input
//                 type="date"
//                 value={
//                   selectedDate
//                 }
//                 min={
//                   days.length
//                     ? toInputDate(
//                         days[0].date
//                       )
//                     : undefined
//                 }
//                 max={
//                   days.length
//                     ? toInputDate(
//                         days[
//                           days.length -
//                             1
//                         ].date
//                       )
//                     : undefined
//                 }
//                 onChange={
//                   handleDateChange
//                 }
//                 disabled={
//                   !data ||
//                   loading
//                 }
//               />

//             </div>

//             <div className="jo-filter-group">

//               <label>
//                 Disiplin
//               </label>

//               <input
//                 type="text"
//                 placeholder="mis. Sipil"
//                 value={
//                   disciplineInput
//                 }
//                 onChange={(e) =>
//                   setDisciplineInput(
//                     e.target.value
//                   )
//                 }
//               />

//             </div>

//             <div className="jo-filter-actions">

//               <button
//                 type="button"
//                 className="jo-btn jo-btn-primary"
//                 onClick={
//                   handleApplyFilter
//                 }
//               >
//                 Terapkan
//               </button>

//               <button
//                 type="button"
//                 className="jo-btn jo-btn-secondary"
//                 onClick={
//                   handleResetFilter
//                 }
//               >
//                 Reset
//               </button>

//             </div>

//           </div>

//           {/* ==================================================
//               PROJECT INFORMATION
//           ================================================== */}

//           <div className="jo-card jo-project-info">

//             <div>
//               <span>
//                 Tanggal Mulai Proyek
//               </span>

//               <strong>
//                 {formatDate(
//                   startDate
//                 )}
//               </strong>
//             </div>

//             <div>
//               <span>
//                 Tanggal Opname
//               </span>

//               <strong>
//                 {formatDate(
//                   selectedDay?.date ||
//                     selectedDate
//                 )}
//               </strong>
//             </div>

//             <div>
//               <span>
//                 Hari ke-
//               </span>

//               <strong>
//                 {selectedDay?.dayNumber ||
//                   "-"}
//               </strong>
//             </div>

//             <div>
//               <span>
//                 Total Hari
//               </span>

//               <strong>
//                 {totalDays}
//               </strong>
//             </div>

//           </div>

//           {/* ==================================================
//               SUMMARY
//           ================================================== */}

//           <div className="jo-summary-grid">

//             <div className="jo-card jo-summary-card">
//               <span>
//                 Total Item
//               </span>

//               <strong>
//                 {summary.totalItems}
//               </strong>
//             </div>

//             <div className="jo-card jo-summary-card">
//               <span>
//                 Belum Mulai
//               </span>

//               <strong>
//                 {summary.notStarted}
//               </strong>
//             </div>

//             <div className="jo-card jo-summary-card">
//               <span>
//                 On Progress
//               </span>

//               <strong>
//                 {summary.onProgress}
//               </strong>
//             </div>

//             <div className="jo-card jo-summary-card">
//               <span>
//                 Selesai
//               </span>

//               <strong>
//                 {summary.completed}
//               </strong>
//             </div>

//             <div className="jo-card jo-summary-card">
//               <span>
//                 Rata-rata Progress
//               </span>

//               <strong>
//                 {formatPercent(
//                   summary.averageProgress
//                 )}
//                 %
//               </strong>
//             </div>

//           </div>

//           {/* ==================================================
//               LOADING / ERROR
//           ================================================== */}

//           {loading && (
//             <div className="jo-card jo-loading">
//               <div className="jo-spinner" />
//               <span>
//                 Memuat data Join Opname...
//               </span>
//             </div>
//           )}

//           {error && !loading && (
//             <div className="jo-card jo-error-card">

//               <strong>
//                 Gagal memuat data
//               </strong>

//               <p>
//                 {error}
//               </p>

//               <button
//                 className="jo-btn jo-btn-primary"
//                 onClick={() =>
//                   fetchJoinOpname(
//                     projectId,
//                     appliedDiscipline
//                   )
//                 }
//               >
//                 Coba Lagi
//               </button>

//             </div>
//           )}

//           {/* ==================================================
//               TABLE
//           ================================================== */}

//           {!loading &&
//             !error &&
//             data && (
//               <div className="jo-card jo-table-card">

//                 <div className="jo-table-header">

//                   <div>
//                     <h2>
//                       Rekap Progress
//                     </h2>

//                     <p>
//                       Input progress pada tanggal
//                       yang dipilih, lalu simpan.
//                     </p>
//                   </div>

//                   <div className="jo-selected-date">
//                     {formatDate(
//                       selectedDate
//                     )}
//                   </div>

//                 </div>

//                 <div className="jo-table-wrapper">

//                   <table className="jo-table">

//                     <thead>
//                       <tr>

//                         <th>
//                           Group
//                         </th>

//                         <th>
//                           Pekerjaan
//                         </th>

//                         <th>
//                           Satuan
//                         </th>

//                         <th>
//                           Volume
//                         </th>

//                         <th>
//                           Nilai RAB
//                         </th>

//                         <th>
//                           Bobot
//                         </th>

//                         <th>
//                           Progress Rekap
//                         </th>

//                         <th>
//                           Status
//                         </th>

//                         <th className="jo-input-column">
//                           Progress{" "}
//                           {formatDate(
//                             selectedDate
//                           )}
//                         </th>

//                         <th>
//                           Aksi
//                         </th>

//                       </tr>
//                     </thead>

//                     <tbody>

//                       {groupedItems.map(
//                         ([
//                           groupName,
//                           groupItems,
//                         ]) => (
//                           <React.Fragment
//                             key={
//                               groupName
//                             }
//                           >

//                             <tr className="jo-group-row">

//                               <td
//                                 colSpan={
//                                   10
//                                 }
//                               >
//                                 {groupName}
//                               </td>

//                             </tr>

//                             {groupItems.map(
//                               (item) => {

//                                 const progressValue =
//                                   progressInputs[
//                                     item
//                                       .rabItemId
//                                   ] ??
//                                   "0";

//                                 const busy =
//                                   !!busyItems[
//                                     item
//                                       .rabItemId
//                                   ];

//                                 return (
//                                   <tr
//                                     key={
//                                       item.rabItemId
//                                     }
//                                   >

//                                     <td>
//                                       {
//                                         item.groupName ||
//                                         "-"
//                                       }
//                                     </td>

//                                     <td className="jo-name-cell">

//                                       {item.name}

//                                       {item.isByOwner && (
//                                         <span className="jo-tag jo-tag-owner">
//                                           By Owner
//                                         </span>
//                                       )}

//                                       {item.isStip && (
//                                         <span className="jo-tag jo-tag-stip">
//                                           Stip
//                                         </span>
//                                       )}

//                                       {item.hasChildren && (
//                                         <span className="jo-tag jo-tag-parent">
//                                           Parent
//                                         </span>
//                                       )}

//                                     </td>

//                                     <td>
//                                       {
//                                         item.paymentUnit ||
//                                         "-"
//                                       }
//                                     </td>

//                                     <td>
//                                       {formatNumber(
//                                         item.volume
//                                       )}
//                                     </td>

//                                     <td>
//                                       {formatCurrency(
//                                         item.rabTotalPrice
//                                       )}
//                                     </td>

//                                     <td>
//                                       {formatPercent(
//                                         item.weight
//                                       )}
//                                       %
//                                     </td>

//                                     <td>
//                                       <strong>
//                                         {formatPercent(
//                                           item.rekapProgress
//                                         )}
//                                         %
//                                       </strong>
//                                     </td>

//                                     <td>
//                                       <span
//                                         className={`jo-status jo-status-${(
//                                           item.status ||
//                                           ""
//                                         )
//                                           .toLowerCase()
//                                           .replace(
//                                             /\s+/g,
//                                             "-"
//                                           )}`}
//                                       >
//                                         {
//                                           item.status
//                                         }
//                                       </span>
//                                     </td>

//                                     <td className="jo-input-cell">

//                                       {item.hasChildren ? (
//                                         <span className="jo-muted">
//                                           Parent
//                                         </span>
//                                       ) : (
//                                         <div className="jo-progress-input-wrapper">

//                                           <input
//                                             type="number"
//                                             min="0"
//                                             max="100"
//                                             step="0.01"
//                                             value={
//                                               progressValue
//                                             }
//                                             onChange={(
//                                               event
//                                             ) =>
//                                               handleProgressChange(
//                                                 item.rabItemId,
//                                                 event
//                                                   .target
//                                                   .value
//                                               )
//                                             }
//                                             disabled={
//                                               busy
//                                             }
//                                             className="jo-progress-input"
//                                           />

//                                           <span>
//                                             %
//                                           </span>

//                                         </div>
//                                       )}

//                                     </td>

//                                     <td>

//                                       {!item.hasChildren && (
//                                         <button
//                                           type="button"
//                                           className="jo-btn jo-btn-save"
//                                           onClick={() =>
//                                             handleSaveProgress(
//                                               item
//                                             )
//                                           }
//                                           disabled={
//                                             busy
//                                           }
//                                         >
//                                           {busy
//                                             ? "Menyimpan..."
//                                             : "Simpan"}
//                                         </button>
//                                       )}

//                                     </td>

//                                   </tr>
//                                 );
//                               }
//                             )}

//                           </React.Fragment>
//                         )
//                       )}

//                     </tbody>

//                   </table>

//                 </div>

//               </div>
//             )}

//           {/* ==================================================
//               DAILY BREAKDOWN
//           ================================================== */}

//           {!loading &&
//             !error &&
//             data &&
//             items.length > 0 && (
//               <div className="jo-card jo-breakdown-card">

//                 <div className="jo-table-header">

//                   <div>
//                     <h2>
//                       Breakdown Progress Harian
//                     </h2>

//                     <p>
//                       Progress, bobot, dan volume
//                       terlaksana setiap hari.
//                     </p>
//                   </div>

//                 </div>

//                 <div className="jo-table-wrapper">

//                   <table className="jo-table jo-daily-table">

//                     <thead>
//                       <tr>

//                         <th>
//                           Pekerjaan
//                         </th>

//                         <th>
//                           Bobot
//                         </th>

//                         {days.map(
//                           (day) => (
//                             <th
//                               key={
//                                 day.dayNumber
//                               }
//                             >
//                               <div>
//                                 Hari{" "}
//                                 {
//                                   day.dayNumber
//                                 }
//                               </div>

//                               <small>
//                                 {formatDate(
//                                   day.date
//                                 )}
//                               </small>
//                             </th>
//                           )
//                         )}

//                       </tr>
//                     </thead>

//                     <tbody>

//                       {items.map(
//                         (item) => (
//                           <tr
//                             key={
//                               item.rabItemId
//                             }
//                           >

//                             <td className="jo-name-cell">
//                               {
//                                 item.name
//                               }
//                             </td>

//                             <td>
//                               {formatPercent(
//                                 item.weight
//                               )}
//                               %
//                             </td>

//                             {days.map(
//                               (day) => {
//                                 const breakdown =
//                                   item.dailyBreakdown?.find(
//                                     (
//                                       record
//                                     ) =>
//                                       record.dayNumber ===
//                                       day.dayNumber
//                                   );

//                                 return (
//                                   <td
//                                     key={
//                                       day.dayNumber
//                                     }
//                                     className={
//                                       selectedDate ===
//                                       toInputDate(
//                                         day.date
//                                       )
//                                         ? "jo-current-day-cell"
//                                         : ""
//                                     }
//                                   >

//                                     <div className="jo-day-progress">
//                                       <strong>
//                                         {formatPercent(
//                                           breakdown?.progress ||
//                                             0
//                                         )}
//                                         %
//                                       </strong>

//                                       <small>
//                                         Bobot:{" "}
//                                         {formatPercent(
//                                           breakdown?.bobot ||
//                                             0
//                                         )}
//                                         %
//                                       </small>

//                                       <small>
//                                         Vol:{" "}
//                                         {formatNumber(
//                                           breakdown?.volume ||
//                                             0
//                                         )}
//                                       </small>
//                                     </div>

//                                   </td>
//                                 );
//                               }
//                             )}

//                           </tr>
//                         )
//                       )}

//                     </tbody>

//                   </table>

//                 </div>

//               </div>
//             )}

//         </>
//       )}

//     </div>
//   );
// }

// export default JoinOpnamePage;