import { useEffect, useMemo, useState } from "react"
import { Icon, Spinner } from "../components/ui.jsx"
import { CATEGORIES, peso } from "../lib/constants.js"

export default function MenuPage({ products, loading, error, query, setQuery, openProduct }) {
  const [activeCategory, setActiveCategory] = useState("Coffee")
  const searching = query.trim().length > 0

  // searching looks through the whole menu; clearing the search goes back to a category
  useEffect(() => {
    if (searching) setActiveCategory("All")
    else setActiveCategory((c) => (c === "All" ? "Coffee" : c))
  }, [searching])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) => !q || `${p.name} ${p.detail} ${p.category}`.toLowerCase().includes(q),
    )
  }, [products, query])

  const visibleItems =
    activeCategory === "All" ? matches : matches.filter((p) => p.category === activeCategory)
  const tabs = searching ? ["All", ...CATEGORIES] : CATEGORIES
  const countFor = (c) => (c === "All" ? matches.length : matches.filter((p) => p.category === c).length)

  return (
    <main className="min-h-screen bg-earth-200">
      <section className="border-b border-earth-300 bg-earth-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto flex max-w-[1040px] flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Quick ordering hub</p>
            <h1 className="display-title mt-3 text-6xl tracking-[-.05em] sm:text-7xl">The menu</h1>
          </div>
          <div className="flex h-12 w-full items-center gap-2 rounded-full border border-earth-300 bg-earth-50 px-4 sm:w-80">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search the menu"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-earth-600"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <Icon name="close" size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1040px]">
          <div
            className="no-scrollbar sticky top-[102px] z-30 mb-4 flex gap-2 overflow-x-auto border-b border-earth-400 bg-earth-200 px-1 py-3 lg:top-[151px]"
            role="tablist"
            aria-label="Menu categories"
          >
            {tabs.map((category, index) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`relative min-w-[118px] flex-1 whitespace-nowrap rounded-full px-4 py-3 text-left text-sm font-semibold transition sm:text-center ${
                  activeCategory === category
                    ? "bg-earth-700 !text-earth-50"
                    : "text-earth-600 hover:bg-earth-300 hover:text-earth-900"
                }`}
                role="tab"
                style={activeCategory === category ? { color: "#F6F1EF" } : undefined}
                aria-selected={activeCategory === category}
              >
                <span className="mr-2 text-[9px] font-normal opacity-60">
                  {searching ? countFor(category) : `0${index + 1}`}
                </span>
                {category}
              </button>
            ))}
          </div>

          {searching && (
            <p className="mb-4 text-xs text-earth-600">
              {matches.length} result{matches.length === 1 ? "" : "s"} for <strong>“{query}”</strong>
              {activeCategory !== "All" && <> in {activeCategory}</>}
            </p>
          )}

          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-16 text-center shadow-md">
              <p className="font-semibold">We couldn’t load the menu.</p>
              <p className="mt-2 text-sm text-earth-600">{error}</p>
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-md">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className={`menu-row group flex items-center gap-3 border-b border-earth-300 p-3 last:border-b-0 sm:gap-5 sm:p-4 ${
                    item.available ? "" : "opacity-60"
                  }`}
                >
                  <div className="size-[74px] shrink-0 overflow-hidden rounded-xl bg-earth-200 sm:size-24">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {activeCategory === "All" && (
                      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-earth-600">
                        {item.category}
                      </p>
                    )}
                    <h2 className="truncate text-sm font-semibold sm:text-base">{item.name}</h2>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-earth-600 sm:text-xs sm:leading-5">
                      {item.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                    <p className="text-right text-[10px] font-medium text-earth-600 sm:text-xs">
                      From
                      <strong className="mt-0.5 block text-xs text-earth-900 sm:text-sm">
                        {peso(item.price)}
                      </strong>
                    </p>
                    {item.available ? (
                      <button
                        onClick={() => openProduct(item)}
                        className="grid size-10 place-items-center rounded-full bg-earth-700 text-earth-50 shadow-md transition hover:scale-110 hover:bg-earth-600 active:scale-95 sm:size-11"
                        aria-label={`Customize and add ${item.name} to cart`}
                      >
                        <Icon name="plus" size={20} />
                      </button>
                    ) : (
                      <span className="badge cancelled whitespace-nowrap">Sold out</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-16 text-center shadow-md">
              <p className="font-semibold">
                {searching ? `Nothing matches “${query}”.` : "No items in this category yet."}
              </p>
              <p className="mt-2 text-sm text-earth-600">
                Try another category or adjust your search.
              </p>
              {searching && (
                <button onClick={() => setQuery("")} className="secondary-button mt-6">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
