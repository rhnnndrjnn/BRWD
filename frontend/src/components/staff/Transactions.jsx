import { useMemo, useState } from "react"
import { Icon } from "../ui.jsx"
import { PAYMENT_LABEL, STATUS_LABEL, fmtDateTime, peso } from "../../lib/constants.js"
import { PanelHeader } from "./Shell.jsx"

const RANGES = [
  { id: "today", label: "Today", days: 0 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "all", label: "All time", days: null },
]

export default function TransactionsPanel({ orders }) {
  const [range, setRange] = useState("today")
  const [q, setQ] = useState("")

  const rows = useMemo(() => {
    const r = RANGES.find((x) => x.id === range)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    if (r.days) start.setDate(start.getDate() - r.days)
    return orders.filter((o) => {
      if (r.days !== null && new Date(o.created_at) < start) return false
      const s = q.trim().toLowerCase()
      return !s || `${o.code} ${o.customer_name}`.toLowerCase().includes(s)
    })
  }, [orders, range, q])

  const paid = rows.filter((o) => o.payment_status === "paid" && o.status !== "cancelled")
  const sum = (list) => list.reduce((n, o) => n + Number(o.total), 0)
  const stats = [
    { label: "Sales (paid)", value: peso(sum(paid)) },
    { label: "Cash", value: peso(sum(paid.filter((o) => o.payment_method === "cash"))) },
    { label: "GCash", value: peso(sum(paid.filter((o) => o.payment_method === "gcash"))) },
    { label: "Orders", value: rows.length },
  ]

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const lines = [
      ["Date", "Code", "Customer", "Method", "Payment", "Status", "Items", "Total"].join(","),
      ...rows.map((o) =>
        [
          new Date(o.created_at).toLocaleString("en-PH"),
          o.code,
          o.customer_name,
          o.payment_method,
          o.payment_status,
          o.status,
          o.items.map((l) => `${l.qty}x ${l.name}`).join("; "),
          Number(o.total).toFixed(2),
        ].map(esc).join(","),
      ),
    ]
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `brwd-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PanelHeader eyebrow="Records" title="Transactions">
        <button className="btn-sm" onClick={exportCsv} disabled={!rows.length}>
          <Icon name="upload" size={14} /> Export CSV
        </button>
      </PanelHeader>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-earth-300 bg-earth-50 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-earth-600">{s.label}</p>
            <p className="display-title mt-2 text-2xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={`chip ${range === r.id ? "chip-active" : ""}`}>
            {r.label}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or name" className="input-box ml-auto max-w-[220px] rounded-full" aria-label="Search transactions" />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
        <table className="data-table min-w-[720px]">
          <thead>
            <tr><th>Date</th><th>Code</th><th>Customer</th><th>Method</th><th>Payment</th><th>Status</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-earth-600">No transactions in this range.</td></tr>
            )}
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap">{fmtDateTime(o.created_at)}</td>
                <td className="whitespace-nowrap font-semibold">{o.code}</td>
                <td>{o.customer_name}</td>
                <td>{o.payment_method === "gcash" ? "GCash" : "Cash"}</td>
                <td><span className={`badge ${o.payment_status}`}>{PAYMENT_LABEL[o.payment_status]}</span></td>
                <td><span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="text-right font-semibold">{peso(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
