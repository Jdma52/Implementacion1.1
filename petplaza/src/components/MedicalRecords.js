// src/components/MedicalRecords.js
import React, { useState, useRef } from "react";
import { Plus, Search, Edit, Trash2, FileDown, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../CSS/MedicalRecords.css";

/* =========================
 *   Estructuras iniciales
 * ========================= */
const initialGeneralRecord = () => ({
  id: null,
  owner: "",
  ownerPhone: "",
  pet: "",
  species: "",
  otherSpecies: "",
  gender: "",
  breed: "",
  weight: "",
  color: "",
  bloodDonor: "",
  ccToApply: "",
  surgery: "",
  date: "",
  vet: "",
  diagnosis: "",
  treatment: "",
  notes: "",
  vaccinesAdministered: [],
  vaccinesField: "",
  images: [],
  branch: "",
  exams: "",
  createdAt: null,
  modifiedAt: null,
});

const initialSurgeryRecord = () => ({
  id: null,
  generalId: null, // vínculo opcional al expediente general
  branch: "",
  date: "",
  time: "",
  owner: "",
  ownerId: "",
  pet: "",
  species: "",
  otherSpecies: "",
  breed: "",
  gender: "",
  age: "",
  caseDescription: "",
  risks: ["", "", "", "", "", ""],
  images: [],
  createdAt: null,
});

const initialCareRecord = () => ({
  id: null,
  generalId: null, // vínculo opcional al expediente general
  owner: "",
  pet: "",
  species: "",
  branch: "",
  instructions: "",
  meds: "",      // date
  foodWater: "", // date
  exercise: "",
  sutures: "",
  followUp: "",
  monitoring: "",
  emergencyContact: "",
  images: [],
  createdAt: null,
});

/* =========================
 *   Componente principal
 * ========================= */
const MedicalRecords = () => {
  /* ====== Estados raíz ====== */
  const [generalRecords, setGeneralRecords] = useState([
    // Ejemplo inicial
    {
      ...initialGeneralRecord(),
      id: 1,
      owner: "Juan Pérez",
      ownerPhone: "9999-9999",
      pet: "Max",
      species: "Perro",
      gender: "Macho",
      breed: "Labrador",
      weight: "10 kg",
      color: "Marrón",
      bloodDonor: "Sí",
      ccToApply: "Ninguno",
      date: "2025-09-24",
      vet: "Dra. María González (Cardióloga)",
      notes: "Mascota en excelente estado de salud",
      branch: "Sucursal Central",
      createdAt: new Date(),
      modifiedAt: null,
    },
  ]);
  const [surgeryRecords, setSurgeryRecords] = useState([]);
  const [careRecords, setCareRecords] = useState([]);

  /* ====== Filtros ====== */
  const [selectedPet, setSelectedPet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] = useState("Todos");

  /* ====== Menú desplegable NUEVO ====== */
  const [showDropdown, setShowDropdown] = useState(false);

  /* ====== Modales ====== */
  const [showModal, setShowModal] = useState(false);             // General
  const [showSurgeryModal, setShowSurgeryModal] = useState(false); // Cirugía
  const [showCareModal, setShowCareModal] = useState(false);     // Cuidados

  /* ====== Edición ====== */
  const [editingRecord, setEditingRecord] = useState(null);    // General en edición
  const [editingSurgery, setEditingSurgery] = useState(null);  // Cirugía en edición
  const [editingCare, setEditingCare] = useState(null);        // Cuidados en edición

  /* ====== UI & mensajes ====== */
  const [confirmationMsg, setConfirmationMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: "", id: null });

  /* ====== Imágenes ====== */
  const [imagePreview, setImagePreview] = useState([]);              // general (nuevo/edición)
  const [surgeryImagePreview, setSurgeryImagePreview] = useState([]); // cirugía (nuevo/edición)
  const [careImagePreview, setCareImagePreview] = useState([]);       // cuidados (nuevo/edición)
  const [deleteImageModal, setDeleteImageModal] = useState(false);
  // imageToDelete = { scope: "general"|"surgery"|"care", recordId: "new"|number, img: base64 }
  const [imageToDelete, setImageToDelete] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  /* ====== Formularios ====== */
  const [newRecord, setNewRecord] = useState(initialGeneralRecord());
  const [newSurgery, setNewSurgery] = useState(initialSurgeryRecord());
  const [newCare, setNewCare] = useState(initialCareRecord());

  const pdfRef = useRef();

  /* ====== Catálogos ====== */
  const vets = [
    "Dra. María González (Cardióloga)",
    "Dr. Carlos López (Dermatólogo)",
    "Dra. Ana Torres (Cirujana)",
  ];
  const vaccines = ["Rabia", "Parvovirus", "Distemper", "Leptospirosis"];
  const speciesOptions = ["Perro", "Gato", "Ave", "Conejo", "Otro"];
  const genderOptions = ["Macho", "Hembra"];
  const bloodDonorOptions = ["Sí", "No"];

  /* =========================
   *         Helpers
   * ========================= */
  const showTemporaryMessage = (msg) => {
    setConfirmationMsg(msg);
    setTimeout(() => setConfirmationMsg(""), 4000);
  };

  const petOwnerKey = (pet, species, owner) =>
    `${pet || ""} (${species || ""}) - ${owner || ""}`;

  const matchesSearchAndSelected = (pet, species, owner) => {
    const key = petOwnerKey(pet, species, owner).toLowerCase();
    const sel = selectedPet.toLowerCase();
    const matchSelected = !sel || key.includes(sel);

    const term = searchTerm.toLowerCase();
    const matchSearch =
      (pet || "").toLowerCase().includes(term) ||
      (owner || "").toLowerCase().includes(term);

    return matchSelected && matchSearch;
  };

  /* =========================
   *       FILTRADOS
   * ========================= */
  const filteredGeneral = generalRecords.filter((r) =>
    matchesSearchAndSelected(r.pet, r.species, r.owner)
  );

  const filteredSurgery = surgeryRecords.filter((s) =>
    matchesSearchAndSelected(s.pet, s.species, s.owner)
  );

  const filteredCare = careRecords.filter((c) =>
    matchesSearchAndSelected(c.pet, c.species, c.owner)
  );

  /* =========================
   *   GENERAL: inputs y CRUD
   * ========================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "vaccinesField") {
      if (!value) return;
      const dateTime = new Date().toLocaleString();
      const updatedVaccine = `${value} (${dateTime})`;
      setNewRecord((prev) => ({
        ...prev,
        vaccinesField: "",
        vaccinesAdministered: [...prev.vaccinesAdministered, updatedVaccine],
      }));
      return;
    }

    setNewRecord((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateRecord = () => {
    if (!newRecord.pet || !newRecord.vet || !newRecord.date) {
      alert("Por favor completa Mascota, Doctor y Fecha.");
      return;
    }

    if (editingRecord) {
      const updated = {
        ...newRecord,
        id: editingRecord.id,
        createdAt: editingRecord.createdAt,
        modifiedAt: new Date(),
      };
      setGeneralRecords((prev) =>
        prev.map((r) => (r.id === editingRecord.id ? updated : r))
      );
      showTemporaryMessage("Expediente general modificado correctamente");
    } else {
      const newEntry = {
        ...newRecord,
        id: Date.now(),
        createdAt: new Date(),
        modifiedAt: null,
      };
      setGeneralRecords((prev) => [...prev, newEntry]);
      showTemporaryMessage("Expediente general creado correctamente");
    }

    setNewRecord(initialGeneralRecord());
    setEditingRecord(null);
    setShowModal(false);
    setImagePreview([]);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setNewRecord({ ...record, vaccinesField: "" });
    setImagePreview(record.images || []);
    setShowModal(true);
  };

  /* =========================
   *   BORRADO (solo el seleccionado)
   * ========================= */
  const requestDeleteRecord = (type, id) => {
    setDeleteConfirm({ show: true, type, id });
  };

  const confirmDeleteRecord = () => {
    const { type, id } = deleteConfirm;

    if (type === "general") {
      setGeneralRecords((prev) => prev.filter((r) => r.id !== id));
    } else if (type === "surgery") {
      setSurgeryRecords((prev) => prev.filter((s) => s.id !== id));
    } else if (type === "care") {
      setCareRecords((prev) => prev.filter((c) => c.id !== id));
    }

    setDeleteConfirm({ show: false, type: "", id: null });
    showTemporaryMessage("Expediente eliminado correctamente");
  };

  const cancelDeleteRecord = () =>
    setDeleteConfirm({ show: false, type: "", id: null });

  /* =========================
   *   Imágenes (import/eliminar)
   * ========================= */
  const handleExportImage = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers = Array.from(files).map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((images) => {
      if (type === "general") {
        setImagePreview((prev) => [...prev, ...images]);
        setNewRecord((prev) => ({ ...prev, images: [...prev.images, ...images] }));
      } else if (type === "surgery") {
        setSurgeryImagePreview((prev) => [...prev, ...images]);
        setNewSurgery((prev) => ({ ...prev, images: [...prev.images, ...images] }));
      } else if (type === "care") {
        setCareImagePreview((prev) => [...prev, ...images]);
        setNewCare((prev) => ({ ...prev, images: [...prev.images, ...images] }));
      }
      showTemporaryMessage("Imagen(es) importada(s) correctamente");
    });
  };

  const askDeleteImage = (scope, recordId, img) => {
    setImageToDelete({ scope, recordId, img });
    setDeleteImageModal(true);
  };

  const confirmDeleteImage = () => {
    if (!imageToDelete) return;
    const { scope, recordId, img } = imageToDelete;

    if (scope === "general") {
      if (recordId === "new") {
        setImagePreview((prev) => prev.filter((i) => i !== img));
        setNewRecord((prev) => ({
          ...prev,
          images: prev.images.filter((i) => i !== img),
        }));
      } else {
        setGeneralRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, images: r.images.filter((i) => i !== img) }
              : r
          )
        );
      }
    } else if (scope === "surgery") {
      if (recordId === "new") {
        setSurgeryImagePreview((prev) => prev.filter((i) => i !== img));
        setNewSurgery((prev) => ({
          ...prev,
          images: prev.images.filter((i) => i !== img),
        }));
      } else {
        setSurgeryRecords((prev) =>
          prev.map((s) =>
            s.id === recordId
              ? { ...s, images: s.images.filter((i) => i !== img) }
              : s
          )
        );
      }
    } else if (scope === "care") {
      if (recordId === "new") {
        setCareImagePreview((prev) => prev.filter((i) => i !== img));
        setNewCare((prev) => ({
          ...prev,
          images: prev.images.filter((i) => i !== img),
        }));
      } else {
        setCareRecords((prev) =>
          prev.map((c) =>
            c.id === recordId
              ? { ...c, images: c.images.filter((i) => i !== img) }
              : c
          )
        );
      }
    }

    setDeleteImageModal(false);
    setImageToDelete(null);
    showTemporaryMessage("Imagen eliminada correctamente");
  };

  /* =========================
   *   Exportar PDF (por tipo)
   * ========================= */
  const handleExportPDF = async (record, type) => {
    const input = document.getElementById(`${type}-${record.id}`);
    if (!input) return;
    input.classList.add("pdf-hidden");

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    input.classList.remove("pdf-hidden");
    pdf.save(`${type}-${record.pet || "expediente"}.pdf`);
  };

  /* =========================
   *   Cirugía (inputs y CRUD)
   * ========================= */
  const handleSurgeryInputChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name.startsWith("risk")) {
      const risks = [...newSurgery.risks];
      risks[index] = value;
      setNewSurgery((prev) => ({ ...prev, risks }));
    } else {
      setNewSurgery((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openSurgeryModal = () => {
    const base = initialSurgeryRecord();
    if (editingRecord) {
      setNewSurgery({
        ...base,
        generalId: editingRecord.id,
        branch: editingRecord.branch || "",
        date: editingRecord.date || "",
        owner: editingRecord.owner || "",
        pet: editingRecord.pet || "",
        species: editingRecord.species || "",
        otherSpecies: editingRecord.otherSpecies || "",
        breed: editingRecord.breed || "",
        gender: editingRecord.gender || "",
        age: editingRecord.age || "",
      });
    } else {
      setNewSurgery(base);
    }
    setEditingSurgery(null);
    setSurgeryImagePreview([]);
    setShowSurgeryModal(true);
  };

  const handleAddOrUpdateSurgery = () => {
    if (!newSurgery.owner || !newSurgery.pet || !newSurgery.date) {
      alert("Completa Dueño, Mascota y Fecha.");
      return;
    }

    if (editingSurgery) {
      const updated = {
        ...newSurgery,
        id: editingSurgery.id,
        createdAt: editingSurgery.createdAt,
      };
      setSurgeryRecords((prev) =>
        prev.map((s) => (s.id === editingSurgery.id ? updated : s))
      );
      showTemporaryMessage("Expediente quirúrgico modificado correctamente");
    } else {
      const newEntry = {
        ...newSurgery,
        id: Date.now(),
        createdAt: new Date(),
      };
      setSurgeryRecords((prev) => [...prev, newEntry]);
      showTemporaryMessage("Expediente quirúrgico creado correctamente");
    }

    setNewSurgery(initialSurgeryRecord());
    setEditingSurgery(null);
    setSurgeryImagePreview([]);
    setShowSurgeryModal(false);
  };

  const handleEditSurgery = (record) => {
    setEditingSurgery(record);
    setNewSurgery({ ...record });
    setSurgeryImagePreview(record.images || []);
    setShowSurgeryModal(true);
  };

  /* =========================
   *   Cuidados en casa (inputs y CRUD)
   * ========================= */
  const openCareModal = () => {
    const base = initialCareRecord();
    if (editingRecord) {
      setNewCare({
        ...base,
        generalId: editingRecord.id,
        owner: editingRecord.owner || "",
        pet: editingRecord.pet || "",
        species: editingRecord.species || "",
        branch: editingRecord.branch || "",
      });
    } else {
      setNewCare(base);
    }
    setEditingCare(null);
    setCareImagePreview([]);
    setShowCareModal(true);
  };

  const handleCareInputChange = (e) => {
    const { name, value } = e.target;
    setNewCare((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateCare = () => {
    if (!newCare.owner || !newCare.pet) {
      alert("Completa Propietario y Mascota.");
      return;
    }

    if (editingCare) {
      const updated = {
        ...newCare,
        id: editingCare.id,
        createdAt: editingCare.createdAt,
      };
      setCareRecords((prev) =>
        prev.map((c) => (c.id === editingCare.id ? updated : c))
      );
      showTemporaryMessage("Cuidados en casa modificado correctamente");
    } else {
      const newEntry = {
        ...newCare,
        id: Date.now(),
        createdAt: new Date(),
      };
      setCareRecords((prev) => [...prev, newEntry]);
      showTemporaryMessage("Cuidados en casa guardados correctamente");
    }

    setNewCare(initialCareRecord());
    setEditingCare(null);
    setCareImagePreview([]);
    setShowCareModal(false);
  };

  const handleEditCare = (record) => {
    setEditingCare(record);
    setNewCare({ ...record });
    setCareImagePreview(record.images || []);
    setShowCareModal(true);
  };

  /* =========================
   *         Render
   * ========================= */
  return (
    <div className="medical-container" ref={pdfRef}>
      {/* Mensaje de confirmaciones */}
      {confirmationMsg && <div className="confirmation-modal">{confirmationMsg}</div>}

      {/* Imagen fullscreen */}
      {fullScreenImage && (
        <div className="image-modal-overlay active" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} className="image-modal" alt="Full Preview" />
        </div>
      )}

      {/* Header */}
      <div className="medical-header">
        <h1>Expedientes</h1>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative" }}>
          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="filter-select"
            aria-label="Filtrar por tipo de expediente"
          >
            <option value="Todos">Todos</option>
            <option value="Expediente general">Expediente general</option>
            <option value="Expediente cirugía">Expediente cirugía</option>
            <option value="Cuidados de mascota">Cuidados de mascota</option>
          </select>

          {/* Botón NUEVO EXPEDIENTE con menú desplegable */}
          <div style={{ position: "relative" }}>
            <button
              className="btn-primary"
              onClick={() => setShowDropdown((v) => !v)}
            >
              <Plus size={16} /> Nuevo Expediente
            </button>

            <div className={`dropdown-menu ${showDropdown ? "show" : ""}`}>
              <button
                onClick={() => {
                  setNewRecord(initialGeneralRecord());
                  setEditingRecord(null);
                  setImagePreview([]);
                  setShowModal(true);
                  setShowDropdown(false);
                }}
              >
                Expediente General
              </button>
              <button
                onClick={() => {
                  setNewSurgery(initialSurgeryRecord());
                  setEditingSurgery(null);
                  setSurgeryImagePreview([]);
                  setShowSurgeryModal(true);
                  setShowDropdown(false);
                }}
              >
                Quirúrgico
              </button>
              <button
                onClick={() => {
                  setNewCare(initialCareRecord());
                  setEditingCare(null);
                  setCareImagePreview([]);
                  setShowCareModal(true);
                  setShowDropdown(false);
                }}
              >
                Cuidados en Casa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros: mascota + búsqueda */}
      <div className="medical-filters">
        <select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)}>
          <option value="">Seleccionar mascota</option>
          {generalRecords.map((r) => (
            <option key={r.id} value={petOwnerKey(r.pet, r.species, r.owner)}>
              {petOwnerKey(r.pet, r.species, r.owner)}
            </option>
          ))}
        </select>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en expedientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tarjetas separadas por tipo de expediente */}
      <div className="records-cards">
        {/* ====== GENERALES ====== */}
        {(recordTypeFilter === "Todos" || recordTypeFilter === "Expediente general") &&
          filteredGeneral.map((r) => (
            <div className="record-card" key={r.id} id={`general-${r.id}`}>
              <div className="record-header">
                <h3>Expediente General</h3>
                <span>
                  Creado: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"} <br />
                  Modificado: {r.modifiedAt ? new Date(r.modifiedAt).toLocaleString() : "No modificado"} <br />
                  Doctor: {r.vet || "N/A"}
                </span>
                <div className="card-buttons">
                  <button className="btn-edit" onClick={() => handleEditRecord(r)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="btn-delete" onClick={() => requestDeleteRecord("general", r.id)}>
                    <Trash2 size={16} /> Borrar
                  </button>
                  <button className="btn-export-pdf" onClick={() => handleExportPDF(r, "general")}>
                    <FileDown size={16} /> Exportar PDF
                  </button>
                </div>
              </div>

              <div className="record-body">
                <div className="record-section"><h4>Sucursal</h4><p>{r.branch || "N/A"}</p></div>
                <div className="record-section"><h4>Exámenes a realizar</h4><p>{r.exams || "N/A"}</p></div>
                <div className="record-section"><h4>Teléfono Propietario</h4><p>{r.ownerPhone || "N/A"}</p></div>
                <div className="record-section"><h4>Cirugía a realizar</h4><p>{r.surgery || "N/A"}</p></div>
                <div className="record-section"><h4>Diagnóstico</h4><p>{r.diagnosis || "N/A"}</p></div>
                <div className="record-section"><h4>Tratamiento</h4><p>{r.treatment || "N/A"}</p></div>
                <div className="record-section"><h4>Notas adicionales</h4><p>{r.notes || "N/A"}</p></div>

                <div className="record-section">
                  <h4>Vacunas administradas</h4>
                  {r.modifiedAt && (
                    <p className="modified-msg">Este expediente ha sido modificado con anterioridad.</p>
                  )}
                  {r.vaccinesAdministered?.length ? (
                    <ul>
                      {r.vaccinesAdministered.map((v, idx) => (
                        <li key={idx}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>

                {r.images?.length > 0 && (
                  <div className="record-section">
                    <h4>Imágenes asociadas</h4>
                    <div className="image-gallery">
                      {r.images.map((img, idx) => (
                        <div key={idx} className="image-container">
                          <img
                            src={img}
                            alt="Expediente"
                            className="record-image"
                            onClick={() => setFullScreenImage(img)}
                          />
                          <button
                            className="delete-image-btn"
                            title="Eliminar imagen"
                            onClick={() => askDeleteImage("general", r.id, img)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* ====== CIRUGÍAS ====== */}
        {(recordTypeFilter === "Todos" || recordTypeFilter === "Expediente cirugía") &&
          filteredSurgery.map((s) => (
            <div className="surgery-card" key={s.id} id={`surgery-${s.id}`}>
              <div className="record-header">
                <h3>Expediente Cirugía</h3>
                <span>
                  Creado: {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"} <br />
                  Sucursal: {s.branch || "N/A"}
                </span>
                <div className="card-buttons">
                  <button className="btn-edit" onClick={() => handleEditSurgery(s)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="btn-delete" onClick={() => requestDeleteRecord("surgery", s.id)}>
                    <Trash2 size={16} /> Borrar
                  </button>
                  <button className="btn-export-pdf" onClick={() => handleExportPDF(s, "surgery")}>
                    <FileDown size={16} /> Exportar PDF
                  </button>
                </div>
              </div>

              <div className="record-body">
                <p><strong>Fecha:</strong> {s.date || "N/A"}</p>
                <p><strong>Hora:</strong> {s.time || "N/A"}</p>
                <p><strong>Propietario:</strong> {s.owner || "N/A"}</p>
                <p><strong>ID/Pasaporte:</strong> {s.ownerId || "N/A"}</p>
                <p><strong>Mascota:</strong> {s.pet || "N/A"}</p>
                <p><strong>Especie:</strong> {s.species === "Otro" ? (s.otherSpecies || "Otro") : (s.species || "N/A")}</p>
                <p><strong>Raza:</strong> {s.breed || "N/A"}</p>
                <p><strong>Sexo:</strong> {s.gender || "N/A"}</p>
                <p><strong>Edad:</strong> {s.age || "N/A"}</p>
                <p><strong>Descripción del caso:</strong> {s.caseDescription || "N/A"}</p>

                {s.risks?.some((x) => x && x.trim()) ? (
                  <>
                    <p><strong>Riesgos:</strong></p>
                    <ul>{s.risks.map((rr, i) => (rr ? <li key={i}>{rr}</li> : null))}</ul>
                  </>
                ) : (
                  <p><strong>Riesgos:</strong> N/A</p>
                )}

                {s.images?.length > 0 && (
                  <div className="record-section">
                    <h4>Imágenes</h4>
                    <div className="image-gallery">
                      {s.images.map((img, idx) => (
                        <div key={idx} className="image-container">
                          <img
                            src={img}
                            alt="Cirugía"
                            className="record-image"
                            onClick={() => setFullScreenImage(img)}
                          />
                          <button
                            className="delete-image-btn"
                            title="Eliminar imagen"
                            onClick={() => askDeleteImage("surgery", s.id, img)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* ====== CUIDADOS EN CASA ====== */}
        {(recordTypeFilter === "Todos" || recordTypeFilter === "Cuidados de mascota") &&
          filteredCare.map((c) => (
            <div className="record-card" key={c.id} id={`care-${c.id}`}>
              <div className="record-header">
                <h3>Cuidados en Casa</h3>
                <span>
                  Creado: {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"} <br />
                  Sucursal: {c.branch || "N/A"}
                </span>
                <div className="card-buttons">
                  <button className="btn-edit" onClick={() => handleEditCare(c)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="btn-delete" onClick={() => requestDeleteRecord("care", c.id)}>
                    <Trash2 size={16} /> Borrar
                  </button>
                  <button className="btn-export-pdf" onClick={() => handleExportPDF(c, "care")}>
                    <FileDown size={16} /> Exportar PDF
                  </button>
                </div>
              </div>

              <div className="record-body">
                <p><strong>Propietario:</strong> {c.owner || "N/A"}</p>
                <p><strong>Mascota:</strong> {c.pet || "N/A"}</p>
                <p><strong>Especie:</strong> {c.species || "N/A"}</p>

                <div className="record-section"><h4>Instrucciones</h4><p>{c.instructions || "N/A"}</p></div>
                <p><strong>Medicaciones (fecha):</strong> {c.meds || "N/A"}</p>
                <p><strong>Comida y Agua (fecha):</strong> {c.foodWater || "N/A"}</p>
                <p><strong>Ejercicio:</strong> {c.exercise || "N/A"}</p>
                <p><strong>Suturas:</strong> {c.sutures || "N/A"}</p>
                <div className="record-section"><h4>Instrucciones de Seguimiento</h4><p>{c.followUp || "N/A"}</p></div>
                <p><strong>Monitoreo en Casa:</strong> {c.monitoring || "N/A"}</p>
                <p><strong>Contacto de Emergencia:</strong> {c.emergencyContact || "N/A"}</p>

                {c.images?.length > 0 && (
                  <div className="record-section">
                    <h4>Imágenes</h4>
                    <div className="image-gallery">
                      {c.images.map((img, idx) => (
                        <div key={idx} className="image-container">
                          <img
                            src={img}
                            alt="Cuidado"
                            className="record-image"
                            onClick={() => setFullScreenImage(img)}
                          />
                          <button
                            className="delete-image-btn"
                            title="Eliminar imagen"
                            onClick={() => askDeleteImage("care", c.id, img)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* =========================
          Modal: Expediente General
        ========================= */}
      {showModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target.classList.contains('modal-overlay')) setShowModal(false); }}>
          <div className="modal" id={`general-${newRecord.id || 'new'}`}>
            <div className="modal-header">
              <h2>{editingRecord ? "Editar Expediente General" : "Nuevo Expediente General"}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                  setNewRecord(initialGeneralRecord());
                  setImagePreview([]);
                }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <label>Dueño</label>
              <input
                type="text"
                name="owner"
                placeholder="Nombre del dueño"
                value={newRecord.owner}
                onChange={handleInputChange}
              />

              <label>Teléfono Propietario</label>
              <input
                type="text"
                name="ownerPhone"
                placeholder="Teléfono del propietario"
                value={newRecord.ownerPhone}
                onChange={handleInputChange}
              />

              <label>Mascota</label>
              <input
                type="text"
                name="pet"
                placeholder="Nombre de la mascota"
                value={newRecord.pet}
                onChange={handleInputChange}
              />

              <label>Especie</label>
              <select name="species" value={newRecord.species} onChange={handleInputChange}>
                <option value="">Seleccionar especie</option>
                {speciesOptions.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>

              {newRecord.species === "Otro" && (
                <>
                  <label>Especifique Otra Especie</label>
                  <input
                    type="text"
                    name="otherSpecies"
                    placeholder="Especifique otra especie"
                    value={newRecord.otherSpecies}
                    onChange={handleInputChange}
                  />
                </>
              )}

              <label>Género</label>
              <select name="gender" value={newRecord.gender} onChange={handleInputChange}>
                <option value="">Seleccionar género</option>
                {genderOptions.map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>

              <label>Raza</label>
              <input type="text" name="breed" placeholder="Raza" value={newRecord.breed} onChange={handleInputChange} />

              <label>Peso</label>
              <input type="text" name="weight" placeholder="Peso" value={newRecord.weight} onChange={handleInputChange} />

              <label>Color de Mascota</label>
              <input type="text" name="color" placeholder="Color" value={newRecord.color} onChange={handleInputChange} />

              <label>Donante de Sangre</label>
              <select name="bloodDonor" value={newRecord.bloodDonor} onChange={handleInputChange}>
                <option value="">Seleccionar opción</option>
                {bloodDonorOptions.map((b, idx) => (
                  <option key={idx} value={b}>{b}</option>
                ))}
              </select>

              <label>Doctor</label>
              <select name="vet" value={newRecord.vet} onChange={handleInputChange}>
                <option value="">Seleccionar doctor</option>
                {vets.map((v, idx) => (
                  <option key={idx} value={v}>{v}</option>
                ))}
              </select>

              <label>Fecha</label>
              <input type="date" name="date" value={newRecord.date} onChange={handleInputChange} />

              <label>Sucursal</label>
              <input type="text" name="branch" placeholder="Sucursal" value={newRecord.branch} onChange={handleInputChange} />

              <label>Exámenes a realizar</label>
              <input type="text" name="exams" placeholder="Exámenes" value={newRecord.exams} onChange={handleInputChange} />

              <label>Cirugía a realizar</label>
              <input type="text" name="surgery" placeholder="Cirugía a realizar" value={newRecord.surgery} onChange={handleInputChange} />

              <label>Diagnóstico</label>
              <input type="text" name="diagnosis" placeholder="Diagnóstico" value={newRecord.diagnosis} onChange={handleInputChange} />

              <label>Tratamiento</label>
              <textarea name="treatment" placeholder="Tratamiento" value={newRecord.treatment} onChange={handleInputChange} />

              <label>Notas adicionales</label>
              <textarea name="notes" placeholder="Notas adicionales" value={newRecord.notes} onChange={handleInputChange} />

              <label>Vacuna (agrega con marca de tiempo)</label>
              <select name="vaccinesField" value={newRecord.vaccinesField || ""} onChange={handleInputChange}>
                <option value="">Seleccionar vacuna</option>
                {vaccines.map((v, idx) => (
                  <option key={idx} value={v}>{v}</option>
                ))}
              </select>

              {newRecord.vaccinesAdministered.length > 0 && (
                <ul>
                  {newRecord.vaccinesAdministered.map((vac, idx) => (
                    <li key={idx}>{vac}</li>
                  ))}
                </ul>
              )}

              <label>CC a aplicar</label>
              <input type="text" name="ccToApply" placeholder="CC a aplicar" value={newRecord.ccToApply} onChange={handleInputChange} />

              <div className="modal-buttons unified-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                    setImagePreview([]);
                  }}
                >
                  Cancelar
                </button>

                <button className="btn-primary" onClick={handleAddOrUpdateRecord}>
                  {editingRecord ? "Actualizar" : "Guardar"}
                </button>

                <label className="btn-export">
                  Importar Imagen
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleExportImage(e, "general")}
                  />
                </label>

                <button className="btn-surgery" onClick={openSurgeryModal}>
                  Expediente Cirugía
                </button>

                <button className="btn-surgery" onClick={openCareModal}>
                  Cuidados En Casa
                </button>
              </div>

              {imagePreview.length > 0 && (
                <div className="image-gallery" style={{ marginTop: 10 }}>
                  {imagePreview.map((img, idx) => (
                    <div key={idx} className="image-container">
                      <img
                        src={img}
                        alt="Preview"
                        className="image-preview"
                        onClick={() => setFullScreenImage(img)}
                      />
                      <button
                        className="delete-image-btn"
                        onClick={() => askDeleteImage("general", "new", img)}
                        title="Eliminar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Modal: Expediente Cirugía
        ========================= */}
      {showSurgeryModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target.classList.contains('modal-overlay')) setShowSurgeryModal(false); }}>
          <div className="modal" id={`surgery-${newSurgery.id || 'new'}`}>
            <div className="modal-header">
              <h2>{editingSurgery ? "Editar Expediente Quirúrgico" : "Expediente Quirúrgico"}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowSurgeryModal(false);
                  setEditingSurgery(null);
                  setNewSurgery(initialSurgeryRecord());
                  setSurgeryImagePreview([]);
                }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <label>Sucursal</label>
              <input type="text" name="branch" value={newSurgery.branch} onChange={handleSurgeryInputChange} />

              <label>Fecha</label>
              <input type="date" name="date" value={newSurgery.date} onChange={handleSurgeryInputChange} />

              <label>Hora</label>
              <input type="text" name="time" value={newSurgery.time} onChange={handleSurgeryInputChange} />

              <label>Nombre del propietario</label>
              <input type="text" name="owner" value={newSurgery.owner} onChange={handleSurgeryInputChange} />

              <label>Número de Identidad o Pasaporte</label>
              <input type="text" name="ownerId" value={newSurgery.ownerId} onChange={handleSurgeryInputChange} />

              <label>Nombre de la mascota</label>
              <input type="text" name="pet" value={newSurgery.pet} onChange={handleSurgeryInputChange} />

              <label>Especie</label>
              <select name="species" value={newSurgery.species} onChange={handleSurgeryInputChange}>
                <option value="">Seleccionar especie</option>
                {speciesOptions.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>

              {newSurgery.species === "Otro" && (
                <>
                  <label>Especifique Otra Especie</label>
                  <input
                    type="text"
                    name="otherSpecies"
                    placeholder="Especifique otra especie"
                    value={newSurgery.otherSpecies}
                    onChange={handleSurgeryInputChange}
                  />
                </>
              )}

              <label>Raza</label>
              <input type="text" name="breed" value={newSurgery.breed} onChange={handleSurgeryInputChange} />

              <label>Sexo</label>
              <select name="gender" value={newSurgery.gender} onChange={handleSurgeryInputChange}>
                <option value="">Seleccionar género</option>
                {genderOptions.map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>

              <label>Edad</label>
              <input type="text" name="age" value={newSurgery.age} onChange={handleSurgeryInputChange} />

              <label>Descripción del caso</label>
              <textarea name="caseDescription" value={newSurgery.caseDescription} onChange={handleSurgeryInputChange} />

              <label>Riesgos</label>
              {newSurgery.risks.map((risk, i) => (
                <input
                  key={i}
                  type="text"
                  name={`risk${i}`}
                  placeholder={`Riesgo ${i + 1}`}
                  value={risk}
                  onChange={(e) => handleSurgeryInputChange(e, i)}
                />
              ))}

              <div className="modal-buttons unified-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowSurgeryModal(false);
                    setEditingSurgery(null);
                    setNewSurgery(initialSurgeryRecord());
                    setSurgeryImagePreview([]);
                  }}
                >
                  Cancelar
                </button>

                <button className="btn-primary" onClick={handleAddOrUpdateSurgery}>
                  {editingSurgery ? "Actualizar" : "Guardar Cirugía"}
                </button>

                <label className="btn-export">
                  Importar Imagen
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleExportImage(e, "surgery")}
                  />
                </label>

                <button className="btn-surgery" onClick={openCareModal}>
                  Cuidados En Casa
                </button>
              </div>

              {surgeryImagePreview.length > 0 && (
                <div className="image-gallery">
                  {surgeryImagePreview.map((img, idx) => (
                    <div key={idx} className="image-container">
                      <img
                        src={img}
                        alt="Preview"
                        className="image-preview"
                        onClick={() => setFullScreenImage(img)}
                      />
                      <button
                        className="delete-image-btn"
                        title="Eliminar imagen"
                        onClick={() => askDeleteImage("surgery", "new", img)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Modal: Cuidados en Casa
        ========================= */}
      {showCareModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target.classList.contains('modal-overlay')) setShowCareModal(false); }}>
          <div className="modal" id={`care-${newCare.id || 'new'}`}>
            <div className="modal-header">
              <h2>{editingCare ? "Editar Cuidados en Casa" : "Cuidados en Casa"}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCareModal(false);
                  setEditingCare(null);
                  setNewCare(initialCareRecord());
                  setCareImagePreview([]);
                }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label>Propietario</label>
              <input type="text" name="owner" value={newCare.owner} onChange={handleCareInputChange} />

              <label>Mascota</label>
              <input type="text" name="pet" value={newCare.pet} onChange={handleCareInputChange} />

              <label>Especie</label>
              <input type="text" name="species" value={newCare.species} onChange={handleCareInputChange} />

              <label>Sucursal</label>
              <input type="text" name="branch" value={newCare.branch} onChange={handleCareInputChange} />

              <label>Instrucciones</label>
              <textarea name="instructions" value={newCare.instructions} onChange={handleCareInputChange} />

              <label>Medicaciones (fecha)</label>
              <input type="date" name="meds" value={newCare.meds} onChange={handleCareInputChange} />

              <label>Comida y Agua (fecha)</label>
              <input type="date" name="foodWater" value={newCare.foodWater} onChange={handleCareInputChange} />

              <label>Ejercicio</label>
              <input type="text" name="exercise" value={newCare.exercise} onChange={handleCareInputChange} />

              <label>Suturas</label>
              <input type="text" name="sutures" value={newCare.sutures} onChange={handleCareInputChange} />

              <label>Instrucciones de Seguimiento</label>
              <textarea name="followUp" value={newCare.followUp} onChange={handleCareInputChange} />

              <label>Monitoreo en Casa</label>
              <input type="text" name="monitoring" value={newCare.monitoring} onChange={handleCareInputChange} />

              <label>Contacto de Emergencia</label>
              <input type="text" name="emergencyContact" value={newCare.emergencyContact} onChange={handleCareInputChange} />

              <div className="modal-buttons unified-buttons">
                <button className="btn-cancel" onClick={() => {
                  setShowCareModal(false);
                  setEditingCare(null);
                  setNewCare(initialCareRecord());
                  setCareImagePreview([]);
                }}>
                  Cancelar
                </button>

                <button className="btn-primary" onClick={handleAddOrUpdateCare}>
                  {editingCare ? "Actualizar" : "Guardar"}
                </button>

                <label className="btn-export">
                  Importar Imagen
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleExportImage(e, "care")}
                  />
                </label>
              </div>

              {careImagePreview.length > 0 && (
                <div className="image-gallery">
                  {careImagePreview.map((img, idx) => (
                    <div key={idx} className="image-container">
                      <img
                        src={img}
                        alt="Cuidado"
                        className="record-image"
                        onClick={() => setFullScreenImage(img)}
                      />
                      <button
                        className="delete-image-btn"
                        onClick={() => askDeleteImage("care", "new", img)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Confirmación: eliminar expediente
        ========================= */}
      {deleteConfirm.show && (
        <div className="modal-overlay">
          <div className="delete-confirmation">
            <h3>Eliminar Expediente</h3>
            <div>
              <button className="btn-accept" onClick={confirmDeleteRecord}>
                Aceptar
              </button>
              <button className="btn-cancel-delete" onClick={cancelDeleteRecord}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Confirmación: eliminar imagen
        ========================= */}
      {deleteImageModal && (
        <div className="modal-overlay">
          <div className="delete-confirmation">
            <h3>¿Deseas eliminar la imagen?</h3>
            <div>
              <button className="btn-accept" onClick={confirmDeleteImage}>
                Sí
              </button>
              <button className="btn-cancel-delete" onClick={() => setDeleteImageModal(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;