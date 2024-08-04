import { Send } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import github from '/public/icons/github.svg';
import x from '/public/icons/x.svg';
import { Logo } from '@/components/Logo';
import { ROUTES } from '@/utils/routes';

export const Footer = () => {
  const f = useTranslations('Public.Footer');
  const p = useTranslations('Public');

  const year = new Date().getFullYear();

  const links = [
    { title: p('privacy'), link: ROUTES.docs.privacyPolicy },
    { title: p('terms'), link: ROUTES.docs.termsOfService },
    { title: f('docs'), link: ROUTES.docs.home },
    { title: f('faq'), link: ROUTES.docs.faq },
    { title: f('contact'), link: ROUTES.external.support },
  ];

  const socials = [
    { icon: <Image src={github} alt="github" />, link: ROUTES.external.github },
    { icon: <Image src={x} alt="x" />, link: ROUTES.external.x },
    {
      icon: <Send size={24} className="text-white" />,
      link: ROUTES.external.telegram,
    },
  ];

  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 rounded-3xl bg-[#2E2E2E] px-4 py-8 2xl:flex-row 2xl:gap-4 2xl:px-8 2xl:py-6">
      <div className="flex flex-col items-center gap-4 2xl:flex-row">
        <Logo className="fill-white" />

        <p className="text-base font-semibold text-[#909090]">
          {f('copyright')} © {year}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 2xl:flex-row 2xl:gap-10">
        {links.map(l => (
          <a
            key={l.title}
            href={l.link}
            target="_blank"
            className="text-base font-semibold text-white"
          >
            {l.title}
          </a>
        ))}

        <div className="flex gap-4">
          {socials.map(s => (
            <a
              key={s.link}
              href={s.link}
              target="_blank"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
