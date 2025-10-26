// src/components/GeneralRecordForm.js
import React, { useEffect, useMemo, useState } from "react";
import { X, Brush, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import "../CSS/GeneralRecordForm.css";

export default function GeneralRecordForm({ onClose, onSave, editData, onLink }) {
  const [form, setForm] = useState({
    id: undefined,
    type: "Expediente General",
    color: "#00a884",
    owner: "",
    ownerPhone: "",
    pet: "",
    species: "",
    gender: "",
    breed: "",
    weight: "",
    colorName: "",
    bloodDonor: "",
    doctor: "",
    date: "",
    branch: "",
    tests: "",
    surgeryPlanned: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    vaccines: [],
    vaccineSelect: "",
    cc: "",
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [viewer, setViewer] = useState(null);
  const [notif, setNotif] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (editData) setForm((f) => ({ ...f, ...editData }));
  }, [editData]);

  const inputs = useMemo(
    () => [
      ["ownerPhone", "Teléfono Propietario"],
      ["species", "Especie"],
      ["breed", "Raza"],
      ["weight", "Peso"],
      ["colorName", "Color de Mascota"],
      ["doctor", "Doctor"],
      ["branch", "Sucursal"],
      ["tests", "Exámenes a realizar"],
      ["surgeryPlanned", "Cirugía a realizar"],
      ["diagnosis", "Diagnóstico"],
      ["treatment", "Tratamiento"],
    ],
    []
  );

  function validate() {
    const newErrors = {};
    const requiredFields = [
      "owner",
      "ownerPhone",
      "pet",
      "species",
      "gender",
      "bloodDonor",
      "date",
      "breed",
      "weight",
      "colorName",
      "doctor",
      "branch",
      "tests",
      "surgeryPlanned",
      "diagnosis",
      "treatment",
      "vaccineSelect",
      "cc",
    ];

    requiredFields.forEach((field) => {
      if (!form[field] || form[field].trim() === "") {
        newErrors[field] = "⚠️ Requerido";
      }
    });

    if (form.ownerPhone && !/^\+504\s?\d{4}-\d{4}$/.test(form.ownerPhone)) {
      newErrors.ownerPhone = "⚠️ Debe tener formato +504 XXXX-XXXX";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function change(e) {
    const { name, value } = e.target;

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

  function reset() {
    setForm({
      id: form.id,
      type: "Expediente General",
      color: "#00a884",
      owner: "",
      ownerPhone: "",
      pet: "",
      species: "",
      gender: "",
      breed: "",
      weight: "",
      colorName: "",
      bloodDonor: "",
      doctor: "",
      date: "",
      branch: "",
      tests: "",
      surgeryPlanned: "",
      diagnosis: "",
      treatment: "",
      notes: "",
      vaccines: [],
      vaccineSelect: "",
      cc: "",
      images: [],
    });
    setErrors({});
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) {
      showNotif("delete", "Expediente Incompleto");
      return;
    }

    // ✅ Reemplazar vacuna anterior por la nueva
    let vaccinesArray = [];
    if (form.vaccineSelect.trim() !== "") {
      vaccinesArray = [
        {
          label: form.vaccineSelect.trim(),
          when: new Date().toLocaleString(),
        },
      ];
    }

    const data = {
      ...form,
      vaccines: vaccinesArray,
      type: "Expediente General",
      color: "#00a884",
      date: form.date || new Date().toISOString().split("T")[0],
    };

    onSave(data);
    showNotif("success", "✅ Expediente guardado correctamente");
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 250);
  };

  function showNotif(type, text) {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 2500);
  }

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

  function gotoSurgery() {
    onLink?.("surgery", {
      pet: form.pet,
      doctor: form.doctor,
      date: form.date,
      owner: form.owner,
      species: form.species,
      surgeryType: form.surgeryPlanned || "",
      notes: form.notes || "",
      images: form.images || [],
      color: "#d44",
      type: "Expediente Cirugía",
    });
  }

  function gotoCare() {
    onLink?.("care", {
      pet: form.pet,
      doctor: form.doctor,
      date: form.date,
      careType: "Cuidados postoperatorios",
      medication: "",
      frequency: "",
      notes: form.notes || "",
      images: form.images || [],
      color: "#007bff",
      type: "Cuidados en Casa",
    });
  }

  return (
    <div className={`general-modal-overlay ${closing ? "closing" : ""}`}>
      <div className={`general-modal ${closing ? "closing" : ""}`}>
        <div className="modal-header">
          <h2>Expediente General</h2>
          <button className="close" onClick={handleClose}>
            <X size={20} />
          </button>
          <button className="clean" onClick={reset}>
            <Brush size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
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

          <label className={errors.pet ? "error" : ""}>
            <span>Mascota</span>
            <select name="pet" value={form.pet} onChange={change}>
              <option value="">Seleccione una mascota</option>
              <option>Rocky</option>
              <option>Luna</option>
              <option>Max</option>
              <option>Kiara</option>
            </select>
            {errors.pet && <small>{errors.pet}</small>}
          </label>

          <label className={errors.gender ? "error" : ""}>
            <span>Género</span>
            <select name="gender" value={form.gender} onChange={change}>
              <option value="">Seleccione</option>
              <option>Hembra</option>
              <option>Macho</option>
            </select>
            {errors.gender && <small>{errors.gender}</small>}
          </label>

          <label className={errors.bloodDonor ? "error" : ""}>
            <span>Donante de Sangre</span>
            <select name="bloodDonor" value={form.bloodDonor} onChange={change}>
              <option value="">Seleccione</option>
              <option>Sí</option>
              <option>No</option>
            </select>
            {errors.bloodDonor && <small>{errors.bloodDonor}</small>}
          </label>

          <label className={errors.date ? "error" : ""}>
            <span>Fecha</span>
            <input type="date" name="date" value={form.date} onChange={change} />
            {errors.date && <small>{errors.date}</small>}
          </label>

          {inputs.map(([name, label]) => (
            <label key={name} className={errors[name] ? "error" : ""}>
              <span>{label}</span>
              <input
                name={name}
                value={form[name] || ""}
                onChange={change}
                placeholder={label}
              />
              {errors[name] && <small>{errors[name]}</small>}
            </label>
          ))}

          <label>
            <span>Notas adicionales</span>
            <textarea
              name="notes"
              value={form.notes || ""}
              onChange={change}
              placeholder="Escribe notas…"
            />
          </label>

          <div className="vaccine-block">
            <label className={errors.vaccineSelect ? "error" : ""}>
              <span>Vacuna o Medicamento</span>
              <input
                name="vaccineSelect"
                value={form.vaccineSelect || ""}
                onChange={change}
                placeholder="Ej: Rabia, Parvovirus, etc."
              />
              {errors.vaccineSelect && <small>{errors.vaccineSelect}</small>}
            </label>

            <label className={errors.cc ? "error" : ""}>
              <span>CC a aplicar</span>
              <input
                name="cc"
                value={form.cc || ""}
                onChange={change}
                placeholder="10 cc"
              />
              {errors.cc && <small>{errors.cc}</small>}
            </label>
          </div>

          {!!form.vaccines.length && (
            <ul className="vaccines">
              {form.vaccines.map((v, i) => (
                <li key={i}>• {v.label}</li>
              ))}
            </ul>
          )}

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

          <div className="buttons-grid">
            <label className="ghost">
              Importar Imagen
              <input type="file" accept="image/*" onChange={onPickImage} hidden />
            </label>
            <button type="button" className="ghost" onClick={gotoSurgery}>
              Expediente Cirugía
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
              {editData ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      {viewer && (
        <div
          className="img-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains("img-overlay")) setViewer(null);
          }}
        >
          <div className="img-viewer" onMouseDown={(e) => e.stopPropagation()}>
            <img src={viewer} alt="" />
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

      {notif && (
        <div className={`notif ${notif.type}`}>
          {notif.type === "success" && <CheckCircle2 size={22} />}
          {notif.type === "delete" && <AlertTriangle size={22} />}
          <span>{notif.text}</span>
        </div>
      )}

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
