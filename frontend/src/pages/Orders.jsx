import { useState } from "react"
import { Icon, PageLink, Spinner } from "../components/ui.jsx"
import { PAYMENT_LABEL, STATUS_LABEL, fmtDateTime, lineSummary, peso } from "../lib/constants.js"
import { attachReceipt, uploadImage } from "../lib/db.js"
import { useNotify } from "../lib/notify.jsx"

const STEPS = ["pending", "preparing", "ready", "completed"]

function OrderCard({ order, onChanged }) {
  const notify = useNotify()
  const [busy, setBusy] = useState(false)
  const step = STEPS.indexOf(order.status)

  const reupload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage(file, "receipts")
      await attachReceipt(order.code, url)
      notify("Receipt uploaded", "We'll check it shortly.", { tone: "success" })
      onChanged()
    } catch (e) {
      notify("Upload failed", e.message, { tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-earth-300 bg-earth-50 p-5 shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="display-title text-2xl">{order.code}</p>
          <p className="mt-1 text-xs text-earth-600">
            Placed {fmtDateTime(order.created_at)} · pickup {fmtDateTime(order.arrival_time)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${order.status}`}>{STATUS_LABEL[order.status]}</span>
          <span className={`badge ${order.payment_status}`}>
            {order.payment_method === "gcash" ? "GCash · " : "Cash · "}
            {PAYMENT_LABEL[order.payment_status]}
          </span>
        </div>
      </div>

      {order.status !== "cancelled" && (
        <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-[.08em]">
          {STEPS.map((s, i) => (
            <li key={s}>
              <span className={`block h-1.5 rounded-full ${i <= step ? "bg-earth-700" : "bg-earth-200"}`} />
              <span className={`mt-2 block ${i <= step ? "text-earth-900" : "text-earth-500"}`}>
                {s === "ready" ? "Ready" : STATUS_LABEL[s]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-5 divide-y divide-earth-200 text-sm">
        {order.items.map((l, i) => (
          <li key={i} className="flex justify-between gap-3 py-2.5">
            <span>
              <strong>{l.qty}× {l.name}</strong>
              <span className="block text-[11px] text-earth-600">{lineSummary(l)}</span>
            </span>
            <span className="font-semibold">{peso(l.qty * l.unitPrice)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between border-t border-earth-300 pt-3 font-semibold">
        <span>Total</span>
        <span>{peso(order.total)}</span>
      </p>

      {order.payment_method === "cash" && order.status === "pending" && (
        <p className="mt-4 rounded-xl bg-earth-100 p-3 text-xs leading-5 text-earth-700">
          Your order will be prepared upon your arrival. Please pay in cash at the counter.
        </p>
      )}
      {order.payment_status === "rejected" && order.status !== "cancelled" && (
        <div className="mt-4 rounded-xl bg-[#F3DEDB] p-3 text-xs leading-5 text-[#8F3B31]">
          We couldn’t verify your GCash receipt. Please upload a clearer one.
          <label className={`btn-sm mt-3 cursor-pointer ${busy ? "opacity-60" : ""}`}>
            <Icon name="upload" size={14} /> {busy ? "Uploading…" : "Upload new receipt"}
            <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => reupload(e.target.files?.[0])} />
          </label>
        </div>
      )}
    </article>
  )
}

export default function OrdersPage({ navigate, myOrders }) {
  const { orders, loading, refresh, track } = myOrders
  const [code, setCode] = useState("")

  return (
    <main className="min-h-[70vh] bg-earth-200">
      <section className="border-b border-earth-300 bg-earth-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto flex max-w-[1040px] flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Follow your pickup</p>
            <h1 className="display-title mt-3 text-6xl tracking-[-.05em] sm:text-7xl">My orders</h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (code.trim()) track(code).then(() => setCode(""))
            }}
            className="flex w-full gap-2 sm:w-96"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Have an order code? BRWD-1106-1234"
              className="input-box rounded-full"
              aria-label="Order code"
            />
            <button className="btn-sm solid shrink-0">Track</button>
          </form>
        </div>
      </section>
      <section className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1040px] space-y-5">
          {loading ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-20 text-center shadow-md">
              <p className="font-semibold">No orders on this device yet.</p>
              <p className="mt-2 text-sm text-earth-600">Orders you place here will show up so you can follow them.</p>
              <PageLink to="/menu" navigate={navigate} className="primary-button mt-7">
                Order from the menu <Icon name="arrow" size={17} />
              </PageLink>
            </div>
          ) : (
            orders.map((o) => <OrderCard key={o.id} order={o} onChanged={refresh} />)
          )}
        </div>
      </section>
    </main>
  )
}
