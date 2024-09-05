import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { useGetWalletContactsQuery } from '@/graphql/queries/__generated__/contacts.generated';
import { useContactStore } from '@/stores/contacts';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

export const RecentContacts: FC<{ id: string }> = ({ id }) => {
  const t = useTranslations('App');
  const { push } = useRouter();
  const { toast } = useToast();

  const { data, loading } = useGetWalletContactsQuery({
    variables: { id },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting recent contacts.',
        description: messages.join(', '),
      });
    },
  });

  const contacts = data?.wallets.find_one.contacts.find_many;

  const setContact = useContactStore(s => s.setCurrentContact);

  return (
    <div>
      <div className="mb-4 flex w-full justify-between space-x-2 lg:mb-6">
        <p className="text-2xl font-semibold">{t('Dashboard.recent')}</p>

        <Link
          href={ROUTES.contacts.home}
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {t('view-all')}
        </Link>
      </div>

      <div className="flex w-full space-x-4 overflow-x-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-primary" />
              <p className="h-5 w-24 animate-pulse rounded-full bg-slate-600 dark:bg-neutral-400" />
            </div>
          ))
        ) : contacts?.length ? (
          contacts.map(c => (
            <button
              key={c.id}
              onClick={() => {
                const [user, domain] = c.money_address.split('@');

                setContact({
                  id: c.id,
                  user,
                  domain,
                  address: c.money_address,
                });

                push(ROUTES.contacts.home);
              }}
              className="group space-y-2"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-medium uppercase text-black">
                {c.money_address.slice(0, 2)}
              </div>

              <p className="text-center text-sm font-medium text-slate-600 transition-colors group-hover:text-foreground dark:text-neutral-400">
                {c.money_address.split('@')[0]}
              </p>
            </button>
          ))
        ) : (
          <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
            {t('Dashboard.no-contacts')}
          </p>
        )}
      </div>
    </div>
  );
};
