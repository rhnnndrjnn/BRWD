import { useMemo, useState } from "react"
import { Icon, Modal } from "../ui.jsx"
import { PAYMENT_LABEL, STATUS_LABEL, fmtDateTime, lineSummary, peso } from "../../lib/constants.js"
import { updateOrder } from "../../lib/db.js"
import { useNotify } from "../../lib/notify.jsx"
import { PanelHeader } from "./Shell.jsx"

const FILTERS = [
  { id: "active", label: "Active", test: (o) => ["pending", "preparing", "ready"].includes(o.status) },
  { id: "pending", label: "Pending", test: (o) => o.status === "pending" },
  { id: "preparing", label: "Preparing", test: (o) => o.status === "preparing" },
  { id: "ready", label: "Ready", test: (o) => o.status === "ready" },
  { id: "done", label: "Completed / cancelled", test: (o) => ["completed", "cancelled"].includes(o.status) },
  { id: "all", label: "All", test: () => true },
]

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()

export function OrderStats({ orders }) {
  const today = orders.filter((o) => isToday(o.created_at))
  const sales = today
    .filter((o) => o.status === "completed")
    .reduce((n, o) => n + Number(o.total), 0)
  const cards = [
    { label: "Pending", value: orders.filter((o) => o.status === "pending").length },
    { label: "Preparing", value: orders.filter((o) => o.status === "preparing").length },
    { label: "Ready for pickup", value: orders.filter((o) => o.status === "ready").length },
    { label: "Orders today", value: today.length },
    { label: "Sales today", value: peso(sales) },
  ]
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-earth-300 bg-earth-50 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-earth-600">{c.label}</p>
          <p className="display-title mt-2 text-2xl sm:text-3xl">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

export default function OrdersPanel({ orders, storeOpen }) {
  const notify = useNotify()
  const [filter, setFilter] = useState("active")
  const [receipt, setReceipt] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const test = FILTERS.find((f) => f.id === filter).test

  const list = useMemo(() => {
    const rows = orders.filter(test)
    // soonest pickup first for active orders, newest first otherwise
    return filter === "active"
      ? [...rows].sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time))
      : rows
  }, [orders, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (order, patch, text) => {
    setBusyId(order.id)
    try {
      await updateOrder(order, patch, text)
    } catch (e) {
      notify("Update failed", e.message, { tone: "error" })
    } finally {
      setBusyId(null)
    }
  }

  const nextStep = (o) => {
    const gcashUnpaid = o.payment_method === "gcash" && o.payment_status !== "paid"
    if (o.status === "pending")
      return { label: "Start preparing", patch: { status: "preparing" }, text: "now preparing", disabled: gcashUnpaid, hint: gcashUnpaid ? "Verify the GCash receipt first" : "" }
    if (o.status === "preparing")
      return { label: "Mark ready", patch: { status: "ready" }, text: "ready for pickup" }
    if (o.status === "ready")
      return {
        label: "Complete",
        patch: { status: "completed", payment_status: "paid" },
        text: "completed",
      }
    return null
  }

  return (
    <div>
      <PanelHeader eyebrow="Dashboard" title="Orders">
        {!storeOpen && <span className="badge cancelled">Store closed — not accepting orders</span>}
      </PanelHeader>
      <OrderStats orders={orders} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`chip whitespace-nowrap ${filter === f.id ? "chip-active" : ""}`}>
            {f.label}
            <span className="ml-1.5 opacity-60">{orders.filter(f.test).length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-16 text-center text-sm text-earth-600">
          No orders here right now.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((o) => {
            const step = nextStep(o)
            const busy = busyId === o.id
            return (
              <article key={o.id} className="rounded-2xl border border-earth-300 bg-earth-50 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="display-title text-xl">{o.code}</p>
                    <p className="text-sm font-semibold">
                      {o.customer_name}
                      {o.phone && <span className="ml-2 font-normal text-earth-600">{o.phone}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                    <span className={`badge ${o.payment_status}`}>
                      {o.payment_method === "gcash" ? "GCash" : "Cash"} · {PAYMENT_LABEL[o.payment_status]}
                    </span>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-earth-600">
                  <Icon name="clock" size={14} /> Arrives {fmtDateTime(o.arrival_time)} · placed {fmtDateTime(o.created_at)}
                </p>
                <ul className="mt-3 divide-y divide-earth-200 text-sm">
                  {o.items.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3 py-2">
                      <span>
                        <strong>{l.qty}× {l.name}</strong>
                        <span className="block text-[11px] text-earth-600">{lineSummary(l)}</span>
                      </span>
                      <span className="shrink-0">{peso(l.qty * l.unitPrice)}</span>
                    </li>
                  ))}
                </ul>
                {o.note && (
                  <p className="mt-2 rounded-lg bg-earth-100 p-2.5 text-xs text-earth-700">
                    <strong>Note:</strong> {o.note}
                  </p>
                )}
                <p className="mt-2 flex justify-between border-t border-earth-300 pt-3 font-semibold">
                  <span>Total</span>
                  <span>{peso(o.total)}</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.payment_method === "gcash" && o.receipt_url && (
                    <button className="btn-sm" onClick={() => setReceipt(o)}>
                      <Icon name="receipt" size={14} /> View receipt
                    </button>
                  )}
                  {o.payment_method === "gcash" && o.payment_status !== "paid" && o.status !== "cancelled" && (
                    <>
                      <button disabled={busy} className="btn-sm solid" onClick={() => act(o, { payment_status: "paid" }, "GCash payment verified")}>
                        <Icon name="check" size={14} /> Mark paid
                      </button>
                      {o.payment_status !== "rejected" && (
                        <button disabled={busy} className="btn-sm danger" onClick={() => act(o, { payment_status: "rejected" }, "GCash receipt rejected")}>
                          Reject receipt
                        </button>
                      )}
                    </>
                  )}
                  {o.payment_method === "cash" && o.payment_status !== "paid" && ["preparing", "ready"].includes(o.status) && (
                    <button disabled={busy} className="btn-sm" onClick={() => act(o, { payment_status: "paid" }, "cash received")}>
                      Mark cash received
                    </button>
                  )}
                  {step && (
                    <button disabled={busy || step.disabled} title={step.hint} className="btn-sm solid" onClick={() => act(o, step.patch, step.text)}>
                      {step.label}
                    </button>
                  )}
                  {["pending", "preparing", "ready"].includes(o.status) && (
                    <button
                      disabled={busy}
                      className="btn-sm danger"
                      onClick={() => window.confirm(`Cancel order ${o.code}?`) && act(o, { status: "cancelled" }, "cancelled")}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {o.status === "pending" && o.payment_method === "gcash" && o.payment_status !== "paid" && (
                  <p className="mt-2 text-[11px] text-earth-600">Verify the receipt before preparing.</p>
                )}
              </article>
            )
          })}
        </div>
      )}

      <Modal open={!!receipt} onClose={() => setReceipt(null)} label="GCash receipt">
        {receipt && (
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{receipt.code}</p>
                <p className="text-xs text-earth-600">Expected amount: {peso(receipt.total)}</p>
              </div>
              <button onClick={() => setReceipt(null)} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-earth-100">
                <Icon name="close" size={16} />
              </button>
            </div>
            <img src={receipt.receipt_url} alt="GCash receipt" className="max-h-[65svh] w-full rounded-xl object-contain" />
          </div>
        )}
      </Modal>
    </div>
  )
}
