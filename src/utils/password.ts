export const MIN_PASSWORD_LENGTH = 12;

export const evaluatePasswordStrength = (password: string) => {
  if (!password) return;

  let score = 0;

  // Contains lowercase
  if (/[a-z]/.test(password)) score += 1;
  // Contains uppercase
  if (/[A-Z]/.test(password)) score += 1;

  // Contains numbers
  if (/\d/.test(password)) score += 1;
  // Contains special characters
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Check password length
  if (password.length < MIN_PASSWORD_LENGTH) score = 0;

  if (password.split(' ').length > 6) score = 4;

  switch (score) {
    case 0:
      return { title: 'Weak', progress: 0 };
    case 1:
    case 2:
      return { title: 'Weak', progress: 25 };
    case 3:
      return { title: 'Medium', progress: 60 };
    case 4:
      return { title: 'Strong', progress: 100 };
  }
};
