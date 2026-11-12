import { useEffect, useState } from "react"
import { getSession, logout } from "../lib/db.js"
import { useStaffData } from "../lib/staffData.js"
import { Spinner } from "../components/ui.jsx"
import { AccountPanel, LoginScreen, NotificationBell, StaffLayout, WrongRole } from "../components/staff/Shell.jsx"
import { OrderStats } from "../components/staff/Orders.jsx"
import TransactionsPanel from "../components/staff/Transactions.jsx"
import MessagesPanel from "../components/staff/Messages.jsx"
import ProductsManager from "../components/staff/Products.jsx"
import GcashSettings, { StoreToggle } from "../components/staff/Settings.jsx"
import { PanelHeader } from "../components/staff/Shell.jsx"
import { fmtDateTime, peso } from "../lib/constants.js"

function Overview({ orders }) {
  const recent = orders.slice(0, 6)
  return (
    <div>
      <PanelHeader eyebrow="At a glance" title="Overview" />
      <OrderStats orders={orders} />
      <p className="eyebrow mb-2">Recent orders</p>
      <ul className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
        {recent.length === 0 && <li className="px-5 py-12 text-center text-sm text-earth-600">No orders yet.</li>}
        {recent.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 border-b border-earth-200 p-4 text-sm last:border-b-0">
            <span>
              <strong>{o.code}</strong> · {o.customer_name}
              <span className="block text-xs text-earth-600">{fmtDateTime(o.created_at)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className={`badge ${o.status}`}>{o.status}</span>
              <strong>{peso(o.total)}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OwnerApp({ session, setSession, navigate, onLogout }) {
  const data = useStaffData()
  const [tab, setTab] = useState("overview")
  const tabs = [
    { id: "overview", label: "Overview", icon: "chart" },
    { id: "products", label: "Products", icon: "cup" },
    { id: "transactions", label: "Transactions", icon: "receipt" },
    { id: "messages", label: "Messages", icon: "mail", badge: data.messages.filter((m) => !m.read).length },
    { id: "payments", label: "GCash details", icon: "bag" },
    { id: "account", label: "My account", icon: "lock" },
  ]
  return (
    <StaffLayout
      role="owner"
      session={session}
      tabs={tabs}
      tab={tab}
      setTab={setTab}
      onLogout={onLogout}
      navigate={navigate}
      right={
        <>
          <StoreToggle settings={data.settings} session={session} />
          <NotificationBell notifications={data.notifications} navigate={(n) => setTab(n.type === "message" ? "messages" : "overview")} />
        </>
      }
    >
      {data.loading ? (
        <Spinner />
      ) : data.error ? (
        <p className="rounded-2xl bg-[#F3DEDB] p-6 text-sm text-[#8F3B31]">{data.error}</p>
      ) : (
        <>
          {tab === "overview" && <Overview orders={data.orders} />}
          {tab === "products" && <ProductsManager products={data.products} />}
          {tab === "transactions" && <TransactionsPanel orders={data.orders} />}
          {tab === "messages" && <MessagesPanel messages={data.messages} canDelete />}
          {tab === "payments" && <GcashSettings settings={data.settings} />}
          {tab === "account" && <AccountPanel session={session} onSessionChange={setSession} />}
        </>
      )}
    </StaffLayout>
  )
}

export default function OwnerPortal({ navigate }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    getSession().then(setSession)
  }, [])
  const onLogout = async () => {
    await logout()
    setSession(null)
  }
  if (session === undefined) return <div className="min-h-screen bg-earth-100"><Spinner /></div>
  if (!session) return <LoginScreen role="owner" onLoggedIn={setSession} navigate={navigate} />
  if (session.role !== "owner") return <WrongRole session={session} role="owner" navigate={navigate} onLogout={onLogout} />
  return <OwnerApp session={session} setSession={setSession} navigate={navigate} onLogout={onLogout} />
}
