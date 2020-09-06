import * as https from 'https';
import * as querystring from 'querystring';
import md5 = require('md5');
import {appID, appSecret} from './privateData';

type ErrorMap = {
    [key: string]: string
}
const errorMap: ErrorMap = {
    52003: '用户认证失败',
    54001: '签名错误',
    54004: '账户余额不足',
};
export const translate = (word:string) => {

    const salt = Math.random();
    let from, to;
    if (/[a-zA-Z]/.test(word[0])) {
        from = 'en';
        to = 'zh';
    } else {
        from = 'zh';
        to = 'en';
    }
    const sign = md5(appID + word + salt + appSecret);
    const query: string = querystring.stringify({q: word, from, to, appid:appID, salt, sign});
    const options = {
        hostname: 'api.fanyi.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?'+ query,
        method: 'GET'
    };
    const request = https.request(options, (response) => {
        let chunks: Buffer[] = [];
        response.on('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            const string = Buffer.concat(chunks).toString();
            type BaiduResult = {
                error_code?: string;
                error_msg?: string;
                from: string;
                to: string;
                trans_result: { src: string; dst: string }[]
            }

            const object: BaiduResult = JSON.parse(string);
            if (object.error_code) {
                console.error(errorMap[object.error_code] || object.error_msg);
                process.exit(2);
            } else {
                object.trans_result.map(obj => {
                    console.log(obj.dst);
                });
                process.exit(0);
            }
        });
    });
    request.on('error', (e) => {
        console.error(e);

    });
    request.end();
};
