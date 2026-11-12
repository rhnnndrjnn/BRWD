import { useState } from "react"
import { Icon } from "../ui.jsx"
import { pushNotification, setSetting, uploadImage } from "../../lib/db.js"
import { useNotify } from "../../lib/notify.jsx"
import { PanelHeader, Switch } from "./Shell.jsx"

/** Open / closed switch shown in the header of both portals. */
export function StoreToggle({ settings, session }) {
  const notify = useNotify()
  const open = settings.store_open?.open !== false
  const change = async (next) => {
    try {
      await setSetting("store_open", { open: next, by: session.username, at: new Date().toISOString() })
      await pushNotification({
        type: "store",
        title: `Store ${next ? "opened" : "closed"}`,
        body: `Set by ${session.username}`,
      })
    } catch (e) {
      notify("Could not update store status", e.message, { tone: "error" })
    }
  }
  return (
    <label className="flex items-center gap-2 rounded-full border border-earth-300 bg-earth-50 py-1.5 pl-3 pr-2 text-[11px] font-bold uppercase tracking-[.08em]">
      <span className={`size-2 rounded-full ${open ? "bg-[#65A56E]" : "bg-[#B5564A]"}`} />
      <span className="hidden sm:inline">Store</span> {open ? "Open" : "Closed"}
      <Switch on={open} onChange={change} label="Store open" />
    </label>
  )
}

export default function GcashSettings({ settings }) {
  const notify = useNotify()
  const g = settings.gcash || {}
  const [name, setName] = useState(g.name || "")
  const [number, setNumber] = useState(g.number || "")
  const [qr, setQr] = useState(g.qr || "")
  const [busy, setBusy] = useState(false)

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      setQr(await uploadImage(file, "gcash"))
    } catch (e) {
      notify("Upload failed", e.message, { tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await setSetting("gcash", { name: name.trim(), number: number.trim(), qr })
      notify("GCash details saved", "Customers will see them at checkout.", { tone: "success" })
    } catch (err) {
      notify("Could not save", err.message, { tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PanelHeader eyebrow="Payments" title="GCash details" />
      <form onSubmit={save} className="grid max-w-3xl gap-6 rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-sm sm:grid-cols-[200px_1fr] sm:p-8">
        <div>
          <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-earth-300 bg-white">
            {qr ? <img src={qr} alt="GCash QR" className="h-full w-full object-contain" /> : <p className="px-4 text-center text-xs text-earth-600">No QR uploaded</p>}
          </div>
          <label className="btn-sm mt-3 w-full cursor-pointer">
            <Icon name="upload" size={14} /> {qr ? "Replace QR" : "Upload QR"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
        <div className="space-y-5">
          <label className="block">
            <span className="opt-label">Account name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-box mt-2" />
          </label>
          <label className="block">
            <span className="opt-label">GCash number</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className="input-box mt-2" inputMode="tel" />
          </label>
          <button disabled={busy} className="btn-sm solid">{busy ? "Saving…" : "Save GCash details"}</button>
        </div>
      </form>
    </div>
  )
}
