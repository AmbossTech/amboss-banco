export const shorten = (
  text: string | null | undefined,
  length = 6
): string => {
  if (!text) return '';

  const textLength = text.length;

  if (textLength < length * 2) {
    return text;
  }

  let amount = length;

  if (textLength <= 12) {
    amount = Math.min(2, length);
  } else if (textLength <= 24) {
    amount = Math.min(4, length);
  }

  const beginning = text.slice(0, amount);
  const end = text.slice(text.length - amount);

  return `${beginning}...${end}`;
};
