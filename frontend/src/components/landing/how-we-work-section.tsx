const steps = [
  {
    number: "01",
    title: "Frame the real question",
    description:
      "Align leaders around the decision, value at stake and constraints that matter.",
  },
  {
    number: "02",
    title: "Find the critical insight",
    description:
      "Combine data, customer truth and experience to challenge the obvious answer.",
  },
  {
    number: "03",
    title: "Design the path",
    description:
      "Translate ambition into clear choices, initiatives, ownership and economics.",
  },
  {
    number: "04",
    title: "Deliver and embed",
    description:
      "Work side by side with your team until change becomes new muscle.",
  },
] as const;

export function HowWeWorkSection() {
  return (
    <section className="" aria-labelledby="how-we-work-heading">
      <div className="bg-[#f3e7d5] h-screen  px-6 py-20 sm:px-10 sm:py-16 lg:px-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end container-page">
          <div>
            <p className="text-[10px] mt-10 font-bold tracking-[0.2em] text-[#b0785d] uppercase">
              How we work
            </p>
            <h2
              id="how-we-work-heading"
              className="mt-4 max-w-3xl text-4xl  leading-[1.02] tracking-tight text-[#15262d] sm:text-5xl lg:text-[4rem]"
            >
              A rigorous path from ambiguity to action.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#6d7778] sm:text-lg sm:leading-8 lg:mb-1 lg:justify-self-end">
            Structured enough to create momentum. Flexible enough to fit the
            reality of your business.
          </p>
        </div>

        <div className="relative container-page mt-12 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`group relative z-10 text-center ${
                index < steps.length - 1
                  ? "lg:after:absolute lg:after:top-5 lg:after:left-1/2 lg:after:block lg:after:h-px lg:after:w-[calc(100%+2rem)] lg:after:bg-[#e1d8c9] lg:after:content-['']"
                  : ""
              }`}
            >
              <div className="relative z-10 mx-auto flex size-12 items-center justify-center rounded-full border border-[#ded7cb] bg-[#fbfaf6] text-sm font-semibold text-[#b0785d] shadow-[0_2px_8px_rgba(41,48,45,0.05)] transition-all duration-300 group-hover:scale-110 group-hover:border-[#c9784b] group-hover:bg-[#c9784b] group-hover:text-white group-hover:shadow-[0_10px_24px_rgba(201,120,75,0.28)]">
                {step.number}
              </div>
              <h3 className="mt-6 text-xl font-semibold leading-7 text-[#27383d] transition-colors duration-300 group-hover:text-[#b7653e] sm:text-2xl">
                {step.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[18rem] text-base leading-7 text-[#87908d] sm:text-lg sm:leading-8">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
