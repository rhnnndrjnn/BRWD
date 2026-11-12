import { useRef } from "react"
import { Icon, PageLink } from "../components/ui.jsx"
import { image } from "../lib/constants.js"

export default function HomePage({ navigate, products, openProduct }) {
  const carouselRef = useRef(null)
  const featured = products.filter((p) => p.available).slice(0, 4)
  const hero = products.find((p) => p.name === "Florencia Latte") || featured[0]

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    })
  }

  return (
    <main>
      <section className="home-hero grid min-h-[calc(100svh-102px)] lg:min-h-[calc(100svh-151px)] lg:grid-cols-[54%_46%]">
        <div className="flex flex-col justify-between bg-earth-100 px-6 py-12 sm:px-10 lg:px-16 lg:py-16 xl:px-20">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-earth-700" /> Florencia Street · Quezon
            City
          </p>
          <div className="my-14 max-w-[720px]">
            <h1 className="display-title text-[clamp(4rem,8.2vw,8rem)] leading-[.84] tracking-[-.065em]">
              Brewing daily
              <br />
              <span className="italic text-earth-700">at Florencia,</span>
              <br />
              SFDM.
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-earth-600">
              Thoughtful coffee, tea, and slow neighborhood moments—made fresh
              in the heart of San Francisco del Monte.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PageLink
                to="/menu"
                navigate={navigate}
                className="primary-button"
              >
                Order from the menu <Icon name="arrow" size={17} />
              </PageLink>
              <PageLink
                to="/about"
                navigate={navigate}
                className="secondary-button"
              >
                Our story
              </PageLink>
            </div>
          </div>
          <div className="flex max-w-lg items-center justify-between border-t border-earth-200 pt-5 text-[10px] uppercase tracking-[.15em] text-earth-600">
            <span>Open daily</span>
            <span>Freshly brewed · Locally served</span>
          </div>
        </div>
        <div className="relative min-h-[580px] overflow-hidden">
          <img
            src={image("photo-1520903304654-28bd223f96d7", 1400)}
            alt="Fresh latte and pastry served at a warm café table"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-earth-950/60 via-transparent to-earth-900/10" />
          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-earth-50 sm:bottom-10 sm:left-10 sm:right-10">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-earth-200">
                House favorite
              </p>
              <p className="display-title mt-2 text-3xl">{hero?.name || "Florencia Latte"}</p>
            </div>
            <button
              onClick={() => hero && openProduct(hero)}
              className="grid size-12 place-items-center rounded-full bg-earth-700 text-earth-50 shadow-lg ring-4 ring-earth-50/80 transition hover:scale-110 hover:bg-earth-600 active:scale-95"
              aria-label="Add Florencia Latte to cart"
            >
              <Icon name="plus" size={22} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-earth-300 px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">The regulars’ picks</p>
              <h2 className="display-title mt-3 text-5xl tracking-[-.04em] sm:text-6xl">
                Best sellers
              </h2>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button
                onClick={() => scrollCarousel(-1)}
                className="carousel-button rotate-180"
                aria-label="Previous products"
              >
                <Icon name="arrow" />
              </button>
              <button
                onClick={() => scrollCarousel(1)}
                className="carousel-button"
                aria-label="Next products"
              >
                <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div
            ref={carouselRef}
            className="no-scrollbar flex snap-x gap-4 overflow-x-auto"
          >
            {featured.map((item) => (
              <article
                key={item.id}
                className="group min-w-[82vw] snap-start overflow-hidden rounded-2xl border border-earth-300 bg-earth-50 shadow-md sm:min-w-[330px] lg:min-w-[calc(25%-12px)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-earth-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-xs text-earth-600">
                      From ₱{item.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => openProduct(item)}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-earth-700 text-earth-50 shadow-md transition hover:scale-110 hover:bg-earth-600 active:scale-95"
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <Icon name="plus" size={20} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-9 flex justify-center">
            <PageLink to="/menu" navigate={navigate} className="primary-button">
              View full menu <Icon name="arrow" size={17} />
            </PageLink>
          </div>
        </div>
      </section>

      <section className="bg-earth-100 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] overflow-hidden rounded-[2rem] border border-earth-300 shadow-xl lg:grid-cols-2">
          <div className="flex flex-col justify-center bg-earth-900 p-8 text-earth-50 sm:p-12 lg:p-16">
            <p className="eyebrow !text-earth-300">Our corner of the city</p>
            <h2 className="display-title mt-4 text-4xl leading-tight sm:text-5xl">
              Made for neighbors,
              <br />
              <span className="italic text-earth-300">not just customers.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-earth-300">
              BRWD. Florencia is a place to settle in, catch up, and enjoy a cup
              made with care. Familiar, warm, and unmistakably SFDM.
            </p>
            <PageLink
              to="/about"
              navigate={navigate}
              className="mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em]"
            >
              Get to know us <Icon name="arrow" />
            </PageLink>
          </div>
          <div className="map-placeholder relative min-h-[420px] overflow-hidden bg-earth-300">
            <span className="map-road map-road-one" />
            <span className="map-road map-road-two" />
            <span className="map-road map-road-three" />
            <div className="absolute left-[53%] top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="grid size-14 place-items-center rounded-full bg-earth-700 text-earth-50 shadow-xl">
                <Icon name="pin" size={24} />
              </span>
              <span className="mt-3 rounded-full bg-earth-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] shadow-lg">
                BRWD. Florencia
              </span>
            </div>
            <p className="absolute bottom-6 left-6 rounded-full border border-earth-300 bg-earth-50/85 px-4 py-2 text-[9px] uppercase tracking-[.12em] backdrop-blur-sm">
              San Francisco del Monte · Quezon City
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
