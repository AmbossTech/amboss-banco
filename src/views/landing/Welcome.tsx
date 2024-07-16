import Image from 'next/image';

import welcome from '/public/images/welcome.webp';

export const Welcome = () => {
  return (
    <section className="mt-16 w-full scroll-mt-16 px-4 lg:px-14" id="about">
      <div className="relative">
        <Image
          src={welcome}
          alt="welcome"
          className="h-[640px] w-full rounded-2xl object-cover brightness-75"
        />

        <div className="absolute left-6 right-6 top-6 lg:left-20 lg:top-20">
          <h2 className="mb-4 text-3xl font-bold !leading-snug text-white lg:text-5xl">
            Welcome to Banco
          </h2>

          <h2 className="max-w-[600px] text-3xl font-semibold !leading-snug text-white/85 lg:text-5xl">
            Your gateway to secure and simple banking.
          </h2>
        </div>
      </div>
    </section>
  );
};
