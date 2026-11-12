import { Icon, PageLink } from "../components/ui.jsx"
import { lineSummary, peso } from "../lib/constants.js"

// Returns a reason string if a cart line can't be ordered right now.
export const lineProblem = (line, products, beans) => {
  const p = products.find((x) => x.id === line.productId)
  if (!p) return "No longer on the menu"
  if (!p.available) return "Currently sold out"
  if (line.bean && !beans.find((b) => b.name === line.bean && b.available))
    return `${line.bean} is unavailable`
  return ""
}

export default function CartPage({ cart, navigate, products, beans, onEdit, storeOpen }) {
  const problems = cart.items.map((l) => lineProblem(l, products, beans))
  const blocked = problems.some(Boolean)

  return (
    <main className="min-h-[70vh] bg-earth-200">
      <section className="border-b border-earth-300 bg-earth-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1040px]">
          <p className="eyebrow">Advance ordering · pick up in store</p>
          <h1 className="display-title mt-3 text-6xl tracking-[-.05em] sm:text-7xl">Your cart</h1>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-[1040px]">
          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-20 text-center shadow-md">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-earth-100">
                <Icon name="cart" size={24} />
              </span>
              <p className="mt-5 font-semibold">Your cart is empty.</p>
              <p className="mt-2 text-sm text-earth-600">Pick something from the menu to get started.</p>
              <PageLink to="/menu" navigate={navigate} className="primary-button mt-7">
                Browse the menu <Icon name="arrow" size={17} />
              </PageLink>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <div className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-md">
                  {cart.items.map((line, i) => (
                    <article
                      key={line.id}
                      className="flex gap-3 border-b border-earth-300 p-3 last:border-b-0 sm:gap-5 sm:p-4"
                    >
                      <div className="size-[74px] shrink-0 overflow-hidden rounded-xl bg-earth-200 sm:size-24">
                        {line.image && (
                          <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-sm font-semibold sm:text-base">{line.name}</h2>
                          <p className="shrink-0 text-sm font-bold">{peso(line.unitPrice * line.qty)}</p>
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-earth-600 sm:text-xs">
                          {lineSummary(line) || line.category} · {peso(line.unitPrice)} each
                        </p>
                        {problems[i] && (
                          <p className="mt-1 text-xs font-semibold text-[#8F3B31]">
                            {problems[i]} — edit or remove this item.
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full border border-earth-300 p-0.5">
                            <button
                              onClick={() =>
                                line.qty > 1
                                  ? cart.updateLine(line.id, { qty: line.qty - 1 })
                                  : cart.removeLine(line.id)
                              }
                              className="grid size-8 place-items-center rounded-full hover:bg-earth-100"
                              aria-label="Decrease quantity"
                            >
                              <Icon name="minus" size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{line.qty}</span>
                            <button
                              onClick={() => cart.updateLine(line.id, { qty: Math.min(20, line.qty + 1) })}
                              className="grid size-8 place-items-center rounded-full hover:bg-earth-100"
                              aria-label="Increase quantity"
                            >
                              <Icon name="plus" size={14} />
                            </button>
                          </div>
                          <button onClick={() => onEdit(line)} className="btn-sm">
                            <Icon name="edit" size={14} /> Edit
                          </button>
                          <button onClick={() => cart.removeLine(line.id)} className="btn-sm danger">
                            <Icon name="trash" size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-3">
                  <PageLink to="/menu" navigate={navigate} className="secondary-button">
                    + Add more items
                  </PageLink>
                  <button
                    onClick={() => window.confirm("Remove everything from your cart?") && cart.clear()}
                    className="btn-sm danger"
                  >
                    <Icon name="trash" size={14} /> Clear cart
                  </button>
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-md lg:sticky lg:top-[180px]">
                <p className="eyebrow">Order summary</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-earth-600">Items</dt>
                    <dd className="font-semibold">{cart.count}</dd>
                  </div>
                  <div className="flex justify-between border-t border-earth-200 pt-3 text-base">
                    <dt className="font-semibold">Total</dt>
                    <dd className="display-title text-2xl">{peso(cart.total)}</dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-xl bg-earth-100 p-3 text-xs leading-5 text-earth-700">
                  We don’t deliver — orders are placed in advance and picked up at our Florencia branch.
                </p>
                {!storeOpen && (
                  <p className="mt-3 rounded-xl bg-[#F3DEDB] p-3 text-xs leading-5 text-[#8F3B31]">
                    The branch is closed right now, so new orders can’t be placed.
                  </p>
                )}
                <button
                  disabled={blocked || !storeOpen}
                  onClick={() => navigate("/checkout")}
                  className="primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proceed to order <Icon name="arrow" size={17} />
                </button>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
