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
import three from '/public/images/landing/3.svg';
import four from '/public/images/landing/4.svg';
import five from '/public/images/landing/5.webp';
import six from '/public/images/landing/6.webp';
import seven from '/public/images/landing/7.webp';
import eight from '/public/images/landing/8.webp';
import nine from '/public/images/landing/9.webp';
import ten from '/public/images/landing/10.svg';
import people from '/public/images/landing/people.svg';
import person1 from '/public/images/landing/person-1.svg';
import person2 from '/public/images/landing/person-2.svg';
import status1 from '/public/images/landing/status-1.svg';
import status2 from '/public/images/landing/status-2.svg';
import status3 from '/public/images/landing/status-3.svg';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/toggle/LanguageToggle';
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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
        >
          <section className="relative grid items-center gap-8 rounded-3xl bg-white p-4 lg:grid-cols-2 lg:px-6 lg:py-4">
            <header className="z-10 flex w-full flex-wrap items-start justify-between gap-4 lg:absolute lg:left-8 lg:top-10 lg:pr-[88px]">
              <Logo className="w-32 fill-black lg:w-auto" />

              <div className="flex space-x-4">
                <LanguageToggle />

                <Button variant="primary" asChild className="lg:hidden">
                  <Link href={ROUTES.login.home}>{p('login')}</Link>
                </Button>
                <Button variant="secondary" asChild className="hidden lg:block">
                  <Link href={ROUTES.login.home}>{p('login')}</Link>
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
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          variants={{
            hidden: { opacity: 0, y: 60 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <section>
            <h2 className="w-full py-10 text-center text-[32px] font-semibold text-white lg:py-[72px] lg:text-5xl">
              {l('access')}
            </h2>

            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <CardSection
                bg="bg-primary"
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
                <Image
                  src={four}
                  alt="iphone"
                  className="absolute bottom-0 right-1/2 translate-x-1/2 lg:right-0 lg:-translate-x-0 xl:right-[10%]"
                />
              }
              className="min-h-[700px] items-start overflow-hidden lg:min-h-[500px]"
            />
          </section>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          variants={{
            hidden: { opacity: 0, y: 60 },
            visible: { opacity: 1, y: 0 },
          }}
        >
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
                bg="bg-primary"
                accent="bg-white"
                icon={
                  <ShieldCheck className="h-[28px] w-[28px] lg:h-[32px] lg:w-[32px]" />
                }
                title={l('friendly-secure')}
                subtitle={l('user-friendly')}
                image={
                  <div className="overflow-hidden rounded-3xl">
                    <Image
                      src={six}
                      alt="phone-pay"
                      className="scale-125 transition-transform duration-500 hover:scale-150"
                    />
                  </div>
                }
              />

              <CardSection
                bg="bg-white"
                accent="bg-primary"
                icon={
                  <KeyRound className="h-[28px] w-[28px] lg:h-[32px] lg:w-[32px]" />
                }
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
                icon={
                  <ArrowLeftRight className="h-[28px] w-[28px] lg:h-[32px] lg:w-[32px]" />
                }
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
                accent="bg-primary"
                icon={
                  <LockKeyhole className="h-[28px] w-[28px] lg:h-[32px] lg:w-[32px]" />
                }
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
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          variants={{
            hidden: { opacity: 0, y: 60 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <section className="relative my-8 flex items-center justify-center rounded-3xl bg-white p-4 lg:my-6 lg:px-24 lg:py-[120px]">
            <div className="z-10">
              <Image
                src={ten}
                alt="chat-bubbles"
                className="mx-auto lg:hidden"
              />

              <div className="hidden justify-center lg:flex">
                <div className="group relative self-end">
                  <Image
                    src={status1}
                    alt="status"
                    className="absolute -left-7 -top-10 z-20 transition-transform duration-500 group-hover:-translate-y-2"
                  />
                  <Image
                    src={person1}
                    alt="person"
                    className="mr-[51px] xl:mr-[71px]"
                  />
                </div>

                <div className="group relative self-start">
                  <Image
                    src={status2}
                    alt="status"
                    className="absolute -left-5 -top-10 z-20 transition-transform duration-500 group-hover:-translate-y-2"
                  />
                  <Image
                    src={person2}
                    alt="person"
                    className="mr-[47px] xl:mr-[67px]"
                  />
                </div>

                <div className="group relative">
                  <Image
                    src={status3}
                    alt="status"
                    className="absolute -left-10 top-4 z-20 transition-transform duration-500 group-hover:-translate-y-2"
                  />
                  <Image src={people} alt="people" />
                </div>
              </div>

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
        </motion.div>

        <Footer />
      </div>
    </main>
  );
}
