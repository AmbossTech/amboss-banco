import { Observable } from '@apollo/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const promiseToObservable = (promise: any) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new Observable((subscriber: any) => {
    promise.then(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value: any) => {
        if (subscriber.closed) return;
        subscriber.next(value);
        subscriber.complete();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => subscriber.error(err)
    );
  });
