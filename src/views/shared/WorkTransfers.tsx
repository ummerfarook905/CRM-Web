import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRightLeft, Check, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert, UserRound, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchWorkOrders, type MonitoredWorkOrder } from "../../services/WorkMonitoringSlice";
import {
  clearTransferTargets,
  clearWorkTransferMessages,
  decideWorkTransfer,
  fetchTransferTargets,
  fetchWorkTransfers,
  reassignWork,
  type WorkTransfer,
  type WorkTransferStatus,
} from "../../services/WorkTransfersSlice";

const statuses: WorkTransferStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const statusLabel = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const dateTimeLabel = (value: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};
const activeOrder = (work: MonitoredWorkOrder) => !["COMPLETED", "CANCELLED"].includes(work.status.toUpperCase().replaceAll(" ", "_"));
const activeAssignment = (assignment: MonitoredWorkOrder["assignments"][number]) =>
  assignment.employeeId && !["COMPLETED", "CANCELLED", "REJECTED"].includes(assignment.status.toUpperCase().replaceAll(" ", "_"));

type DecisionDraft = { transfer: WorkTransfer; decision: "APPROVED" | "REJECTED" };

export default function WorkTransfers() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const transferState = useAppSelector((state) => state.workTransfers);
  const workOrderState = useAppSelector((state) => state.workMonitoring);
  const [status, setStatus] = useState<WorkTransferStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [decisionDraft, setDecisionDraft] = useState<DecisionDraft | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [workOrderId, setWorkOrderId] = useState("");
  const [fromEmployeeId, setFromEmployeeId] = useState("");
  const [toEmployeeId, setToEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [reassignNote, setReassignNote] = useState("");

  useEffect(() => {
    void dispatch(fetchWorkTransfers({ status, page, limit: 20 }));
  }, [dispatch, status, page]);

  const reassignableOrders = useMemo(
    () => workOrderState.items.filter((work) => activeOrder(work) && work.assignments.some(activeAssignment)),
    [workOrderState.items],
  );
  const selectedWorkOrder = reassignableOrders.find((work) => work.id === workOrderId);
  const activeAssignments = selectedWorkOrder?.assignments.filter(activeAssignment) ?? [];
  const eligibleTargets = transferState.targets.filter((target) => target.id !== fromEmployeeId);

  useEffect(() => {
    if (!reassignOpen || !workOrderId) {
      dispatch(clearTransferTargets());
      return;
    }
    const work = reassignableOrders.find((item) => item.id === workOrderId);
    if (!work) return;
    dispatch(fetchTransferTargets(workOrderId));
  }, [dispatch, reassignOpen, workOrderId, reassignableOrders]);

  const openReassign = () => {
    dispatch(clearWorkTransferMessages());
    setWorkOrderId("");
    setFromEmployeeId("");
    setToEmployeeId("");
    setReason("");
    setReassignNote("");
    setReassignOpen(true);
    void dispatch(fetchWorkOrders({ page: 1, limit: 100 }));
  };

  const closeReassign = () => {
    if (transferState.reassigning) return;
    setReassignOpen(false);
    setWorkOrderId("");
    dispatch(clearTransferTargets());
  };

  const openDecision = (transfer: WorkTransfer, decision: DecisionDraft["decision"]) => {
    dispatch(clearWorkTransferMessages());
    setDecisionDraft({ transfer, decision });
    setDecisionNote("");
  };

  const submitDecision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decisionDraft || transferState.actionId) return;
    const { transfer, decision } = decisionDraft;
    const confirmed = window.confirm(
      `${decision === "APPROVED" ? "Accept" : "Reject"} the transfer for ${transfer.workOrderNumber}?`,
    );
    if (!confirmed) return;
    const result = await dispatch(decideWorkTransfer({
      transferId: transfer.id,
      decision,
      ...(decisionNote.trim() ? { note: decisionNote.trim() } : {}),
    }));
    if (decideWorkTransfer.fulfilled.match(result)) {
      setDecisionDraft(null);
      void dispatch(fetchWorkTransfers({ status, page, limit: 20 }));
      void dispatch(fetchWorkOrders({ page: 1, limit: 100 }));
    }
  };

  const submitReassignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkOrder || !fromEmployeeId || !toEmployeeId || reason.trim().length < 5 || transferState.reassigning) return;
    if (!window.confirm(`Reassign ${selectedWorkOrder.reference} to the selected technician?`)) return;
    const result = await dispatch(reassignWork({
      workOrderId: selectedWorkOrder.id,
      fromEmployeeId,
      toEmployeeId,
      reason: reason.trim(),
      ...(reassignNote.trim() ? { note: reassignNote.trim() } : {}),
    }));
    if (reassignWork.fulfilled.match(result)) {
      closeReassign();
      void dispatch(fetchWorkOrders({ page: 1, limit: 100 }));
      void dispatch(fetchWorkTransfers({ status, page, limit: 20 }));
    }
  };

  const pageButtonClass = "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40";
  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const actingLabel = decisionDraft?.decision === "APPROVED" ? "Accept transfer" : "Reject transfer";

  return (
    <div className="space-y-6 text-slate-900">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Workforce / Assignments</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Work transfers</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {role === "manager" ? "Review technician transfer requests for work orders you manage." : "Review transfer requests for work orders in your company."}
          </p>
        </div>
        <button type="button" onClick={openReassign} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
          <ArrowRightLeft size={16} /> Reassign work
        </button>
      </header>

      {transferState.actionSuccess && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{transferState.actionSuccess}</p>}
      {transferState.actionError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{transferState.actionError}</p>}
      {transferState.reassignSuccess && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{transferState.reassignSuccess}</p>}
      {transferState.reassignError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{transferState.reassignError}</p>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-bold text-slate-900">Transfer inbox</h2>
            <p className="mt-1 text-xs text-slate-500">{transferState.pagination.total} requests · page {page} of {transferState.pagination.totalPages}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter work transfers by status">
            {statuses.map((item) => (
              <button key={item} type="button" aria-pressed={status === item} onClick={() => { setStatus(item); setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${status === item ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {statusLabel(item)}
              </button>
            ))}
            <button type="button" title="Refresh transfers" aria-label="Refresh transfers" onClick={() => void dispatch(fetchWorkTransfers({ status, page, limit: 20 }))} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
          </div>
        </div>

        {transferState.error && <div role="alert" className="m-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><ShieldAlert size={17} className="mt-0.5 shrink-0" /><span>{transferState.error}</span></div>}
        {transferState.loading ? (
          <p role="status" className="p-12 text-center text-sm text-slate-500">Loading transfer requests…</p>
        ) : !transferState.error && transferState.items.length === 0 ? (
          <div className="p-12 text-center"><ArrowRightLeft size={27} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No {statusLabel(status).toLowerCase()} transfers</p><p className="mt-1 text-xs text-slate-500">Transfer requests will appear here when submitted.</p></div>
        ) : transferState.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Work order</th><th className="px-5 py-3">Requesting technician</th><th className="px-5 py-3">Proposed technician</th><th className="px-5 py-3">Reason / note</th><th className="px-5 py-3">Requested</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {transferState.items.map((transfer) => (
                  <tr key={transfer.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{transfer.workOrderNumber}</p><p className="mt-1 text-[10px] text-slate-400">{transfer.workOrderId}</p></td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-slate-700"><UserRound size={15} className="text-slate-400" />{transfer.requestingTechnician}</span></td>
                    <td className="px-5 py-4 text-slate-700">{transfer.proposedTechnician}</td>
                    <td className="max-w-xs px-5 py-4"><p className="whitespace-pre-wrap text-slate-700">{transfer.reason || "—"}</p>{transfer.note && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{transfer.note}</p>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{dateTimeLabel(transfer.requestedAt)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${transfer.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : transfer.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{statusLabel(transfer.status)}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2">{transfer.status === "PENDING" && <><button type="button" disabled={Boolean(transferState.actionId)} onClick={() => openDecision(transfer, "APPROVED")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Check size={14} />Accept</button><button type="button" disabled={Boolean(transferState.actionId)} onClick={() => openDecision(transfer, "REJECTED")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={14} />Reject</button></>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
          <span className="text-xs text-slate-500">Showing {transferState.items.length} of {transferState.pagination.total}</span>
          <div className="flex gap-2"><button type="button" className={pageButtonClass} disabled={page <= 1 || transferState.loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14} />Previous</button><button type="button" className={pageButtonClass} disabled={page >= transferState.pagination.totalPages || transferState.loading} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight size={14} /></button></div>
        </footer>
      </section>

      {decisionDraft && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !transferState.actionId) setDecisionDraft(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="transfer-decision-title" className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Work transfer</p><h2 id="transfer-decision-title" className="mt-1 text-lg font-bold text-slate-900">{actingLabel}</h2><p className="mt-1 text-sm text-slate-500">{decisionDraft.transfer.workOrderNumber}: {decisionDraft.transfer.requestingTechnician} → {decisionDraft.transfer.proposedTechnician}</p></div><button type="button" aria-label="Close" disabled={Boolean(transferState.actionId)} onClick={() => setDecisionDraft(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={18} /></button></header>
            <form onSubmit={(event) => void submitDecision(event)} className="space-y-4 p-5"><p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{decisionDraft.decision === "APPROVED" ? "Confirming approval will move the assignment to the proposed technician." : "Confirming rejection will leave the current assignment unchanged."}</p><label className="block text-sm font-medium text-slate-700">Decision note <span className="font-normal text-slate-400">(optional)</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} maxLength={1000} rows={3} className={`${inputClass} mt-1.5 resize-y`} /></label>{transferState.actionError && <p role="alert" className="text-sm text-rose-700">{transferState.actionError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={Boolean(transferState.actionId)} onClick={() => setDecisionDraft(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={Boolean(transferState.actionId)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${decisionDraft.decision === "APPROVED" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}`}>{transferState.actionId ? "Saving…" : `Confirm ${decisionDraft.decision === "APPROVED" ? "accept" : "reject"}`}</button></div></form>
          </section>
        </div>
      )}

      {reassignOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !transferState.reassigning) closeReassign(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="work-reassign-title" className="my-auto w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Direct assignment</p><h2 id="work-reassign-title" className="mt-1 text-lg font-bold text-slate-900">Reassign work</h2><p className="mt-1 text-sm text-slate-500">Choose a work order and an eligible replacement technician.</p></div><button type="button" aria-label="Close" disabled={transferState.reassigning} onClick={closeReassign} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={18} /></button></header>
            <form onSubmit={(event) => void submitReassignment(event)} className="space-y-4 p-5">
              {workOrderState.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{workOrderState.error}</p>}
              <label className="block text-sm font-medium text-slate-700">Work order<select required value={workOrderId} onChange={(event) => { const nextId = event.target.value; const work = reassignableOrders.find((item) => item.id === nextId); setWorkOrderId(nextId); setFromEmployeeId(work?.assignments.find(activeAssignment)?.employeeId ?? ""); setToEmployeeId(""); }} disabled={workOrderState.loading || transferState.reassigning} className={`${inputClass} mt-1.5`}><option value="">{workOrderState.loading ? "Loading work orders…" : "Select a work order"}</option>{reassignableOrders.map((work) => <option key={work.id} value={work.id}>{work.reference} · {work.customer}</option>)}</select></label>
              {!workOrderState.loading && reassignableOrders.length === 0 && !workOrderState.error && <p className="text-xs text-slate-500">No active work orders with technician assignments are available.</p>}
              {selectedWorkOrder && <>
                <label className="block text-sm font-medium text-slate-700">Currently assigned technician<select required value={fromEmployeeId} onChange={(event) => { setFromEmployeeId(event.target.value); setToEmployeeId(""); }} disabled={transferState.reassigning} className={`${inputClass} mt-1.5`}><option value="">Select current technician</option>{activeAssignments.map((assignment) => <option key={assignment.employeeId} value={assignment.employeeId}>{assignment.employeeName}</option>)}</select></label>
                <label className="block text-sm font-medium text-slate-700">Replacement technician<select required value={toEmployeeId} onChange={(event) => setToEmployeeId(event.target.value)} disabled={transferState.targetsLoading || transferState.targetsWorkOrderId !== workOrderId || Boolean(transferState.targetsError) || transferState.reassigning} className={`${inputClass} mt-1.5`}><option value="">{transferState.targetsLoading || transferState.targetsWorkOrderId !== workOrderId ? "Loading eligible technicians…" : transferState.targetsError ? "Availability unavailable" : "Select replacement technician"}</option>{eligibleTargets.map((target) => <option key={target.id} value={target.id}>{target.name}{target.employeeNo ? ` · ${target.employeeNo}` : ""}</option>)}</select></label>
                {transferState.targetsError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{transferState.targetsError} Admin/manager reassignment requires an authorized endpoint that returns active, eligible, available technicians from the same company for this work order.</p>}
                {!transferState.targetsLoading && !transferState.targetsError && transferState.targetsWorkOrderId === workOrderId && eligibleTargets.length === 0 && <p className="text-xs text-slate-500">No eligible replacement technicians were returned for this work order.</p>}
              </>}
              <label className="block text-sm font-medium text-slate-700">Reason <span className="text-rose-600">(at least 5 characters)</span><textarea required minLength={5} maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} mt-1.5 resize-y`} /></label>
              <label className="block text-sm font-medium text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={1000} rows={2} value={reassignNote} onChange={(event) => setReassignNote(event.target.value)} className={`${inputClass} mt-1.5 resize-y`} /></label>
              {transferState.reassignError && <p role="alert" className="text-sm text-rose-700">{transferState.reassignError}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={transferState.reassigning} onClick={closeReassign} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={transferState.reassigning || !selectedWorkOrder || !fromEmployeeId || !toEmployeeId || reason.trim().length < 5 || !transferState.targetsWorkOrderId || transferState.targetsWorkOrderId !== workOrderId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{transferState.reassigning ? "Reassigning…" : <><ArrowRightLeft size={15} />Confirm reassignment</>}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}