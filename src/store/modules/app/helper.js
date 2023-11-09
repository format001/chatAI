import { ss } from '@/utils/storage';
const LOCAL_NAME = 'appSetting';
export function defaultSetting() {
    return { siderCollapsed: false, theme: 'light', language: 'zh-CN' };
}
export function getLocalSetting() {
    const localSetting = ss.get(LOCAL_NAME);
    return { ...defaultSetting(), ...localSetting };
}
export function setLocalSetting(setting) {
    ss.set(LOCAL_NAME, setting);
}
