// =========================================================
// 📄 MedicalRecords.js
// Módulo de gestión de expedientes — PETPLAZA HOSPIVET
// Incluye: formularios, vista previa y exportación PDF
// con soporte de imágenes, encabezado con logo y marca de agua.
// =========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileDown,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import jsPDF from "jspdf";
import "../CSS/MedicalRecords.css";
import GeneralRecordForm from "./GeneralRecordForm";
import SurgeryRecordForm from "./SurgeryRecordForm";
import HomeCareRecordForm from "./HomeCareRecordForm";
import RecordPreviewModal from "./RecordPreviewModal";
import logo from "../assets/petigato_logo.jpeg";

const seedData = [
  {
    id: 1,
    type: "Expediente General",
    color: "#00a884",
    pet: "Rocky",
    species: "Perro",
    gender: "Macho",
    owner: "Carlos Gómez",
    ownerPhone: "+504 9999-9999",
    breed: "Labrador",
    weight: "25 kg",
    colorName: "Café con blanco",
    bloodDonor: "Sí",
    doctor: "Dr. Eduardo Matamoros",
    date: "2025-10-14",
    branch: "Sucursal Central",
    tests: "Sangre",
    surgeryPlanned: "Quebradura de cadera",
    diagnosis: "Rabia",
    treatment: "Aplicar vacuna",
    notes: "Mantener lejos de adultos mayores.",
    vaccines: [{ label: "Parvovirus N", when: "2025-10-15 04:02" }],
    cc: "10 cc",
    createdAt: "2025-10-15T04:30:00",
    updatedAt: "2025-10-16T02:35:00",
    images: [
      {
        id: "img-1",
        url: "https://i.pinimg.com/736x/8f/0f/33/8f0f33cf47f2b1b8888b2cb75a44c62b.jpg",
      },
      {
        id: "img-2",
        url: "https://i.pinimg.com/564x/62/cc/f5/62ccf5e7ce48f9ef9d64a7de3281ccba.jpg",
      },
    ],
  },
];

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [editData, setEditData] = useState(null);
  const [tempRecord, setTempRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterPet, setFilterPet] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => setRecords(seedData), []);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const pets = useMemo(
    () => Array.from(new Set(records.map((r) => r.pet))),
    [records]
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const okPet = !filterPet || r.pet === filterPet;
      const okType = filterType === "Todos" || r.type === filterType;
      const q = query.trim().toLowerCase();
      const okQ =
        !q ||
        [r.pet, r.owner, r.doctor, r.type, r.species, r.breed, r.diagnosis]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q));
      return okPet && okType && okQ;
    });
  }, [records, filterPet, filterType, query]);

  function onCreate(type) {
    setEditData(null);
    setTempRecord(null);
    setActiveModal(type);
    setMenuOpen(false);
  }

  function onEdit(record) {
    setEditData(record);
    if (record.type === "Expediente General") setActiveModal("general");
    if (record.type === "Expediente Cirugía") setActiveModal("surgery");
    if (record.type === "Cuidados en Casa") setActiveModal("care");
  }

  function handleLinkRecord(type, data) {
    const baseData = {
      pet: data.pet || editData?.pet || "",
      species: data.species || editData?.species || "",
      gender: data.gender || editData?.gender || "",
      owner: data.owner || editData?.owner || "",
      ownerPhone: data.ownerPhone || editData?.ownerPhone || "",
      breed: data.breed || editData?.breed || "",
      doctor: data.doctor || editData?.doctor || "",
      branch: data.branch || editData?.branch || "",
      date: data.date || editData?.date || "",
    };
    const cloned = JSON.parse(JSON.stringify(baseData));
    setTempRecord(cloned);
    setEditData(cloned);
    setActiveModal(type);
  }

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function onSave(upsert) {
    const now = new Date().toISOString();
    const recordWithTimestamps = {
      ...upsert,
      createdAt: upsert.createdAt || now,
      updatedAt: upsert.id ? now : upsert.createdAt || now,
    };

    setRecords((prev) => {
      if (recordWithTimestamps.id) {
        showToast("edit", "✏️ Expediente editado con éxito");
        return prev.map((r) =>
          r.id === recordWithTimestamps.id ? recordWithTimestamps : r
        );
      }
      showToast("success", "📁 Expediente creado correctamente");
      return [...prev, { ...recordWithTimestamps, id: Date.now() }];
    });

    setActiveModal(null);
    setEditData(null);
    setTempRecord(null);
  }

  /* =========================================================
     FUNCIONES DE UTILIDAD (PDF)
     ========================================================= */

  const toDataURL = async (url) => {
    if (typeof url === "string" && url.startsWith("data:")) return url;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      return await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // 🔧 Versión ajustada de renderImagesSection
  async function renderImagesSection({ pdf, record, y, themeColorRGB, drawHeader }) {
    const marginX = 15;
    const maxY = 260;
    const title = "Imágenes asociadas";

    if (!record.images?.length) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...themeColorRGB);
      pdf.text(title, marginX, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80);
      pdf.text("No se adjuntaron imágenes.", marginX, y + 6);
      return y + 14;
    }

    if (y + 10 > maxY) {
      pdf.addPage();
      await drawHeader();
      y = 35;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...themeColorRGB);
    pdf.text(title, marginX, y);
    y += 6;

    // 🔸 Tamaños por tipo de expediente
      //    imgW = ancho (mm)
      //    imgH = alto  (mm)
    let imgW = 70;  // 🔹 tamaño por defecto (Expediente General)
    let imgH = 50; // 🔹 tamaño por defecto (Expediente General)

    if (record.type === "Expediente Cirugía") {
      imgW = 90; // 🔸 aumenta el ancho para los de cirugía
      imgH = 60; // 🔸 aumenta el alto para los de cirugía
    } else if (record.type === "Cuidados en Casa") {
      imgW = 90;  // 🔸 tamaño aún mayor para cuidados en casa
      imgH = 60;   // 🔸 tamaño aún mayor para cuidados en casa
    }

    // 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸 🔸
    const gap = 10; // 🧩 separación horizontal y vertical entre imágenes
    let x = marginX;

    for (const imgObj of record.images) {
      if (y + imgH > maxY) {
        pdf.addPage();
        await drawHeader();
        y = 35;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...themeColorRGB);
        pdf.text(`${title} (continuación)`, marginX, y);
        y += 6;
      }
      try {
        const data = await toDataURL(imgObj.url);
        if (data) pdf.addImage(data, "JPEG", x, y, imgW, imgH);
        x += imgW + gap;
        if (x + imgW > 210 - marginX) {
          x = marginX;
          y += imgH + gap;
        }
      } catch {}
    }

    y += 4;
    return y;
  }

  /* =========================================================
     EXPORTACIÓN PDF COMPLETA
     ========================================================= */
  async function exportPDF(record) {
    const pdf = new jsPDF("p", "mm", "a4");
    const marginX = 15;

    let theme = {
      color: [0, 168, 132],
      title: "Expediente General",
      fileName: `general-${record.pet}.pdf`,
    };
    if (record.type === "Expediente Cirugía") {
      theme = {
        color: [239, 68, 68],
        title: "Expediente Quirúrgico",
        fileName: `cirugia-${record.pet}.pdf`,
      };
    } else if (record.type === "Cuidados en Casa") {
      theme = {
        color: [0, 123, 255],
        title: "Expediente de Cuidados en Casa",
        fileName: `cuidados-${record.pet}.pdf`,
      };
    }

    const drawHeader = async () => {
      pdf.setFillColor(...theme.color);
      pdf.rect(0, 0, 210, 30, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(15);
      pdf.text(theme.title, marginX, 13);

      try {
        const img = await toDataURL(logo);
        pdf.addImage(img, "JPEG", 165, 5, 35, 18);
      } catch {}

      const fmt = (iso) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString("es-HN")} — ${d.toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`;
      };

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(240, 240, 240);
      if (record.createdAt) pdf.text(`Creado: ${fmt(record.createdAt)}`, marginX, 22);
      if (record.updatedAt && record.updatedAt !== record.createdAt)
        pdf.text(`Modificado: ${fmt(record.updatedAt)}`, marginX, 27);
    };

    const drawFooter = () => {
      const pages = pdf.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(160);
        pdf.text("Generado por el Sistema de PETPLAZA HOSPIVET", 105, 285, {
          align: "center",
        });
      }
    };

    await drawHeader();
    let y = 40;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    // =====================================================
    // 🩺 EXPEDIENTE GENERAL
    // =====================================================
    if (record.type === "Expediente General") {
      const rows = [
        ["Paciente:", record.pet, "Dueño:", record.owner],
        ["Especie:", record.species, "Teléfono:", record.ownerPhone],
        ["Raza:", record.breed, "Sucursal:", record.branch],
        ["Sexo:", record.gender, "Doctor:", record.doctor],
        ["Peso:", record.weight, "Fecha:", record.date],
        ["Color:", record.colorName, "Donante Sangre:", record.bloodDonor],
      ];

      const leftX = marginX - 5;
      const rightX = 108;
      const lh = 8;

      rows.forEach((r, i) => {
        const offset = y + 10 + i * lh;
        pdf.setFont("helvetica", "bold");
        pdf.text(r[0], leftX, offset);
        pdf.setFont("helvetica", "normal");
        pdf.text(r[1] || "-", leftX + 35, offset);
        pdf.setFont("helvetica", "bold");
        pdf.text(r[2], rightX, offset);
        pdf.setFont("helvetica", "normal");
        pdf.text(r[3] || "-", rightX + 35, offset);
      });
      y += rows.length * lh + 15;

      const sections = [
        ["Exámenes", record.tests],
        ["Cirugía", record.surgeryPlanned],
        ["CC a aplicar", record.cc],
        ["Diagnóstico", record.diagnosis],
        ["Tratamiento", record.treatment],
        ["Notas", record.notes],
      ];

      for (const [title, value] of sections) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...theme.color);
        pdf.text(title, marginX, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0);
        const split = pdf.splitTextToSize(value || "N/A", 180);
        pdf.text(split, marginX, y + 6);
        y += split.length * 6 + 10;
      }

      if (record.vaccines?.length) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...theme.color);
        pdf.text("Vacunas administradas", marginX, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0);
        record.vaccines.forEach((v, i) =>
          pdf.text(`• ${v.label} (${v.when})`, marginX, y + 8 + i * 6)
        );
        y += 12 + record.vaccines.length * 6;
      }

      y = await renderImagesSection({
        pdf,
        record,
        y,
        themeColorRGB: theme.color,
        drawHeader,
      });
    }

    // =====================================================
    // 🩹 EXPEDIENTE QUIRÚRGICO
    // =====================================================
    if (record.type === "Expediente Cirugía") {
      const info = [
        ["Dueño:", record.owner, "Teléfono:", record.ownerPhone],
        ["Identidad:", record.identityNumber || record.idCard || "-", "Mascota:", record.pet],
        ["Especie:", record.species, "Raza:", record.breed],
        ["Sexo:", record.gender, "Doctor:", record.doctor],
        ["Sucursal:", record.branch, "Fecha:", record.date],
        ["Tipo de Cirugía:", record.surgeryType, "", ""],
      ];

      info.forEach((row, i) => {
        const offset = y + 10 + i * 8;
        pdf.setFont("helvetica", "bold");
        pdf.text(row[0], marginX, offset);
        pdf.setFont("helvetica", "normal");
        pdf.text(row[1] || "-", marginX + 40, offset);
        if (row[2]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(row[2], 110, offset);
          pdf.setFont("helvetica", "normal");
          pdf.text(row[3] || "-", 150, offset);
        }
      });
      y += info.length * 8 + 12;

      const risksList = [
        record.risk1,
        record.risk2,
        record.risk3,
        record.risk4,
        record.risk5,
        record.risk6,
      ].filter((v) => v && String(v).trim() !== "");

      const risksText = risksList.length
        ? risksList.map((r) => `• ${r}`).join("\n")
        : "N/A";

      const sections = [
        ["Descripción del Caso", record.caseDescription],
        ["Riesgos", risksText],
        ["Notas", record.notes],
      ];

      for (const [title, value] of sections) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...theme.color);
        pdf.text(title, marginX, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0);
        const split = pdf.splitTextToSize(value || "N/A", 180);
        pdf.text(split, marginX, y + 6);
        y += split.length * 6 + 10;
      }

      y = await renderImagesSection({
        pdf,
        record,
        y,
        themeColorRGB: theme.color,
        drawHeader,
      });
    }

    // =====================================================
    // 🏡 EXPEDIENTE DE CUIDADOS EN CASA
    // =====================================================
    if (record.type === "Cuidados en Casa") {
      const info = [
        ["Dueño:", record.owner, "Teléfono:", record.ownerPhone],
        ["Mascota:", record.pet, "Especie:", record.species],
        ["Sucursal:", record.branch, "Fecha:", record.date],
        ["Tipo:", record.type, "", ""],
      ];

      info.forEach((row, i) => {
        const offset = y + 10 + i * 8;
        pdf.setFont("helvetica", "bold");
        pdf.text(row[0], marginX, offset);
        pdf.setFont("helvetica", "normal");
        pdf.text(row[1] || "-", marginX + 40, offset);
        if (row[2]) {
          pdf.setFont("helvetica", "bold");
          pdf.text(row[2], 110, offset);
          pdf.setFont("helvetica", "normal");
          pdf.text(row[3] || "-", 150, offset);
        }
      });
      y += info.length * 8 + 10;

      const sections = [
        ["Instrucciones", record.instructions],
        ["Medicamentos", record.medication],
        ["Comida y Agua", record.foodWater],
        ["Ejercicio", record.exercise],
        ["Suturas", record.sutures],
        ["Instrucciones de Seguimiento", record.followupInstructions],
        ["Monitoreo en Casa", record.monitoredAtHome],
        ["Contacto de Emergencia", record.emergencyContact],
      ];

      for (const [title, value] of sections) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...theme.color);
        pdf.text(title, marginX, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0);
        const split = pdf.splitTextToSize(value || "N/A", 180);
        pdf.text(split, marginX, y + 6);
        y += split.length * 6 + 10;
      }

      y = await renderImagesSection({
        pdf,
        record,
        y,
        themeColorRGB: theme.color,
        drawHeader,
      });
    }

    drawFooter();
    pdf.save(theme.fileName);
  }

  /* =========================================================
     INTERFAZ — LISTADO Y ACCIONES
     ========================================================= */
  function confirmDelete() {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    showToast("delete", "🗑️ Expediente eliminado correctamente");
    setDeleteTarget(null);
  }

  return (
    <div className="medical-section">
      <div className="header-bar">
        <h1>Expedientes</h1>
        <div className="new-record" ref={menuRef}>
          <button className="btn-new" onClick={() => setMenuOpen((s) => !s)}>
            <Plus size={18} /> Nuevo Expediente
          </button>
          {menuOpen && (
            <div className="menu">
              <button onClick={() => onCreate("general")}>Expediente General</button>
              <button onClick={() => onCreate("surgery")}>Quirúrgico</button>
              <button onClick={() => onCreate("care")}>Cuidados en Casa</button>
            </div>
          )}
        </div>
      </div>

      <div className="filters">
        <select className="ctl" value={filterPet} onChange={(e) => setFilterPet(e.target.value)}>
          <option value="">Seleccionar mascota</option>
          {pets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select className="ctl" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="Expediente General">Expediente General</option>
          <option value="Expediente Cirugía">Expediente Cirugía</option>
          <option value="Cuidados en Casa">Cuidados en Casa</option>
        </select>

        <div className="search ctl">
          <Search className="ico" size={18} />
          <input
            placeholder="Buscar en expedientes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="cards">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="card"
            style={{ borderLeftColor: r.color }}
            onClick={() => setPreviewData(r)}
          >
            <header className="card-head">
              <h3>{r.type}</h3>
              <p>
                {r.pet} ({r.species}) • {r.owner}
              </p>
              <p className="sub">
                Doctor: {r.doctor || "-"} • Fecha: {r.date}
              </p>
            </header>
            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn edit" onClick={() => onEdit(r)}>
                <Edit size={16} /> Editar
              </button>
              <button className="btn del" onClick={() => setDeleteTarget(r)}>
                <Trash2 size={16} /> Borrar
              </button>
              <button className="btn pdf" onClick={() => exportPDF(r)}>
                <FileDown size={16} /> Exportar PDF
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeModal === "general" && (
        <GeneralRecordForm
          editData={editData || tempRecord}
          onClose={() => {
            setActiveModal(null);
            setEditData(null);
          }}
          onSave={onSave}
          onLink={handleLinkRecord}
        />
      )}
      {activeModal === "surgery" && (
        <SurgeryRecordForm
          editData={editData || tempRecord}
          onClose={() => {
            setActiveModal(null);
            setEditData(null);
          }}
          onSave={onSave}
          onLink={handleLinkRecord}
        />
      )}
      {activeModal === "care" && (
        <HomeCareRecordForm
          editData={editData || tempRecord}
          onClose={() => {
            setActiveModal(null);
            setEditData(null);
          }}
          onSave={onSave}
          onLink={handleLinkRecord}
        />
      )}

      {deleteTarget && (
        <div className="overlay">
          <div className="confirm neon-zoom">
            <AlertTriangle size={42} color="#d44" />
            <h3>¿Eliminar expediente?</h3>
            <p>
              Se eliminará <b>{deleteTarget.type}</b> de <b>{deleteTarget.pet}</b>.
            </p>
            <div className="row">
              <button className="yes" onClick={confirmDelete}>
                Sí, eliminar
              </button>
              <button className="no" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <RecordPreviewModal record={previewData} onClose={() => setPreviewData(null)} />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" && <CheckCircle2 size={20} />}
          {toast.type === "delete" && <AlertTriangle size={20} />}
          {toast.type === "edit" && <Pencil size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
