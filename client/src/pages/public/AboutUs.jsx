import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <h1
        className="text-5xl font-bold text-center"
        style={{ color: '#223B5B' }}
      >
        Where Passion Meets Purpose
      </h1>

      <section className="space-y-5 text-lg text-gray-700 leading-relaxed">
        <p>
          Our work at Madison 88 is guided by a simple yet profound belief: what we create matters.
          From the materials we source to the people we collaborate with, every decision is a step toward
          fostering a philosophy rooted in trust, quality, and sustainability. Together, we innovate for
          the present and inspire for the future.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-bold" style={{ color: '#223B5B' }}>
          Our History
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Established in New York City in 2003, Madison 88 has ascended as a leader in the outdoor
          headwear industry. Our journey is marked by a deep-seated passion for design, development,
          and manufacturing excellence. Our portfolio shines as a strategic partner with top-tier outdoor
          and athletic brands that resonate worldwide.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-2xl font-bold" style={{ color: '#223B5B' }}>
            OUR MISSION
          </h3>
          <p className="text-gray-700 leading-relaxed">
            As ONE team, we create the world's best headwear through a service first mindset, unmatched
            quality and sustainable manufacturing excellence.
          </p>
        </div>

        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-2xl font-bold" style={{ color: '#223B5B' }}>
            OUR VISION
          </h3>
          <p className="text-gray-700 leading-relaxed">
            To be the LEADER in accessories; the first choice for apparel brands through our combined
            PASSION, drive on INNOVATION, love for the OUTDOORS and INTEGRITY of our team.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-bold" style={{ color: '#223B5B' }}>
          OUR VALUES
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We are a PEOPLE first company. We make environmentally CONSCIOUS choice. We RESPECT each
          other and our brands. We do this because of our PASSION. We welcome a good CHALLENGE. When
          the brand SUCCEEDS, we succeed. We take PRIDE in our work.
        </p>
      </section>
    </div>
  );
}
