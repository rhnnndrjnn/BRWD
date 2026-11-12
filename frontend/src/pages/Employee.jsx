import { useEffect, useState } from "react"
import { getSession, logout } from "../lib/db.js"
import { useStaffData } from "../lib/staffData.js"
import { Spinner } from "../components/ui.jsx"
import { AccountPanel, LoginScreen, NotificationBell, StaffLayout, WrongRole } from "../components/staff/Shell.jsx"
import OrdersPanel from "../components/staff/Orders.jsx"
import TransactionsPanel from "../components/staff/Transactions.jsx"
import MessagesPanel from "../components/staff/Messages.jsx"
import { BeanAvailability, ProductAvailability } from "../components/staff/Availability.jsx"
import { StoreToggle } from "../components/staff/Settings.jsx"

function EmployeeApp({ session, setSession, navigate, onLogout }) {
  const data = useStaffData()
  const [tab, setTab] = useState("orders")
  const activeOrders = data.orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status)).length
  const unreadMsgs = data.messages.filter((m) => !m.read).length

  const tabs = [
    { id: "orders", label: "Orders", icon: "bag", badge: data.orders.filter((o) => o.status === "pending").length || activeOrders },
    { id: "transactions", label: "Transactions", icon: "receipt" },
    { id: "products", label: "Products", icon: "cup" },
    { id: "beans", label: "Coffee beans", icon: "store" },
    { id: "messages", label: "Messages", icon: "mail", badge: unreadMsgs },
    { id: "account", label: "My account", icon: "lock" },
  ]

  const goTo = (n) => setTab(n.type === "message" ? "messages" : n.type === "store" ? "orders" : "orders")

  return (
    <StaffLayout
      role="employee"
      session={session}
      tabs={tabs}
      tab={tab}
      setTab={setTab}
      onLogout={onLogout}
      navigate={navigate}
      right={
        <>
          <StoreToggle settings={data.settings} session={session} />
          <NotificationBell notifications={data.notifications} navigate={goTo} />
        </>
      }
    >
      {data.loading ? (
        <Spinner />
      ) : data.error ? (
        <p className="rounded-2xl bg-[#F3DEDB] p-6 text-sm text-[#8F3B31]">{data.error}</p>
      ) : (
        <>
          {tab === "orders" && <OrdersPanel orders={data.orders} storeOpen={data.settings.store_open?.open !== false} />}
          {tab === "transactions" && <TransactionsPanel orders={data.orders} />}
          {tab === "products" && <ProductAvailability products={data.products} />}
          {tab === "beans" && <BeanAvailability beans={data.beans} />}
          {tab === "messages" && <MessagesPanel messages={data.messages} canDelete={false} />}
          {tab === "account" && <AccountPanel session={session} onSessionChange={setSession} />}
        </>
      )}
    </StaffLayout>
  )
}

export default function EmployeePortal({ navigate }) {
  const [session, setSession] = useState(undefined) // undefined = checking
  useEffect(() => {
    getSession().then(setSession)
  }, [])

  const onLogout = async () => {
    await logout()
    setSession(null)
  }

  if (session === undefined) return <div className="min-h-screen bg-earth-100"><Spinner /></div>
  if (!session) return <LoginScreen role="employee" onLoggedIn={setSession} navigate={navigate} />
  if (session.role !== "employee") return <WrongRole session={session} role="employee" navigate={navigate} onLogout={onLogout} />
  return <EmployeeApp session={session} setSession={setSession} navigate={navigate} onLogout={onLogout} />
}
