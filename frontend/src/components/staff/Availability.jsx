import { CATEGORIES, peso } from "../../lib/constants.js"
import { setBeanAvailable, setProductAvailable } from "../../lib/db.js"
import { useNotify } from "../../lib/notify.jsx"
import { PanelHeader, Switch } from "./Shell.jsx"

export function ProductAvailability({ products }) {
  const notify = useNotify()
  const toggle = async (p, on) => {
    try {
      await setProductAvailable(p.id, on)
      notify(`${p.name} marked ${on ? "available" : "sold out"}`)
    } catch (e) {
      notify("Update failed", e.message, { tone: "error" })
    }
  }
  return (
    <div>
      <PanelHeader eyebrow="Inventory" title="Product availability" />
      <p className="mb-5 text-sm text-earth-600">Turn an item off when it’s sold out — customers will see it as sold out and can’t add it to their cart.</p>
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const items = products.filter((p) => p.category === cat)
          if (!items.length) return null
          return (
            <section key={cat}>
              <p className="eyebrow mb-2">{cat}</p>
              <ul className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
                {items.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 border-b border-earth-200 p-3 last:border-b-0">
                    <img src={p.image} alt="" className="size-12 rounded-lg bg-earth-200 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-earth-600">{peso(p.price)}</p>
                    </div>
                    <span className={`hidden text-xs font-semibold sm:block ${p.available ? "text-[#1F5A2B]" : "text-[#8F3B31]"}`}>
                      {p.available ? "Available" : "Sold out"}
                    </span>
                    <Switch on={p.available} onChange={(v) => toggle(p, v)} label={`${p.name} available`} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function BeanAvailability({ beans }) {
  const notify = useNotify()
  const toggle = async (b, on) => {
    try {
      await setBeanAvailable(b.id, on)
      notify(`${b.name} marked ${on ? "available" : "unavailable"}`)
    } catch (e) {
      notify("Update failed", e.message, { tone: "error" })
    }
  }
  return (
    <div>
      <PanelHeader eyebrow="Inventory" title="Coffee beans" />
      <p className="mb-5 text-sm text-earth-600">Unavailable beans are greyed out when customers customize a coffee.</p>
      <ul className="max-w-xl overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
        {beans.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 border-b border-earth-200 p-4 last:border-b-0">
            <div>
              <p className="text-sm font-semibold">{b.name}</p>
              <p className={`text-xs font-semibold ${b.available ? "text-[#1F5A2B]" : "text-[#8F3B31]"}`}>
                {b.available ? "Available" : "Unavailable"}
              </p>
            </div>
            <Switch on={b.available} onChange={(v) => toggle(b, v)} label={`${b.name} available`} />
          </li>
        ))}
      </ul>
    </div>
  )
}
