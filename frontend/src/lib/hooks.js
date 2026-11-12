import { useCallback, useEffect, useRef, useState } from "react"
import { getBeans, getOrdersByCodes, getProducts, getSettings, subscribe } from "./db.js"

/** Live menu data shared by the customer pages and the staff portals. */
export function useMenuData() {
  const [products, setProducts] = useState([])
  const [beans, setBeans] = useState([])
  const [settings, setSettings] = useState({
    store_open: { open: true },
    gcash: { name: "", number: "", qr: "" },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const [p, b, s] = await Promise.all([getProducts(), getBeans(), getSettings()])
      setProducts(p)
      setBeans(b)
      setSettings(s)
      setError("")
    } catch (e) {
      setError(e.message || "Could not load the menu.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return subscribe(["products", "beans", "settings"], load)
  }, [load])

  return { products, beans, settings, loading, error, reload: load }
}

/* ---- customer order tracking: polls the visitor's own orders and toasts on status changes ---- */
import { getMyOrderCodes, rememberOrderCode } from "./cart.js"
import { useNotify } from "./notify.jsx"
import { STATUS_LABEL } from "./constants.js"

export function useMyOrders(active) {
  const notify = useNotify()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const seen = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const rows = await getOrdersByCodes(getMyOrderCodes())
      if (seen.current) {
        rows.forEach((o) => {
          const prev = seen.current[o.code]
          if (prev && (prev.status !== o.status || prev.payment_status !== o.payment_status)) {
            if (prev.payment_status !== o.payment_status && o.payment_status === "paid")
              notify(`Payment confirmed · ${o.code}`, "We received your GCash payment.", { tone: "success" })
            else if (prev.payment_status !== o.payment_status && o.payment_status === "rejected")
              notify(`Receipt problem · ${o.code}`, "We couldn't verify your receipt. Please re-upload it in Orders.", { tone: "error", duration: 9000 })
            if (prev.status !== o.status)
              notify(
                `${o.code}: ${STATUS_LABEL[o.status]}`,
                o.status === "ready" ? "Your order is ready — see you at the counter!" : "",
                { tone: o.status === "cancelled" ? "error" : "success", duration: 7000 },
              )
          }
        })
      }
      seen.current = Object.fromEntries(rows.map((o) => [o.code, o]))
      setOrders(rows)
    } catch {
      /* offline — try again on the next tick */
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, active ? 8000 : 20000)
    const unsub = subscribe(["orders"], refresh)
    return () => {
      clearInterval(t)
      unsub()
    }
  }, [refresh, active])

  const track = (code) => {
    rememberOrderCode(code.trim().toUpperCase())
    return refresh()
  }
  return { orders, loading, refresh, track }
}
