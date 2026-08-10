export const metadata = {
  title: 'Instructions - Laser Refractometer',
  description: 'Step-by-step instructions for building and using the DIY laser Brix refractometer.',
}

export default function Instructions() {
  return (
    <main className="retro-page">
      <div className="retro-container">
        <section className="hero-window panel-outset">
          <div className="title-bar"><span>Instructions</span><span>Setup guide</span></div>
          <div className="panel-content">
            <div className="hero-headline text-rainbow">Instructions</div>
            <p className="hero-copy">Follow these steps for the physical set up of the Brix Refractometer</p>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Step 1</span><span>Prism</span></div>
          <div className="panel-content">
            <p className="hero-copy">First, you will need a prism that can hold liquid samples</p>
            <a className="retro-btn success" href="https://www.instructables.com/Optical-Water-Prism">Click here for prism instructions</a>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Step 2</span><span>Platform</span></div>
          <div className="panel-content">
            <p className="hero-copy">After making your prism, you will need a rotating platform, where you can place the prism on</p>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Step 3</span><span>Laser</span></div>
          <div className="panel-content">
            <p className="hero-copy">You will need to shine a laser through the prism and observe how its position changes as you rotate the prism</p>
            <p className="hero-copy">As you rotate it, the laser spot will move along the wall until it stops.</p>
            <p className="hero-copy">This happens due to total internal reflection and using a formula, you can determine the refractive index of the liquid sample.</p>
          </div>
        </section>

        <section className="form-window panel-outset">
          <div className="title-bar"><span>Note</span><span>Important</span></div>
          <div className="panel-content">
            <p className="hero-copy">Note that you should not completely seal the prism otherwise, you won't be able to refill or empty it.</p>
            <p className="hero-copy">This process is made easier with the help of this website</p>
          </div>
        </section>

        <section className="cta-window panel-outset">
          <div className="title-bar"><span>Navigation</span><span>Go back</span></div>
          <div className="panel-content">
            <div className="hit-counter-row">
              <a className="retro-btn primary" href="/">Back to Refractometer</a>
              <a className="retro-btn retro-link" href="/health">Health Planner</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
