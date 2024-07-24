import Image, { StaticImageData } from 'next/image';
import { FC } from 'react';

import groupPhone from '/public/images/group-phone.webp';
import manPhone from '/public/images/man-phone.webp';
import womanCard from '/public/images/woman-card.webp';
import womanPhone from '/public/images/woman-phone.webp';

const Card: FC<{ title: string; subtitle: string; image: StaticImageData }> = ({
  title,
  subtitle,
  image,
}) => {
  return (
    <div className="relative">
      <Image
        src={image}
        alt="stock-photo"
        className="h-[520px] w-full rounded-2xl object-cover brightness-75"
      />

      <div className="absolute bottom-10 left-6 right-6">
        <h4 className="mb-2 text-4xl font-semibold text-white">{title}</h4>

        <p className="text-2xl font-medium text-white/85">{subtitle}</p>
      </div>
    </div>
  );
};

export const Believe = () => {
  return (
    <section className="mt-28 w-full px-4 lg:px-14">
      <div className="mb-6 flex w-full flex-col gap-4 lg:flex-row lg:items-center">
        <h2 className="text-7xl font-semibold text-primary lg:w-1/2 lg:text-8xl 2xl:text-9xl">
          MiBanco
        </h2>

        <h3 className="max-w-2xl text-4xl font-semibold text-black/65 lg:w-1/2 lg:text-5xl">
          Access global finance in four simple steps.
        </h3>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <Card
          title="1. Sign up"
          subtitle="Create your account with just an email and a password."
          image={manPhone}
        />
        <Card
          title="2. Connect with friends and family"
          subtitle="Generate a MIBAN Code to chat and receive payments."
          image={groupPhone}
        />
        <Card
          title="3. Get paid"
          subtitle="Receive dollars or bitcoin in seconds."
          image={womanPhone}
        />
        <Card
          title="4. Start banco-ing"
          subtitle="Send money securely with complete freedom."
          image={womanCard}
        />
      </div>
    </section>
  );
};
