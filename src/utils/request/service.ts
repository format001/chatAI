import axios from 'axios'

const BASE_URL = import.meta.env.VITE_APP_API;

function httpGet(url) {
    return new Promise((resolve, reject) => {
        axios(BASE_URL + url).then(res => {
            const { code, msg, data } = res.data;
            if (code === 0) {
                resolve(data);
            }else{
                reject(msg)
            }
        }).catch((err) => {
            reject(err);
        })
    })
}

async function httpPost  (url, data, config,  message) {
       let res =  await axios.post(BASE_URL + url, data, config).catch(err => {
                    return Promise.reject(err, '网络错误！请求API:' + BASE_URL + url);
                })

        if(res.status === 200){
            const data = res.data;
            if(data.code === 200){
                return Promise.resolve(data);
            }else if(data.code == 401){
                localStorage.setItem('user_token','')
                localStorage.clear();
                message.error ('登录已失效！')
                location.href = '/'
            }else if(data.code == 400){
                message.error (data.msg)
            }else{
                message.error ('网络错误！')
            }
        }

    return Promise.reject(res);
}

export {
    httpPost,
    httpGet
}
