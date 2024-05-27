export const toWithError = async <T>(promise: Promise<T>) => {
  return promise
    .then(data => [data, undefined] as [T, undefined])
    .catch(err => [undefined, err] as [undefined, Error]);
};
