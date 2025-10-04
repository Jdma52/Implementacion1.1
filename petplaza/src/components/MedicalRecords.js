// src/components/MedicalRecords.js
import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, Edit, Trash2, FileDown, Brush } from "lucide-react";
import jsPDF from "jspdf";
import "../CSS/MedicalRecords.css";
// ⬇️ Asegúrate de que la ruta coincida con tu estructura de proyecto
import logoSrc from "../assets/petigato_logo.jpeg";

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
  generalId: null,
  branch: "",
  datetime: "",
  owner: "",
  ownerPhone: "",
  ownerId: "",
  pet: "",
  species: "",
  otherSpecies: "",
  breed: "",
  gender: "",
  birthDate: "",
  caseDescription: "",
  risks: ["", "", "", "", "", ""],
  images: [],
  createdAt: null,
  fromGeneral: false,
});

const initialCareRecord = () => ({
  id: null,
  generalId: null,
  owner: "",
  ownerPhone: "",
  pet: "",
  species: "",
  branch: "",
  instructions: "",
  meds: "",
  foodWater: "",
  exercise: "",
  sutures: "",
  followUp: "",
  monitoring: "",
  emergencyContact: "",
  images: [],
  createdAt: null,
  fromGeneral: false,
});

/* =========================
 *   Utilidades fecha/hora
 * ========================= */
const pad2 = (n) => String(n).padStart(2, "0");
const nowLocalDateTimeValue = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${da}T${hh}:${mm}`;
};
const dateToLocalDateTimeValue = (dateStr, defaultTime = "09:00") => {
  if (!dateStr) return nowLocalDateTimeValue();
  return `${dateStr}T${defaultTime}`;
};
const formatLocalDateTime = (dt) => (dt ? new Date(dt).toLocaleString() : "—");

/* =========================
 *   Componente principal
 * ========================= */
const MedicalRecords = () => {
  /* ====== Estados raíz ====== */
  const [generalRecords, setGeneralRecords] = useState([]);
  const [surgeryRecords, setSurgeryRecords] = useState([]);
  const [careRecords, setCareRecords] = useState([]);

  /* ====== Filtros ====== */
  const [selectedPet, setSelectedPet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] = useState("Todos");

  /* ====== Menú desplegable NUEVO ====== */
  const [showDropdown, setShowDropdown] = useState(false);

  /* ====== Modales ====== */
  const [showModal, setShowModal] = useState(false); // General
  const [showSurgeryModal, setShowSurgeryModal] = useState(false); // Cirugía
  const [showCareModal, setShowCareModal] = useState(false); // Cuidados

  /* ====== Edición ====== */
  const [editingRecord, setEditingRecord] = useState(null); // General en edición
  const [editingSurgery, setEditingSurgery] = useState(null); // Cirugía en edición
  const [editingCare, setEditingCare] = useState(null); // Cuidados en edición

  /* ====== UI & mensajes ====== */
  const [confirmationMsg, setConfirmationMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "",
    id: null,
  });

  /* ====== Imágenes ====== */
  const [imagePreview, setImagePreview] = useState([]); // general (nuevo/edición)
  const [surgeryImagePreview, setSurgeryImagePreview] = useState([]); // cirugía (nuevo/edición)
  const [careImagePreview, setCareImagePreview] = useState([]); // cuidados (nuevo/edición)
  const [deleteImageModal, setDeleteImageModal] = useState(false);
  // imageToDelete = { scope: "general"|"surgery"|"care", recordId: "new"|number, img: base64 }
  const [imageToDelete, setImageToDelete] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  /* ====== Formularios ====== */
  const [newRecord, setNewRecord] = useState(initialGeneralRecord());
  const [newSurgery, setNewSurgery] = useState(initialSurgeryRecord());
  const [newCare, setNewCare] = useState(initialCareRecord());

  const pdfRef = useRef();

  /* ====== LOGO para PDF (pre-cargado a dataURL) ====== */
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  useEffect(() => {
    if (!logoSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setLogoDataUrl(dataUrl);
      } catch {
        setLogoDataUrl(null);
      }
    };
  }, []);

  /* ====== Catálogos ====== */
  const vets = ["Dra. María González", "Dr. Carlos López", "Dra. Ana Torres"];
  const speciesOptions = ["Perro", "Gato", "Ave", "Conejo", "Otro"];
  const genderOptions = ["Macho", "Hembra"];
  const bloodDonorOptions = ["Sí", "No"];

  // ➕ Listas ficticias para facilitar la creación de expedientes
  const demoOwners = [
    "María Pérez",
    "Carlos Ramírez",
    "Ana Torres",
    "Luis Fernández",
    "Carmen Díaz",
    "Jorge Castillo",
    "Patricia Gómez",
    "Ricardo Morales",
    "Sofía Herrera",
    "Daniela Ruiz",
  ];
  const demoPets = [
    "Luna",
    "Max",
    "Simba",
    "Coco",
    "Rocky",
    "Milo",
    "Nala",
    "Chispita",
    "Tom",
    "Bobby",
  ];

  /* ====== Acordeón ====== */
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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

  // Unir opciones (existentes + ficticias), únicas
  const uniqueMerge = (arr) =>
    Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

  const getAllPetOwnerOptions = () => {
    const all = [...generalRecords, ...surgeryRecords, ...careRecords];
    const seen = new Set();
    const out = [];
    for (const r of all) {
      const label = petOwnerKey(r.pet, r.species, r.owner);
      if (!label.trim()) continue;
      if (!seen.has(label)) {
        seen.add(label);
        out.push(label);
      }
    }
    return out;
  };

  const getUniqueOwners = () => {
    const all = [...generalRecords, ...surgeryRecords, ...careRecords].map((r) => r.owner);
    return uniqueMerge([...demoOwners, ...all]);
  };
  const getUniquePets = () => {
    const all = [...generalRecords, ...surgeryRecords, ...careRecords].map((r) => r.pet);
    return uniqueMerge([...demoPets, ...all]);
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
   *   Manejo de imágenes
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
            r.id === recordId ? { ...r, images: r.images.filter((i) => i !== img) } : r
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
            s.id === recordId ? { ...s, images: s.images.filter((i) => i !== img) } : s
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
            c.id === recordId ? { ...c, images: c.images.filter((i) => i !== img) } : c
          )
        );
      }
    }

    setDeleteImageModal(false);
    setImageToDelete(null);
    showTemporaryMessage("Imagen eliminada correctamente");
  };

  /* =========================
   *   Exportación PDF (unificada) + LOGO
   * ========================= */
  const handleExportPDF = (record, type) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // Color barra según tipo/origen
    let color = [0, 168, 132]; // general
    if (type === "surgery") color = record.fromGeneral ? [212, 68, 68] : [255, 165, 0];
    if (type === "care") color = record.fromGeneral ? [0, 123, 255] : [255, 165, 0];

    // Encabezado (barra superior)
    pdf.setFillColor(...color);
    pdf.rect(0, 0, pageW, 18, "F");

    // Logo (si está disponible), lo colocamos a la izquierda
    let titleX = margin;
    if (logoDataUrl) {
      try {
        const logoW = 24; // mm
        const logoH = 12; // mm
        const logoX = margin;
        const logoY = 3; // dentro de la barra
        pdf.addImage(logoDataUrl, "JPEG", logoX, logoY, logoW, logoH);
        titleX = margin + logoW + 4; // desplazar el título a la derecha del logo
      } catch {
        // si falla, no bloquea la exportación
      }
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(
      type === "general"
        ? "Expediente General"
        : type === "surgery"
        ? "Expediente Cirugía"
        : "Cuidados en Casa",
      titleX,
      12
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Generado: ${new Date().toLocaleString()}`, pageW - margin, 12, {
      align: "right",
    });

    y = 26;
    pdf.setTextColor(0, 0, 0);

    // Helpers de texto
    const maybePageBreak = (next = 6.5) => {
      if (y + next > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const row = (label, value) => {
      maybePageBreak();
      pdf.setFont("helvetica", "bold");
      pdf.text(`${label}:`, margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(value || "—"), margin + 50, y);
      y += 6.5;
    };

    const block = (title, text) => {
      const h = 5;
      maybePageBreak(h + 4);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...color);
      pdf.text(title, margin, y);
      pdf.setTextColor(0, 0, 0);
      y += h;
      const lines = pdf.splitTextToSize(text || "—", pageW - margin * 2);
      lines.forEach((ln) => {
        maybePageBreak();
        pdf.setFont("helvetica", "normal");
        pdf.text(ln, margin, y);
        y += 6;
      });
      y += 2;
    };

    // Contenido según tipo
    if (type === "general") {
      const leftStartY = y;
      ["Paciente", "Especie", "Raza", "Sexo", "Peso", "Color"].forEach((label) => {
        const val =
          label === "Paciente"
            ? record.pet
            : label === "Especie"
            ? record.species === "Otro"
              ? record.otherSpecies
              : record.species
            : label === "Raza"
            ? record.breed
            : label === "Sexo"
            ? record.gender
            : label === "Peso"
            ? record.weight
            : record.color;
        row(label, val);
      });

      let yRight = leftStartY;
      const rightX = pageW / 2 + 5;
      const rowRight = (label, value) => {
        if (yRight + 6.5 > pageH - margin) {
          pdf.addPage();
          yRight = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${label}:`, rightX, yRight);
        pdf.setFont("helvetica", "normal");
        pdf.text(String(value || "—"), rightX + 50, yRight);
        yRight += 6.5;
      };
      [
        ["Dueño", record.owner],
        ["Teléfono", record.ownerPhone],
        ["Sucursal", record.branch],
        ["Doctor", record.vet],
        ["Fecha", record.date],
        ["Donante Sangre", record.bloodDonor],
      ].forEach(([l, v]) => rowRight(l, v));

      y = Math.max(y, yRight) + 4;

      block("Exámenes", record.exams);
      block("Cirugía", record.surgery);
      block("CC a aplicar", record.ccToApply);
      block("Diagnóstico", record.diagnosis);
      block("Tratamiento", record.treatment);
      block("Notas", record.notes);

      // Vacunas
      maybePageBreak(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...color);
      pdf.text("Vacunas administradas", margin, y);
      pdf.setTextColor(0, 0, 0);
      y += 6;
      if (record.vaccinesAdministered?.length) {
        record.vaccinesAdministered.forEach((v) => {
          const lines = pdf.splitTextToSize(`• ${v}`, pageW - margin * 2);
          lines.forEach((ln) => {
            maybePageBreak();
            pdf.setFont("helvetica", "normal");
            pdf.text(ln, margin, y);
            y += 6;
          });
        });
      } else {
        maybePageBreak();
        pdf.text("—", margin, y);
        y += 6;
      }

      // Fechas
      y += 2;
      maybePageBreak(10);
      pdf.setDrawColor(230);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `Creado: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : "—"}   •   Modificado: ${
          record.modifiedAt ? new Date(record.modifiedAt).toLocaleString() : "No modificado"
        }`,
        margin,
        y
      );
      y += 8;
    }

    if (type === "surgery") {
      row("Sucursal", record.branch);
      row("Fecha y hora", formatLocalDateTime(record.datetime));
      row("Propietario", record.owner);
      row("Teléfono", record.ownerPhone);
      row("ID/Pasaporte", record.ownerId);
      row("Mascota", record.pet);
      row("Especie", record.species === "Otro" ? record.otherSpecies : record.species);
      row("Raza", record.breed);
      row("Sexo", record.gender);
      row("Fecha de nacimiento", record.birthDate || record.age || "—");
      block("Descripción del caso", record.caseDescription);

      const hasRisks = record.risks?.some((r) => r && r.trim());
      if (hasRisks) {
        maybePageBreak(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...color);
        pdf.text("Riesgos", margin, y);
        pdf.setTextColor(0, 0, 0);
        y += 6;
        record.risks.forEach((risk) => {
          if (!risk) return;
          const lines = pdf.splitTextToSize(`• ${risk}`, pageW - margin * 2);
          lines.forEach((ln) => {
            maybePageBreak();
            pdf.setFont("helvetica", "normal");
            pdf.text(ln, margin, y);
            y += 6;
          });
        });
        y += 2;
      }
    }

    if (type === "care") {
      row("Propietario", record.owner);
      row("Teléfono", record.ownerPhone);
      row("Mascota", record.pet);
      row("Especie", record.species);
      row("Sucursal", record.branch);
      block("Instrucciones", record.instructions);
      row("Medicaciones (fecha)", record.meds);
      row("Comida y Agua (fecha)", record.foodWater);
      row("Ejercicio", record.exercise);
      row("Suturas", record.sutures);
      block("Instrucciones de seguimiento", record.followUp);
      row("Monitoreo en casa", record.monitoring);
      row("Contacto de emergencia", record.emergencyContact);
    }

    // Imágenes (grilla 2xN)
    if (record.images?.length) {
      if (y + 12 > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...color);
      pdf.text("Imágenes asociadas", margin, y);
      pdf.setTextColor(0, 0, 0);
      y += 8;

      const cols = 2;
      const gutter = 8;
      const imgW = (pageW - margin * 2 - gutter) / cols;
      const imgH = imgW * 0.75;

      record.images.forEach((src, i) => {
        const col = i % cols;
        const rowIdx = Math.floor(i / cols);
        const x = margin + col * (imgW + gutter);
        const yCell = y + rowIdx * (imgH + gutter);

        if (yCell + imgH > pageH - margin) {
          pdf.addPage();
        }
        try {
          const yOffset = y + Math.floor(i / cols) * (imgH + gutter);
          pdf.addImage(src, "JPEG", x, yOffset, imgW, imgH);
        } catch {}
      });
    }

    // Pie
    pdf.setFontSize(9);
    pdf.setTextColor(130, 130, 130);
    pdf.text(
      "PetPlaza Hospivet • Documento generado automáticamente",
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );

    pdf.save(`${type}-${record.pet || "expediente"}.pdf`);
  };

  /* =========================
   *   General: inputs y CRUD
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

  // Abrir cirugía desde menú "Nuevo expediente" (NO autollenar, color naranja)
  const openSurgeryModal = () => {
    setNewSurgery({
      ...initialSurgeryRecord(),
      fromGeneral: false,
      datetime: nowLocalDateTimeValue(),
    });
    setEditingSurgery(null);
    setSurgeryImagePreview([]);
    setShowSurgeryModal(true);
  };

  // Abrir cirugía desde un General (autollenado, color normal rojo)
  const openSurgeryFromGeneral = () => {
    const ctx = editingRecord || newRecord;
    const base = initialSurgeryRecord();
    setNewSurgery({
      ...base,
      generalId: editingRecord ? editingRecord.id : null,
      branch: ctx.branch || "",
      datetime: ctx.date ? dateToLocalDateTimeValue(ctx.date) : nowLocalDateTimeValue(),
      owner: ctx.owner || "",
      ownerPhone: ctx.ownerPhone || "",
      pet: ctx.pet || "",
      species: ctx.species || "",
      otherSpecies: ctx.otherSpecies || "",
      breed: ctx.breed || "",
      gender: ctx.gender || "",
      birthDate: ctx.birthDate || "",
      fromGeneral: true,
    });
    setEditingSurgery(null);
    setSurgeryImagePreview([]);
    setShowSurgeryModal(true);
  };

  const handleAddOrUpdateSurgery = () => {
    if (!newSurgery.owner || !newSurgery.pet || !newSurgery.datetime) {
      alert("Completa Dueño, Mascota y Fecha y hora.");
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
  const handleCareInputChange = (e) => {
    const { name, value } = e.target;
    setNewCare((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir cuidados desde menú "Nuevo expediente" (NO autollenado, color naranja)
  const openCareModal = () => {
    setNewCare({ ...initialCareRecord(), fromGeneral: false });
    setEditingCare(null);
    setCareImagePreview([]);
    setShowCareModal(true);
  };

  // Abrir cuidados desde un General (autollenado, color normal azul)
  const openCareFromGeneral = () => {
    const ctx = editingRecord || newRecord;
    const base = initialCareRecord();
    setNewCare({
      ...base,
      generalId: editingRecord ? editingRecord.id : null,
      owner: ctx.owner || "",
      ownerPhone: ctx.ownerPhone || "",
      pet: ctx.pet || "",
      species: ctx.species || "",
      branch: ctx.branch || "",
      fromGeneral: true,
    });
    setEditingCare(null);
    setCareImagePreview([]);
    setShowCareModal(true);
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
   *   LIMPIADORES de formularios (brocha)
   * ========================= */
  const clearGeneralForm = () => {
    setNewRecord(initialGeneralRecord());
    setImagePreview([]);
    setEditingRecord(null);
  };

  const clearSurgeryForm = () => {
    const { fromGeneral, generalId } = newSurgery;
    setNewSurgery({
      ...initialSurgeryRecord(),
      fromGeneral,
      generalId,
      datetime: nowLocalDateTimeValue(),
    });
    setSurgeryImagePreview([]);
    setEditingSurgery(null);
  };

  const clearCareForm = () => {
    const { fromGeneral, generalId } = newCare;
    setNewCare({ ...initialCareRecord(), fromGeneral, generalId });
    setCareImagePreview([]);
    setEditingCare(null);
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
        <div
          className="image-modal-overlay active"
          onClick={() => setFullScreenImage(null)}
        >
          <img src={fullScreenImage} className="image-modal" alt="Full Preview" />
        </div>
      )}

      {/* Header */}
      <div className="medical-header">
        <h1>Expedientes</h1>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            position: "relative",
          }}
        >
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
            <button className="btn-primary" onClick={() => setShowDropdown((v) => !v)}>
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
                  setShowDropdown(false);
                  openSurgeryModal();
                }}
              >
                Quirúrgico
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  openCareModal();
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
          {getAllPetOwnerOptions().map((label, idx) => (
            <option key={idx} value={label}>
              {label}
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
          filteredGeneral.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <div
                className={`record-card ${isOpen ? "expanded" : "collapsed"} general-card`}
                key={r.id}
                id={`general-${r.id}`}
                onClick={() => toggleExpand(r.id)}
              >
                <div className="record-header">
                  <h3>Expediente General</h3>
                  <span>
                    {isOpen ? (
                      <>
                        Creado: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"} <br />
                        Modificado:{" "}
                        {r.modifiedAt
                          ? new Date(r.modifiedAt).toLocaleString()
                          : "No modificado"}{" "}
                        <br />
                        Doctor: {r.vet || "N/A"}
                      </>
                    ) : (
                      <>
                        {r.pet || "Mascota"} ({r.species || "—"}) • {r.owner || "Propietario"}{" "}
                        <br />
                        Doctor: {r.vet || "N/A"} • Fecha: {r.date || "—"}
                      </>
                    )}
                  </span>
                  <div className="card-buttons">
                    <button
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecord(r);
                      }}
                    >
                      <Edit size={16} /> Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteRecord("general", r.id);
                      }}
                    >
                      <Trash2 size={16} /> Borrar
                    </button>
                    <button
                      className="btn-export-pdf"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(r, "general");
                      }}
                    >
                      <FileDown size={16} /> Exportar PDF
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="record-body">
                    <div className="record-section">
                      <h4>Sucursal</h4>
                      <p>{r.branch || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Exámenes a realizar</h4>
                      <p>{r.exams || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Teléfono Propietario</h4>
                      <p>{r.ownerPhone || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Cirugía a realizar</h4>
                      <p>{r.surgery || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Diagnóstico</h4>
                      <p>{r.diagnosis || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Tratamiento</h4>
                      <p>{r.treatment || "N/A"}</p>
                    </div>
                    <div className="record-section">
                      <h4>Notas adicionales</h4>
                      <p>{r.notes || "N/A"}</p>
                    </div>

                    <div className="record-section">
                      <h4>Vacunas administradas</h4>
                      {r.modifiedAt && (
                        <p className="modified-msg">
                          Este expediente ha sido modificado con anterioridad.
                        </p>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullScreenImage(img);
                                }}
                              />
                              <button
                                className="delete-image-btn"
                                title="Eliminar imagen"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDeleteImage("general", r.id, img);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {/* ====== CIRUGÍAS ====== */}
        {(recordTypeFilter === "Todos" || recordTypeFilter === "Expediente cirugía") &&
          filteredSurgery.map((s) => {
            const isOpen = expandedId === s.id;
            return (
              <div
                className={`surgery-card ${!s.fromGeneral ? "orange" : ""} ${
                  isOpen ? "expanded" : "collapsed"
                }`}
                key={s.id}
                id={`surgery-${s.id}`}
                onClick={() => toggleExpand(s.id)}
              >
                <div className="record-header">
                  <h3>Expediente Cirugía</h3>
                  <span>
                    {isOpen ? (
                      <>
                        Creado: {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}{" "}
                        <br />
                        Sucursal: {s.branch || "N/A"}
                      </>
                    ) : (
                      <>
                        {s.pet || "Mascota"} ({s.species || "—"}) • {s.owner || "Propietario"}{" "}
                        <br />
                        Fecha y hora: {formatLocalDateTime(s.datetime)}
                      </>
                    )}
                  </span>
                  <div className="card-buttons">
                    <button
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSurgery(s);
                      }}
                    >
                      <Edit size={16} /> Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteRecord("surgery", s.id);
                      }}
                    >
                      <Trash2 size={16} /> Borrar
                    </button>
                    <button
                      className="btn-export-pdf"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(s, "surgery");
                      }}
                    >
                      <FileDown size={16} /> Exportar PDF
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="record-body">
                    <p>
                      <strong>Fecha y hora:</strong> {formatLocalDateTime(s.datetime)}
                    </p>
                    <p>
                      <strong>Propietario:</strong> {s.owner || "N/A"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {s.ownerPhone || "N/A"}
                    </p>
                    <p>
                      <strong>ID/Pasaporte:</strong> {s.ownerId || "N/A"}
                    </p>
                    <p>
                      <strong>Mascota:</strong> {s.pet || "N/A"}
                    </p>
                    <p>
                      <strong>Especie:</strong>{" "}
                      {s.species === "Otro" ? s.otherSpecies || "Otro" : s.species || "N/A"}
                    </p>
                    <p>
                      <strong>Raza:</strong> {s.breed || "N/A"}
                    </p>
                    <p>
                      <strong>Sexo:</strong> {s.gender || "N/A"}
                    </p>
                    <p>
                      <strong>Fecha de nacimiento:</strong> {s.birthDate || s.age || "N/A"}
                    </p>
                    <p>
                      <strong>Descripción del caso:</strong> {s.caseDescription || "N/A"}
                    </p>

                    {s.risks?.some((x) => x && x.trim()) ? (
                      <>
                        <p>
                          <strong>Riesgos:</strong>
                        </p>
                        <ul>{s.risks.map((rr, i) => (rr ? <li key={i}>{rr}</li> : null))}</ul>
                      </>
                    ) : (
                      <p>
                        <strong>Riesgos:</strong> N/A
                      </p>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullScreenImage(img);
                                }}
                              />
                              <button
                                className="delete-image-btn"
                                title="Eliminar imagen"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDeleteImage("surgery", s.id, img);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {/* ====== CUIDADOS EN CASA ====== */}
        {(recordTypeFilter === "Todos" || recordTypeFilter === "Cuidados de mascota") &&
          filteredCare.map((c) => {
            const isOpen = expandedId === c.id;
            return (
              <div
                className={`record-card ${isOpen ? "expanded" : "collapsed"} care-card ${
                  !c.fromGeneral ? "orange" : ""
                }`}
                key={c.id}
                id={`care-${c.id}`}
                onClick={() => toggleExpand(c.id)}
              >
                <div className="record-header">
                  <h3>Cuidados en Casa</h3>
                  <span>
                    {isOpen ? (
                      <>
                        Creado: {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}{" "}
                        <br />
                        Sucursal: {c.branch || "N/A"}
                      </>
                    ) : (
                      <>
                        {c.pet || "Mascota"} ({c.species || "—"}) • {c.owner || "Propietario"}
                      </>
                    )}
                  </span>
                </div>

                <div className="card-buttons">
                  <button
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCare(c);
                    }}
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteRecord("care", c.id);
                    }}
                  >
                    <Trash2 size={16} /> Borrar
                  </button>
                  <button
                    className="btn-export-pdf"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF(c, "care");
                    }}
                  >
                    <FileDown size={16} /> Exportar PDF
                  </button>
                </div>

                {isOpen && (
                  <div className="record-body">
                    <p>
                      <strong>Propietario:</strong> {c.owner || "N/A"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {c.ownerPhone || "N/A"}
                    </p>
                    <p>
                      <strong>Mascota:</strong> {c.pet || "N/A"}
                    </p>
                    <p>
                      <strong>Especie:</strong> {c.species || "N/A"}
                    </p>

                    <div className="record-section">
                      <h4>Instrucciones</h4>
                      <p>{c.instructions || "N/A"}</p>
                    </div>
                    <p>
                      <strong>Medicaciones (fecha):</strong> {c.meds || "N/A"}
                    </p>
                    <p>
                      <strong>Comida y Agua (fecha):</strong> {c.foodWater || "N/A"}
                    </p>
                    <p>
                      <strong>Ejercicio:</strong> {c.exercise || "N/A"}
                    </p>
                    <p>
                      <strong>Suturas:</strong> {c.sutures || "N/A"}
                    </p>
                    <div className="record-section">
                      <h4>Instrucciones de Seguimiento</h4>
                      <p>{c.followUp || "N/A"}</p>
                    </div>
                    <p>
                      <strong>Monitoreo en Casa:</strong> {c.monitoring || "N/A"}
                    </p>
                    <p>
                      <strong>Contacto de Emergencia:</strong> {c.emergencyContact || "N/A"}
                    </p>

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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullScreenImage(img);
                                }}
                              />
                              <button
                                className="delete-image-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDeleteImage("care", c.id, img);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* =========================
          Modal: Expediente General
        ========================= */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) setShowModal(false);
          }}
        >
          <div className="modal" id={`general-${newRecord.id || "new"}`}>
            <div className="modal-header">
              <h2>
                {editingRecord ? "Editar Expediente General" : "Nuevo Expediente General"}
              </h2>
              <button className="modal-clean" onClick={clearGeneralForm} title="Limpiar formulario">
                <Brush size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Dueño → menú desplegable (incluye ficticios) */}
              <label>Dueño</label>
              <select
                name="owner"
                value={newRecord.owner}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar dueño</option>
                {getUniqueOwners().map((o, idx) => (
                  <option key={idx} value={o}>{o}</option>
                ))}
              </select>

              <label>Teléfono Propietario</label>
              <input
                type="text"
                name="ownerPhone"
                placeholder="Teléfono del propietario"
                value={newRecord.ownerPhone}
                onChange={handleInputChange}
              />

              {/* Mascota → menú desplegable (incluye ficticias) */}
              <label>Mascota</label>
              <select
                name="pet"
                value={newRecord.pet}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar mascota</option>
                {getUniquePets().map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>

              <label>Especie</label>
              <select name="species" value={newRecord.species} onChange={handleInputChange}>
                <option value="">Seleccionar especie</option>
                {speciesOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
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
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <label>Raza</label>
              <input
                type="text"
                name="breed"
                placeholder="Raza"
                value={newRecord.breed}
                onChange={handleInputChange}
              />

              <label>Peso</label>
              <input
                type="text"
                name="weight"
                placeholder="Peso"
                value={newRecord.weight}
                onChange={handleInputChange}
              />

              <label>Color de Mascota</label>
              <input
                type="text"
                name="color"
                placeholder="Color"
                value={newRecord.color}
                onChange={handleInputChange}
              />

              <label>Donante de Sangre</label>
              <select name="bloodDonor" value={newRecord.bloodDonor} onChange={handleInputChange}>
                <option value="">Seleccionar opción</option>
                {bloodDonorOptions.map((b, idx) => (
                  <option key={idx} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <label>Doctor</label>
              <select name="vet" value={newRecord.vet} onChange={handleInputChange}>
                <option value="">Seleccionar doctor</option>
                {vets.map((v, idx) => (
                  <option key={idx} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <label>Fecha</label>
              <input type="date" name="date" value={newRecord.date} onChange={handleInputChange} />

              <label>Sucursal</label>
              <input
                type="text"
                name="branch"
                placeholder="Sucursal"
                value={newRecord.branch}
                onChange={handleInputChange}
              />

              <label>Exámenes a realizar</label>
              <input
                type="text"
                name="exams"
                placeholder="Exámenes"
                value={newRecord.exams}
                onChange={handleInputChange}
              />

              <label>Cirugía a realizar</label>
              <input
                type="text"
                name="surgery"
                placeholder="Cirugía a realizar"
                value={newRecord.surgery}
                onChange={handleInputChange}
              />

              <label>Diagnóstico</label>
              <input
                type="text"
                name="diagnosis"
                placeholder="Diagnóstico"
                value={newRecord.diagnosis}
                onChange={handleInputChange}
              />

              <label>Tratamiento</label>
              <textarea
                name="treatment"
                placeholder="Tratamiento"
                value={newRecord.treatment}
                onChange={handleInputChange}
              />

              <label>Notas adicionales</label>
              <textarea
                name="notes"
                placeholder="Notas adicionales"
                value={newRecord.notes}
                onChange={handleInputChange}
              />

              <label>Vacuna (agrega con marca de tiempo)</label>
              <select
                name="vaccinesField"
                value={newRecord.vaccinesField || ""}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar vacuna</option>
                {["Rabia", "Parvovirus", "Distemper", "Leptospirosis"].map((v, idx) => (
                  <option key={idx} value={v}>
                    {v}
                  </option>
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
              <input
                type="text"
                name="ccToApply"
                placeholder="CC a aplicar"
                value={newRecord.ccToApply}
                onChange={handleInputChange}
              />

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

                {/* Abrir modales derivados DESDE GENERAL */}
                <button className="btn-surgery" onClick={openSurgeryFromGeneral}>
                  Expediente Cirugía
                </button>

                <button className="btn-surgery" onClick={openCareFromGeneral}>
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) setShowSurgeryModal(false);
          }}
        >
          <div className="modal" id={`surgery-${newSurgery.id || "new"}`}>
            <div className="modal-header">
              <h2>{editingSurgery ? "Editar Expediente Quirúrgico" : "Expediente Quirúrgico"}</h2>
              <button className="modal-clean" onClick={clearSurgeryForm} title="Limpiar formulario">
                <Brush size={20} />
              </button>
            </div>

            <div className="modal-body">
              <label>Dueño</label>
              <select
                name="owner"
                value={newSurgery.owner}
                onChange={handleSurgeryInputChange}
              >
                <option value="">Seleccionar dueño</option>
                {getUniqueOwners().map((o, idx) => (
                  <option key={idx} value={o}>{o}</option>
                ))}
              </select>

              <label>Teléfono del propietario</label>
              <input
                type="text"
                name="ownerPhone"
                value={newSurgery.ownerPhone}
                onChange={handleSurgeryInputChange}
              />

              <label>Número de Identidad o Pasaporte</label>
              <input
                type="text"
                name="ownerId"
                value={newSurgery.ownerId}
                onChange={handleSurgeryInputChange}
              />

              <label>Nombre de la mascota</label>
              <select
                name="pet"
                value={newSurgery.pet}
                onChange={handleSurgeryInputChange}
              >
                <option value="">Seleccionar mascota</option>
                {getUniquePets().map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>

              <label>Sucursal</label>
              <input
                type="text"
                name="branch"
                value={newSurgery.branch}
                onChange={handleSurgeryInputChange}
              />

              <label>Fecha y hora</label>
              <input
                type="datetime-local"
                name="datetime"
                value={newSurgery.datetime}
                onChange={(e) => {
                  let v = e.target.value;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                    v = `${v}T${pad2(new Date().getHours())}:${pad2(new Date().getMinutes())}`;
                  }
                  setNewSurgery((prev) => ({ ...prev, datetime: v }));
                }}
              />

              <label>Especie</label>
              <select
                name="species"
                value={newSurgery.species}
                onChange={handleSurgeryInputChange}
              >
                <option value="">Seleccionar especie</option>
                {speciesOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
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
              <input
                type="text"
                name="breed"
                value={newSurgery.breed}
                onChange={handleSurgeryInputChange}
              />

              <label>Sexo</label>
              <select
                name="gender"
                value={newSurgery.gender}
                onChange={handleSurgeryInputChange}
              >
                <option value="">Seleccionar género</option>
                {genderOptions.map((g, idx) => (
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <label>Fecha de nacimiento</label>
              <input
                type="date"
                name="birthDate"
                value={newSurgery.birthDate}
                onChange={handleSurgeryInputChange}
              />

              <label>Descripción del caso</label>
              <textarea
                name="caseDescription"
                value={newSurgery.caseDescription}
                onChange={handleSurgeryInputChange}
              />

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

                {!newSurgery.fromGeneral && !editingSurgery && (
                  <button className="btn-care" onClick={() => openCareModal()}>
                    Cuidados en Casa
                  </button>
                )}
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) setShowCareModal(false);
          }}
        >
          <div className="modal" id={`care-${newCare.id || "new"}`}>
            <div className="modal-header">
              <h2>{editingCare ? "Editar Cuidados en Casa" : "Cuidados en Casa"}</h2>
              <button className="modal-clean" onClick={clearCareForm} title="Limpiar formulario">
                <Brush size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label>Propietario</label>
              <select
                name="owner"
                value={newCare.owner}
                onChange={handleCareInputChange}
              >
                <option value="">Seleccionar dueño</option>
                {getUniqueOwners().map((o, idx) => (
                  <option key={idx} value={o}>{o}</option>
                ))}
              </select>

              <label>Teléfono</label>
              <input
                type="text"
                name="ownerPhone"
                value={newCare.ownerPhone}
                onChange={handleCareInputChange}
              />

              <label>Mascota</label>
              <select
                name="pet"
                value={newCare.pet}
                onChange={handleCareInputChange}
              >
                <option value="">Seleccionar mascota</option>
                {getUniquePets().map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>

              <label>Especie</label>
              <select name="species" value={newCare.species} onChange={handleCareInputChange}>
                <option value="">Seleccionar especie</option>
                {speciesOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <label>Sucursal</label>
              <input
                type="text"
                name="branch"
                value={newCare.branch}
                onChange={handleCareInputChange}
              />

              <label>Instrucciones</label>
              <textarea
                name="instructions"
                value={newCare.instructions}
                onChange={handleCareInputChange}
              />

              <label>Medicaciones (fecha)</label>
              <input type="date" name="meds" value={newCare.meds} onChange={handleCareInputChange} />

              <label>Comida y Agua (fecha)</label>
              <input
                type="date"
                name="foodWater"
                value={newCare.foodWater}
                onChange={handleCareInputChange}
              />

              <label>Ejercicio</label>
              <input
                type="text"
                name="exercise"
                value={newCare.exercise}
                onChange={handleCareInputChange}
              />

              <label>Suturas</label>
              <input
                type="text"
                name="sutures"
                value={newCare.sutures}
                onChange={handleCareInputChange}
              />

              <label>Instrucciones de Seguimiento</label>
              <textarea
                name="followUp"
                value={newCare.followUp}
                onChange={handleCareInputChange}
              />

              <label>Monitoreo en Casa</label>
              <input
                type="text"
                name="monitoring"
                value={newCare.monitoring}
                onChange={handleCareInputChange}
              />

              <label>Contacto de Emergencia</label>
              <input
                type="text"
                name="emergencyContact"
                value={newCare.emergencyContact}
                onChange={handleCareInputChange}
              />

              <div className="modal-buttons unified-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowCareModal(false);
                    setEditingCare(null);
                    setCareImagePreview([]);
                  }}
                >
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
