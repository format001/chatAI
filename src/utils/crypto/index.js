import CryptoJS from 'crypto-js';
const CryptoSecret = '__CRYPTO_SECRET__';
export function enCrypto(data) {
    const str = JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, CryptoSecret).toString();
}
export function deCrypto(data) {
    const bytes = CryptoJS.AES.decrypt(data, CryptoSecret);
    const str = bytes.toString(CryptoJS.enc.Utf8);
    if (str)
        return JSON.parse(str);
    return null;
}
