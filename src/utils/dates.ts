import { format } from 'date-fns';

export const formatDate = (date: string) => {
  const parsed = new Date(date);
  return format(parsed, 'MMM d, HH:mm');
};
