import { useCallback, useEffect, useState } from "react"

// The cart lives in the visitor's browser only (localStorage), never in Supabase.
const KEY = "brwd_cart_v1"
const CODES = "brwd_my_orders_v1"

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch {
    return []
  }
}

export function useCart() {
  const [items, setItems] = useState(() => read(KEY))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage full or blocked — cart still works for this session */
    }
  }, [items])

  // keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(read(KEY))
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const uid = () => Math.random().toString(36).slice(2, 10)

  const addLine = useCallback((line) => {
    setItems((prev) => {
      // merge identical configurations
      const sig = (l) =>
        JSON.stringify([l.productId, l.bean, l.sugar, l.temp, l.size, [...(l.addons || [])].sort()])
      const same = prev.find((p) => sig(p) === sig(line))
      if (same)
        return prev.map((p) => (p === same ? { ...p, qty: p.qty + line.qty } : p))
      return [...prev, { ...line, id: uid() }]
    })
  }, [])

  const updateLine = useCallback(
    (id, patch) => setItems((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    [],
  )
  const removeLine = useCallback((id) => setItems((prev) => prev.filter((l) => l.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((n, l) => n + l.qty, 0)
  const total = items.reduce((n, l) => n + l.qty * l.unitPrice, 0)
  return { items, count, total, addLine, updateLine, removeLine, clear }
}

// Order codes the visitor placed on this device, so they can track them.
export const getMyOrderCodes = () => read(CODES)
export const rememberOrderCode = (code) => {
  const codes = [code, ...read(CODES).filter((c) => c !== code)].slice(0, 30)
  localStorage.setItem(CODES, JSON.stringify(codes))
}
