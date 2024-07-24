import Image from 'next/image';
import Link from 'next/link';

import dollar from '/public/icons/dollar.svg';
import euro from '/public/icons/euro.svg';
import pound from '/public/icons/pound.svg';
import { ROUTES } from '@/utils/routes';

export const Ready = () => {
  return (
    <section className="mt-28 w-full px-4 pb-28 lg:px-14">
      <div className="relative flex min-h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 p-4">
        <Image
          src={pound}
          alt="pound"
          className="absolute left-1/2 top-0 w-20 -translate-x-1/2 lg:left-[10%] lg:w-auto lg:-translate-x-0"
        />

        <div>
          <h2 className="text-center text-4xl font-bold text-black lg:text-5xl">
            Ready to Experience the Future of Banking?
          </h2>

          <h3 className="mb-8 mt-4 text-center text-xl font-semibold text-black/85 lg:text-2xl">
            Join MiBanco today and take control of your financial future.
          </h3>

          <Link
            href={ROUTES.signup}
            className="mx-auto flex h-10 w-[200px] items-center justify-center rounded-lg bg-neutral-950 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-950/90"
          >
            Sign Up Now
          </Link>
        </div>

        <Image
          src={dollar}
          alt="dollar"
          className="absolute bottom-0 left-0 w-32 lg:w-auto"
        />

        <Image
          src={euro}
          alt="euro"
          className="absolute bottom-[25%] right-0 w-16 lg:bottom-auto lg:top-[25%] lg:w-auto"
        />
      </div>
    </section>
  );
};
