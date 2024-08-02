'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import circles from '/public/icons/circles.svg';
import smallCircles from '/public/icons/small-circles.svg';
import one from '/public/images/landing/1.webp';
import two from '/public/images/landing/2.webp';
import three from '/public/images/landing/3.webp';
import four from '/public/images/landing/4.webp';
import five from '/public/images/landing/5.webp';
import six from '/public/images/landing/6.webp';
import seven from '/public/images/landing/7.webp';
import eight from '/public/images/landing/8.webp';
import nine from '/public/images/landing/9.webp';
import ten from '/public/images/landing/10.webp';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button-v2';
import { ROUTES } from '@/utils/routes';
import { CardSection } from '@/views/landing/CardSection';
import { Footer } from '@/views/landing/Footer';

export default function Page() {
  const p = useTranslations('Public');
  const l = useTranslations('Public.Landing');

  return (
    <main className="bg-black p-4 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-screen-2xl">
        <section className="relative grid min-h-dvh items-center gap-8 rounded-3xl bg-white p-4 lg:grid-cols-2 lg:px-6 lg:py-4">
          <header className="z-10 flex w-full items-start justify-between lg:absolute lg:left-8 lg:top-10 lg:pr-[88px]">
            <Logo className="w-28 fill-black lg:w-auto" />

            <div className="flex space-x-4">
              <Button variant="primary" asChild className="lg:hidden">
                <Link href={ROUTES.login}>{p('login')}</Link>
              </Button>
              <Button variant="secondary" asChild className="hidden lg:block">
                <Link href={ROUTES.login}>{p('login')}</Link>
              </Button>

              <Button asChild className="hidden lg:inline">
                <Link href={ROUTES.signup}>{l('get-started')}</Link>
              </Button>
            </div>
          </header>

          <div className="max-w-lg lg:mx-auto">
            <h1 className="mb-4 text-[40px] font-semibold leading-tight text-black lg:mb-6 lg:text-[64px]">
              {l('your-money')} <br /> {l('your-way')}
            </h1>

            <p className="mb-4 text-lg font-semibold !leading-normal text-black lg:mb-10 lg:text-2xl">
              {l('hero-sub-one')}
              <br className="hidden lg:block" /> {l('hero-sub-two')}
            </p>

            <Button asChild size="lg">
              <Link href={ROUTES.signup}>{l('get-started')}</Link>
            </Button>
          </div>

          <div className="h-[414px] overflow-hidden rounded-3xl lg:h-[818px]">
            <Image
              src={one}
              alt="woman-coffee"
              className="h-full object-cover object-[20%_0%]"
            />
          </div>
        </section>

        <section>
          <h2 className="w-full py-10 text-center text-[32px] font-semibold text-white lg:py-[72px] lg:text-5xl">
            {l('access')}
          </h2>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <CardSection
              bg="bg-accent-blue"
              accent="bg-white"
              icon="1"
              title={p('signup')}
              subtitle={l('create-account')}
              image={
                <Image
                  src={two}
                  alt="man-phone"
                  className="mx-auto lg:mx-0 lg:ml-auto"
                />
              }
            />

            <CardSection
              bg="bg-white"
              accent="bg-accent-gray"
              icon="2"
              title={l('connect-friends')}
              subtitle={l('generate-miban')}
              image={
                <Image
                  src={three}
                  alt="woman-looking"
                  className="mx-auto lg:mx-0 lg:ml-auto"
                />
              }
            />
          </div>

          <CardSection
            bg="bg-accent-green"
            accent="bg-white"
            icon="3"
            title={l('get-paid')}
            subtitle={l('receive-dollars')}
            image={
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                variants={{
                  hidden: { opacity: 0, y: 60 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="absolute bottom-0 right-0 sm:right-[10%] lg:right-0 xl:right-[10%]"
              >
                <Image src={four} alt="iphone" />
              </motion.div>
            }
            className="min-h-[700px] items-start overflow-hidden lg:min-h-[500px]"
          />
        </section>

        <section>
          <div className="flex w-full flex-col items-center justify-center gap-8 py-10 lg:flex-row lg:gap-[88px] lg:py-[72px]">
            <Image
              src={five}
              alt="girl-phone"
              className="rounded-full sm:max-h-[320px] sm:max-w-[320px]"
            />

            <div>
              <h2 className="mb-2 text-center text-[32px] font-semibold text-white lg:text-left lg:text-5xl">
                {l('banco-works')}
              </h2>

              <p className="mb-6 text-center text-lg font-semibold text-white lg:text-left">
                {l('designed')}
              </p>

              <Button asChild className="mx-auto lg:mx-0">
                <Link href={ROUTES.signup}>{l('get-started')}</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <CardSection
              bg="bg-accent-blue"
              accent="bg-white"
              icon={<ShieldCheck className="w-[22px] lg:w-[32px]" />}
              title={l('friendly-secure')}
              subtitle={l('user-friendly')}
              image={
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src={six}
                    alt="phone-pay"
                    className="scale-150 transition-transform duration-500 hover:scale-[200%]"
                  />
                </div>
              }
            />

            <CardSection
              bg="bg-white"
              accent="bg-accent-blue"
              icon={<KeyRound className="w-[22px] lg:w-[32px]" />}
              title={l('self-custody')}
              subtitle={l('no-parties')}
              image={
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src={seven}
                    alt="phone-wallet"
                    className="scale-125 transition-transform duration-500 hover:scale-150"
                  />
                </div>
              }
              reverse
            />

            <CardSection
              bg="bg-accent-green"
              accent="bg-white"
              icon={<ArrowLeftRight className="w-[22px] lg:w-[32px]" />}
              title={l('instant-payments')}
              subtitle={l('ease-payments')}
              image={
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src={eight}
                    alt="phones-paid"
                    className="scale-125 transition-transform duration-500 hover:scale-150"
                  />
                </div>
              }
            />

            <CardSection
              bg="bg-accent-black"
              accent="bg-accent-blue"
              icon={<LockKeyhole className="w-[22px] lg:w-[32px]" />}
              title={l('private-messaging')}
              subtitle={l('send-messages')}
              image={
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src={nine}
                    alt="phone-messages"
                    className="scale-125 transition-transform duration-500 hover:scale-150"
                  />
                </div>
              }
              reverse
            />
          </div>
        </section>

        <section className="relative my-8 flex items-center justify-center rounded-3xl bg-white p-4 lg:my-6 lg:min-h-dvh lg:px-24 lg:py-[120px]">
          <div className="z-10">
            <Image src={ten} alt="chat-bubbles" className="mx-auto" />

            <h2 className="mx-auto mt-7 max-w-xl text-center text-[26px] font-semibold !leading-tight text-black lg:mt-10 lg:text-5xl">
              {l('experience')}
            </h2>

            <p className="my-6 text-center text-lg font-semibold text-black">
              {l('join')}
            </p>

            <Button asChild size="lg" className="mx-auto">
              <Link href={ROUTES.signup}>{l('get-started')}</Link>
            </Button>
          </div>

          <Image
            src={circles}
            alt="circles"
            className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 lg:block"
          />
          <Image
            src={smallCircles}
            alt="circles"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:hidden"
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}
