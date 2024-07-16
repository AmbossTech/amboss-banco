import Image from 'next/image';

import womanLaptop from '/public/images/woman-laptop.webp';

export const Security = () => {
  return (
    <section className="mt-28 w-full scroll-mt-16 px-4 lg:px-14" id="security">
      <div className="grid w-full gap-4 lg:grid-cols-2">
        <div className="relative order-last lg:order-first">
          <Image
            src={womanLaptop}
            alt="woman-laptop"
            className="h-[540px] w-full rounded-2xl object-cover brightness-75 lg:h-[640px]"
          />

          <p className="absolute bottom-10 left-4 right-4 text-[32px] font-semibold text-white lg:left-10 lg:right-10">
            Our platform uses encryption so that only you have access and
            control over your money.
          </p>
        </div>

        <div className="order-first flex flex-col justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-10 lg:order-last lg:px-10">
          <div>
            <h2 className="text-6xl font-semibold text-black/45 lg:text-8xl">
              Security made <span className="block text-primary">simple.</span>
            </h2>
          </div>

          <h4 className="mt-20 text-2xl font-bold text-black/45 lg:mt-4 lg:text-5xl lg:!leading-[56px]">
            <span className="text-black">Safeguard</span> your financial future.
          </h4>
        </div>
      </div>
    </section>
  );
};
