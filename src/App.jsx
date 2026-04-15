import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const INITIAL_FORM = {
  cliente: "",
  concepto: "",
  proyecto: "",
  tipoServicio: "",
  valor: "",
  moneda: "COP",
  aplicaRetencion: false,
  incluyeIva: false,
  formaPago: "",
  mesFacturacion: "",
  observaciones: "",
};

const TIPOS_SERVICIO = ["Fee Mensual", "Proyecto Puntual", "Pauta Digital", "Consultoría", "Producción", "Otro"];
const FORMAS_PAGO = ["Crédito 30 días", "Crédito 60 días", "Anticipado"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ESTADOS = ["Pendiente Aprobación", "Aprobada", "En Proceso Contabilidad", "Facturada", "Pagada", "Rechazada"];

const ESTADO_COLORS = {
  "Pendiente Aprobación": { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  "Aprobada": { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  "En Proceso Contabilidad": { bg: "#E9D5FF", text: "#6B21A8", dot: "#8B5CF6" },
  "Facturada": { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  "Pagada": { bg: "#A7F3D0", text: "#064E3B", dot: "#059669" },
  "Rechazada": { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

const FLASH_RED = "#E53935";
const FLASH_RED_DARK = "#C62828";
const FLASH_RED_LIGHT = "#FFEBEE";

function formatCurrency(val, moneda) {
  if (!val) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (moneda === "COP") return `$ ${num.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return `€ ${num.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`;
}

function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span style={{color: FLASH_RED}}>*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={onChange}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none pr-10"
          style={{"--tw-ring-color": FLASH_RED}}
          onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${FLASH_RED}40`}
          onBlur={(e) => e.target.style.boxShadow = 'none'}>
          <option value="">{placeholder || "Seleccionar..."}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", required, prefix }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span style={{color: FLASH_RED}}>*</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{prefix}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full ${prefix ? "pl-8" : "pl-3"} pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all`}
          onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${FLASH_RED}40`}
          onBlur={(e) => e.target.style.boxShadow = 'none'}
        />
      </div>
    </div>
  );
}

function Badge({ estado }) {
  const c = ESTADO_COLORS[estado] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {estado}
    </span>
  );
}

function KpiCard({ label, value, subtitle, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: color || "#1F2937" }}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("form");
  const [form, setForm] = useState(INITIAL_FORM);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterMes, setFilterMes] = useState("Todos");
  const [expandedId, setExpandedId] = useState(null);
  const [sheetsCopied, setSheetsCopied] = useState(false);

  // Fetch solicitudes from Supabase
  const fetchSolicitudes = async () => {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSolicitudes(data);
    setLoading(false);
  };

  useEffect(() => { fetchSolicitudes(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente Aprobación");

  const handleSubmit = async () => {
    if (!form.cliente || !form.concepto || !form.valor || !form.tipoServicio || !form.mesFacturacion) return;
    const { error } = await supabase.from('solicitudes').insert({
      cliente: form.cliente,
      concepto: form.concepto,
      proyecto: form.proyecto || null,
      tipo_servicio: form.tipoServicio,
      valor: parseFloat(form.valor),
      moneda: form.moneda,
      incluye_iva: form.incluyeIva,
      aplica_retencion: form.aplicaRetencion,
      forma_pago: form.formaPago || null,
      mes_facturacion: form.mesFacturacion,
      observaciones: form.observaciones || null,
      solicitado_por: 'Tú',
    });
    if (!error) {
      setForm(INITIAL_FORM);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      fetchSolicitudes();
    }
  };

  const updateEstado = async (id, nuevoEstado) => {
    const updates = { estado: nuevoEstado };
    if (nuevoEstado === "Aprobada") {
      updates.aprobado_por = "Mariana R.";
      updates.fecha_aprobacion = new Date().toISOString().split("T")[0];
    }
    const { error } = await supabase.from('solicitudes').update(updates).eq('id', id);
    if (!error) fetchSolicitudes();
  };

  const filtered = solicitudes.filter((s) => {
    if (filterEstado !== "Todos" && s.estado !== filterEstado) return false;
    if (filterMes !== "Todos" && s.mes_facturacion !== filterMes) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const totalAprobado = solicitudes.filter(s => s.estado !== "Pendiente Aprobación" && s.estado !== "Rechazada").reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const totalFacturado = solicitudes.filter(s => s.estado === "Facturada" || s.estado === "Pagada").reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);

  const exportCSV = () => {
    const headers = ["ID", "Fecha", "Solicitado Por", "Cliente", "Concepto", "Proyecto", "Tipo Servicio", "Valor", "Moneda", "IVA", "Retención", "Forma Pago", "Estado", "Aprobado Por", "Fecha Aprobación", "# Factura", "Fecha Facturación", "Mes", "Observaciones"];
    const rows = filtered.map((s) => [`FAC-${String(s.id).padStart(3, "0")}`, s.fecha, s.solicitado_por, s.cliente, s.concepto, s.proyecto, s.tipo_servicio, s.valor, s.moneda, s.incluye_iva ? "Sí" : "No", s.aplica_retencion ? "Sí" : "No", s.forma_pago, s.estado, s.aprobado_por || "", s.fecha_aprobacion || "", s.num_factura || "", s.fecha_facturacion || "", s.mes_facturacion, s.observaciones]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturacion_flash_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [sheetsLoading, setSheetsLoading] = useState(false);

  const exportToGoogleSheets = async () => {
    setSheetsLoading(true);
    try {
      const res = await fetch("/api/export-sheets", { method: "POST" });
      const data = await res.json();
      if (data.success && data.url) {
        setSheetsCopied(true);
        setTimeout(() => setSheetsCopied(false), 6000);
        window.open(data.url, "_blank");
      } else {
        alert("Error: " + (data.error || "No se pudo crear el Google Sheet"));
      }
    } catch (err) {
      alert("Error de conexión. Intenta de nuevo.");
    }
    setSheetsLoading(false);
  };

  const navItems = [
    { id: "form", label: "Nueva Solicitud", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>) },
    { id: "list", label: "Solicitudes", count: solicitudes.length, icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>) },
    { id: "approval", label: "Aprobar", count: pendientes.length, alert: pendientes.length > 0, icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>) },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FAFAFA'}}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4" style={{backgroundColor: FLASH_RED}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <p className="text-sm text-gray-400 font-medium">Cargando solicitudes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FAFAFA'}}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: FLASH_RED, boxShadow: '0 4px 14px rgba(229, 57, 53, 0.3)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">FLASH</h1>
                <p className="text-[11px] text-gray-400 leading-tight font-medium">Facturación</p>
              </div>
            </div>
            <nav className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setView(item.id)}
                  className="relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  style={view === item.id ? {backgroundColor: 'white', color: FLASH_RED, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'} : {color: '#6B7280'}}>
                  <span className="hidden sm:inline">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.count !== undefined && (<span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold" style={item.alert ? {backgroundColor: '#FEF3C7', color: '#92400E'} : {backgroundColor: '#F3F4F6', color: '#6B7280'}}>{item.count}</span>)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {view === "form" && (
          <div className="max-w-2xl mx-auto">
            {success && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div><p className="text-sm text-emerald-800 font-semibold">Solicitud enviada</p><p className="text-xs text-emerald-600">Queda pendiente de aprobación por Mariana.</p></div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5" style={{background: `linear-gradient(135deg, ${FLASH_RED} 0%, ${FLASH_RED_DARK} 100%)`}}>
                <h2 className="text-lg font-bold text-white">Nueva Solicitud de Facturación</h2>
                <p className="text-sm mt-1" style={{color: 'rgba(255,255,255,0.8)'}}>Llena los datos y envía. Mariana recibirá la solicitud para aprobación.</p>
              </div>
              <div className="p-6 space-y-7">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: FLASH_RED_LIGHT}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={FLASH_RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{color: FLASH_RED}}>Datos del Cliente</p>
                  </div>
                  <InputField label="Cliente / Razón Social" value={form.cliente} onChange={set("cliente")} placeholder="Ej: Bancoldex S.A." required />
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: '#FFF3E0'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{color: '#E65100'}}>Detalle del Servicio</p>
                  </div>
                  <div className="space-y-4">
                    <InputField label="Concepto" value={form.concepto} onChange={set("concepto")} placeholder="Ej: Fee mensual abril" required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Proyecto Asociado" value={form.proyecto} onChange={set("proyecto")} placeholder="Ej: Marketing Bancoldex" />
                      <SelectField label="Tipo de Servicio" value={form.tipoServicio} onChange={set("tipoServicio")} options={TIPOS_SERVICIO} required />
                    </div>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: '#E8F5E9'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{color: '#2E7D32'}}>Valor y Condiciones</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Valor a Facturar" value={form.valor} onChange={set("valor")} placeholder="Ej: 12000000" type="number" required prefix="$" />
                    <SelectField label="Moneda" value={form.moneda} onChange={set("moneda")} options={["COP", "USD", "EUR"]} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <SelectField label="Forma de Pago" value={form.formaPago} onChange={set("formaPago")} options={FORMAS_PAGO} />
                    <SelectField label="Mes de Facturación" value={form.mesFacturacion} onChange={set("mesFacturacion")} options={MESES} required />
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={form.incluyeIva} onChange={set("incluyeIva")} className="w-4 h-4 rounded border-gray-300" style={{accentColor: FLASH_RED}} />
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Incluye IVA</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={form.aplicaRetencion} onChange={set("aplicaRetencion")} className="w-4 h-4 rounded border-gray-300" style={{accentColor: FLASH_RED}} />
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Aplica retención en la fuente</span>
                    </label>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea value={form.observaciones} onChange={set("observaciones")} placeholder="Notas adicionales para contabilidad..." rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all resize-none"
                    onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${FLASH_RED}40`}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                  />
                </div>
                {form.valor && form.cliente && (
                  <div className="rounded-xl p-4 border" style={{backgroundColor: FLASH_RED_LIGHT, borderColor: '#FFCDD2'}}>
                    <p className="text-xs mb-1" style={{color: '#B71C1C'}}>Resumen de solicitud</p>
                    <p className="text-sm text-gray-800">Facturar a <strong>{form.cliente}</strong> por <strong>{formatCurrency(form.valor, form.moneda)}</strong> {form.moneda}{form.incluyeIva ? " (IVA incluido)" : " (sin IVA)"}{form.concepto && <> — {form.concepto}</>}</p>
                  </div>
                )}
                <button onClick={handleSubmit}
                  disabled={!form.cliente || !form.concepto || !form.valor || !form.tipoServicio || !form.mesFacturacion}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{background: `linear-gradient(135deg, ${FLASH_RED} 0%, ${FLASH_RED_DARK} 100%)`, boxShadow: '0 4px 14px rgba(229, 57, 53, 0.3)'}}>
                  Enviar Solicitud de Facturación
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Solicitudes" value={solicitudes.length} subtitle="total registradas" color={FLASH_RED} />
              <KpiCard label="Aprobado" value={formatCurrency(totalAprobado, "COP")} subtitle="listo para facturar" color="#1565C0" />
              <KpiCard label="Facturado" value={formatCurrency(totalFacturado, "COP")} subtitle="facturas emitidas" color="#2E7D32" />
              <KpiCard label="Pendientes" value={pendientes.length} subtitle="por aprobar" color="#E65100" />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none transition-all" onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${FLASH_RED}40`} onBlur={(e) => e.target.style.boxShadow = 'none'}><option value="Todos">Todos los estados</option>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select>
                <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none transition-all" onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${FLASH_RED}40`} onBlur={(e) => e.target.style.boxShadow = 'none'}><option value="Todos">Todos los meses</option>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{filtered.length} resultados · <strong className="text-gray-700">{formatCurrency(totalFiltered, "COP")}</strong></span>
                <button onClick={exportCSV} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all active:scale-95"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>CSV</button>
                <button onClick={exportToGoogleSheets} disabled={sheetsLoading} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all active:scale-95 border disabled:opacity-50" style={{backgroundColor: '#E8F5E9', borderColor: '#A5D6A7', color: '#2E7D32'}}>{sheetsLoading ? (<><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/></svg>Creando...</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>Google Sheets</>)}</button>
              </div>
            </div>
            {filtered.length === 0 ? (<div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400">No hay solicitudes{filterEstado !== 'Todos' || filterMes !== 'Todos' ? ' con estos filtros' : ' aún. Crea la primera desde "Nueva Solicitud"'}.</p></div>) : (
              filtered.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} style={{borderLeft: `4px solid ${ESTADO_COLORS[s.estado]?.dot || '#ccc'}`}}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">FAC-{String(s.id).padStart(3, "0")}</span>
                          <Badge estado={s.estado} />
                          {s.incluye_iva && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">IVA</span>}
                          {s.aplica_retencion && <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">RETENCIÓN</span>}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 truncate">{s.cliente}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{s.concepto}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(s.valor, s.moneda)}</p>
                        <p className="text-xs text-gray-400">{s.moneda} · {s.mes_facturacion}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>Por <strong className="text-gray-500">{s.solicitado_por}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{s.fecha}</span>
                      {s.tipo_servicio && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">{s.tipo_servicio}</span></>}
                      {s.num_factura && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-emerald-600 font-semibold">{s.num_factura}</span></>}
                    </div>
                    {expandedId === s.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-400">Proyecto:</span> <span className="text-gray-700">{s.proyecto || "—"}</span></div>
                        <div><span className="text-gray-400">Forma Pago:</span> <span className="text-gray-700">{s.forma_pago || "—"}</span></div>
                        <div><span className="text-gray-400">IVA:</span> <span className="text-gray-700">{s.incluye_iva ? "Sí" : "No"}</span></div>
                        <div><span className="text-gray-400">Retención:</span> <span className="text-gray-700">{s.aplica_retencion ? "Sí" : "No"}</span></div>
                        {s.aprobado_por && <div><span className="text-gray-400">Aprobó:</span> <span className="text-gray-700">{s.aprobado_por} ({s.fecha_aprobacion})</span></div>}
                        {s.num_factura && <div><span className="text-gray-400">Factura:</span> <span className="text-gray-700">{s.num_factura} ({s.fecha_facturacion})</span></div>}
                        {s.observaciones && <div className="col-span-2"><span className="text-gray-400">Notas:</span> <span className="text-gray-700">{s.observaciones}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "approval" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5 border" style={{background: 'linear-gradient(135deg, #FFF3E0 0%, #FBE9E7 100%)', borderColor: '#FFCCBC'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#FF8A65'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                <div>
                  <h2 className="text-base font-bold" style={{color: '#BF360C'}}>Aprobación de Solicitudes</h2>
                  <p className="text-sm mt-0.5" style={{color: '#D84315'}}>{pendientes.length > 0 ? `Tienes ${pendientes.length} solicitud${pendientes.length > 1 ? "es" : ""} esperando tu aprobación` : "No hay solicitudes pendientes"}</p>
                </div>
              </div>
            </div>
            {pendientes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                <p className="text-lg font-semibold text-gray-700">Todo al día</p>
                <p className="text-sm text-gray-400 mt-1">No hay solicitudes pendientes de aprobación.</p>
              </div>
            ) : (
              pendientes.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all" style={{border: `2px solid ${FLASH_RED}20`}}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">FAC-{String(s.id).padStart(3, "0")}</span><span className="text-xs text-gray-400">Solicitado por <strong className="text-gray-600">{s.solicitado_por}</strong> el {s.fecha}</span></div>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{s.cliente}</h3>
                      </div>
                      <div className="text-right flex-shrink-0"><p className="text-2xl font-bold text-gray-900">{formatCurrency(s.valor, s.moneda)}</p><p className="text-xs text-gray-400">{s.moneda}{s.incluye_iva ? " · IVA incluido" : ""}</p></div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Concepto</span><span className="text-gray-800 font-medium text-right max-w-[60%]">{s.concepto}</span></div>
                      {s.proyecto && <div className="flex justify-between text-sm"><span className="text-gray-400">Proyecto</span><span className="text-gray-700">{s.proyecto}</span></div>}
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Tipo de Servicio</span><span className="text-gray-700">{s.tipo_servicio}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Forma de Pago</span><span className="text-gray-700">{s.forma_pago || "—"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Mes de Facturación</span><span className="text-gray-700 font-medium">{s.mes_facturacion}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">IVA</span><span className="text-gray-700">{s.incluye_iva ? "Sí incluye" : "No incluye"}</span></div>
                      {s.aplica_retencion && <div className="flex justify-between text-sm"><span className="text-gray-400">Retención</span><span className="text-amber-600 font-medium">Sí aplica</span></div>}
                      {s.observaciones && <div className="flex justify-between text-sm"><span className="text-gray-400">Notas</span><span className="text-gray-700 text-right max-w-[60%]">{s.observaciones}</span></div>}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => updateEstado(s.id, "Aprobada")} className="flex-1 py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]" style={{background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)', boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Aprobar</button>
                      <button onClick={() => updateEstado(s.id, "Rechazada")} className="px-6 py-3 bg-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]" style={{border: `2px solid ${FLASH_RED}40`, color: FLASH_RED}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Rechazar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {sheetsCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3" style={{backgroundColor: '#1F2937', maxWidth: '90vw'}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#0F9D5830'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div><p className="text-sm font-semibold text-white">Google Sheet creado</p><p className="text-xs text-gray-400 mt-0.5">Se abrió en una nueva pestaña con <strong className="text-gray-300">{solicitudes.length} solicitudes</strong>.</p></div>
        </div>
      )}

      <footer className="mt-12 py-4" style={{borderTop: `3px solid ${FLASH_RED}`}}>
        <p className="text-center text-xs text-gray-400 font-medium">FLASH · Asesoría Digital SAS · Sistema de Facturación</p>
      </footer>
    </div>
  );
}
