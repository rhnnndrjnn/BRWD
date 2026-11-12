import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Icon } from "../components/ui.jsx"

const Ctx = createContext(() => {})
export const useNotify = () => useContext(Ctx)

/** Short two-tone chime so staff hear new orders even when the tab is in the background. */
export function chime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC()
    ;[880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.16
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
      o.start(t)
      o.stop(t + 0.32)
    })
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* audio not available */
  }
}

export function systemNotify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted")
      new Notification(title, { body })
  } catch {
    /* ignore */
  }
}

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const notify = useCallback((title, body = "", opts = {}) => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-3), { id, title, body, tone: opts.tone || "info" }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 5000)
  }, [])

  return (
    <Ctx.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-[118px] z-[120] flex w-[min(92vw,360px)] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-earth-300 bg-earth-50 p-4 shadow-[0_18px_50px_rgba(32,24,19,.2)]"
          >
            <span
              className={`mt-1 size-2.5 shrink-0 rounded-full ${
                t.tone === "success"
                  ? "bg-[#65A56E]"
                  : t.tone === "error"
                    ? "bg-[#B5564A]"
                    : "bg-earth-600"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs leading-5 text-earth-600">{t.body}</p>}
            </div>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              aria-label="Dismiss"
              className="text-earth-600"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

/** Re-runs `fn` whenever any of the given tables change (plus once on mount). */
export function useLive(tables, fn, subscribeFn) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    fnRef.current()
    return subscribeFn(tables, () => fnRef.current())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")])
}
