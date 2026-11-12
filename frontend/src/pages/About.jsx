import { Icon, PageLink } from "../components/ui.jsx"
import { image } from "../lib/constants.js"

export default function AboutPage({ navigate }) {
  return (
    <main>
      <section className="grid min-h-[650px] lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-earth-900 px-6 py-20 text-earth-50 sm:px-10 lg:px-16 xl:px-20">
          <p className="eyebrow !text-earth-300">The BRWD.</p>
          <h1 className="display-title mt-5 text-[clamp(3.7rem,7vw,7rem)] leading-[.9] tracking-[-.055em]">
            A good cup.
            <br />
            <span className="italic text-earth-300">A familiar place.</span>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-7 text-earth-300">
            More than just delicious drinks, our home is a place where you can find comfort, 
            friendship, and someone to listen. Whatever you're feeling, BRWD Florencia is 
            always here for you. Because we're not just serving drinks, we're building 
            friendships <br/> <br/>
            BRWD Florencia — More than a drink, a home away from home.
          </p>
        </div>
        <div className="min-h-[520px]">
          <img
            src={image("photo-1598959652545-c0230cdbb01f", 1400)}
            alt="The warm interior and menu board of a neighborhood café"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-earth-100 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="eyebrow">Why we brew</p>
            <h2 className="display-title mt-4 text-5xl leading-[1.02] tracking-[-.04em]">
              Everyday care,
              <br />
              cup by cup.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              {
                number: "01",
                title: "Considered sourcing",
                text: "We select expressive coffee beans and tea leaves with balanced flavor, dependable quality, and responsible partnerships in mind.",
              },
              {
                number: "02",
                title: "Made with intention",
                text: "Every drink is measured, brewed, and finished by hand. No shortcuts—just a better version of your everyday favorite.",
              },
              {
                number: "03",
                title: "Neighborhood first",
                text: "Florencia is more than our address. We built this branch to feel at home in SFDM and to serve the people around it.",
              },
              {
                number: "04",
                title: "Warmly familiar",
                text: "Good hospitality should feel easy. We remember regulars, welcome new faces, and always leave room to stay awhile.",
              },
            ].map((value) => (
              <article
                key={value.number}
                className="rounded-2xl border border-earth-300 bg-earth-50 p-6 shadow-sm"
              >
                <span className="text-[10px] font-bold text-earth-600">
                  {value.number}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
                <p className="mt-3 text-sm leading-7 text-earth-600">
                  {value.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-earth-300 px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">Inside Florencia</p>
            <h2 className="display-title mt-4 text-5xl tracking-[-.04em] sm:text-6xl">
              The branch, in moments.
            </h2>
          </div>
          <div className="gallery-grid">
            <figure className="gallery-tall">
              <img
                src={image("photo-1553329537-7a06eb26021c")}
                alt="A carefully poured cup of coffee"
              />
            </figure>
            <figure>
              <img
                src={image("photo-1534432182912-63863115e106")}
                alt="Fresh pastries at the café counter"
              />
            </figure>
            <figure>
              <img
                src={image("photo-1520903304654-28bd223f96d7")}
                alt="Coffee and pastry ready to share"
              />
            </figure>
            <figure className="gallery-wide">
              <img
                src={image("photo-1598959652545-c0230cdbb01f", 1400)}
                alt="Warm details inside a rustic coffee shop"
              />
            </figure>
          </div>
          <div className="mt-12 flex justify-center">
            <PageLink to="/menu" navigate={navigate} className="primary-button">
              Taste the story <Icon name="arrow" />
            </PageLink>
          </div>
        </div>
      </section>
    </main>
  )
}
