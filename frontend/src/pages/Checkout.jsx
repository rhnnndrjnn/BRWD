import { useMemo, useState } from "react"
import { Icon, PageLink } from "../components/ui.jsx"
import { HOURS, lineSummary, peso } from "../lib/constants.js"
import { createOrder, uploadImage } from "../lib/db.js"
import { rememberOrderCode } from "../lib/cart.js"
import { useNotify } from "../lib/notify.jsx"
import { lineProblem } from "./Cart.jsx"

// Pickup slots every 15 minutes, starting 20 minutes from now until closing time today.
function pickupSlots() {
  const now = new Date()
  const [open, close] = [0, 6].includes(now.getDay()) ? HOURS.weekend : HOURS.weekday
  const start = new Date(now.getTime() + 20 * 60000)
  start.setSeconds(0, 0)
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15)
  const first = new Date(now)
  first.setHours(open, 0, 0, 0)
  const end = new Date(now)
  end.setHours(close, 0, 0, 0)
  const slots = []
  for (let t = Math.max(start.getTime(), first.getTime()); t <= end.getTime(); t += 15 * 60000)
    slots.push(new Date(t))
  return slots
}

const slotLabel = (d) => d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })

export default function CheckoutPage({ cart, navigate, products, beans, settings, storeOpen }) {
  const notify = useNotify()
  const slots = useMemo(pickupSlots, [])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [method, setMethod] = useState("cash")
  const [arrival, setArrival] = useState(slots[0]?.toISOString() || "")
  const [note, setNote] = useState("")
  const [receipt, setReceipt] = useState(null)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const gcash = settings.gcash || {}
  const problem = cart.items.some((l) => lineProblem(l, products, beans))

  const pickReceipt = (file) => {
    setError("")
    if (!file) return
    if (!file.type.startsWith("image/")) return setError("Please upload your receipt as an image (screenshot or photo).")
    if (file.size > 10 * 1024 * 1024) return setError("That image is too large (max 10 MB).")
    setReceipt(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    if (!name.trim()) return setError("Please enter your name.")
    if (!arrival) return setError("Please choose your arrival time.")
    if (method === "gcash" && !receipt) return setError("Please upload your GCash receipt.")
    setBusy(true)
    try {
      const receipt_url = method === "gcash" ? await uploadImage(receipt, "receipts") : null
      const order = await createOrder({
        customer_name: name.trim(),
        phone: phone.trim(),
        payment_method: method,
        receipt_url,
        arrival_time: arrival,
        note: note.trim(),
        total: cart.total,
        items: cart.items.map(({ id, image, ...rest }) => rest),
      })
      rememberOrderCode(order.code)
      cart.clear()
      setDone(order)
      window.scrollTo({ top: 0, behavior: "smooth" })
      notify("Order placed", `Your order code is ${order.code}`, { tone: "success" })
    } catch (err) {
      setError(err.message || "Something went wrong placing your order. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (done)
    return (
      <main className="min-h-[70vh] bg-earth-200 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-earth-300 bg-earth-50 p-8 text-center shadow-xl sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#CBE6CF] text-[#1F5A2B]">
            <Icon name="check" size={30} />
          </span>
          <p className="eyebrow mt-6">Order received</p>
          <h1 className="display-title mt-2 text-4xl">Thank you, {done.customer_name.split(" ")[0]}!</h1>
          <p className="mt-5 text-xs uppercase tracking-[.16em] text-earth-600">Your order code</p>
          <p className="display-title mt-1 text-3xl tracking-wide">{done.code}</p>
          <p className="mt-5 text-sm leading-6 text-earth-600">
            Pick up at our Florencia branch around{" "}
            <strong className="text-earth-900">{slotLabel(new Date(done.arrival_time))}</strong>.{" "}
            {done.payment_method === "cash"
              ? "Your order will be prepared upon your arrival — please pay in cash at the counter."
              : "We’ll check your GCash receipt and start preparing your order right away."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PageLink to="/orders" navigate={navigate} className="primary-button">
              Track my order <Icon name="arrow" size={17} />
            </PageLink>
            <PageLink to="/menu" navigate={navigate} className="secondary-button">
              Back to menu
            </PageLink>
          </div>
        </div>
      </main>
    )

  if (cart.items.length === 0)
    return (
      <main className="min-h-[70vh] bg-earth-200 px-5 py-20 text-center">
        <p className="font-semibold">Your cart is empty.</p>
        <PageLink to="/menu" navigate={navigate} className="primary-button mt-6">
          Browse the menu <Icon name="arrow" size={17} />
        </PageLink>
      </main>
    )

  return (
    <main className="bg-earth-200">
      <section className="border-b border-earth-300 bg-earth-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1040px]">
          <p className="eyebrow">Advance order · pick up in store</p>
          <h1 className="display-title mt-3 text-6xl tracking-[-.05em] sm:text-7xl">Checkout</h1>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <form onSubmit={submit} className="mx-auto grid max-w-[1040px] gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-md sm:p-8">
              <p className="eyebrow">1 · Your details</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="opt-label">Name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="input-box mt-2"
                  />
                </label>
                <label className="block">
                  <span className="opt-label">Mobile number (optional)</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxxx"
                    inputMode="tel"
                    className="input-box mt-2"
                  />
                </label>
              </div>
              <label className="mt-5 block">
                <span className="opt-label">Arrival time (today)</span>
                {slots.length ? (
                  <select value={arrival} onChange={(e) => setArrival(e.target.value)} className="input-box mt-2">
                    {slots.map((s) => (
                      <option key={s.toISOString()} value={s.toISOString()}>
                        {slotLabel(s)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 rounded-xl bg-[#F3DEDB] p-3 text-sm text-[#8F3B31]">
                    There are no more pickup times available today. Please come back tomorrow.
                  </p>
                )}
              </label>
              <label className="mt-5 block">
                <span className="opt-label">Note for the team (optional)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Allergies, special requests…"
                  className="input-box mt-2 resize-y"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-md sm:p-8">
              <p className="eyebrow">2 · Mode of payment</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { id: "cash", title: "Cash", sub: "Pay at the counter" },
                  { id: "gcash", title: "GCash", sub: "Scan, pay, upload receipt" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      method === m.id
                        ? "border-earth-700 bg-earth-700 text-earth-50"
                        : "border-earth-300 hover:border-earth-600"
                    }`}
                    style={method === m.id ? { color: "#F6F1EF" } : undefined}
                    aria-pressed={method === m.id}
                  >
                    <span className="block font-semibold">{m.title}</span>
                    <span className="mt-1 block text-xs opacity-75">{m.sub}</span>
                  </button>
                ))}
              </div>

              {method === "cash" && (
                <p className="mt-5 rounded-xl bg-earth-100 p-4 text-sm leading-6 text-earth-700">
                  Your order will be prepared upon arrival. Just tell the counter your name or order
                  code and pay in cash when you pick it up.
                </p>
              )}

              {method === "gcash" && (
                <div className="mt-5 grid gap-6 sm:grid-cols-[200px_1fr]">
                  <div>
                    <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-earth-300 bg-white">
                      {gcash.qr ? (
                        <img src={gcash.qr} alt="GCash QR code" className="h-full w-full object-contain" />
                      ) : (
                        <p className="px-4 text-center text-xs leading-5 text-earth-600">
                          GCash QR code isn’t set up yet. Use the number below.
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-center text-[10px] uppercase tracking-[.14em] text-earth-600">
                      Scan with GCash
                    </p>
                  </div>
                  <div>
                    <dl className="space-y-3 text-sm">
                      {gcash.name && (
                        <div>
                          <dt className="opt-label">Account name</dt>
                          <dd className="mt-1 font-semibold">{gcash.name}</dd>
                        </div>
                      )}
                      {gcash.number && (
                        <div>
                          <dt className="opt-label">GCash number</dt>
                          <dd className="mt-1 font-semibold">{gcash.number}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="opt-label">Amount to pay</dt>
                        <dd className="display-title mt-1 text-2xl">{peso(cart.total)}</dd>
                      </div>
                    </dl>

                    <p className="opt-label mt-6">Upload your GCash receipt</p>
                    <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-earth-500 p-3 transition hover:bg-earth-100">
                      {preview ? (
                        <img src={preview} alt="Receipt preview" className="size-14 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-14 place-items-center rounded-lg bg-earth-100">
                          <Icon name="upload" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 text-xs leading-5">
                        <strong className="block truncate">
                          {receipt ? receipt.name : "Choose a screenshot or photo"}
                        </strong>
                        <span className="text-earth-600">
                          {receipt ? "Tap to replace" : "PNG or JPG, up to 10 MB"}
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => pickReceipt(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-md lg:sticky lg:top-[180px]">
            <p className="eyebrow">Your order</p>
            <ul className="mt-4 divide-y divide-earth-200">
              {cart.items.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {l.qty}× {l.name}
                    </span>
                    <span className="block text-[11px] leading-4 text-earth-600">{lineSummary(l)}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{peso(l.qty * l.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-earth-300 pt-4">
              <span className="font-semibold">Total</span>
              <span className="display-title text-2xl">{peso(cart.total)}</span>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-[#F3DEDB] p-3 text-xs leading-5 text-[#8F3B31]">
                {error}
              </p>
            )}
            {!storeOpen && (
              <p className="mt-4 rounded-xl bg-[#F3DEDB] p-3 text-xs leading-5 text-[#8F3B31]">
                The branch is closed right now, so new orders can’t be placed.
              </p>
            )}
            {problem && (
              <p className="mt-4 rounded-xl bg-[#F3DEDB] p-3 text-xs leading-5 text-[#8F3B31]">
                Some items in your cart are unavailable. Please update your cart first.
              </p>
            )}
            <button
              disabled={busy || !storeOpen || problem || !slots.length}
              className="primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Placing order…" : "Place order"} <Icon name="arrow" size={17} />
            </button>
            <PageLink to="/cart" navigate={navigate} className="mt-3 block text-center text-xs font-semibold underline underline-offset-4">
              Back to cart
            </PageLink>
          </aside>
        </form>
      </section>
    </main>
  )
}
