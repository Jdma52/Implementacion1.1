// src/components/RecordPreviewModal.js
import React, { useEffect, useState } from "react";
import { X, FileText, User, Dog, ClipboardList } from "lucide-react";
import "../CSS/RecordPreviewModal.css";

export default function RecordPreviewModal({ record, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose?.(), 250);
  };

  if (!record) return null;

  const recordType =
    record.type?.toLowerCase().includes("cirugía")
      ? "surgery"
      : record.type?.toLowerCase().includes("cuidados")
      ? "care"
      : "general";

  const themeColor =
    recordType === "surgery"
      ? "#ef4444"
      : recordType === "care"
      ? "#007bff"
      : "#00a884";

  return (
    <div className="record-preview-modal" key={record.id}>
      <div
        className={`preview-overlay ${closing ? "closing" : ""}`}
        onMouseDown={(e) => {
          if (e.target.classList.contains("preview-overlay")) handleClose();
        }}
      >
        <div className={`preview-modal ${recordType} ${closing ? "closing" : ""}`}>
          {/* ENCABEZADO */}
          <header className="preview-header">
            <div className="icon-title">
              <FileText size={26} color={themeColor} />
              <h2>{record.type || "Expediente"}</h2>
            </div>
            <button className="btn-close" onClick={handleClose}>
              <X size={22} />
            </button>
          </header>

          {/* CUERPO */}
          <div className="preview-body">
            <h3 className="pet-title" style={{ color: themeColor }}>
              <Dog size={18} /> {record.pet || "Mascota desconocida"}{" "}
              {record.species && `(${record.species})`}
            </h3>

            <p className="owner-info">
              <User size={16} /> Dueño: {record.owner || "Sin registro"}{" "}
              {record.ownerPhone && `• Tel: ${record.ownerPhone}`}
            </p>

            <hr />

            {/* GRID DE DATOS */}
            <div className="record-grid">
              {/* 🟢 GENERAL */}
              {recordType === "general" && (
                <>
                  <Info label="Doctor" value={record.doctor} />
                  <Info label="Fecha" value={record.date} />
                  <Info label="Sucursal" value={record.branch} />
                  <Info label="Peso" value={record.weight} />
                  <Info label="Raza" value={record.breed} />
                  <Info label="Color Mascota" value={record.colorName} />
                  <Info label="Donante de Sangre" value={record.bloodDonor} />
                  <Info label="Exámenes" value={record.tests} />
                  <Info label="Diagnóstico" value={record.diagnosis} />
                  <Info label="Tratamiento" value={record.treatment} />
                </>
              )}

              {/* 🔴 CIRUGÍA */}
              {recordType === "surgery" && (
                <>
                  <Info label="Doctor Responsable" value={record.doctor} />
                  <Info label="Fecha de Cirugía" value={record.date} />
                  <Info label="Sucursal" value={record.branch} />
                  <Info label="Número de Identidad / Pasaporte" value={record.identityNumber} />
                  <Info label="Tipo de Cirugía" value={record.surgeryType} />
                  <Info label="Anestésico Utilizado" value={record.anesthetic} />
                  <Info label="Descripción del Caso" value={record.caseDescription} />
                  <Info label="Riesgo 1" value={record.risk1} />
                  <Info label="Riesgo 2" value={record.risk2} />
                  <Info label="Riesgo 3" value={record.risk3} />
                  <Info label="Riesgo 4" value={record.risk4} />
                  <Info label="Riesgo 5" value={record.risk5} />
                  <Info label="Riesgo 6" value={record.risk6} />
                </>
              )}

              {/* 🔵 CUIDADOS EN CASA */}
              {recordType === "care" && (
                <>
                  <Info label="Doctor" value={record.doctor} />
                  <Info label="Fecha" value={record.date} />
                  <Info label="Sucursal" value={record.branch} />
                  <Info label="Instrucciones Generales" value={record.instructions} />
                  <Info label="Medicamento" value={record.medication} />
                  <Info label="Fecha de Inicio de Medicamento" value={record.medicationDate} />
                  <Info label="Alimentación e Hidratación" value={record.foodWater} />
                  <Info label="Fecha de Inicio de Alimentación" value={record.foodWaterDate} />
                  <Info label="Ejercicio" value={record.exercise} />
                  <Info label="Suturas" value={record.sutures} />
                  <Info label="Instrucciones de Seguimiento" value={record.followupInstructions} />
                  <Info label="Monitoreo en Casa" value={record.monitoredAtHome} />
                  <Info label="Contacto de Emergencia" value={record.emergencyContact} />
                </>
              )}
            </div>

            {/* NOTAS */}
            {record.notes && (
              <div className={`notes-box ${recordType}`}>
                <ClipboardList size={18} color={themeColor} />{" "}
                <b>Notas adicionales:</b>
                <p>{record.notes}</p>
              </div>
            )}

            {/* VACUNAS */}
            {record.vaccines?.length > 0 && recordType === "general" && (
              <div className={`vaccines-box ${recordType}`}>
                <h4 style={{ color: themeColor }}>Vacunas administradas</h4>
                <ul>
                  {record.vaccines.map((v, i) => (
                    <li key={i}>
                      💉 {v.label} ({v.when})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* IMÁGENES */}
            {record.images?.length > 0 && (
              <div className="images-section">
                <h4>Imágenes asociadas</h4>
                <div className="images-grid">
                  {record.images.map((img) => (
                    <img key={img.id} src={img.url} alt="Evidencia" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTE REUTILIZABLE DE INFO */
function Info({ label, value }) {
  if (!value) return null;
  return (
    <div className="info-item">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}
