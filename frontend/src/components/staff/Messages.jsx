import { useState } from "react"
import { Icon } from "../ui.jsx"
import { deleteMessage, markMessage } from "../../lib/db.js"
import { fmtDateTime } from "../../lib/constants.js"
import { useNotify } from "../../lib/notify.jsx"
import { PanelHeader } from "./Shell.jsx"

export default function MessagesPanel({ messages, canDelete }) {
  const notify = useNotify()
  const [openId, setOpenId] = useState(null)

  const toggle = async (m) => {
    setOpenId(openId === m.id ? null : m.id)
    if (!m.read) await markMessage(m.id, true)
  }
  const remove = async (m) => {
    if (!window.confirm("Delete this message?")) return
    try {
      await deleteMessage(m.id)
      notify("Message deleted")
    } catch (e) {
      notify("Could not delete", e.message, { tone: "error" })
    }
  }

  return (
    <div>
      <PanelHeader eyebrow="Inbox" title="Messages">
        <span className="badge">{messages.filter((m) => !m.read).length} unread</span>
      </PanelHeader>
      {messages.length === 0 ? (
        <p className="rounded-2xl border border-earth-300 bg-earth-50 px-5 py-16 text-center text-sm text-earth-600">
          No messages yet. Messages sent from the Contacts page appear here.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-sm">
          {messages.map((m) => (
            <li key={m.id} className="border-b border-earth-200 last:border-b-0">
              <button onClick={() => toggle(m)} className={`flex w-full items-start gap-3 p-4 text-left hover:bg-earth-100 ${m.read ? "" : "bg-earth-100/60"}`}>
                <span className={`mt-2 size-2 shrink-0 rounded-full ${m.read ? "bg-transparent" : "bg-[#B5564A]"}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <strong className="text-sm">{m.name}</strong>
                    <span className="text-[11px] text-earth-600">{fmtDateTime(m.created_at)}</span>
                  </span>
                  <span className="block text-xs text-earth-600">{m.email}</span>
                  {openId !== m.id && <span className="mt-1 block truncate text-sm text-earth-700">{m.message}</span>}
                </span>
              </button>
              {openId === m.id && (
                <div className="px-4 pb-4 pl-9">
                  <p className="whitespace-pre-wrap rounded-xl bg-white/60 p-4 text-sm leading-6">{m.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a className="btn-sm solid" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to BRWD. Florencia")}`}>
                      <Icon name="mail" size={14} /> Reply by email
                    </a>
                    <button className="btn-sm" onClick={() => markMessage(m.id, false)}>Mark unread</button>
                    {canDelete && (
                      <button className="btn-sm danger" onClick={() => remove(m)}>
                        <Icon name="trash" size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
