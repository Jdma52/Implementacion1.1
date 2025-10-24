// src/components/HomeCareRecordForm.js
import React, { useEffect, useState } from "react";
import { X, Brush, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import "../CSS/HomeCareRecordForm.css";

export default function HomeCareRecordForm({ onClose, onSave, editData, onLink }) {
  /* =========================================================
     🎯 ESTADO INICIAL DEL FORMULARIO
  ========================================================= */
  const [form, setForm] = useState({
    id: undefined,
    type: "Cuidados en Casa",
    color: "#007bff",
    owner: "",
    ownerPhone: "",
    pet: "",
    species: "",
    branch: "",
    instructions: "",
    medication: "",
    medicationDate: "",
    foodWater: "",
    foodWaterDate: "",
    exercise: "",
    sutures: "",
    followupInstructions: "",
    monitoredAtHome: "",
    emergencyContact: "",
    date: "",
    doctor: "",
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [viewer, setViewer] = useState(null);
  const [notif, setNotif] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [closing, setClosing] = useState(false);

  /* =========================================================
     🧩 CARGAR DATOS EN MODO EDICIÓN
  ========================================================= */
  useEffect(() => {
    if (editData) setForm((f) => ({ ...f, ...editData }));
  }, [editData]);

  /* =========================================================
     🧭 VALIDACIÓN DE CAMPOS
  ========================================================= */
  function validate() {
    const required = [
      "owner",
      "ownerPhone",
      "pet",
      "species",
      "branch",
      "instructions",
      "medication",
      "medicationDate",
      "foodWater",
      "foodWaterDate",
      "exercise",
      "sutures",
      "followupInstructions",
      "monitoredAtHome",
      "emergencyContact",
    ];

    const newErrors = {};

    required.forEach((key) => {
      if (!form[key] || form[key].trim() === "") {
        newErrors[key] = "⚠️ Requerido";
      }
    });

    // Validar formato de teléfono hondureño
    if (form.ownerPhone && !/^\+504\s?\d{4}-\d{4}$/.test(form.ownerPhone)) {
      newErrors.ownerPhone = "⚠️ Formato +504 XXXX-XXXX";
    }

    // Validar contacto de emergencia: puede incluir letras, espacios, +, -, paréntesis, números.
    if (
      form.emergencyContact &&
      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s()+\-]{6,40}$/.test(form.emergencyContact)
    ) {
      newErrors.emergencyContact =
        "⚠️ Ingrese entre 6 y 40 caracteres válidos (letras o números)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* =========================================================
     ✏️ MANEJO DE CAMBIOS EN CAMPOS
  ========================================================= */
  function change(e) {
    const { name, value } = e.target;

    // Formatear teléfono automáticamente
    if (name === "ownerPhone") {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("504")) digits = digits.slice(3);
      digits = digits.slice(0, 8);
      let formatted = "+504";
      if (digits.length > 0) {
        formatted +=
          " " + digits.slice(0, 4) + (digits.length > 4 ? "-" + digits.slice(4) : "");
      }
      setForm((f) => ({ ...f, [name]: formatted }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  }

  /* =========================================================
     ♻️ REINICIAR FORMULARIO
  ========================================================= */
  function reset() {
    setForm({
      id: undefined,
      type: "Cuidados en Casa",
      color: "#007bff",
      owner: "",
      ownerPhone: "",
      pet: "",
      species: "",
      branch: "",
      instructions: "",
      medication: "",
      medicationDate: "",
      foodWater: "",
      foodWaterDate: "",
      exercise: "",
      sutures: "",
      followupInstructions: "",
      monitoredAtHome: "",
      emergencyContact: "",
      date: "",
      doctor: "",
      images: [],
    });
    setErrors({});
    showNotif("success", "Formulario reiniciado correctamente");
  }

  /* =========================================================
     📤 ENVIAR FORMULARIO
  ========================================================= */
  function submit(e) {
    e.preventDefault();
    if (!validate()) {
      showNotif("delete", "Expediente incompleto");
      return;
    }

    const data = {
      ...form,
      date: form.date || new Date().toISOString().split("T")[0],
    };
    onSave(data);
    showNotif("success", "✅ Cuidados en Casa guardado correctamente");
  }

  /* =========================================================
     ❌ CERRAR CON ANIMACIÓN
  ========================================================= */
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose?.(), 250);
  };

  /* =========================================================
     🔔 NOTIFICACIONES
  ========================================================= */
  function showNotif(type, text) {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 2500);
  }

  /* =========================================================
     🖼️ MANEJO DE IMÁGENES
  ========================================================= */
  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({
      ...f,
      images: [...f.images, { id: `${Date.now()}`, url }],
    }));
    e.target.value = "";
    showNotif("success", "📸 Imagen cargada exitosamente");
  }

  function askRemoveImage(img) {
    setConfirmModal(img);
  }

  function confirmRemoveImage() {
    if (!confirmModal) return;
    setForm((f) => ({
      ...f,
      images: f.images.filter((i) => i.id !== confirmModal.id),
    }));
    setConfirmModal(null);
    showNotif("delete", " Imagen eliminada correctamente");
  }

  /* =========================================================
     🔄 ENLACES ENTRE EXPEDIENTES
  ========================================================= */
  function gotoGeneral() {
    onLink?.("general", {
      pet: form.pet,
      owner: form.owner,
      ownerPhone: form.ownerPhone,
      species: form.species,
      doctor: form.doctor,
      branch: form.branch,
      notes: form.instructions,
      images: form.images,
      type: "Expediente General",
      color: "#00a884",
    });
  }

  function gotoSurgery() {
    onLink?.("surgery", {
      pet: form.pet,
      owner: form.owner,
      doctor: form.doctor,
      date: form.date,
      notes: form.instructions,
      images: form.images,
      type: "Expediente Cirugía",
      color: "#ef4444",
    });
  }

  /* =========================================================
     🧱 RENDERIZADO PRINCIPAL DEL FORMULARIO
  ========================================================= */
  return (
    <div className={`care-overlay ${closing ? "closing" : ""}`}>
      <div className={`care-modal ${closing ? "closing" : ""}`}>
        <div className="modal-header">
          <h2>Cuidados en Casa</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
          <button className="clear-btn" onClick={reset}>
            <Brush size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          {/* Dueño / Teléfono */}
          <div className="row-2">
            <label className={errors.owner ? "error" : ""}>
              <span>Dueño</span>
              <select name="owner" value={form.owner} onChange={change}>
                <option value="">Seleccione un dueño</option>
                <option>Juan Pérez</option>
                <option>María López</option>
                <option>Carlos Gómez</option>
                <option>Ana Rodríguez</option>
              </select>
              {errors.owner && <small>{errors.owner}</small>}
            </label>

            <label className={errors.ownerPhone ? "error" : ""}>
              <span>Teléfono</span>
              <input
                name="ownerPhone"
                value={form.ownerPhone}
                onChange={change}
                placeholder="+504 XXXX-XXXX"
              />
              {errors.ownerPhone && <small>{errors.ownerPhone}</small>}
            </label>
          </div>

          {/* Mascota / Especie */}
          <div className="row-2">
            <label className={errors.pet ? "error" : ""}>
              <span>Nombre de la Mascota</span>
              <select name="pet" value={form.pet} onChange={change}>
                <option value="">Seleccione una mascota</option>
                <option>Rocky</option>
                <option>Luna</option>
                <option>Max</option>
                <option>Kiara</option>
              </select>
              {errors.pet && <small>{errors.pet}</small>}
            </label>

            <label className={errors.species ? "error" : ""}>
              <span>Especie</span>
              <input
                name="species"
                value={form.species}
                onChange={change}
                placeholder="Perro, Gato…"
              />
              {errors.species && <small>{errors.species}</small>}
            </label>
          </div>

          {/* Sucursal / Instrucciones */}
          <label className={errors.branch ? "error" : ""}>
            <span>Sucursal</span>
            <input
              name="branch"
              value={form.branch}
              onChange={change}
              placeholder="Sucursal Central"
            />
            {errors.branch && <small>{errors.branch}</small>}
          </label>

          <label className={errors.instructions ? "error" : ""}>
            <span>Instrucciones</span>
            <input
              name="instructions"
              value={form.instructions}
              onChange={change}
              placeholder="Indicaciones generales para el cuidado"
            />
            {errors.instructions && <small>{errors.instructions}</small>}
          </label>

          {/* Medicamentos / Comida y Agua */}
          <div className="row-2">
            <label className={errors.medication ? "error" : ""}>
              <span>Medicamentos</span>
              <input
                name="medication"
                value={form.medication}
                onChange={change}
                placeholder="Nombre del medicamento"
              />
              {errors.medication && <small>{errors.medication}</small>}
            </label>

            <label className={errors.medicationDate ? "error" : ""}>
              <span>Fecha de inicio de medicamento</span>
              <input
                type="date"
                name="medicationDate"
                value={form.medicationDate}
                onChange={change}
              />
              {errors.medicationDate && <small>{errors.medicationDate}</small>}
            </label>
          </div>

          <div className="row-2">
            <label className={errors.foodWater ? "error" : ""}>
              <span>Comida y Agua</span>
              <input
                name="foodWater"
                value={form.foodWater}
                onChange={change}
                placeholder="Indicaciones sobre alimentación e hidratación"
              />
              {errors.foodWater && <small>{errors.foodWater}</small>}
            </label>

            <label className={errors.foodWaterDate ? "error" : ""}>
              <span>Fecha de inicio de alimentación</span>
              <input
                type="date"
                name="foodWaterDate"
                value={form.foodWaterDate}
                onChange={change}
              />
              {errors.foodWaterDate && <small>{errors.foodWaterDate}</small>}
            </label>
          </div>

          {/* Ejercicio / Suturas */}
          <div className="row-2">
            <label className={errors.exercise ? "error" : ""}>
              <span>Ejercicio</span>
              <input
                name="exercise"
                value={form.exercise}
                onChange={change}
                placeholder="Indicaciones sobre actividad física"
              />
              {errors.exercise && <small>{errors.exercise}</small>}
            </label>

            <label className={errors.sutures ? "error" : ""}>
              <span>Suturas</span>
              <input
                name="sutures"
                value={form.sutures}
                onChange={change}
                placeholder="Cuidados y revisión de suturas"
              />
              {errors.sutures && <small>{errors.sutures}</small>}
            </label>
          </div>

          {/* Instrucciones de seguimiento */}
          <label className={errors.followupInstructions ? "error" : ""}>
            <span>Instrucciones de Seguimiento</span>
            <input
              name="followupInstructions"
              value={form.followupInstructions}
              onChange={change}
              placeholder="Recomendaciones posteriores"
            />
            {errors.followupInstructions && <small>{errors.followupInstructions}</small>}
          </label>

          {/* Monitoreó en casa */}
          <label className={errors.monitoredAtHome ? "error" : ""}>
            <span>Monitoreó en Casa</span>
            <textarea
              name="monitoredAtHome"
              value={form.monitoredAtHome}
              onChange={change}
              placeholder="Observaciones o comportamientos detectados"
              rows={4}
            />
            {errors.monitoredAtHome && <small>{errors.monitoredAtHome}</small>}
          </label>

          {/* Contacto de emergencia (actualizado) */}
          <label className={errors.emergencyContact ? "error" : ""}>
            <span>Contacto de Emergencia</span>
            <input
              name="emergencyContact"
              value={form.emergencyContact}
              onChange={change}
              placeholder="Ej: +504 8888-8888 / Dr. Luis Castillo"
            />
            {errors.emergencyContact && <small>{errors.emergencyContact}</small>}
          </label>

          {/* Sección de imágenes */}
          <div className="images">
            {form.images.map((img) => (
              <div className="thumb" key={img.id}>
                <img src={img.url} alt="Evidencia" onClick={() => setViewer(img.url)} />
                <button
                  type="button"
                  className="trash"
                  onClick={() => askRemoveImage(img)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Botones inferiores */}
          <div className="buttons-grid">
            <label className="ghost">
              Importar Imagen
              <input type="file" accept="image/*" onChange={onPickImage} hidden />
            </label>
            <button type="button" className="ghost" onClick={gotoGeneral}>
              Expediente General
            </button>
            <button type="button" className="ghost" onClick={gotoSurgery}>
              Expediente Cirugía
            </button>
          </div>

          <div className="footer">
            <button type="button" className="secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="primary">
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Visor de imagen */}
      {viewer && (
        <div
          className="img-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains("img-overlay")) setViewer(null);
          }}
        >
          <div className="img-viewer" onMouseDown={(e) => e.stopPropagation()}>
            <img src={viewer} alt="Vista ampliada" />
            <button
              className="img-close"
              onClick={(e) => {
                e.stopPropagation();
                setViewer(null);
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Notificación */}
      {notif && (
        <div className={`notif ${notif.type}`}>
          {notif.type === "success" && <CheckCircle2 size={22} />}
          {notif.type === "delete" && <AlertTriangle size={22} />}
          <span>{notif.text}</span>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmModal && (
        <div
          className="delete-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains("delete-overlay"))
              setConfirmModal(null);
          }}
        >
          <div className="delete-modal" onMouseDown={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="#ef4444" />
            <h3>¿Eliminar esta imagen?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="confirm-btns">
              <button className="btn-yes" onClick={confirmRemoveImage}>
                Sí, eliminar
              </button>
              <button className="btn-no" onClick={() => setConfirmModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
