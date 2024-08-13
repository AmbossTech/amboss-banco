import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

import { ChangePassword } from './ChangePassword';
import { PasskeySettings } from './Passkey';
import { Section } from './Section';

export const Settings = () => {
  const t = useTranslations('Index');

  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">{t('settings')}</h1>

      <div className="flex max-w-screen-lg flex-col gap-10 pt-4 md:gap-16">
        <ChangePassword />
        <Section
          title="Setup 2FA"
          description="Setup 2FA with OTP or passkeys for login."
        >
          <Button className="w-full md:w-fit" asChild>
            <Link href={ROUTES.settings.twofa}>Setup 2FA</Link>
          </Button>
        </Section>
        <PasskeySettings />
      </div>
    </div>
  );
};
