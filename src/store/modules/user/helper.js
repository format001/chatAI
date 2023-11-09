import { ss } from '@/utils/storage';
const LOCAL_NAME = 'userStorage';
export function defaultSetting() {
    return {
        userInfo: {
            accout_type: '',
            customer_id: '',
            nickname: '',
            phone: '',
            terminate_time: '',
            avatar: 'https://raw.githubusercontent.com/Chanzhaoyu/chatgpt-web/main/src/assets/avatar.jpg',
            kid: '',
            description: '',
            cus_url: null,
        },
    };
}
export function getLocalState() {
    const localSetting = ss.get(LOCAL_NAME);
    return { ...defaultSetting(), ...localSetting };
}
export function setLocalState(setting) {
    ss.set(LOCAL_NAME, setting);
}
