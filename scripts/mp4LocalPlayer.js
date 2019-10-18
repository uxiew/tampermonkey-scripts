// ==UserScript==
// @name         mp4LocalPlayer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  本地视频直接拖放到chrome上自动播放，同时使本地视频同名的tt和srt字幕自动挂载
// @author       ChandlerVer5
// @match        file:///*:/*.mp4
/* ---额外js--
http://libs.baidu.com/jquery/2.0.0/jquery.min.js
https://unpkg.com/plyr@3.5.6/dist/plyr.min.js
*/
// @require https://lib.baomitu.com/plyr/latest/plyr.min.js
// @grant        GM_addStyle
// ==/UserScript==
// 可能会出现网络延迟，加载错乱问题
// 修改自：https://github.com/zhw2590582/srt.js/blob/master/src/index.js
class SrtJs {
    constructor(option) {
        this.option = Object.assign({}, SrtJs.DEFAULTS, option);
        this.init();
    }

    static get version() {
        return '__VERSION__';
    }

    static get DEFAULTS() {
        return {
            videoElement: '',
            subtitles: []
        };
    }

    static polyfill() {
        Object.getOwnPropertyNames(this.prototype).forEach(method => {
            if (method !== 'constructor') {
                this[method] = this.prototype[method].bind(this);
            }
        });

        this.$videos = Array.from(document.querySelectorAll('video'));
        this.$videos.forEach($video => {
            this.changeTrack($video);
        });
    }

    init() {
        this.$video = this.getElement(this.option.videoElement);
        this.option.subtitles.forEach(subtitle => {
            this.creatTrack(subtitle);
        });
    }

    getElement(query) {
        return query instanceof Element ? query : document.querySelector(query);
    }

    changeTrack($video) {
        const $tracks = Array.from($video.querySelectorAll('track'));
        $tracks.forEach($track => {
            this.fetchUrl($track.src).then(data => {
                if ($track.src !== data) {
                    $track.src = data;
                }
            });
        });
    }

    creatTrack(subtitle) {
        const $track = document.createElement('track');

        if (subtitle.label) {
            $track.label = subtitle.label;
        }

        if (subtitle.kind) {
            $track.kind = subtitle.kind;
        }

        if (subtitle.srclang) {
            $track.srclang = subtitle.srclang;
        }

        if (subtitle.default) {
            $track.default = subtitle.default;
        }

        if (subtitle.src) {
            console.log(subtitle);
            this.fetchUrl(subtitle.src).then(data => {
                console.log(data);
                if(data){
                    $track.src = data;
                    this.$video.appendChild($track);
                }
            });
        }
    }

    // =======此处修改版=====
    fetchUrl(url) {
        let type;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
                // response.headers.get('Content-Type');
                if ((/srt$/ig).test(url)) {
                     console.log(url);
                    return this.srtToVtt(xhr.responseText);
                }
                return resolve(url);
            }
            xhr.onerror = () => {

                xhr.open('GET', url.replace('/vtt$/','') + 'srt');
                xhr.send();
                reject(null)
            };
            xhr.open('GET', url);
            xhr.send();
        }).catch(err=>{
            console.log(err);
        })
    }

    srtToVtt(text) {
        console.log(text);
        const vttText = 'WEBVTT \r\n\r\n'.concat(text
                                                 .replace(/\{\\([ibu])\}/g, '</$1>')
                                                 .replace(/\{\\([ibu])1\}/g, '<$1>')
                                                 .replace(/\{([ibu])\}/g, '<$1>')
                                                 .replace(/\{\/([ibu])\}/g, '</$1>')
                                                 .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2')
                                                 .concat('\r\n\r\n'));
        console.log(vttText);
        return URL.createObjectURL(new Blob([vttText], {
            type: 'text/vtt'
        }));
    }
}
window.SrtJs = SrtJs;

// 业务内容
(function(w, d) {
    'use strict';
    const link = d.createElement('link');
    link.rel="stylesheet";
    link.href="https://lib.baomitu.com/plyr/latest/plyr.css";
    d.getElementsByTagName('head')[0].append(link);

    GM_addStyle(`body{margin:0;padding:0}
body, .plyr__video-wrapper {height:100%}
.plyr__video-wrapper{
  padding-bottom:0!important;
}
.plyr__captions .plyr__caption{
display: inline-block;
background: rgba(23,35,34,.75);
border-radius: 5px;
padding: .2em .5em .3em;
font-weight: 400;
font-size:24px;
line-height: 1.2;
-webkit-font-smoothing: antialiased;}
`);
    const v = d.getElementsByTagName('video')[0];
    v.setAttribute('width','100%');
    v.setAttribute('id','player');
    v.setAttribute('crossorigin',true);
    v.setAttribute('playsinline',true);

    // 识别字幕文件 ;
    const tracker = document.createElement('track');

    // 自动加载本地字幕文件vtt 或者 srt
    const fileUrl = w.location.href;
    const subtitleUrl = fileUrl.replace(/\mp4$/,'');
    console.log(subtitleUrl);
    tracker.src= subtitleUrl + 'vtt';
    tracker.kind= "subtitles";
    tracker.label = "English" // 显示"英文"
    tracker.srclang= "en"  // 默认都是英文
    tracker.default = true;
    v.appendChild(tracker);

    // ===== 本地vtt 直接加载，srt转换 ====

    SrtJs.polyfill();

    // ============ Plyr handler===============
    // This is the bare minimum JavaScript. You can opt to pass no arguments to setup.
    const player = new Plyr('#player');
    // w.player = player();

})(window, document);