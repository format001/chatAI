import { createI18n } from 'vue-i18n';
import enUS from './en-US';
import koKR from './ko-KR';
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import { useAppStoreWithOut } from '@/store/modules/app';
const appStore = useAppStoreWithOut();
const defaultLocale = appStore.language || 'zh-CN';
const i18n = createI18n({
    locale: defaultLocale,
    fallbackLocale: 'en-US',
    allowComposition: true,
    messages: {
        'en-US': enUS,
        'ko-KR': koKR,
        'zh-CN': zhCN,
        'zh-TW': zhTW,
    },
});
export const t = i18n.global.t;
export function setLocale(locale) {
    i18n.global.locale = locale;
}
export function setupI18n(app) {
    app.use(i18n);
}
export default i18n;
