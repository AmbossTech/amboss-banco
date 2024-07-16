import { Believe } from '@/views/landing/Believe';
import { Footer } from '@/views/landing/Footer';
import { Hero } from '@/views/landing/Hero';
import { OpenSource } from '@/views/landing/OpenSource';
import { Ready } from '@/views/landing/Ready';
import { Security } from '@/views/landing/Security';
import { Welcome } from '@/views/landing/Welcome';
import { Why } from '@/views/landing/Why';

export default function Page() {
  return (
    <main className="bg-white">
      <Hero />
      <div className="mx-auto max-w-screen-2xl">
        <Welcome />
        <Believe />
        <Why />
        <OpenSource />
        <Security />
        <Ready />
        <Footer />
      </div>
    </main>
  );
}
