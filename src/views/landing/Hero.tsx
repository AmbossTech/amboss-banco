'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import bitcoin from '/public/icons/bitcoin.svg';
import tether from '/public/icons/tether.svg';
import usdc from '/public/icons/usdc.svg';
import { ROUTES } from '@/utils/routes';

import { Header } from './Header';

export const Hero = () => {
  const [email, setEmail] = useState('');

  return (
    <div className="relative min-h-dvh w-full rounded-b-[40px] bg-gradient-to-b from-[#FAF5FF] to-[#F3E9FE]">
      <Header />

      <section className="flex h-[calc(100dvh-80px)] w-full items-center justify-center px-4 lg:h-[calc(100dvh-90px)]">
        <Image
          src={bitcoin}
          alt="bitcoin"
          className="absolute right-0 top-[5%] w-24 lg:top-[15%] lg:w-auto"
        />

        <div>
          <h1 className="mb-8 text-center text-6xl font-semibold text-landing lg:text-8xl">
            Banking for Everyone
          </h1>

          <p className="mb-12 text-center text-lg font-semibold text-landing/85 lg:text-xl">
            Join the revolution in digital banking. Simple, secure, and open
            source.
          </p>

          <Image
            src={tether}
            alt="tether"
            className="absolute left-0 top-[60%] w-32 lg:top-[40%] lg:w-auto"
          />

          <div className="relative mx-auto w-full lg:w-[640px]">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mb-2 h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base text-landing placeholder:text-landing/45 lg:mb-0 lg:h-14 lg:pr-48"
            />

            <Link
              href={`${ROUTES.signup}${email ? '?email=' + encodeURIComponent(email) : ''}`}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-950/90 lg:absolute lg:right-2 lg:top-1/2 lg:w-auto lg:-translate-y-1/2"
            >
              Get Started Today
            </Link>
          </div>
        </div>

        <Image
          src={usdc}
          alt="usdc"
          className="absolute bottom-0 right-0 w-36 lg:right-[12.5%] lg:w-auto"
        />
      </section>
    </div>
  );
};
