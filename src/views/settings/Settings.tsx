import { useTranslations } from 'next-intl';

import { ChangePassword } from './ChangePassword';

export const Settings = () => {
  const t = useTranslations('Index');

  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">{t('settings')}</h1>

      <div className="flex max-w-screen-lg flex-col gap-10 pt-4 md:gap-16">
        <ChangePassword />
      </div>
    </div>
  );
};
