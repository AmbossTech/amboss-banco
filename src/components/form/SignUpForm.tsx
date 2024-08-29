'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import stringEntropy from 'fast-password-entropy';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  SignUpDocument,
  SignUpMutation,
  SignUpMutationVariables,
} from '@/graphql/mutations/__generated__/signUp.generated';
import { WalletAccountType, WalletType } from '@/graphql/types';
import { toWithError } from '@/utils/async';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Button } from '../ui/button-v2';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/use-toast';
import { WaitlistForm } from './WaitlistForm';

export function SignUpForm() {
  const s = useTranslations('Public.Signup');
  const c = useTranslations('Common');
  const p = useTranslations('Public');

  const searchParams = useSearchParams();
  const referralParam = searchParams.get('referral');

  const { toast } = useToast();

  const client = useApolloClient();

  const workerRef = useRef<Worker>();

  const [view, setView] = useState<'waitlist' | 'sign-up'>(
    referralParam ? 'sign-up' : 'waitlist'
  );
  const [subscriber, setSubscriber] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState(referralParam || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [acceptTermsAndPrivacy, setAcceptTermsAndPrivacy] = useState(false);
  const [acceptPasswordWarning, setAcceptPasswordWarning] = useState(false);

  const entropy = stringEntropy(password);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'create',
        payload: {
          email,
          password,
          password_hint: passwordHint,
          referral_code: referralCode,
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'loaded':
          setLoading(false);
          break;

        case 'create':
          const { wallet, ...userInfo } = message.payload;

          const [, error] = await toWithError(
            client.mutate<SignUpMutation, SignUpMutationVariables>({
              mutation: SignUpDocument,
              variables: {
                input: {
                  ...userInfo,
                  wallet: {
                    secp256k1_key_pair: wallet.secp256k1_key_pair,
                    details: {
                      type: WalletType.ClientGenerated,
                      protected_mnemonic: wallet.protectedMnemonic,
                    },
                    accounts: [
                      {
                        type: WalletAccountType.Liquid,
                        liquid_descriptor: wallet.liquidDescriptor,
                      },
                    ],
                  },
                },
              },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Error creating account.',
              description: messages.join(', '),
            });

            setLoading(false);
            return;
          }

          window.location.href = ROUTES.dashboard;

          break;

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error creating account.',
            description: message.msg,
          });

          setLoading(false);

          break;
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [client, toast]);

  return view === 'waitlist' ? (
    <WaitlistForm setView={setView} setSubscriber={setSubscriber} />
  ) : (
    <form onSubmit={onSubmit} className="relative mx-auto my-10 max-w-96 px-4">
      {step > 0 ? (
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={loading}
          className="absolute left-4 top-1 transition-opacity hover:opacity-75 lg:-left-8 lg:top-1.5"
        >
          <ArrowLeft size={24} />
        </button>
      ) : null}

      {step === 0 ? (
        <>
          <h1 className="mb-4 text-center text-2xl font-semibold lg:text-3xl">
            {s('create')}
          </h1>

          <p className="mb-6 text-center">
            {s('already')}{' '}
            <Link
              href={ROUTES.login.home}
              className="hover:text-primary-hover text-primary transition-colors"
            >
              {p('login')}
            </Link>
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{c('email')}</Label>

              <Input
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="satoshi@nakamoto.com"
              />
            </div>

            {!subscriber ? (
              <div className="space-y-2">
                <Label htmlFor="referralCode">{s('referral')}</Label>

                <Input
                  id="referralCode"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="36b8f84d"
                />

                <p className="text-sm text-neutral-400">{s('invite')}</p>
              </div>
            ) : null}

            <Button
              type="button"
              disabled={!email}
              onClick={() => {
                const emailRegex =
                  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

                if (!emailRegex.test(email)) {
                  toast({
                    variant: 'destructive',
                    title: 'Invalid email.',
                  });

                  return;
                }

                if (email.length < 5) {
                  toast({
                    variant: 'destructive',
                    title: 'Email too short.',
                  });

                  return;
                }

                setStep(1);
              }}
              className="w-full"
            >
              {c('next')}
            </Button>
          </div>
        </>
      ) : step === 1 ? (
        <>
          <h1 className="mb-6 text-center text-2xl font-semibold lg:text-3xl">
            {s('set')}
          </h1>

          <p className="mb-6 rounded-xl border border-orange-400 px-4 py-2 text-sm">
            {s('save')}
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{c('password')}</Label>

              <div className="flex items-center gap-2">
                <Input
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? undefined : 'password'}
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="transition-opacity hover:opacity-75"
                >
                  {showPassword ? (
                    <EyeOff className="size-6" />
                  ) : (
                    <Eye className="size-6" />
                  )}
                </button>
              </div>

              <Progress value={Math.min(100, (entropy || 0) / 2)} />

              <p className="text-sm text-neutral-400">{s('important')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{c('confirm-password')}</Label>

              <Input
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                type="password"
              />
            </div>

            <Button
              type="button"
              disabled={!password || !confirmPassword}
              onClick={() => {
                if (password.length < 8) {
                  toast({
                    variant: 'destructive',
                    title: 'Password is too weak.',
                  });

                  return;
                }

                if (password !== confirmPassword) {
                  toast({
                    variant: 'destructive',
                    title: "Passwords don't match.",
                  });

                  return;
                }

                setStep(2);
              }}
              className="w-full"
            >
              {c('next')}
            </Button>
          </div>
        </>
      ) : step === 2 ? (
        <>
          <h1 className="mb-6 text-center text-2xl font-semibold lg:text-3xl">
            {s('hint')}
          </h1>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="passwordHint">
                {s('hint')} ({c('optional')})
              </Label>

              <Input
                id="passwordHint"
                value={passwordHint}
                onChange={e => setPasswordHint(e.target.value)}
                autoComplete="off"
                disabled={loading}
              />

              <p className="text-sm text-neutral-400">{s('plain')}</p>
            </div>

            <div className="flex space-x-3 space-y-0">
              <Checkbox
                id="acceptTermsAndPrivacy"
                disabled={loading}
                checked={acceptTermsAndPrivacy}
                onCheckedChange={() => setAcceptTermsAndPrivacy(v => !v)}
              />

              <Label
                htmlFor="acceptTermsAndPrivacy"
                className="text-sm font-medium"
              >
                {s.rich('accept-terms', {
                  terms: chunks => (
                    <Link
                      href={ROUTES.docs.termsOfService}
                      target="_blank"
                      className="hover:text-primary-hover text-primary transition-colors"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: chunks => (
                    <Link
                      href={ROUTES.docs.privacyPolicy}
                      target="_blank"
                      className="hover:text-primary-hover text-primary transition-colors"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </Label>
            </div>

            <div className="flex space-x-3 space-y-0">
              <Checkbox
                id="acceptPasswordWarning"
                disabled={loading}
                checked={acceptPasswordWarning}
                onCheckedChange={() => setAcceptPasswordWarning(v => !v)}
              />

              <Label
                htmlFor="acceptPasswordWarning"
                className="text-sm font-medium"
              >
                {s('accept-password')}
              </Label>
            </div>

            <Button
              type="submit"
              disabled={
                !acceptTermsAndPrivacy || !acceptPasswordWarning || loading
              }
              className="flex w-full items-center justify-center"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
              ) : null}
              {s('submit')}
            </Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
