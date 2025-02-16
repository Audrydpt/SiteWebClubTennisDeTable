import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import React from 'react';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    load: 'languageOnly',
    supportedLngs: ['en', 'fr'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'dashboard'],
    defaultNS: 'common',
    resources: {
      en: {
        common: en,
      },
      fr: {
        common: fr,
      },
    },
  });

export function lazyLoadFeature<T>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  languages: string[] = ['en', 'fr']
) {
  // On extrait le nom de la feature en cherchant le pattern "/features/{{featureName}}/"
  const fnStr = importFunc.toString();
  const match = fnStr.match(/\/features\/(\w+)\//);
  if (!match || !match[1]) {
    throw new Error(
      "Impossible de déduire le nom de la feature depuis le chemin d'import"
    );
  }
  const featureName = match[1];

  return React.lazy(async () => {
    await Promise.all(
      languages.map(async (lang) => {
        if (!i18n.hasResourceBundle(lang, featureName)) {
          try {
            const module = await import(
              `@/features/${featureName}/locales/${lang}.json`
            );
            i18n.addResourceBundle(
              lang,
              featureName,
              module.default,
              true,
              true
            );
          } catch {
            // eslint-disable-next-line no-console
            console.error(
              `Impossible de charger les ressources de la feature ${featureName} pour la langue ${lang}`
            );
          }
        }
      })
    );
    return importFunc();
  });
}

export default i18n;
