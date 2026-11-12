import { useState } from "react"
import { Icon, Modal } from "../ui.jsx"
import { CATEGORIES, SIZE_UPCHARGE, peso } from "../../lib/constants.js"
import { deleteProduct, saveProduct, uploadImage } from "../../lib/db.js"
import { useNotify } from "../../lib/notify.jsx"
import { PanelHeader, Switch } from "./Shell.jsx"

const blank = { name: "", detail: "", price: "", price_22: "", category: "Coffee", image: "", available: true, has_hot: true }

function ProductForm({ product, onClose }) {
  const notify = useNotify()
  const [f, setF] = useState(() => ({
    ...blank,
    ...product,
    price: product?.price ?? "",
    price_22: product?.price_22 ?? "",
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const isDrink = f.category !== "Other"

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      set("image", await uploadImage(file, "products"))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    const price = Number(f.price)
    if (!f.name.trim()) return setError("Product name is required.")
    if (!(price > 0)) return setError("Enter a valid price.")
    const payload = {
      ...(product?.id ? { id: product.id } : {}),
      name: f.name.trim(),
      detail: f.detail.trim(),
      category: f.category,
      price,
      price_22: isDrink ? Number(f.price_22) || price + SIZE_UPCHARGE : null,
      image: f.image.trim(),
      available: f.available,
      has_hot: f.category === "Coffee" ? !!f.has_hot : false,
    }
    setBusy(true)
    try {
      await saveProduct(payload)
      notify(product?.id ? "Product updated" : "Product added", payload.name, { tone: "success" })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h3 className="display-title text-2xl">{product?.id ? "Edit product" : "Add product"}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-earth-100">
          <Icon name="close" size={16} />
        </button>
      </div>
      <label className="block">
        <span className="opt-label">Name</span>
        <input required value={f.name} onChange={(e) => set("name", e.target.value)} className="input-box mt-2" />
      </label>
      <label className="block">
        <span className="opt-label">Description</span>
        <textarea rows={2} value={f.detail} onChange={(e) => set("detail", e.target.value)} className="input-box mt-2 resize-y" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="opt-label">Category</span>
          <select value={f.category} onChange={(e) => set("category", e.target.value)} className="input-box mt-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="opt-label">{isDrink ? "Price · 16oz (₱)" : "Price (₱)"}</span>
          <input required type="number" min="1" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} className="input-box mt-2" />
        </label>
        {isDrink && (
          <label className="block">
            <span className="opt-label">Price · 22oz (₱)</span>
            <input type="number" min="1" step="0.01" value={f.price_22} onChange={(e) => set("price_22", e.target.value)} placeholder={`+${SIZE_UPCHARGE} if blank`} className="input-box mt-2" />
          </label>
        )}
      </div>
      <div>
        <span className="opt-label">Image</span>
        <div className="mt-2 flex items-center gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-earth-200">
            {f.image && <img src={f.image} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={f.image.startsWith("data:") ? "(uploaded image)" : f.image}
              onChange={(e) => set("image", e.target.value)}
              readOnly={f.image.startsWith("data:")}
              placeholder="Paste an image URL…"
              className="input-box"
            />
            <label className="btn-sm cursor-pointer">
              <Icon name="upload" size={14} /> Upload image
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <Switch on={f.available} onChange={(v) => set("available", v)} label="Available" /> Available
        </label>
        {f.category === "Coffee" && (
          <label className="flex items-center gap-3 text-sm font-semibold">
            <Switch on={!!f.has_hot} onChange={(v) => set("has_hot", v)} label="Can be served hot" /> Can be served hot (12oz)
          </label>
        )}
      </div>
      {error && <p role="alert" className="rounded-xl bg-[#F3DEDB] p-3 text-xs text-[#8F3B31]">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-earth-200 pt-5">
        <button type="button" className="btn-sm" onClick={onClose}>Cancel</button>
        <button disabled={busy} className="btn-sm solid">{busy ? "Saving…" : "Save product"}</button>
      </div>
    </form>
  )
}

export default function ProductsManager({ products }) {
  const notify = useNotify()
  const [editing, setEditing] = useState(null) // product | {} (new) | null
  const [filter, setFilter] = useState("All")
  const list = products.filter((p) => filter === "All" || p.category === filter)

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? Past orders keep their record.`)) return
    try {
      await deleteProduct(p.id)
      notify("Product deleted", p.name)
    } catch (e) {
      notify("Could not delete", e.message, { tone: "error" })
    }
  }

  return (
    <div>
      <PanelHeader eyebrow="Menu" title="Products">
        <button className="btn-sm solid" onClick={() => setEditing({})}>
          <Icon name="plus" size={14} /> Add product
        </button>
      </PanelHeader>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`chip whitespace-nowrap ${filter === c ? "chip-active" : ""}`}>{c}</button>
        ))}
      </div>
      <ul className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
        {list.length === 0 && <li className="px-5 py-14 text-center text-sm text-earth-600">No products in this category.</li>}
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-earth-200 p-3 last:border-b-0">
            <img src={p.image} alt="" className="size-14 shrink-0 rounded-lg bg-earth-200 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="truncate text-xs text-earth-600">
                {p.category} · {peso(p.price)}{p.price_22 ? ` / ${peso(p.price_22)}` : ""}
                {!p.available && <span className="ml-2 font-bold text-[#8F3B31]">SOLD OUT</span>}
              </p>
            </div>
            <button className="btn-sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
              <Icon name="edit" size={14} /> <span className="hidden sm:inline">Edit</span>
            </button>
            <button className="btn-sm danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}>
              <Icon name="trash" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <Modal open={!!editing} onClose={() => setEditing(null)} wide label="Product editor">
        {editing && <ProductForm key={editing.id || "new"} product={editing.id ? editing : null} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
