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
        <h2 className="text-7xl font-semibold text-primary lg:w-1/2 lg:text-9xl 2xl:text-[200px]">
          Banco
        </h2>

        <h3 className="max-w-2xl text-4xl font-semibold text-landing/65 lg:w-1/2 lg:text-5xl">
          We believe that everyone should have access to the financial sector.{' '}
        </h3>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <Card
          title="Sign up"
          subtitle="Create your account with just an email and a password."
          image={manPhone}
        />
        <Card
          title="Set up lightning address"
          subtitle="Get your unique Lightning Address for seamless transactions."
          image={womanCard}
        />
        <Card
          title="Secure your account"
          subtitle="Enable encryption for messages and secure your funds."
          image={womanPhone}
        />
        <Card
          title="Start banking"
          subtitle="Enjoy banking without boundaries. Manage your funds with full control."
          image={groupPhone}
        />
      </div>
    </section>
  );
};
