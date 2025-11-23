import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { resolve } from 'path';

// Dil seçimini çevre değişkeninden al (varsayılan: tr)
const language = process.env.LANGUAGE || 'tr';

i18next
  .use(Backend)
  .init({
    lng: language,
    fallbackLng: 'en',
    preload: ['tr', 'en'],
    backend: {
      loadPath: resolve(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    ns: ['translation'],
    defaultNS: 'translation',
    debug: false,
    interpolation: {
      escapeValue: false, // Not needed for server-side
    },
  });

export default i18next;
export const t = i18next.t.bind(i18next);
