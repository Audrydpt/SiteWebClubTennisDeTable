import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import React from 'react';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import zodEN from 'zod-i18n-map/locales/en/zod.json';
import zodFR from 'zod-i18n-map/locales/fr/zod.json';

import commonEN from '@/locales/en.json';
import commonFR from '@/locales/fr.json';

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
        common: commonEN,
        zod: zodEN,
      },
      fr: {
        common: commonFR,
        zod: zodFR,
      },
    },
  });

z.setErrorMap(zodI18nMap);

export function lazyLoadFeature<T>(
  featureName: string,
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  languages: string[] = ['en', 'fr']
) {
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
