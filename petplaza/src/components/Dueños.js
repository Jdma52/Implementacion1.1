<div className="owner-details">

  <div className="detail-item">
    <span className="detail-label">Teléfono:</span>
    <span className="detail-value">
      <Phone size={15} /> {o.phone}
    </span>
  </div>

  <div className="detail-item">
    <span className="detail-label">Correo:</span>
    <span className="detail-value">
      <Mail size={15} /> {o.email || "—"}
    </span>
  </div>

  <div className="detail-item">
    <span className="detail-label">DNI:</span>
    <span className="detail-value">
      <IdCard size={15} /> {o.dni}
    </span>
  </div>

  <div className="detail-item">
    <span className="detail-label">Dirección:</span>
    <span className="detail-value">
      <Home size={15} /> {o.address}
    </span>
  </div>

</div>
