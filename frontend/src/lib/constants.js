export const CATEGORIES = ["Coffee", "Milktea", "Frappe", "Fruit Tea", "Other"]
export const BEANS = ["Premium Arabica", "Premium Barako", "Premium Robusta"]
export const SUGAR_LEVELS = [0, 25, 50, 75, 100]
export const ADDON_PRICE = 9
export const SIZE_UPCHARGE = 20 // default extra for 22oz when a product has no price_22

export const ADDONS = {
  Coffee: ["Extra espresso shot", "Whipped cream", "Coffee jelly", "Cream cheese"],
  Milktea: ["Pearls", "Cream cheese", "Nata de coco", "Coffee jelly"],
  Frappe: ["Whipped cream", "Pearls", "Extra espresso shot", "Cookie crumble"],
  "Fruit Tea": ["Nata de coco", "Popping pearls", "Pearls", "Lychee jelly"],
  Other: [],
}

export const ORDER_STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"]
export const STATUS_LABEL = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
}
export const PAYMENT_LABEL = {
  unpaid: "Pay on arrival",
  verifying: "Verifying GCash",
  paid: "Paid",
  rejected: "Receipt rejected",
}

// Branch hours: [open, close] in 24h
export const HOURS = { weekday: [7, 22], weekend: [8, 23] }

export const peso = (n) => `₱${Number(n || 0).toFixed(2)}`

export const unitPrice = (product, size, addons = []) => {
  const base =
    size === "22oz"
      ? Number(product.price_22 ?? Number(product.price) + SIZE_UPCHARGE)
      : Number(product.price)
  return base + addons.length * ADDON_PRICE
}

export const lineSummary = (line) => {
  const parts = []
  if (line.bean) parts.push(line.bean)
  if (line.temp) parts.push(`${line.temp} ${line.size}`)
  else if (line.size) parts.push(line.size)
  if (line.sugar !== undefined && line.sugar !== null && line.sugar !== "")
    parts.push(`${line.sugar}% sugar`)
  if (line.addons?.length) parts.push(`+ ${line.addons.join(", ")}`)
  return parts.join(" · ")
}

export const makeOrderCode = () => {
  const d = new Date()
  const stamp = `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  return `BRWD-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`
}

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
}

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export const image = (id, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`

export const SEED_PRODUCTS = [
  ["Florencia Latte", "Double espresso, silky milk, and a soft cocoa finish", 135, "Coffee", "photo-1565252556328-92ee4a9a0983"],
  ["Sea Salt Spanish", "Condensed milk, sea salt cream, and rich espresso", 155, "Coffee", "photo-1553329537-7a06eb26021c"],
  ["Brown Sugar Americano", "Espresso, muscovado, and filtered water", 125, "Coffee", "photo-1593200934786-75d1c755ceb3"],
  ["Oat Cappuccino", "Double espresso with velvety steamed oat milk", 160, "Coffee", "photo-1520903304654-28bd223f96d7"],
  ["Dark Mocha Frappe", "Cocoa, espresso, milk, and whipped cream", 175, "Frappe", "photo-1572490122747-3968b75cc699"],
  ["Caramel Cloud", "Caramel, coffee, fresh milk, and whipped cream", 175, "Frappe", "photo-1577805947697-89e18249d767"],
  ["Matcha Cream", "Ceremonial matcha, milk, and whipped cream", 185, "Frappe", "photo-1515823662972-da6a2e4d3002"],
  ["Cookies & Cream", "Chocolate cookies, fresh milk, and soft cream", 170, "Frappe", "photo-1579954115545-a95591f28bfc"],
  ["Brown Sugar Pearl", "Fresh milk, chewy pearls, and dark muscovado", 155, "Milktea", "photo-1558857563-b371033873b8"],
  ["Wintermelon Cream", "Wintermelon tea with lightly salted cheese foam", 145, "Milktea", "photo-1525803377221-4f6ccdaa5133"],
  ["Classic Okinawa", "Roasted brown sugar and house black milk tea", 145, "Milktea", "photo-1558160074-4d7d8bdf4256"],
  ["Jasmine Honey", "Fragrant jasmine tea, fresh milk, and wild honey", 150, "Milktea", "photo-1576092768241-dec231879fc3"],
  ["Strawberry Fruit Tea", "Black tea shaken with strawberry and fresh fruit", 140, "Fruit Tea", "photo-1558160074-4d7d8bdf4256"],
  ["Passion Fruit Green Tea", "Jasmine green tea with tangy passion fruit", 140, "Fruit Tea", "photo-1525803377221-4f6ccdaa5133"],
  ["Lychee Peach Tea", "Light peach tea with lychee and nata de coco", 145, "Fruit Tea", "photo-1576092768241-dec231879fc3"],
  ["Mango Pomelo", "Sweet mango, pomelo bits, and chilled green tea", 150, "Fruit Tea", "photo-1558857563-b371033873b8"],
  ["Butter Croissant", "Flaky, golden, and baked fresh every morning", 95, "Other", "photo-1565252556328-92ee4a9a0983"],
  ["Chocolate Crumb", "Dark chocolate cake with a crisp cocoa crumble", 115, "Other", "photo-1534432182912-63863115e106"],
  ["Café Cocoa", "Single-origin cocoa and delicately steamed milk", 135, "Other", "photo-1593200934786-75d1c755ceb3"],
  ["Morning Pairing", "A butter croissant served with brewed coffee", 185, "Other", "photo-1520903304654-28bd223f96d7"],
].map(([name, detail, price, category, img]) => ({
  name,
  detail,
  price,
  price_22: category === "Other" ? null : price + SIZE_UPCHARGE,
  category,
  image: image(img),
  available: true,
  has_hot: category === "Coffee",
}))
