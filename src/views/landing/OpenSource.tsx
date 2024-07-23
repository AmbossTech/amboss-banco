import { Github } from 'lucide-react';
import Image from 'next/image';

import coins from '/public/icons/coins.svg';
import womenPhones from '/public/images/women-phones.webp';
import { ROUTES } from '@/utils/routes';

export const OpenSource = () => {
  return (
    <section className="mt-28 w-full scroll-mt-16 px-4 lg:px-14" id="community">
      <div className="grid w-full gap-4 lg:grid-cols-2">
        <div className="flex w-full flex-col justify-between">
          <div>
            <h3 className="mb-10 text-5xl font-bold text-black/85">
              Want to build on Banco? <br />
              <br /> Join our open source community
            </h3>

            <a
              href={ROUTES.external.github}
              target="_blank"
              className="flex w-fit items-center justify-center space-x-2 rounded-lg bg-neutral-100 px-4 py-3 text-base font-semibold text-black"
            >
              <Github size={16} /> <span className="block">Visit GitHub</span>
            </a>
          </div>

          <Image src={coins} alt="coins" className="mt-16 w-full lg:mt-0" />
        </div>

        <div className="relative">
          <Image
            src={womenPhones}
            alt="women-phones"
            className="h-[540px] w-full rounded-2xl object-cover object-top brightness-75 lg:h-[640px]"
          />

          <p className="absolute bottom-16 left-4 right-4 text-2xl font-semibold text-white lg:left-16 lg:right-16">
            Banco is built by the community, for the community. Contribute to
            our code, suggest features, and be a part of a banking revolution.
            Visit our GitHub repository to get involved.
          </p>
        </div>
      </div>
    </section>
  );
};
