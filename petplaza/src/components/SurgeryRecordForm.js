import React, { useEffect, useState } from "react";
import { X, Brush, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import "../CSS/SurgeryRecordForm.css";

export default function SurgeryRecordForm({ onClose, onSave, editData, onLink }) {
  const [form, setForm] = useState({
    id: undefined,
    type: "Expediente Cirugía",
    color: "#d44",
    owner: "",
    ownerPhone: "",
    identityNumber: "",
    pet: "",
    branch: "",
    dateTime: "",
    species: "",
    breed: "",
    gender: "",
    birthDate: "",
    caseDescription: "",
    risk1: "",
    risk2: "",
    risk3: "",
    risk4: "",
    risk5: "",
    risk6: "",
    doctor: "",
    date: "",
    surgeryType: "",
    anesthetic: "",
    notes: "",
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [viewer, setViewer] = useState(null);
  const [notif, setNotif] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [closing, setClosing] = useState(false);

  // ---------------------------------------------------------
  // ⏰ Cargar fecha/hora automática al abrir el formulario
  // ---------------------------------------------------------
  useEffect(() => {
    const nowISO = new Date().toISOString().slice(0, 16);
    setForm((f) => {
      const merged = editData ? { ...f, ...editData } : { ...f };
      if (!editData || !editData.dateTime) merged.dateTime = nowISO;
      return merged;
    });
  }, [editData]);

  // ---------------------------------------------------------
  // ✏️ Manejo de cambios en los campos (teléfono e identidad/pass con formato)
  // ---------------------------------------------------------
  function change(e) {
    const { name, value } = e.target;

    // 📞 Teléfono formateado como +504 XXXX-XXXX
    if (name === "ownerPhone") {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("504")) digits = digits.slice(3);
      digits = digits.slice(0, 8);
      let formatted = "+504";
      if (digits.length > 0) {
        formatted +=
          " " + digits.slice(0, 4) + (digits.length > 4 ? "-" + digits.slice(4) : "");
      }
      setForm((f) => ({ ...f, ownerPhone: formatted }));
      return;
    }

    // 🪪 Identidad (numérica) => XXXX-XXXX-XXXXX
    // 🛂 Pasaporte (alfa-num) => 6–15 caracteres alfanum (sin guiones, permite letras)
    if (name === "identityNumber") {
      let clean = value.replace(/[^a-zA-Z0-9]/g, "");

      // Si contiene sólo dígitos, formatear como identidad
      if (/^\d+$/.test(clean)) {
        clean = clean.slice(0, 13); // 13 dígitos máx
        let formatted = "";
        if (clean.length > 0) formatted += clean.slice(0, 4);
        if (clean.length > 4) formatted += "-" + clean.slice(4, 8);
        if (clean.length > 8) formatted += "-" + clean.slice(8, 13);
        setForm((f) => ({ ...f, identityNumber: formatted }));
        return;
      }

      // Si tiene letras: tratamos como pasaporte (6–15 alfanum)
      clean = clean.slice(0, 15);
      setForm((f) => ({ ...f, identityNumber: clean }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  }

  // ---------------------------------------------------------
  // ♻️ Resetear formulario (manteniendo tipo/color y fecha/hora nueva)
  // ---------------------------------------------------------
  function reset() {
    setForm({
      id: undefined,
      type: "Expediente Cirugía",
      color: "#d44",
      owner: "",
      ownerPhone: "",
      identityNumber: "",
      pet: "",
      branch: "",
      dateTime: new Date().toISOString().slice(0, 16),
      species: "",
      breed: "",
      gender: "",
      birthDate: "",
      caseDescription: "",
      risk1: "",
      risk2: "",
      risk3: "",
      risk4: "",
      risk5: "",
      risk6: "",
      doctor: "",
      date: "",
      surgeryType: "",
      anesthetic: "",
      notes: "",
      images: [],
    });
    setErrors({});
    showNotif("success", "Formulario reiniciado correctamente");
  }

  // ---------------------------------------------------------
  // ✅ Validación de todos los campos requeridos
  // ---------------------------------------------------------
  function validate() {
    const required = [
      "owner",
      "ownerPhone",
      "identityNumber",
      "pet",
      "branch",
      "dateTime",
      "species",
      "breed",
      "gender",
      "birthDate",
      "caseDescription",
      "doctor",
      "surgeryType",
      "risk1",
      "risk2",
      "risk3",
      "risk4",
      "risk5",
      "risk6",
      "notes",
    ];

    const newErrors = {};

    required.forEach((key) => {
      const val = form[key];
      if (!val || (typeof val === "string" && val.trim() === "")) {
        newErrors[key] = "⚠️ Requerido";
      }
    });

    // Validación de teléfono de Honduras
    if (form.ownerPhone && !/^\+504\s?\d{4}-\d{4}$/.test(form.ownerPhone)) {
      newErrors.ownerPhone = "⚠️ Formato +504 XXXX-XXXX";
    }

    // Validación de identidad o pasaporte
    if (form.identityNumber) {
      const isID = /^\d{4}-\d{4}-\d{5}$/.test(form.identityNumber);
      const isPassport = /^[A-Za-z0-9]{6,15}$/.test(form.identityNumber);
      if (!isID && !isPassport) {
        newErrors.identityNumber =
          "⚠️ Formato inválido. Use 0801-1980-12345 o AB1234567";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------------------------------------------------------
  // 🔒 Cerrar modal con animación
  // ---------------------------------------------------------
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose?.(), 250);
  };

  // ---------------------------------------------------------
  // 🔔 Notificación
  // ---------------------------------------------------------
  function showNotif(type, text) {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 2500);
  }

  // ---------------------------------------------------------
  // 📸 Manejo de imágenes
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 💾 Enviar formulario
  // ---------------------------------------------------------
  function submit(e) {
    e.preventDefault();
    if (!validate()) {
      showNotif("delete", "Expediente Incompleto");
      return;
    }

    const isEditing = !!form.id;
    const onlyDate = form.dateTime
      ? form.dateTime.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    onSave({
      ...form,
      date: onlyDate,
      type: "Expediente Cirugía",
      color: "#d44",
    });

    showNotif(
      "success",
      isEditing
        ? "✏️ Expediente quirúrgico actualizado con éxito"
        : "💾 Expediente quirúrgico creado correctamente"
    );
  }

  // ---------------------------------------------------------
  // 🔄 Enlaces entre expedientes
  // ---------------------------------------------------------
  function gotoGeneral() {
    onLink?.("general", {
      pet: form.pet,
      owner: form.owner,
      ownerPhone: form.ownerPhone,
      species: form.species,
      gender: form.gender,
      breed: form.breed,
      branch: form.branch,
      doctor: form.doctor,
      date: form.date || (form.dateTime ? form.dateTime.slice(0, 10) : ""),
      notes: form.notes,
      images: form.images,
      type: "Expediente General",
      color: "#00a884",
    });
  }

  function gotoCare() {
    onLink?.("care", {
      pet: form.pet,
      owner: form.owner,
      doctor: form.doctor,
      date: form.date || (form.dateTime ? form.dateTime.slice(0, 10) : ""),
      notes: form.notes,
      images: form.images,
      type: "Cuidados en Casa",
      color: "#007bff",
    });
  }

  // ---------------------------------------------------------
  // 🧱 Renderizado del formulario
  // ---------------------------------------------------------
  return (
    <div className={`surgery-modal-overlay ${closing ? "closing" : ""}`}>
      <div className={`surgery-modal ${closing ? "closing" : ""}`}>
        <div className="modal-header">
          <h2>Expediente Quirúrgico</h2>
          <button className="close" onClick={handleClose}><X size={20} /></button>
          <button className="clean" onClick={reset}><Brush size={18} /></button>
        </div>

        <form onSubmit={submit}>
          {/* 🔹 Dueño, Teléfono, Identidad */}
          <div className="row-3">
            <label className={`field ${errors.owner ? "error" : ""}`}>
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

            <label className={`field ${errors.ownerPhone ? "error" : ""}`}>
              <span>Teléfono del propietario</span>
              <input
                name="ownerPhone"
                value={form.ownerPhone}
                onChange={change}
                placeholder="+504 XXXX-XXXX"
              />
              {errors.ownerPhone && <small>{errors.ownerPhone}</small>}
            </label>

            <label className={`field ${errors.identityNumber ? "error" : ""}`}>
              <span>Número de identidad o pasaporte</span>
              <input
                name="identityNumber"
                value={form.identityNumber}
                onChange={change}
                placeholder="Ej: 0801-1980-12345 o AB1234567"
              />
              {errors.identityNumber && <small>{errors.identityNumber}</small>}
            </label>
          </div>

          {/* 🔹 Mascota, Sucursal, Fecha */}
          <div className="row-3">
            <label className={`field ${errors.pet ? "error" : ""}`}>
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

            <label className={`field ${errors.branch ? "error" : ""}`}>
              <span>Sucursal</span>
              <input
                name="branch"
                value={form.branch}
                onChange={change}
                placeholder="Sucursal Central"
              />
              {errors.branch && <small>{errors.branch}</small>}
            </label>

            <label className={`field ${errors.dateTime ? "error" : ""}`}>
              <span>Fecha y hora</span>
              <input
                type="datetime-local"
                name="dateTime"
                value={form.dateTime}
                onChange={change}
              />
              {errors.dateTime && <small>{errors.dateTime}</small>}
            </label>
          </div>

          {/* 🔹 Especie, Raza, Sexo */}
          <div className="row-3">
            <label className={`field ${errors.species ? "error" : ""}`}>
              <span>Especie</span>
              <input
                name="species"
                value={form.species}
                onChange={change}
                placeholder="Perro, Gato…"
              />
              {errors.species && <small>{errors.species}</small>}
            </label>

            <label className={`field ${errors.breed ? "error" : ""}`}>
              <span>Raza</span>
              <input
                name="breed"
                value={form.breed}
                onChange={change}
                placeholder="Labrador, Siames…"
              />
              {errors.breed && <small>{errors.breed}</small>}
            </label>

            <label className={`field ${errors.gender ? "error" : ""}`}>
              <span>Sexo</span>
              <select name="gender" value={form.gender} onChange={change}>
                <option value="">Seleccione sexo</option>
                <option value="Hembra">Hembra</option>
                <option value="Macho">Macho</option>
              </select>
              {errors.gender && <small>{errors.gender}</small>}
            </label>
          </div>

          {/* 🔹 Nacimiento, Doctor, Tipo de cirugía */}
          <div className="row-3">
            <label className={`field ${errors.birthDate ? "error" : ""}`}>
              <span>Fecha de nacimiento</span>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={change}
              />
              {errors.birthDate && <small>{errors.birthDate}</small>}
            </label>

            <label className={`field ${errors.doctor ? "error" : ""}`}>
              <span>Doctor Responsable</span>
              <input
                name="doctor"
                value={form.doctor}
                onChange={change}
                placeholder="Nombre del doctor"
              />
              {errors.doctor && <small>{errors.doctor}</small>}
            </label>

            <label className={`field ${errors.surgeryType ? "error" : ""}`}>
              <span>Tipo de Cirugía</span>
              <input
                name="surgeryType"
                value={form.surgeryType}
                onChange={change}
                placeholder="Ej: Esterilización"
              />
              {errors.surgeryType && <small>{errors.surgeryType}</small>}
            </label>
          </div>

          {/* 🔹 Descripción */}
          <label className={`field ${errors.caseDescription ? "error" : ""}`}>
            <span>Descripción del Caso</span>
            <textarea
              name="caseDescription"
              value={form.caseDescription}
              onChange={change}
              placeholder="Describa el caso clínico…"
            />
            {errors.caseDescription && <small>{errors.caseDescription}</small>}
          </label>

          {/* 🔹 Riesgos 1–6 */}
          <div className="risk-section">
            <div className="row-3">
              {["1", "2", "3"].map((n) => (
                <label className={`field ${errors[`risk${n}`] ? "error" : ""}`} key={n}>
                  <span>Riesgo {n}</span>
                  <input
                    name={`risk${n}`}
                    value={form[`risk${n}`]}
                    onChange={change}
                    placeholder={`Detalle para riesgo ${n}`}
                  />
                  {errors[`risk${n}`] && <small>{errors[`risk${n}`]}</small>}
                </label>
              ))}
            </div>

            <div className="row-3">
              {["4", "5", "6"].map((n) => (
                <label className={`field ${errors[`risk${n}`] ? "error" : ""}`} key={n}>
                  <span>Riesgo {n}</span>
                  <input
                    name={`risk${n}`}
                    value={form[`risk${n}`]}
                    onChange={change}
                    placeholder={`Detalle para riesgo ${n}`}
                  />
                  {errors[`risk${n}`] && <small>{errors[`risk${n}`]}</small>}
                </label>
              ))}
            </div>
          </div>

          {/* 🔹 Notas */}
          <label className={`field ${errors.notes ? "error" : ""}`}>
            <span>Notas</span>
            <textarea
              name="notes"
              value={form.notes || ""}
              onChange={change}
              placeholder="Observaciones adicionales…"
            />
            {errors.notes && <small>{errors.notes}</small>}
          </label>

          {/* 🔹 Imágenes */}
          <div className="images">
            {form.images.map((img) => (
              <div className="thumb" key={img.id}>
                <img src={img.url} alt="" onClick={() => setViewer(img.url)} />
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

          {/* 🔹 Botones inferiores */}
          <div className="buttons-grid">
            <label className="ghost">
              Importar Imagen
              <input type="file" accept="image/*" onChange={onPickImage} hidden />
            </label>
            <button type="button" className="ghost" onClick={gotoGeneral}>
              Expediente General
            </button>
            <button type="button" className="ghost" onClick={gotoCare}>
              Cuidados En Casa
            </button>
          </div>

          <div className="footer">
            <button type="button" className="secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="primary">
              {form.id ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      {/* 🔎 Visor de imagen ampliada */}
      {viewer && (
        <div
          className="img-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains("img-overlay")) setViewer(null);
          }}
        >
          <div className="img-viewer" onMouseDown={(e) => e.stopPropagation()}>
            <img src={viewer} alt="" />
            <button className="img-close" onClick={() => setViewer(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 🔔 Notificación flotante */}
      {notif && (
        <div className={`notif ${notif.type}`}>
          {notif.type === "success" && <CheckCircle2 size={22} />}
          {notif.type === "delete" && <AlertTriangle size={22} />}
          <span>{notif.text}</span>
        </div>
      )}

      {/* 🗑️ Modal de confirmación de eliminación */}
      {confirmModal && (
        <div
          className="delete-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains("delete-overlay"))
              setConfirmModal(null);
          }}
        >
          <div className="delete-modal" onMouseDown={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="#ff4444" />
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
