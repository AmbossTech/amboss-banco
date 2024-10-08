import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import error from '/public/icons/error.svg';
import { Button } from '@/components/ui/button-v2';
import { ROUTES } from '@/utils/routes';

export default function NotFound() {
  const t = useTranslations('Public.404');

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <Image src={error} alt="error" className="mx-auto" />

      <h2 className="text-center text-3xl font-semibold">{t('not-found')}</h2>

      <p className="my-4 text-center">{t('desc')}</p>

      <Button variant="secondary" className="mx-auto" asChild>
        <Link href={ROUTES.home}>{t('home')}</Link>
      </Button>
    </div>
  );
}
