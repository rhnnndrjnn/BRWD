import { useMemo, useState } from "react"
import { Chip, Icon, Modal } from "./ui.jsx"
import { ADDONS, ADDON_PRICE, SUGAR_LEVELS, peso, unitPrice } from "../lib/constants.js"

// Opens when the "+" button is pressed. Also used to edit a line already in the cart.
export default function ProductModal({ product, beans, line, onClose, onSubmit }) {
  const isCoffee = product?.category === "Coffee"
  const isDrink = ["Coffee", "Milktea", "Frappe", "Fruit Tea"].includes(product?.category)
  const hotAllowed = isCoffee && product?.has_hot !== false

  const firstBean = beans.find((b) => b.available)?.name || ""
  const [bean, setBean] = useState(line?.bean || firstBean)
  const [sugar, setSugar] = useState(line?.sugar ?? 100)
  const [temp, setTemp] = useState(line?.temp || (isCoffee ? "Iced" : ""))
  const [size, setSize] = useState(line?.size && line.size !== "12oz" ? line.size : "16oz")
  const [addons, setAddons] = useState(line?.addons || [])
  const [qty, setQty] = useState(line?.qty || 1)

  const isHot = temp === "Hot"
  const effectiveSize = !isDrink ? undefined : isHot ? "12oz" : size
  const price = useMemo(
    () => unitPrice(product, effectiveSize === "22oz" ? "22oz" : "16oz", addons),
    [product, effectiveSize, addons],
  )

  const addonOptions = ADDONS[product?.category] || []
  const toggleAddon = (a) =>
    setAddons((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))

  const noBeans = isCoffee && !firstBean
  const beanInvalid = isCoffee && (!bean || !beans.find((b) => b.name === bean && b.available))

  const submit = () => {
    onSubmit({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      bean: isCoffee ? bean : undefined,
      sugar: isDrink ? sugar : undefined,
      temp: isCoffee ? temp : undefined,
      size: effectiveSize,
      addons,
      qty,
      unitPrice: price,
    })
  }

  return (
    <Modal open={!!product} onClose={onClose} label={`Customize ${product?.name}`}>
      {product && (
        <div>
          <div className="relative h-44 overflow-hidden rounded-t-3xl bg-earth-200">
            {product.image && (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-earth-950/70 to-transparent" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-earth-50/90"
            >
              <Icon name="close" size={16} />
            </button>
            <div className="absolute bottom-4 left-5 right-5 text-earth-50">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-earth-200">
                {product.category}
              </p>
              <h2 className="display-title text-3xl leading-tight">{product.name}</h2>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {product.detail && <p className="text-sm leading-6 text-earth-600">{product.detail}</p>}

            {isCoffee && (
              <section>
                <p className="opt-label mb-3">Type of bean</p>
                <div className="flex flex-wrap gap-2">
                  {beans.map((b) => (
                    <Chip
                      key={b.id}
                      active={bean === b.name}
                      disabled={!b.available}
                      title={b.available ? "" : "Currently unavailable"}
                      onClick={() => setBean(b.name)}
                    >
                      {b.name}
                    </Chip>
                  ))}
                </div>
                {noBeans && (
                  <p className="mt-2 text-xs text-[#8F3B31]">
                    All coffee beans are currently unavailable.
                  </p>
                )}
              </section>
            )}

            {isCoffee && (
              <section>
                <p className="opt-label mb-3">Serving</p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={temp === "Iced"} onClick={() => setTemp("Iced")}>
                    Iced
                  </Chip>
                  {hotAllowed && (
                    <Chip active={temp === "Hot"} onClick={() => setTemp("Hot")}>
                      Hot · 12oz only
                    </Chip>
                  )}
                </div>
              </section>
            )}

            {isDrink && (
              <section>
                <p className="opt-label mb-3">Sugar level</p>
                <div className="flex flex-wrap gap-2">
                  {SUGAR_LEVELS.map((s) => (
                    <Chip key={s} active={sugar === s} onClick={() => setSugar(s)}>
                      {s}%
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            {isDrink && !isHot && (
              <section>
                <p className="opt-label mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {["16oz", "22oz"].map((s) => (
                    <Chip key={s} active={size === s} onClick={() => setSize(s)}>
                      {s} · {peso(unitPrice(product, s))}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            {isDrink && addonOptions.length > 0 && (
              <section>
                <p className="opt-label mb-3">Add-ons · +{peso(ADDON_PRICE)} each</p>
                <div className="flex flex-wrap gap-2">
                  {addonOptions.map((a) => (
                    <Chip key={a} active={addons.includes(a)} onClick={() => toggleAddon(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-earth-200 pt-5">
              <div className="flex items-center gap-1 rounded-full border border-earth-300 p-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid size-9 place-items-center rounded-full hover:bg-earth-100"
                  aria-label="Decrease quantity"
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="grid size-9 place-items-center rounded-full hover:bg-earth-100"
                  aria-label="Increase quantity"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <button
                onClick={submit}
                disabled={noBeans || beanInvalid}
                className="primary-button flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {line ? "Update item" : "Add to cart"} · {peso(price * qty)}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
