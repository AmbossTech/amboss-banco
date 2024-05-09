import { Observable } from '@apollo/client';

export const promiseToObservable = (promise: any) =>
  new Observable((subscriber: any) => {
    promise.then(
      (value: any) => {
        if (subscriber.closed) return;
        subscriber.next(value);
        subscriber.complete();
      },
      (err: any) => subscriber.error(err)
    );
  });
