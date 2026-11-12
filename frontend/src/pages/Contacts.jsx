import { useState } from "react"
import { Icon } from "../components/ui.jsx"
import { sendMessage } from "../lib/db.js"
import { useNotify } from "../lib/notify.jsx"

export default function ContactsPage() {
  const [notice, setNotice] = useState("")

  const [sending, setSending] = useState(false)
  const notify = useNotify()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSending(true)
    try {
      await sendMessage({
        name: data.get("name").trim(),
        email: data.get("email").trim(),
        message: data.get("message").trim(),
      })
      setNotice("Thank you — your message is on its way to our Florencia team.")
      notify("Message sent", "Our Florencia team will get back to you.", { tone: "success" })
      form.reset()
    } catch {
      setNotice("Sorry, we couldn't send your message. Please try again in a moment.")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="bg-earth-200">
      <section className="border-b border-earth-300 bg-earth-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="eyebrow">Visit or write to us</p>
          <h1 className="display-title mt-3 text-6xl tracking-[-.05em] sm:text-7xl">
            Contacts
          </h1>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] overflow-hidden rounded-[2rem] border border-earth-300 shadow-xl lg:grid-cols-[.9fr_1.1fr]">
          <div className="flex flex-col justify-between bg-earth-900 p-7 text-earth-50 sm:p-12 lg:p-16">
            <div>
              <p className="eyebrow !text-earth-300">Florencia branch</p>
              <h2 className="display-title mt-4 text-4xl leading-tight sm:text-5xl">
                Come find your
                <br />
                <span className="italic text-earth-300">usual corner.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-earth-300">
                Whether it’s a quick pickup or an afternoon at the café, our
                Florencia team is ready to welcome you.
              </p>
            </div>

            <div className="mt-14 space-y-9">
              <div className="flex gap-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-earth-600">
                  <Icon name="pin" />
                </span>
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-earth-300">
                    Physical address
                  </p>
                  <address className="max-w-sm text-base not-italic leading-7">
                    Florencia, San Pedro, San Francisco del Monte, Quezon City,
                    Metro Manila
                  </address>
                </div>
              </div>
              <div className="flex gap-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-earth-600">
                  <Icon name="clock" />
                </span>
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-earth-300">
                    Branch hours
                  </p>
                  <div className="grid grid-cols-[118px_1fr] gap-y-1 text-sm leading-6">
                    <span className="text-earth-300">Monday–Friday</span>
                    <span>7:00 AM — 10:00 PM</span>
                    <span className="text-earth-300">Weekends</span>
                    <span>8:00 AM — 11:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-earth-50 p-7 sm:p-12 lg:p-16">
            <p className="eyebrow">Support & inquiries</p>
            <h2 className="display-title mt-3 text-4xl tracking-[-.03em]">
              Message Us
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-earth-600">
              Questions, feedback, or a note for the local team? Send it our
              way.
            </p>
            <form onSubmit={handleSubmit} className="mt-10 space-y-7">
              <label className="field-label light">
                Name
                <input
                  required
                  name="name"
                  placeholder="Your full name"
                  className="contact-field light"
                />
              </label>
              <label className="field-label light">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="name@email.com"
                  className="contact-field light"
                />
              </label>
              <label className="field-label light">
                Message
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder="Tell us what’s on your mind..."
                  className="contact-field light resize-y"
                />
              </label>
              <button
                disabled={sending}
                className="flex w-full items-center justify-between rounded-full bg-earth-700 px-6 py-4 text-xs font-bold uppercase tracking-[.12em] text-earth-50 transition hover:bg-earth-600 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send message"} <Icon name="arrow" />
              </button>
              {notice && (
                <p
                  role="status"
                  className="rounded-xl border border-earth-200 bg-earth-100 p-4 text-sm leading-6 text-earth-700"
                >
                  {notice}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
