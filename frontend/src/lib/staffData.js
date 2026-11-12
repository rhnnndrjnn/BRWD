import { useCallback, useEffect, useRef, useState } from "react"
import {
  getBeans,
  getMessages,
  getNotifications,
  getOrders,
  getProducts,
  getSettings,
  subscribe,
} from "./db.js"
import { chime, systemNotify, useNotify } from "./notify.jsx"

/** Everything the staff portals need, kept live. Toasts + sound on every new transaction. */
export function useStaffData() {
  const notify = useNotify()
  const [orders, setOrders] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [products, setProducts] = useState([])
  const [beans, setBeans] = useState([])
  const [settings, setSettings] = useState({ store_open: { open: true }, gcash: { name: "", number: "", qr: "" } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const booted = useRef(false)

  const loadAll = useCallback(async () => {
    try {
      const [o, m, n, p, b, s] = await Promise.all([
        getOrders(),
        getMessages(),
        getNotifications(),
        getProducts(),
        getBeans(),
        getSettings(),
      ])
      setOrders(o)
      setMessages(m)
      setNotifications(n)
      setProducts(p)
      setBeans(b)
      setSettings(s)
      setError("")
    } catch (e) {
      setError(e.message || "Could not load data.")
    } finally {
      setLoading(false)
      booted.current = true
    }
  }, [])

  useEffect(() => {
    loadAll()
    const unsubs = [
      subscribe(["orders"], async () => setOrders(await getOrders())),
      subscribe(["messages"], async () => setMessages(await getMessages())),
      subscribe(["products", "beans", "settings"], async () => {
        const [p, b, s] = await Promise.all([getProducts(), getBeans(), getSettings()])
        setProducts(p)
        setBeans(b)
        setSettings(s)
      }),
      subscribe(["notifications"], async (ev) => {
        setNotifications(await getNotifications())
        if (ev.type === "INSERT" && booted.current && ev.row) {
          const incoming = /^New /.test(ev.row.title)
          notify(ev.row.title, ev.row.body, { tone: "info", duration: 7000 })
          if (incoming) {
            chime()
            systemNotify(ev.row.title, ev.row.body)
          }
        }
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [loadAll, notify])

  return { orders, messages, notifications, products, beans, settings, loading, error, reload: loadAll }
}
