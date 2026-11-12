import { useEffect, useMemo, useRef, useState } from "react"
import logo from "../assets/logo.png"
import { Icon, PageLink } from "./ui.jsx"
import { peso } from "../lib/constants.js"

export const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Menu", path: "/menu" },
  { label: "Orders", path: "/orders" },
  { label: "Contacts", path: "/contacts" },
]

export function StatusBanner({ isOpen }) {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-[34px] items-center bg-[#17110D] px-5 text-earth-50 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.12em] sm:text-[11px]" style={{ color: "#F6F1EF" }}>
          <span
            className={`size-2 shrink-0 rounded-full ${
              isOpen
                ? "bg-[#65A56E] shadow-[0_0_0_3px_rgba(101,165,110,.18)]"
                : "bg-[#B5564A] shadow-[0_0_0_3px_rgba(181,86,74,.2)]"
            }`}
          />
          <span className="truncate">
            Florencia Branch is currently{" "}
            <strong style={{ color: "#F6F1EF" }}>{isOpen ? "OPEN" : "CLOSED"}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

export function Navbar({ route, navigate, cartCount, query, setQuery, products }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const accountRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false)
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const closeMenus = () => {
    setMobileOpen(false)
    setAccountOpen(false)
  }

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((p) => `${p.name} ${p.detail} ${p.category}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, products])

  const runSearch = () => {
    setSearchOpen(false)
    navigate("/menu")
  }

  return (
    <header className="fixed inset-x-0 top-[34px] z-50 border-b border-earth-200 bg-[#F6F1EF] shadow-[0_6px_20px_rgba(32,24,19,.07)]">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <PageLink to="/" navigate={navigate} onClick={closeMenus} className="group flex items-center gap-3">
          <img src={logo} alt="BRWD Logo" className="h-12 w-auto object-contain" />
        </PageLink>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div ref={searchRef} className="relative">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full border border-earth-200 transition hover:bg-earth-100"
              aria-label="Search menu"
              aria-expanded={searchOpen}
            >
              <Icon name="search" size={17} />
            </button>
            {searchOpen && (
              <div className="fixed inset-x-3 top-[106px] rounded-2xl border border-earth-200 bg-earth-50 p-3 shadow-[0_18px_50px_rgba(32,24,19,.18)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    runSearch()
                  }}
                  className="flex items-center gap-2 rounded-full border border-earth-300 bg-white/50 px-3"
                >
                  <Icon name="search" size={16} />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                    placeholder="Search drinks, pastries…"
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-earth-600"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </form>
                {query.trim() && (
                  <div className="mt-2">
                    {suggestions.length ? (
                      <ul>
                        {suggestions.map((p) => (
                          <li key={p.id}>
                            <button
                              onClick={() => {
                                setQuery(p.name)
                                runSearch()
                              }}
                              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-earth-100"
                            >
                              <img src={p.image} alt="" className="size-10 rounded-lg object-cover" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{p.name}</span>
                                <span className="block text-[11px] text-earth-600">{p.category}</span>
                              </span>
                              <span className="text-xs font-semibold">{peso(p.price)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-2 py-4 text-center text-sm text-earth-600">
                        No items match “{query}”.
                      </p>
                    )}
                    <button
                      onClick={runSearch}
                      className="mt-1 w-full rounded-xl bg-earth-100 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[.1em] hover:bg-earth-200"
                    >
                      See all results in menu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/cart")}
            className="relative grid size-10 place-items-center rounded-full border border-earth-200 transition hover:bg-earth-100"
            aria-label={`Cart with ${cartCount} items`}
          >
            <Icon name="cart" size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-1 grid size-[17px] place-items-center rounded-full bg-earth-700 text-[9px] font-bold text-earth-50">
                {cartCount}
              </span>
            )}
          </button>
          <div className="relative hidden md:block" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex h-10 items-center gap-2 rounded-full border border-earth-200 px-3.5 text-[11px] font-semibold uppercase tracking-[.1em] transition hover:bg-earth-100"
              aria-expanded={accountOpen}
            >
              <Icon name="user" size={16} /> Account
              <Icon name="chevron" size={14} />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-2xl border border-earth-200 bg-earth-50 p-2 shadow-[0_18px_50px_rgba(32,24,19,.16)]">
                <p className="px-3 py-2 text-[10px] uppercase tracking-[.16em] text-earth-600">
                  Switch workspace
                </p>
                <button onClick={closeMenus} className="portal-item active" style={{ color: "#F6F1EF" }}>
                  <span className="size-1.5 rounded-full bg-earth-50" />
                  Customer Portal
                  <span className="ml-auto text-[9px] uppercase tracking-wider">Active</span>
                </button>
                <button
                  onClick={() => {
                    closeMenus()
                    navigate("/employee")
                  }}
                  className="portal-item"
                >
                  Go to Employee Portal <Icon name="arrow" size={14} />
                </button>
                <button
                  onClick={() => {
                    closeMenus()
                    navigate("/owner")
                  }}
                  className="portal-item"
                >
                  Go to Owner Dashboard <Icon name="arrow" size={14} />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-10 place-items-center lg:hidden"
            aria-label="Toggle navigation"
          >
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div className="hidden border-t border-earth-200 bg-earth-50 lg:block">
        <nav className="mx-auto flex h-[48px] max-w-[1440px] items-center justify-center gap-2 px-12" aria-label="Main navigation">
          {navItems.map((item) => (
            <PageLink
              key={item.path}
              to={item.path}
              navigate={navigate}
              className={`nav-link text-[11px] font-semibold uppercase tracking-[.18em] ${
                route === item.path ? "active" : ""
              }`}
              style={route === item.path ? { color: "#F6F1EF" } : undefined}
            >
              {item.label}
            </PageLink>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100svh-102px)] overflow-y-auto border-t border-earth-200 bg-earth-50 px-5 py-5 lg:hidden">
          <nav className="flex flex-col">
            {navItems.map((item, index) => (
              <PageLink
                key={item.path}
                to={item.path}
                navigate={navigate}
                onClick={closeMenus}
                style={route === item.path ? { color: "#F6F1EF" } : undefined}
                className={`mb-1 flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[.15em] transition ${
                  route === item.path ? "bg-earth-700" : "hover:bg-earth-100 hover:text-earth-600"
                }`}
              >
                <span>
                  0{index + 1}   {item.label}
                </span>
                <Icon name="arrow" />
              </PageLink>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] font-semibold uppercase tracking-[.08em] md:hidden">
            <button className="rounded-lg bg-earth-700 px-2 py-3" style={{ color: "#F6F1EF" }} onClick={closeMenus}>
              Customer Portal
            </button>
            <button className="rounded-lg bg-earth-100 px-2 py-3" onClick={() => { closeMenus(); navigate("/employee") }}>
              Employee Portal
            </button>
            <button className="rounded-lg bg-earth-100 px-2 py-3" onClick={() => { closeMenus(); navigate("/owner") }}>
              Owner Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export function CorporateFooter() {
  return (
    <footer className="border-t border-earth-600/30 bg-earth-950 px-6 py-14 text-earth-300 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-earth-50">
          BRWD. Philippines
        </p>
        <p className="mt-3 max-w-md text-xs leading-5">
          Official corporate channels for brand partnerships, franchise
          inquiries, and nationwide updates.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 text-xs sm:flex-row sm:gap-7">
          <a href="https://www.facebook.com/" className="footer-link">
            Facebook: BRWD. Philippines
          </a>
          <a href="https://www.instagram.com/" className="footer-link">
            Instagram: @brwd.philippines
          </a>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-earth-50">
          <a href="tel:+639189370101" className="footer-link">
            0918-937-0101
          </a>
          <span className="text-earth-600">/</span>
          <a href="tel:+639209670101" className="footer-link">
            0920-967-0101
          </a>
        </div>
        <div className="mt-9 h-px w-full bg-earth-600/30" />
        <div className="mt-5 flex w-full flex-col justify-between gap-2 text-[9px] uppercase tracking-[.16em] sm:flex-row">
          <p>© 2026 BRWD. Coffee and Tea</p>
          <p>Official Corporate Brand Channels</p>
        </div>
      </div>
    </footer>
  )
}
