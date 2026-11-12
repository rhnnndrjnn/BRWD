// Data layer. Talks to Supabase when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set,
// otherwise falls back to a localStorage "demo mode" with the same API so the whole
// site (including both staff portals) can be tried without a backend.
import { supabase, isDemo } from "./supabase"
import { SEED_PRODUCTS, BEANS, makeOrderCode } from "./constants"

const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36)

/* ------------------------------------------------------------------ */
/* Local engine (demo mode)                                            */
/* ------------------------------------------------------------------ */
const LS = "brwd_db_"
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("brwd-db") : null
const listeners = new Set()

const fire = (table, event) =>
  listeners.forEach((l) => l.tables.includes(table) && l.cb(event))
channel?.addEventListener("message", (e) => fire(e.data.table, e.data.event))
const emit = (table, event) => {
  fire(table, event)
  channel?.postMessage({ table, event })
}

const readLocal = (t) => {
  try {
    return JSON.parse(localStorage.getItem(LS + t) || "null")
  } catch {
    return null
  }
}
const writeLocal = (t, rows) => localStorage.setItem(LS + t, JSON.stringify(rows))

function seedLocal() {
  if (readLocal("seeded")) return
  const now = new Date().toISOString()
  writeLocal(
    "products",
    SEED_PRODUCTS.map((p) => ({ ...p, id: uid(), created_at: now })),
  )
  writeLocal(
    "beans",
    BEANS.map((name) => ({ id: uid(), name, available: true })),
  )
  writeLocal("orders", [])
  writeLocal("messages", [])
  writeLocal("notifications", [])
  writeLocal("settings", [
    { key: "store_open", value: { open: true } },
    { key: "gcash", value: { name: "BRWD Florencia", number: "0918-937-0101", qr: "" } },
  ])
  writeLocal("staff", [
    { id: uid(), username: "employee", password: "employee123", role: "employee" },
    { id: uid(), username: "owner", password: "owner123", role: "owner" },
  ])
  writeLocal("seeded", true)
}
if (isDemo) seedLocal()

/* ------------------------------------------------------------------ */
/* Generic helpers                                                     */
/* ------------------------------------------------------------------ */
async function list(table, { order = "created_at", asc = false } = {}) {
  if (isDemo) {
    const rows = [...(readLocal(table) || [])]
    return rows.sort((a, b) => {
      const A = a[order] ?? "",
        B = b[order] ?? ""
      return (A > B ? 1 : A < B ? -1 : 0) * (asc ? 1 : -1)
    })
  }
  const { data, error } = await supabase.from(table).select("*").order(order, { ascending: asc })
  if (error) throw error
  return data
}

async function insert(table, row) {
  const full = { id: uid(), created_at: new Date().toISOString(), ...row }
  if (isDemo) {
    writeLocal(table, [full, ...(readLocal(table) || [])])
    emit(table, { type: "INSERT", row: full })
    return full
  }
  // No .select() — anonymous visitors can insert but not read back.
  const { error } = await supabase.from(table).insert(full)
  if (error) throw error
  return full
}

async function update(table, id, patch) {
  if (isDemo) {
    let updated
    writeLocal(
      table,
      (readLocal(table) || []).map((r) => (r.id === id ? (updated = { ...r, ...patch }) : r)),
    )
    if (updated) emit(table, { type: "UPDATE", row: updated })
    return updated
  }
  const { error } = await supabase.from(table).update(patch).eq("id", id)
  if (error) throw error
}

async function remove(table, id) {
  if (isDemo) {
    writeLocal(
      table,
      (readLocal(table) || []).filter((r) => r.id !== id),
    )
    emit(table, { type: "DELETE", row: { id } })
    return
  }
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) throw error
}

/** Subscribe to changes. cb receives {type, row}. Returns an unsubscribe function. */
export function subscribe(tables, cb) {
  if (isDemo) {
    const l = { tables, cb }
    listeners.add(l)
    return () => listeners.delete(l)
  }
  const ch = supabase.channel("brwd-" + tables.join("-") + "-" + uid())
  tables.forEach((table) =>
    ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) =>
      cb({ type: p.eventType, row: p.new && Object.keys(p.new).length ? p.new : p.old, table }),
    ),
  )
  ch.subscribe()
  return () => supabase.removeChannel(ch)
}

/* ------------------------------------------------------------------ */
/* Products & beans                                                    */
/* ------------------------------------------------------------------ */
export const getProducts = () => list("products", { order: "created_at", asc: true })
export const saveProduct = (product) =>
  product.id ? update("products", product.id, product) : insert("products", product)
export const deleteProduct = (id) => remove("products", id)
export const setProductAvailable = (id, available) => update("products", id, { available })

export const getBeans = () => list("beans", { order: "name", asc: true })
export const setBeanAvailable = (id, available) => update("beans", id, { available })

/* ------------------------------------------------------------------ */
/* Settings (store status, GCash details)                              */
/* ------------------------------------------------------------------ */
export async function getSettings() {
  let rows
  if (isDemo) rows = readLocal("settings") || []
  else {
    const { data, error } = await supabase.from("settings").select("*")
    if (error) throw error
    rows = data
  }
  const out = { store_open: { open: true }, gcash: { name: "", number: "", qr: "" } }
  rows.forEach((r) => (out[r.key] = r.value))
  return out
}

export async function setSetting(key, value) {
  if (isDemo) {
    const rows = readLocal("settings") || []
    const exists = rows.some((r) => r.key === key)
    writeLocal(
      "settings",
      exists ? rows.map((r) => (r.key === key ? { key, value } : r)) : [...rows, { key, value }],
    )
    emit("settings", { type: "UPDATE", row: { key, value } })
    return
  }
  const { error } = await supabase.from("settings").upsert({ key, value })
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */
export const getOrders = () => list("orders")

export async function createOrder(order) {
  const row = {
    code: makeOrderCode(),
    status: "pending",
    payment_status: order.payment_method === "gcash" ? "verifying" : "unpaid",
    ...order,
  }
  const saved = await insert("orders", row)
  await pushNotification({
    type: "order",
    title: "New order " + saved.code,
    body: `${saved.customer_name} · ₱${Number(saved.total).toFixed(2)} · ${
      saved.payment_method === "gcash" ? "GCash (check receipt)" : "Cash on arrival"
    }`,
    order_code: saved.code,
  })
  return saved
}

export async function updateOrder(order, patch, notifyText) {
  await update("orders", order.id, patch)
  if (notifyText)
    await pushNotification({
      type: "order",
      title: `${order.code}: ${notifyText}`,
      body: order.customer_name,
      order_code: order.code,
    })
}

/** Customers can only look up their own orders by code. */
export async function getOrdersByCodes(codes) {
  if (!codes.length) return []
  if (isDemo) return (readLocal("orders") || []).filter((o) => codes.includes(o.code))
  const { data, error } = await supabase.rpc("orders_by_codes", { codes })
  if (error) throw error
  return data || []
}

/** Lets a customer attach a GCash receipt to an existing order they own. */
export async function attachReceipt(code, url) {
  if (isDemo) {
    const o = (readLocal("orders") || []).find((x) => x.code === code)
    if (o) await update("orders", o.id, { receipt_url: url, payment_status: "verifying" })
  } else {
    const { error } = await supabase.rpc("attach_receipt", { p_code: code, p_url: url })
    if (error) throw error
  }
  await pushNotification({
    type: "payment",
    title: "New GCash receipt " + code,
    body: "Customer re-uploaded a receipt",
    order_code: code,
  })
}

/* ------------------------------------------------------------------ */
/* Messages & notifications                                            */
/* ------------------------------------------------------------------ */
export const getMessages = () => list("messages")
export const markMessage = (id, read) => update("messages", id, { read })
export const deleteMessage = (id) => remove("messages", id)

export async function sendMessage({ name, email, message }) {
  const saved = await insert("messages", { name, email, message, read: false })
  await pushNotification({
    type: "message",
    title: "New message from " + name,
    body: message.slice(0, 90),
  })
  return saved
}

export const getNotifications = () => list("notifications")
export const pushNotification = (n) => insert("notifications", { read: false, ...n })
export const markNotification = (id) => update("notifications", id, { read: true })
export async function markAllNotifications() {
  const unread = (await getNotifications()).filter((n) => !n.read)
  await Promise.all(unread.map((n) => markNotification(n.id)))
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */
function compressImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const src = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(src)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read image"))), "image/jpeg", 0.82)
    }
    img.onerror = () => reject(new Error("That file is not a valid image"))
    img.src = src
  })
}

const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })

/** folder: "receipts" | "products" | "gcash" — returns a URL (or data URL in demo mode). */
export async function uploadImage(file, folder) {
  const blob = await compressImage(file)
  if (isDemo) return blobToDataUrl(blob)
  const path = `${folder}/${Date.now()}-${uid().slice(0, 8)}.jpg`
  const { error } = await supabase.storage.from("brwd").upload(path, blob, {
    contentType: "image/jpeg",
  })
  if (error) throw error
  return supabase.storage.from("brwd").getPublicUrl(path).data.publicUrl
}

/* ------------------------------------------------------------------ */
/* Staff auth (username + password)                                    */
/* ------------------------------------------------------------------ */
const SESSION_KEY = "brwd_staff_session"

async function profileFor(user) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (error) throw error
  return { id: user.id, username: data.username, role: data.role }
}

export async function getSession() {
  if (isDemo) {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null")
      if (!s) return null
      const acc = (readLocal("staff") || []).find((a) => a.id === s.id)
      return acc ? { id: acc.id, username: acc.username, role: acc.role } : null
    } catch {
      return null
    }
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session) return null
  try {
    return await profileFor(data.session.user)
  } catch {
    return null
  }
}

export async function login(username, password) {
  username = username.trim().toLowerCase()
  if (isDemo) {
    const acc = (readLocal("staff") || []).find(
      (a) => a.username.toLowerCase() === username && a.password === password,
    )
    if (!acc) throw new Error("Incorrect username or password.")
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: acc.id }))
    return { id: acc.id, username: acc.username, role: acc.role }
  }
  const { data: email, error: e1 } = await supabase.rpc("email_for_username", { u: username })
  if (e1 || !email) throw new Error("Incorrect username or password.")
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error("Incorrect username or password.")
  return profileFor(data.user)
}

export async function logout() {
  if (isDemo) sessionStorage.removeItem(SESSION_KEY)
  else await supabase.auth.signOut()
}

export async function changeCredentials(session, { username, currentPassword, newPassword }) {
  username = username.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,}$/.test(username))
    throw new Error("Username must be at least 3 characters (letters, numbers, . _ -).")
  if (newPassword && newPassword.length < 6)
    throw new Error("New password must be at least 6 characters.")

  if (isDemo) {
    const staff = readLocal("staff") || []
    const acc = staff.find((a) => a.id === session.id)
    if (!acc || acc.password !== currentPassword) throw new Error("Current password is incorrect.")
    if (staff.some((a) => a.id !== acc.id && a.username.toLowerCase() === username))
      throw new Error("That username is already taken.")
    writeLocal(
      "staff",
      staff.map((a) =>
        a.id === acc.id ? { ...a, username, password: newPassword || a.password } : a,
      ),
    )
    return { ...session, username }
  }

  const { data: u } = await supabase.auth.getUser()
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: u.user.email,
    password: currentPassword,
  })
  if (authErr) throw new Error("Current password is incorrect.")
  const { error } = await supabase.from("profiles").update({ username }).eq("id", session.id)
  if (error)
    throw new Error(error.code === "23505" ? "That username is already taken." : error.message)
  if (newPassword) {
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
    if (pwErr) throw new Error(pwErr.message)
  }
  return { ...session, username }
}
