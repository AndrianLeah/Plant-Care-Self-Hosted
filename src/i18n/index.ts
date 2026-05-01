import { createI18n } from 'vue-i18n'
import en from './en'
import it from './it'

const savedLocale = localStorage.getItem('locale') ?? 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, it },
})

export default i18n
export function getI18n() {
  return i18n
}
