import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";

const translations = {
  en: { ...en },
};

export const i18n = new I18n(translations);

i18n.locale = getLocales()[0].languageCode || "";
i18n.defaultLocale = "en";
i18n.enableFallback = true;

export const changeLanguage = (lang: string) => {
  i18n.locale = lang;
};
