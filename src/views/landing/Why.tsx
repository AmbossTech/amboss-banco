import Image, { StaticImageData } from 'next/image';
import { FC } from 'react';

import why1 from '/public/icons/why-1.svg';
import why2 from '/public/icons/why-2.svg';
import why3 from '/public/icons/why-3.svg';
import why4 from '/public/icons/why-4.svg';

const Card: FC<{ title: string; subtitle: string; image: StaticImageData }> = ({
  title,
  subtitle,
  image,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-neutral-100 px-4 pt-8 lg:px-12 lg:pt-20">
      <div>
        <h4 className="mb-2 text-4xl font-semibold text-landing">{title}</h4>

        <p className="text-lg font-medium text-landing/65">{subtitle}</p>
      </div>

      <Image src={image} alt="graphic" className="mx-auto mt-8" />
    </div>
  );
};

export const Why = () => {
  return (
    <section className="mt-28 w-full scroll-mt-16 px-4 lg:px-14" id="features">
      <h2 className="mb-10 text-5xl font-semibold text-landing/45 lg:text-[88px]">
        Why choose{' '}
        <span className="mt-4 block text-7xl font-medium text-landing lg:mt-0 lg:inline lg:text-9xl">
          Banco?
        </span>
      </h2>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <Card
          title="Easy and simple"
          subtitle="Banco is designed to be user-friendly. No complicated hoops to jump through. Banking made easy for everyone."
          image={why1}
        />
        <Card
          title="Full control of funds"
          subtitle="You are in complete control of your money. No one else can access or move your funds without your permission."
          image={why2}
        />
        <Card
          title="Lightning address"
          subtitle="Receive payments with ease. Your Banco account comes with a 'Lightning Address' for simple and quick transactions."
          image={why3}
        />
        <Card
          title="Encrypted messaging"
          subtitle="Send encrypted messages to your contacts securely through Banco. Your privacy is our priority."
          image={why4}
        />
      </div>
    </section>
  );
};
