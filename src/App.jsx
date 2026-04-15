import { useState } from "react";

const INITIAL_FORM = {
  cliente: "", nit: "", concepto: "", proyecto: "", tipoServicio: "",
  centroCosto: "", valor: "", moneda: "COP", aplicaRetencion: false,
  formaPago: "", mesFacturacion: "", observaciones: "",
};

const TIPOS_SERVICIO = ["Fee Mensual", "Proyecto Puntual", "Pauta Digital", "Consultoría", "Producción", "Otro"];
const CENTROS_COSTO = ["Flash General", "Marketing Digital", "Producción", "Consultoría", "Pauta"];
const FORMAS_PAGO = ["Transferencia", "Cheque", "Crédito 30 días", "Crédito 60 días", "Anticipado"];
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

function formatCurrency(val, moneda) {
  if (!val) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return moneda === "COP"
    ? `$ ${num.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`
    : `US$ ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={onChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none pr-10">
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
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{prefix}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`w-full ${prefix ? "pl-8" : "pl-3"} pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all`} />
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

const DEMO_DATA = [
  { id: 1, cliente: "Bancoldex", nit: "800.149.923-6", concepto: "Fee mensual abril — Marketing Digital", proyecto: "Marketing Digital Bancoldex", tipoServicio: "Fee Mensual", centroCosto: "Marketing Digital", valor: "12000000", moneda: "COP", aplicaRetencion: false, formaPago: "Crédito 30 días", mesFacturacion: "Abril", observaciones: "", estado: "Pendiente Aprobación", solicitadoPor: "Carolina M.", fecha: "2026-04-10" },
  { id: 2, cliente: "Skandia", nit: "860.005.224-4", concepto: "Pauta digital abril", proyecto: "Pauta Skandia", tipoServicio: "Pauta Digital", centroCosto: "Pauta", valor: "8500000", moneda: "COP", aplicaRetencion: true, formaPago: "Anticipado", mesFacturacion: "Abril", observaciones: "", estado: "Aprobada", solicitadoPor: "Andrés R.", fecha: "2026-04-08", aprobadoPor: "Mariana R.", fechaAprobacion: "2026-04-09" },
  { id: 3, cliente: "Claro Colombia", nit: "830.114.921-1", concepto: "Producción campaña Vive Claro", proyecto: "Campaña Vive Claro", tipoServicio: "Producción", centroCosto: "Producción", valor: "25000000", moneda: "COP", aplicaRetencion: false, formaPago: "Crédito 30 días", mesFacturacion: "Abril", observaciones: "", estado: "Facturada", solicitadoPor: "Carolina M.", fecha: "2026-04-01", aprobadoPor: "Mariana R.", fechaAprobacion: "2026-04-02", numFactura: "FAC-0341", fechaFacturacion: "2026-04-05" },
  { id: 4, cliente: "AYR España", nit: "B-12345678", concepto: "Consultoría estrategia digital Q2", proyecto: "Estrategia AYR 2026", tipoServicio: "Consultoría", centroCosto: "Consultoría", valor: "5200", moneda: "USD", aplicaRetencion: false, formaPago: "Transferencia", mesFacturacion: "Abril", observaciones: "Facturar en USD a cuenta española", estado: "Pendiente Aprobación", solicitadoPor: "Mariana R.", fecha: "2026-04-12" },
];

export default function App() {
  const [view, setView] = useState("form");
  const [form, setForm] = useState(INITIAL_FORM);
  const [solicitudes, setSolicitudes] = useState(DEMO_DATA);
  const [success, setSuccess] = useState(false);
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterMes, setFilterMes] = useState("Todos");
  const [expandedId, setExpandedId] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente Aprobación");

  const handleSubmit = () => {
    if (!form.cliente || !form.concepto || !form.valor || !form.tipoServicio || !form.mesFacturacion) return;
    setSolicitudes([{ id: solicitudes.length + 1, ...form, estado: "Pendiente Aprobación", solicitadoPor: "Tú", fecha: new Date().toISOString().split("T")[0] }, ...solicitudes]);
    setForm(INITIAL_FORM);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const updateEstado = (id, nuevoEstado) => {
    setSolicitudes(solicitudes.map((s) => s.id === id ? { ...s, estado: nuevoEstado, ...(nuevoEstado === "Aprobada" ? { aprobadoPor: "Mariana R.", fechaAprobacion: new Date().toISOString().split("T")[0] } : {}) } : s));
  };

  const filtered = solicitudes.filter((s) => {
    if (filterEstado !== "Todos" && s.estado !== filterEstado) return false;
    if (filterMes !== "Todos" && s.mesFacturacion !== filterMes) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const totalAprobado = solicitudes.filter(s => s.estado !== "Pendiente Aprobación" && s.estado !== "Rechazada").reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const totalFacturado = solicitudes.filter(s => s.estado === "Facturada" || s.estado === "Pagada").reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);

  const exportCSV = () => {
    const headers = ["ID", "Fecha", "Solicitado Por", "Cliente", "NIT", "Concepto", "Proyecto", "Tipo Servicio", "Centro Costo", "Valor", "Moneda", "Retención", "Forma Pago", "Estado", "Aprobado Por", "Fecha Aprobación", "# Factura", "Fecha Facturación", "Mes", "Observaciones"];
    const rows = filtered.map((s) => [`FAC-${String(s.id).padStart(3, "0")}`, s.fecha, s.solicitadoPor, s.cliente, s.nit, s.concepto, s.proyecto, s.tipoServicio, s.centroCosto, s.valor, s.moneda, s.aplicaRetencion ? "Sí" : "No", s.formaPago, s.estado, s.aprobadoPor || "", s.fechaAprobacion || "", s.numFactura || "", s.fechaFacturacion || "", s.mesFacturacion, s.observaciones]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturacion_flash_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "form", label: "Nueva Solicitud", icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>) },
    { id: "list", label: "Solicitudes", count: solicitudes.length, icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>) },
    { id: "approval", label: "Aprobar", count: pendientes.length, alert: pendientes.length > 0, icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Facturación Flash</h1>
                <p className="text-[11px] text-gray-400 leading-tight">Asesoría Digital SAS</p>
              </div>
            </div>
            <nav className="flex bg-gray-100/80 rounded-xl p-1 gap-0.5">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setView(item.id)} className={`relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === item.id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  <span className="hidden sm:inline">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.count !== undefined && (<span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${item.alert ? "bg-amber-100 text-amber-700" : "bg-gray-200/80 text-gray-500"}`}>{item.count}</span>)}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600">
                <h2 className="text-lg font-bold text-white">Nueva Solicitud de Facturación</h2>
                <p className="text-sm text-indigo-100 mt-1">Llena los datos y envía. Mariana recibirá la solicitud para aprobación.</p>
              </div>
              <div className="p-6 space-y-7">
                <div>
                  <div className="flex items-center gap-2 mb-3"><span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Datos del Cliente</p></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Cliente / Razón Social" value={form.cliente} onChange={set("cliente")} placeholder="Ej: Bancoldex S.A." required />
                    <InputField label="NIT / Identificación" value={form.nit} onChange={set("nit")} placeholder="Ej: 800.149.923-6" />
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center gap-2 mb-3"><span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span><p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Detalle del Servicio</p></div>
                  <div className="space-y-4">
                    <InputField label="Concepto" value={form.concepto} onChange={set("concepto")} placeholder="Ej: Fee mensual abril" required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Proyecto Asociado" value={form.proyecto} onChange={set("proyecto")} placeholder="Ej: Marketing Bancoldex" />
                      <SelectField label="Tipo de Servicio" value={form.tipoServicio} onChange={set("tipoServicio")} options={TIPOS_SERVICIO} required />
                    </div>
                    <SelectField label="Centro de Costo" value={form.centroCosto} onChange={set("centroCosto")} options={CENTROS_COSTO} />
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div>
                  <div className="flex items-center gap-2 mb-3"><span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Valor y Condiciones</p></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Valor a Facturar" value={form.valor} onChange={set("valor")} placeholder="Ej: 12000000" type="number" required prefix="$" />
                    <SelectField label="Moneda" value={form.moneda} onChange={set("moneda")} options={["COP", "USD"]} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <SelectField label="Forma de Pago" value={form.formaPago} onChange={set("formaPago")} options={FORMAS_PAGO} />
                    <SelectField label="Mes de Facturación" value={form.mesFacturacion} onChange={set("mesFacturacion")} options={MESES} required />
                  </div>
                  <label className="mt-4 flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={form.aplicaRetencion} onChange={set("aplicaRetencion")} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Aplica retención en la fuente</span>
                  </label>
                </div>
                <hr className="border-gray-100" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea value={form.observaciones} onChange={set("observaciones")} placeholder="Notas adicionales para contabilidad..." rows={3} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none" />
                </div>
                {form.valor && form.cliente && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Resumen de solicitud</p>
                    <p className="text-sm text-gray-800">Facturar a <strong>{form.cliente}</strong> por <strong>{formatCurrency(form.valor, form.moneda)}</strong> {form.moneda}{form.concepto && <> — {form.concepto}</>}</p>
                  </div>
                )}
                <button onClick={handleSubmit} disabled={!form.cliente || !form.concepto || !form.valor || !form.tipoServicio || !form.mesFacturacion} className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/60 active:scale-[0.98]">Enviar Solicitud de Facturación</button>
              </div>
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Solicitudes" value={solicitudes.length} subtitle="total registradas" color="#6366F1" />
              <KpiCard label="Aprobado" value={formatCurrency(totalAprobado, "COP")} subtitle="listo para facturar" color="#3B82F6" />
              <KpiCard label="Facturado" value={formatCurrency(totalFacturado, "COP")} subtitle="facturas emitidas" color="#059669" />
              <KpiCard label="Pendientes" value={pendientes.length} subtitle="por aprobar" color="#F59E0B" />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"><option value="Todos">Todos los estados</option>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select>
                <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"><option value="Todos">Todos los meses</option>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{filtered.length} resultados · <strong className="text-gray-700">{formatCurrency(totalFiltered, "COP")}</strong></span>
                <button onClick={exportCSV} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all active:scale-95"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Exportar CSV</button>
              </div>
            </div>
            {filtered.length === 0 ? (<div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400">No hay solicitudes con estos filtros.</p></div>) : (
              filtered.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/60 transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">FAC-{String(s.id).padStart(3, "0")}</span>
                          <Badge estado={s.estado} />
                          {s.aplicaRetencion && <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">RETENCIÓN</span>}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 truncate">{s.cliente}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{s.concepto}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(s.valor, s.moneda)}</p>
                        <p className="text-xs text-gray-400">{s.moneda} · {s.mesFacturacion}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>Por <strong className="text-gray-500">{s.solicitadoPor}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{s.fecha}</span>
                      {s.tipoServicio && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">{s.tipoServicio}</span></>}
                      {s.numFactura && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-emerald-600 font-semibold">{s.numFactura}</span></>}
                    </div>
                    {expandedId === s.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-400">NIT:</span> <span className="text-gray-700">{s.nit || "—"}</span></div>
                        <div><span className="text-gray-400">Proyecto:</span> <span className="text-gray-700">{s.proyecto || "—"}</span></div>
                        <div><span className="text-gray-400">Centro Costo:</span> <span className="text-gray-700">{s.centroCosto || "—"}</span></div>
                        <div><span className="text-gray-400">Forma Pago:</span> <span className="text-gray-700">{s.formaPago || "—"}</span></div>
                        {s.aprobadoPor && <div><span className="text-gray-400">Aprobó:</span> <span className="text-gray-700">{s.aprobadoPor} ({s.fechaAprobacion})</span></div>}
                        {s.numFactura && <div><span className="text-gray-400">Factura:</span> <span className="text-gray-700">{s.numFactura} ({s.fechaFacturacion})</span></div>}
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
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                <div>
                  <h2 className="text-base font-bold text-amber-900">Aprobación de Solicitudes</h2>
                  <p className="text-sm text-amber-700 mt-0.5">{pendientes.length > 0 ? `Tienes ${pendientes.length} solicitud${pendientes.length > 1 ? "es" : ""} esperando tu aprobación` : "No hay solicitudes pendientes"}</p>
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
                <div key={s.id} className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden hover:border-amber-200 transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">FAC-{String(s.id).padStart(3, "0")}</span><span className="text-xs text-gray-400">Solicitado por <strong className="text-gray-600">{s.solicitadoPor}</strong> el {s.fecha}</span></div>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{s.cliente}</h3>
                        {s.nit && <p className="text-sm text-gray-500">NIT: {s.nit}</p>}
                      </div>
                      <div className="text-right flex-shrink-0"><p className="text-2xl font-bold text-gray-900">{formatCurrency(s.valor, s.moneda)}</p><p className="text-xs text-gray-400">{s.moneda}</p></div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Concepto</span><span className="text-gray-800 font-medium text-right max-w-[60%]">{s.concepto}</span></div>
                      {s.proyecto && <div className="flex justify-between text-sm"><span className="text-gray-400">Proyecto</span><span className="text-gray-700">{s.proyecto}</span></div>}
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Tipo de Servicio</span><span className="text-gray-700">{s.tipoServicio}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Centro de Costo</span><span className="text-gray-700">{s.centroCosto || "—"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Forma de Pago</span><span className="text-gray-700">{s.formaPago || "—"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Mes de Facturación</span><span className="text-gray-700 font-medium">{s.mesFacturacion}</span></div>
                      {s.aplicaRetencion && <div className="flex justify-between text-sm"><span className="text-gray-400">Retención</span><span className="text-amber-600 font-medium">Sí aplica</span></div>}
                      {s.observaciones && <div className="flex justify-between text-sm"><span className="text-gray-400">Notas</span><span className="text-gray-700 text-right max-w-[60%]">{s.observaciones}</span></div>}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => updateEstado(s.id, "Aprobada")} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-[0.98]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Aprobar</button>
                      <button onClick={() => updateEstado(s.id, "Rechazada")} className="px-6 py-3 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Rechazar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <footer className="border-t border-gray-100 mt-12 py-4"><p className="text-center text-xs text-gray-300">Flash · Asesoría Digital SAS · Sistema de Facturación</p></footer>
    </div>
  );
}
