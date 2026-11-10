import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Download, FileText, Plus, Printer, ReceiptText, RefreshCw, Save, Send, Settings2, X } from "lucide-react";
import { useAppSelector } from "../../app/Hooks";
import { api } from "../../api/axios";
import {
  approveBilling, createBillingDraft, downloadBillingPdf, finalizeBilling, getBilling, getBillingConfig,
  listBilling, rejectBilling, submitBilling, updateBillingConfig, updateBillingDraft, updateServiceTax,
  uploadBillingReceipt,
} from "../../api/billing";
import type { BillingCategory, BillingConfig, BillingItemInput, BillingStatus } from "../../api/billing";

type Row = Record<string, unknown>;
interface EditItem extends BillingItemInput { id?: string; file?: File | null }
const statuses: BillingStatus[] = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "FINALIZED"];
const categories: { value: BillingCategory; label: string }[] = [
  { value: "DELIVERY", label: "Delivery" }, { value: "TRANSPORTATION", label: "Transportation" },
  { value: "MATERIAL", label: "Materials" }, { value: "SPARE_PARTS", label: "Spare parts" },
  { value: "OTHER_EXPENSE", label: "Other expense" }, { value: "DISCOUNT", label: "Discount" },
];
const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const text = (value: unknown, fallback = "—") => typeof value === "string" || typeof value === "number" ? String(value) : fallback;
const unwrap = (value: unknown): Row => record(record(value).data ?? value);
const rowsOf = (value: unknown): Row[] => {
  const root = record(value); const data = root.data;
  if (Array.isArray(data)) return data.map(record);
  const nested = record(data);
  const rows = [root.items, root.invoices, nested.items, nested.invoices, nested.data].find(Array.isArray);
  return Array.isArray(rows) ? rows.map(record) : [];
};
const displayName = (value: unknown) => {
  const item = record(value); const user = record(item.user);
  return [item.firstName ?? user.firstName, item.lastName ?? user.lastName].filter(Boolean).join(" ") || text(item.name ?? item.fullName ?? item.email);
};
const invoiceId = (value: Row) => text(value.id ?? value.invoiceId, "");
const invoiceItems = (value: unknown): Row[] => Array.isArray(value) ? value.map(record) : [];
const invoiceStatus = (value: Row) => String(value.status ?? "DRAFT").toUpperCase() as BillingStatus;
const dateTime = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
};
const errorText = (error: unknown) => {
  const data = record(record(error).response); const body = record(data.data); const message = body.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "The billing request failed.";
};
const statusTone: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-rose-100 text-rose-800", FINALIZED: "bg-blue-100 text-blue-800",
};
const lineAmount = (item: EditItem) => (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
const emptyItem = (): EditItem => ({ category: "MATERIAL", description: "", quantity: 1, unitPrice: 0, file: null });

export default function BillingManagement() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role ?? "";
  const isAdmin = role === "admin" || role === "super_admin";
  const isManager = role === "manager";
  const isSupervisor = role === "employee" && user?.designation?.trim().toLowerCase() === "supervisor";
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [workOrders, setWorkOrders] = useState<Row[]>([]);
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [services, setServices] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"billing" | "config">("billing");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BillingStatus>("ALL");
  const [workOrderFilter, setWorkOrderFilter] = useState("");
  const [workOrderSearch, setWorkOrderSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");
  const [companyFilter, setCompanyFilter] = useState(""); const [employeeFilter, setEmployeeFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState(""); const [customerFilter, setCustomerFilter] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Row | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [editItems, setEditItems] = useState<EditItem[]>([emptyItem()]);
  const [remarks, setRemarks] = useState("");
  const [gstStateCodeDraft, setGstStateCodeDraft] = useState("");
  const [serviceTaxSaving, setServiceTaxSaving] = useState<string | null>(null);
  // Technicians and supervisors enter charges; the company setting controls manager entry.
  const canAddCharges = isAdmin || role === "employee" || (isManager && config?.managerCanAddCharges === true);
  const canApprove = isAdmin || isManager || isSupervisor;

  const loadInvoices = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await listBilling({ ...(workOrderFilter ? { workOrderId: workOrderFilter } : {}) });
      setInvoices(rowsOf(response.data));
    } catch (cause) { setError(errorText(cause)); }
    finally { setLoading(false); }
  }, [workOrderFilter]);

  const loadWorkOrders = useCallback(async () => {
    // The endpoint applies the caller's team/company scope, including an employee's own work orders.
    if (!isAdmin && !isManager && role !== "employee") return;
    setWorkOrdersLoading(true);
    try {
      const first = await api.get("/work-orders", { params: { page: 1, limit: 100 } });
      const all = rowsOf(first.data);
      const root = record(first.data); const nested = record(root.data);
      const pageMeta = record(root.pagination ?? nested.pagination);
      const pages = Math.min(100, Number(pageMeta.totalPages ?? 1) || 1);
      for (let page = 2; page <= pages; page += 1) {
        const response = await api.get("/work-orders", { params: { page, limit: 100 } });
        all.push(...rowsOf(response.data));
      }
      setWorkOrders(all);
    } catch (cause) { setError(errorText(cause)); }
    finally { setWorkOrdersLoading(false); }
  }, [isAdmin, isManager, role]);

  const loadConfig = useCallback(async () => {
    try {
      const response = await getBillingConfig(); const data = unwrap(response.data) as unknown as BillingConfig;
      setConfig(data); setGstStateCodeDraft(data.gstStateCode ?? "");
    } catch (cause) { setError((current) => current || errorText(cause)); }
  }, []);

  const loadServices = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get("/services"); setServices(rowsOf(response.data));
    } catch (cause) { setError((current) => current || errorText(cause)); }
  }, [isAdmin]);

  useEffect(() => { void loadInvoices(); }, [loadInvoices]);
  useEffect(() => { void loadWorkOrders(); void loadConfig(); void loadServices(); }, [loadWorkOrders, loadConfig, loadServices]);

  const visibleInvoices = useMemo(() => invoices.filter((invoice) => {
    if (statusFilter !== "ALL" && invoiceStatus(invoice) !== statusFilter) return false;
    const work = record(invoice.workOrder); const booking = record(invoice.booking); const customer = record(booking.customer ?? work.customer);
    const submittedAt = String(invoice.submittedAt ?? invoice.createdAt ?? "").slice(0, 10);
    const company = text(invoice.companyName ?? record(work.company).name ?? invoice.company, "");
    const employee = displayName(invoice.submittedBy ?? invoice.createdBy ?? invoice.employee);
    const manager = displayName(invoice.manager ?? work.manager);
    const customerName = displayName(customer);
    const workRef = text(work.workOrderNumber ?? invoice.workOrderId ?? work.id, "");
    const includes = (field: string, query: string) => !query.trim() || field.toLowerCase().includes(query.trim().toLowerCase());
    return (!dateFrom || submittedAt >= dateFrom) && (!dateTo || submittedAt <= dateTo) && includes(company, companyFilter) && includes(employee, employeeFilter) && includes(manager, managerFilter) && includes(customerName, customerFilter) && includes(workRef, workOrderFilter);
  }), [invoices, statusFilter, dateFrom, dateTo, companyFilter, employeeFilter, managerFilter, customerFilter, workOrderFilter]);

  const openDetail = async (invoice: Row) => {
    setSelected(invoice); setDetailLoading(true); setRemarks(""); setError("");
    try { const response = await getBilling(invoiceId(invoice)); setSelected(unwrap(response.data)); }
    catch (cause) { setError(errorText(cause)); }
    finally { setDetailLoading(false); }
  };
  const beginCreate = (workOrderId = "") => {
    setEditInvoice(null); setSelectedWorkOrderId(workOrderId); setEditItems([emptyItem()]); setEditOpen(true); setError("");
  };
  const openWorkOrderBilling = async (work: Row) => {
    const id = text(work.id, ""); if (!id) return;
    setError("");
    try {
      const response = await listBilling({ workOrderId: id });
      const matches = rowsOf(response.data);
      if (matches[0]) { await openDetail(matches[0]); return; }
      if (canAddCharges && String(work.status ?? "").toUpperCase() === "COMPLETED") { beginCreate(id); return; }
      setError("No billing record exists for this work order.");
    } catch (cause) { setError(errorText(cause)); }
  };
  const beginEdit = (invoice: Row) => {
    const items = invoiceItems(invoice.items).map((item): EditItem => ({
      id: text(item.id, ""), category: String(item.category ?? "MATERIAL") as BillingCategory,
      description: String(item.description ?? ""), quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice ?? item.amount) || 0, file: null,
    }));
    setEditInvoice(invoice); setSelectedWorkOrderId(text(invoice.workOrderId ?? record(invoice.workOrder).id, "")); setEditItems(items.length ? items : [emptyItem()]); setEditOpen(true); setError("");
  };
  const updateEditItem = (index: number, update: Partial<EditItem>) => setEditItems((current) => current.map((item, position) => position === index ? { ...item, ...update } : item));

  const saveDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (editItems.some((item) => item.file && (!item.file.type.startsWith("image/") || item.file.size > 5 * 1024 * 1024))) { setError("Receipt uploads must be images no larger than 5 MB."); return; }
    if (!editInvoice && !selectedWorkOrderId) { setError("Select a completed work order."); return; }
    const validItems = editItems.filter((item) => item.description.trim());
    if (!validItems.length) { setError("Add at least one charge with a description."); return; }
    if (validItems.some((item) => item.quantity <= 0 || item.unitPrice < 0 || !Number.isFinite(item.quantity) || !Number.isFinite(item.unitPrice))) { setError("Each charge needs a positive quantity and a valid non-negative unit price."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const items: BillingItemInput[] = validItems.map(({ category, description, quantity, unitPrice }) => ({ category, description: description.trim(), quantity, unitPrice }));
      const response = editInvoice
        ? await updateBillingDraft(invoiceId(editInvoice), items)
        : await createBillingDraft(selectedWorkOrderId, items);
      const saved = unwrap(response.data); const id = invoiceId(saved) || (editInvoice ? invoiceId(editInvoice) : "");
      if (!id) throw new Error("The billing API did not return an invoice ID.");
      let current = saved;
      const detailResponse = await getBilling(id); current = unwrap(detailResponse.data);
      const savedItems = invoiceItems(current.items);
      for (let index = 0; index < validItems.length; index += 1) {
        const file = validItems[index].file;
        if (!file) continue;
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) throw new Error("Receipt uploads must be images no larger than 5 MB.");
        const itemId = text(savedItems[index]?.id, "");
        await uploadBillingReceipt(id, file, itemId || undefined);
      }
      setSelected(current); setEditOpen(false); setNotice(editInvoice ? "Billing draft updated." : "Billing draft created."); await loadInvoices();
    } catch (cause) { setError(errorText(cause)); }
    finally { setSaving(false); }
  };

  const runAction = async (action: "submit" | "approve" | "reject" | "finalize") => {
    if (!selected || saving) return;
    if (action === "reject" && !remarks.trim()) { setError("Enter remarks explaining why this billing is rejected."); return; }
    const labels = { submit: "Submit this bill for approval?", approve: "Approve this billing?", reject: "Reject this billing?", finalize: "Finalize this invoice? Finalized billing cannot be changed." };
    if (!window.confirm(labels[action])) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const id = invoiceId(selected);
      if (action === "submit") await submitBilling(id);
      if (action === "approve") await approveBilling(id, remarks.trim());
      if (action === "reject") await rejectBilling(id, remarks.trim());
      if (action === "finalize") await finalizeBilling(id);
      const response = await getBilling(id); const fresh = unwrap(response.data);
      setSelected(fresh); setRemarks(""); setNotice(action === "submit" ? "Billing submitted for approval." : action === "approve" ? "Billing approved." : action === "reject" ? "Billing rejected." : "Invoice finalized.");
      await loadInvoices();
    } catch (cause) { setError(errorText(cause)); }
    finally { setSaving(false); }
  };

  const saveCompanyConfig = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!config || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await updateBillingConfig({ managerCanAddCharges: config.managerCanAddCharges, allowSelfApproval: config.allowSelfApproval, gstStateCode: gstStateCodeDraft.trim() });
      setConfig(unwrap(response.data) as unknown as BillingConfig); setNotice("Billing configuration saved.");
    } catch (cause) { setError(errorText(cause)); }
    finally { setSaving(false); }
  };
  const saveServiceTax = async (service: Row) => {
    const id = text(service.id, ""); if (!id) return;
    setServiceTaxSaving(id); setError(""); setNotice("");
    try {
      await updateServiceTax(id, Number(service.gstRate) || 0, Boolean(service.gstInclusive));
      setNotice(`GST settings saved for ${text(service.name, "service")}.`); await loadServices();
    } catch (cause) { setError(errorText(cause)); }
    finally { setServiceTaxSaving(null); }
  };
  const downloadPdf = async (invoice: Row) => {
    try {
      const response = await downloadBillingPdf(invoiceId(invoice));
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a"); link.href = blobUrl; link.download = `${text(invoice.invoiceNumber ?? invoiceId(invoice), "invoice")}.pdf`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (cause) { setError(errorText(cause)); }
  };

  const totals = (invoice: Row) => [
    ["Base service price", invoice.baseServicePrice], ["Discount", invoice.discountAmount], ["Subtotal", invoice.subtotal],
    ["Taxable amount", invoice.taxableAmount], ["GST rate", invoice.gstRate == null ? null : `${invoice.gstRate}%`],
    ["CGST", invoice.cgstAmount], ["SGST", invoice.sgstAmount], ["IGST", invoice.igstAmount], ["GST amount", invoice.gstAmount],
    ["Final payable", invoice.adjustedFinalAmount ?? invoice.finalAmount],
  ] as const;
  const submittedBy = displayName(selected?.submittedBy ?? selected?.createdBy ?? selected?.employee);
  const approvedBy = displayName(selected?.approvedBy ?? selected?.reviewedBy);
  const submittedUserId = text(selected?.submittedById ?? selected?.createdById ?? record(selected?.submittedBy ?? selected?.createdBy).id, "");
  const selfApprovalBlocked = !config?.allowSelfApproval && submittedUserId && String(user?.id) === submittedUserId;
  const selectedStatus = selected ? invoiceStatus(selected) : "DRAFT";
  const selectedEditable = Boolean(selected && canAddCharges && ["DRAFT", "REJECTED"].includes(selectedStatus));
  const pendingApprovalCount = invoices.filter((item) => invoiceStatus(item) === "PENDING_APPROVAL").length;
  const approvedCount = invoices.filter((item) => invoiceStatus(item) === "APPROVED").length;
  const rejectedCount = invoices.filter((item) => invoiceStatus(item) === "REJECTED").length;
  const draftCount = invoices.filter((item) => invoiceStatus(item) === "DRAFT").length;
  const finalizedCount = invoices.filter((item) => invoiceStatus(item) === "FINALIZED").length;
  const textFilters: { label: string; value: string; onChange: (value: string) => void }[] = [
    { label: "Company", value: companyFilter, onChange: setCompanyFilter },
    { label: "Employee", value: employeeFilter, onChange: setEmployeeFilter },
    { label: "Manager", value: managerFilter, onChange: setManagerFilter },
    { label: "Customer", value: customerFilter, onChange: setCustomerFilter },
  ];
  const visibleWorkOrders = workOrders.filter((work) => `${text(work.workOrderNumber ?? work.reference, "")} ${text(work.customer ?? record(work.booking).customer, "")} ${text(work.service, "")} ${text(work.status, "")}`.toLowerCase().includes(workOrderSearch.trim().toLowerCase()));

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Finance / Billing</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Billing Management</h1><p className="mt-2 text-sm text-slate-500">Review service charges, approvals, tax, and finalized invoices.</p></div><div className="flex gap-2">{canAddCharges && <button type="button" onClick={() => beginCreate()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/>Create billing draft</button>}<button type="button" onClick={() => void loadInvoices()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button></div></header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {isAdmin && <div className="flex gap-1 border-b border-slate-200"><button type="button" onClick={() => setTab("billing")} className={`px-4 py-2.5 text-sm font-semibold ${tab === "billing" ? "border-b-2 border-emerald-700 text-emerald-800" : "text-slate-500"}`}>Billing queue</button><button type="button" onClick={() => setTab("config")} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold ${tab === "config" ? "border-b-2 border-emerald-700 text-emerald-800" : "text-slate-500"}`}><Settings2 size={15}/>GST & approval settings</button></div>}
    {(!isAdmin || tab === "billing") ? <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Pending approvals", pendingApprovalCount, "PENDING_APPROVAL"], ["Approved", approvedCount, "APPROVED"], ["Rejected", rejectedCount, "REJECTED"], ["Drafts", draftCount, "DRAFT"], ["Finalized invoices", finalizedCount, "FINALIZED"]].map(([label, value, filter]) => <button key={String(filter)} type="button" onClick={() => setStatusFilter(filter as BillingStatus)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-300"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></button>)}</section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-900">Work orders</h2><p className="mt-1 text-xs text-slate-500">Work orders returned for your company or authorized team.</p></div><input type="search" value={workOrderSearch} onChange={(event) => setWorkOrderSearch(event.target.value)} placeholder="Search work orders…" aria-label="Search work orders" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:max-w-xs"/></header>{workOrdersLoading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Loading work orders…</p> : visibleWorkOrders.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No work orders returned.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Work order</th><th className="px-5 py-3">Customer / service</th><th className="px-5 py-3">Scheduled</th><th className="px-5 py-3">Base service price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{visibleWorkOrders.map((work) => { const booking = record(work.booking); const customer = record(booking.customer ?? work.customer); const service = record(booking.service ?? work.service); const completed = String(work.status ?? "").toUpperCase() === "COMPLETED"; return <tr key={String(work.id)}><td className="px-5 py-4 font-semibold text-slate-800">{text(work.workOrderNumber ?? work.reference ?? work.id)}</td><td className="px-5 py-4"><p className="font-medium text-slate-800">{displayName(customer)}</p><p className="mt-1 text-xs text-slate-500">{text(service.name ?? work.serviceName)}</p></td><td className="px-5 py-4 text-slate-600">{dateTime(work.scheduledDate)}</td><td className="px-5 py-4 text-slate-700">{work.baseServicePrice != null || service.basePrice != null ? money(work.baseServicePrice ?? service.basePrice) : "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completed ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{text(work.status)}</span></td><td className="px-5 py-4"><button type="button" onClick={() => void openWorkOrderBilling(work)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400">{completed && canAddCharges ? "Open / bill" : "Open billing"}</button></td></tr>; })}</tbody></table></div>}</section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold text-slate-600">Billing status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | BillingStatus)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Work order<select value={workOrderFilter} onChange={(event) => setWorkOrderFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All work orders</option>{workOrders.map((work) => <option key={String(work.id)} value={String(work.id)}>{text(work.workOrderNumber ?? work.reference ?? work.id)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label><label className="text-xs font-semibold text-slate-600">To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label>{textFilters.map(({ label, value, onChange }) => <label key={label} className="text-xs font-semibold text-slate-600">{label}<input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Filter ${label.toLowerCase()}`} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label>)}</div>
        {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading billing records…</p> : visibleInvoices.length === 0 ? <div className="p-12 text-center"><ReceiptText className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-semibold text-slate-800">No billing records found</p><p className="mt-1 text-sm text-slate-500">Records visible to your account will appear here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Invoice / work order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Submitted by</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3">Final payable</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{visibleInvoices.map((invoice) => { const work = record(invoice.workOrder); const booking = record(invoice.booking); const customer = record(booking.customer ?? work.customer); const status = invoiceStatus(invoice); return <tr key={invoiceId(invoice)} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-slate-900">{text(invoice.invoiceNumber ?? invoice.id)}</p><p className="mt-1 text-xs text-slate-500">{text(work.workOrderNumber ?? invoice.workOrderId ?? work.id)}</p></td><td className="px-5 py-4 text-slate-700">{displayName(customer)}</td><td className="px-5 py-4 text-slate-700">{displayName(invoice.submittedBy ?? invoice.createdBy ?? invoice.employee)}</td><td className="px-5 py-4 text-slate-600">{dateTime(invoice.submittedAt ?? invoice.updatedAt ?? invoice.createdAt)}</td><td className="px-5 py-4 font-bold text-slate-900">{money(invoice.adjustedFinalAmount ?? invoice.finalAmount)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status] ?? statusTone.DRAFT}`}>{status.replaceAll("_", " ")}</span></td><td className="px-5 py-4"><button type="button" onClick={() => void openDetail(invoice)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400">Details</button></td></tr>; })}</tbody></table><div className="flex justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>{visibleInvoices.length} billing records</span><span>Amounts are calculated by the backend</span></div></div>}
      </section>
    </> : <section className="space-y-5">
      <form onSubmit={(event) => void saveCompanyConfig(event)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-slate-900">Company billing settings</h2><p className="mt-1 text-sm text-slate-500">Approval policy and GST state code used by backend tax calculations.</p></div>{config ? <><label className="block max-w-xs text-xs font-semibold text-slate-600">Company GST state code<input required maxLength={2} value={gstStateCodeDraft} onChange={(event) => setGstStateCodeDraft(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label><div className="mt-4 space-y-3"><label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={config.managerCanAddCharges} onChange={(event) => setConfig({ ...config, managerCanAddCharges: event.target.checked })} className="h-4 w-4 accent-emerald-700"/>Allow managers to add billing charges</label><label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={config.allowSelfApproval} onChange={(event) => setConfig({ ...config, allowSelfApproval: event.target.checked })} className="h-4 w-4 accent-emerald-700"/>Allow self-approval</label></div><p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">GST rate source: {config.gstRateSource || "Service settings"}. Backend calculations remain authoritative.</p><button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save company settings"}</button></> : <p className="text-sm text-slate-500">Loading billing configuration…</p>}</form>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">GST by service</h2><p className="mt-1 text-sm text-slate-500">Set service GST rate and whether the listed price includes tax. Set rate to 0 when GST does not apply.</p></header>{services.length === 0 ? <p className="p-6 text-sm text-slate-500">No service configuration returned.</p> : <div className="divide-y divide-slate-100">{services.map((service) => <div key={String(service.id)} className="grid gap-3 p-4 sm:grid-cols-[1fr_130px_180px_auto] sm:items-center"><div><p className="font-semibold text-slate-800">{text(service.name)}</p><p className="mt-1 text-xs text-slate-500">Base price {money(service.basePrice)}</p></div><label className="text-xs font-semibold text-slate-600">GST rate (%)<input type="number" min="0" max="100" step="0.01" value={String(service.gstRate ?? "0")} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, gstRate: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/></label><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={Boolean(service.gstInclusive)} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, gstInclusive: event.target.checked } : item))} className="h-4 w-4 accent-emerald-700"/>Price includes GST</label><button type="button" onClick={() => void saveServiceTax(service)} disabled={serviceTaxSaving === String(service.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">{serviceTaxSaving === String(service.id) ? "Saving…" : "Save GST"}</button></div>)}</div>}<p className="border-t border-slate-100 p-4 text-xs text-slate-500">Set service location state codes in the customer address form to let the backend calculate CGST/SGST or IGST. GST registration numbers are not exposed by the current billing configuration API.</p></div>
    </section>}

    {selected && createPortal(<><style>{`@media print { body * { visibility: hidden !important; } #billing-print-sheet, #billing-print-sheet * { visibility: visible !important; } #billing-print-sheet { position: fixed !important; inset: 0 !important; width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; } #billing-print-sheet button { display: none !important; } }`}</style><div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}><section id="billing-print-sheet" role="dialog" aria-modal="true" aria-labelledby="billing-detail-heading" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Billing details</p><h2 id="billing-detail-heading" className="mt-1 text-xl font-bold text-slate-900">{text(selected.invoiceNumber ?? selected.id)}</h2></div><div className="flex gap-2">{selectedStatus === "FINALIZED" && <><button type="button" onClick={() => void downloadPdf(selected)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><Download size={15}/>Download PDF</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><Printer size={15}/>Print</button></>}<button type="button" aria-label="Close details" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></div></header>
      {detailLoading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading billing details…</p> : <div className="space-y-5 p-5"><div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Status" value={selectedStatus.replaceAll("_", " ")}/><Info label="Work order" value={text(record(selected.workOrder).workOrderNumber ?? selected.workOrderId ?? record(selected.workOrder).id)}/><Info label="Customer" value={displayName(record(selected.booking).customer ?? record(selected.workOrder).customer)}/><Info label="Customer email" value={text(record(record(selected.booking).customer ?? record(selected.workOrder).customer).email)}/><Info label="Customer phone" value={text(record(record(selected.booking).customer ?? record(selected.workOrder).customer).phone)}/><Info label="Submitted by" value={submittedBy}/><Info label="Approved by" value={approvedBy}/><Info label="Submitted at" value={dateTime(selected.submittedAt)}/><Info label="Base service price" value={money(selected.baseServicePrice)}/><Info label="GST rate" value={`${text(selected.gstRate, "0")}%`}/></div>
        <section className="overflow-hidden rounded-xl border border-slate-200"><div className="flex items-center gap-2 border-b border-slate-100 p-4"><ReceiptText size={17} className="text-emerald-700"/><h3 className="font-bold text-slate-900">Charge items</h3></div>{invoiceItems(selected.items).length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Category / description</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Unit price</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Added by</th><th className="px-4 py-3">Receipt</th></tr></thead><tbody className="divide-y divide-slate-100">{invoiceItems(selected.items).map((item, index) => { const attachments = Array.isArray(item.attachments) ? item.attachments.map(record) : []; const fileUrl = text(item.fileUrl ?? item.receiptUrl ?? attachments[0]?.fileUrl ?? attachments[0]?.url, ""); return <tr key={text(item.id, String(index))}><td className="px-4 py-3"><p className="font-semibold text-slate-800">{String(item.category ?? "OTHER_EXPENSE").replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{text(item.description)}</p></td><td className="px-4 py-3">{text(item.quantity, "1")}</td><td className="px-4 py-3">{money(item.unitPrice)}</td><td className="px-4 py-3 font-semibold">{money(item.amount)}</td><td className="px-4 py-3">{displayName(item.createdBy ?? item.creator) || text(item.createdById)}</td><td className="px-4 py-3">{fileUrl !== "—" && fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="text-emerald-800 underline">View receipt</a> : "—"}</td></tr>; })}</tbody></table></div> : <p className="p-5 text-sm text-slate-500">No additional charges.</p>}</section>
        <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 font-bold text-slate-900">Billing totals</h3><div className="space-y-2">{totals(selected).filter(([, value]) => value != null).map(([label, value]) => <div key={label} className={`flex justify-between gap-3 text-sm ${label === "Final payable" ? "border-t border-slate-200 pt-3 font-bold text-slate-900" : "text-slate-600"}`}><span>{label}</span><span>{label === "GST rate" ? value : money(value)}</span></div>)}</div><p className="mt-3 text-[11px] text-slate-500">Tax values and payable totals are calculated by the backend.</p></div><div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 font-bold text-slate-900">Invoice and approval</h3><Info label="Invoice ID" value={text(selected.invoiceNumber ?? selected.id)}/><Info label="Billing ID" value={invoiceId(selected)}/>{Array.isArray(selected.approvalHistory) && selected.approvalHistory.length > 0 ? <div className="mt-3 space-y-2">{selected.approvalHistory.map((entry, index) => { const item = record(entry); return <div key={String(item.id ?? index)} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-semibold text-slate-800">{text(item.action ?? item.status)} · {displayName(item.user ?? item.actor)}</p><p className="mt-1 text-slate-500">{dateTime(item.createdAt)}{item.remarks ? ` · ${String(item.remarks)}` : ""}</p></div>; })}</div> : <p className="mt-3 text-xs text-slate-500">No approval history was returned by the billing API.</p>}</div></div>
        {selectedEditable && <button type="button" onClick={() => beginEdit(selected)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Edit draft</button>}
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {canApprove && selectedStatus === "PENDING_APPROVAL" && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4"><label className="block text-sm font-semibold text-slate-700">Review remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={1000} rows={3} placeholder="Add a note for the submitter; required when rejecting" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label><div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} onClick={() => void runAction("reject")} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">Reject</button><button type="button" disabled={saving || Boolean(selfApprovalBlocked)} onClick={() => void runAction("approve")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={15}/>Approve</button>{selfApprovalBlocked && <p className="w-full text-right text-xs text-amber-800">Self-approval is disabled by company policy.</p>}</div></div>}
        {canAddCharges && ["DRAFT", "REJECTED"].includes(selectedStatus) && <button type="button" disabled={saving} onClick={() => void runAction("submit")} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Send size={15}/>Submit for approval</button>}
        {isAdmin && selectedStatus === "APPROVED" && <button type="button" disabled={saving} onClick={() => void runAction("finalize")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><FileText size={15}/>Finalize invoice</button>}
      </div>}
    </section></div></>, document.body)}

    {editOpen && createPortal(<div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="billing-editor-heading" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Billing draft</p><h2 id="billing-editor-heading" className="mt-1 text-xl font-bold text-slate-900">{editInvoice ? "Edit billing charges" : "Create billing draft"}</h2></div><button type="button" aria-label="Close" onClick={() => setEditOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header><form onSubmit={(event) => void saveDraft(event)} className="space-y-5 p-5">{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {!editInvoice && <label className="block text-sm font-semibold text-slate-700">Completed work order<select required value={selectedWorkOrderId} onChange={(event) => setSelectedWorkOrderId(event.target.value)} disabled={workOrdersLoading} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="">{workOrdersLoading ? "Loading work orders…" : "Select work order"}</option>{workOrders.filter((item) => String(item.status ?? "").toUpperCase() === "COMPLETED").map((work) => <option key={String(work.id)} value={String(work.id)}>{text(work.workOrderNumber ?? work.reference ?? work.id)} · {text(record(work.booking).bookingNumber ?? work.customer ?? "Work order")}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Billing drafts can only be created for completed work orders.</span></label>}
      {editInvoice && <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Work order {text(record(editInvoice.workOrder).workOrderNumber ?? editInvoice.workOrderId)}</div>}
      <section className="space-y-3"><div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Charge line items</h3><p className="mt-1 text-xs text-slate-500">Prices are sent as inputs; backend totals are authoritative.</p></div><button type="button" onClick={() => setEditItems((current) => [...current, emptyItem()])} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Plus size={14}/>Add line</button></div>{editItems.map((item, index) => <div key={item.id ?? index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_100px_130px_auto]"><label className="text-xs font-semibold text-slate-600">Category<select value={item.category} onChange={(event) => updateEditItem(index, { category: event.target.value as BillingCategory })} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Description<input required value={item.description} onChange={(event) => updateEditItem(index, { description: event.target.value })} maxLength={200} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"/></label><label className="text-xs font-semibold text-slate-600">Qty<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateEditItem(index, { quantity: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"/></label><label className="text-xs font-semibold text-slate-600">Unit price<input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateEditItem(index, { unitPrice: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"/></label><button type="button" disabled={editItems.length <= 1} onClick={() => setEditItems((current) => current.filter((_, position) => position !== index))} className="self-end rounded-lg p-2 text-rose-600 disabled:opacity-30" aria-label="Remove charge line"><X size={17}/></button><label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-4">Receipt image (optional, max 5 MB)<input type="file" accept="image/*" onChange={(event) => updateEditItem(index, { file: event.target.files?.[0] ?? null })} className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold"/>{item.file && <span className="mt-1 block font-normal">{item.file.name}</span>}</label><div className="self-end text-right text-xs font-semibold text-slate-500">Line estimate<br/>{money(lineAmount(item))}</div></div>)}</section>
      <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"><p className="text-xs text-slate-500">Backend subtotal, tax, and final amount are shown after saving the draft.</p><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setEditOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save draft"}</button></div></div></form></section></div>, document.body)}
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 py-1"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p></div>;
}
