import { useEffect, useState } from "react"
import logo from "../assets/logo.png"

// Start-up screen: shows the BRWD. logo for a moment, then fades into the site.
export default function Splash({ onDone, hold = 1900 }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const t1 = setTimeout(() => setLeaving(true), reduce ? 600 : hold)
    const t2 = setTimeout(onDone, reduce ? 700 : hold + 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [hold, onDone])

  return (
    <div
      className={`splash fixed inset-0 z-[200] grid place-items-center bg-earth-50 ${
        leaving ? "splash-out" : ""
      }`}
      role="status"
      aria-label="Loading BRWD."
    >
      <div className="flex flex-col items-center">
        <img src={logo} alt="BRWD." className="splash-logo h-28 w-auto object-contain sm:h-36" />
        <p className="splash-tag mt-6 text-[10px] font-bold uppercase tracking-[.34em] text-earth-600">
          Coffee &amp; Tea · Florencia
        </p>
        <span className="splash-bar mt-8 block h-px w-40 origin-left bg-earth-700" />
      </div>
    </div>
  )
}
