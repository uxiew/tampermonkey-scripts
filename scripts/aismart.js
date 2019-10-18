// ==UserScript==
// @name         aismart 多文件处理
// @author       ChandlerVer5
// @namespace    ChandlerVer5@gmail.com
// @version      0.1
// @description  try to take over the world!
// @url          https://aismartvip.com/module/project/submodule/voice/voice.js
// @match        https://aismartvip.com/voice/*
// @grant        none
// @run-at document-end
// ==/UserScript==

(function(w, $) {
    const L = w.location;
    // voice/downloadList 页面所作操作

    if( L.href.indexOf("voice/downloadList") > 0){
        // $("body").append('<div id="subtitleDownloadText" class="hidden msgBoxText" style="display: block; position: absolute; top: 374px; left: -23px;"><a class="closeButton" href="#">X</a> <h2>save and download</h2> <select id="subtitleDownloadFormat" class="ui-state-default ui-corner-all"> <option selected="selected">srt</option> <option>vtt</option> </select><br> <br> <input id="subtitleDownloadOK" type="button" class="ui-state-default ui-corner-all" value="download"> </div>');
        // test URL ： https://aismartvip.com/voice/download?voiceId=22746&format=pr

        $("marquee").after('<button id="srtBtn" class="btn btn-default" style="margin:10px;color:#e83838;border-color: #ccc;">下载全部 <b style="color:blue">srt</b> 字幕</button>');


        const AllTrEle = $('tbody tr');
        let queuing = false,allSubtitleData = []; // 还有在排队处理的。

        let num = 0, timer = null; // 好像一次只能下载10个,那么，就间隔一下

        AllTrEle.each((e,d)=>{
            if( $(d).find('td')[10].innerText !== 'finished' ){
             queuing = true;
            }
            let d4 = $(d).find('td a')[4];
            //  字幕信息组织
            d4 && allSubtitleData.push({
                title:$(d).find('td')[3].innerText.replace(/\.mp4/,''),
                voiceId:d4.href.split(/voiceId=/)[1]
            });
            // console.log(queuing,allSubtitleData)
        });

        /**
        * type：下载字幕文件类型
        * data：数据组织，包含全部字幕文件的重命名、voiceId.
        */
        function downloadAll(type='srt', data){
           let d = type === 'srt' ? 'download' : 'downloadVTT2';

           // 批量下载...
           data.forEach(async (info) => {
               const {title, voiceId} = info;

               const res = await fetch(`${L.origin}/voice/${d}?voiceId=${voiceId}&format=pr`);
               const blob = await res.blob();
               // console.log(blob);
               var a = document.createElement('a');
               var url = window.URL.createObjectURL(blob);
               a.href = url;
               a.download = `${title}.${type}`;
               a.click(); //点击
               window.URL.revokeObjectURL(url); //释放已经下载过的字幕URL对象。不再需要
           })
        }



        // === 绑定点击下载 ===
        $("#srtBtn").click(function(e){
            const count = allSubtitleData.length;
            if(queuing || !count || num || timer){
                alert("===请等待所有处理完成===");
                return;
            }

            if( count - num > 10 ){
                timer = setInterval(()=>{
                    if( count - num < 10 ){
                        clearInterval(timer);
                        downloadAll('srt', allSubtitleData.slice(num, count));
                        return;
                    }
                    downloadAll('srt', allSubtitleData.slice(num, num + 10));
                    num += 10;
                },14E3);
            }

            downloadAll('srt', allSubtitleData.slice(num, count > 10 ? num + 10 : count ));
            num += 10;
            console.log(`====共${allSubtitleData.length}个字幕，加入下载====`);
        })

        return;
    }

    // voice/index 页面所作操作

    $("#id_languageSelect").val(1737);
    // console.log($("script"));
    $("script")[3].remove();
    // $('.btns').prepend('<div id="picker">选择音频或视频文件</div>');


    var d = $, a = d("#thelist"), b = d("#ctlBtn"), c = "pending", e, filesNum =0;
    e = WebUploader.create({
        resize: false,
        timeout: 0,
        swf: "/module/webuploader/0.1.5/Uploader.swf",
        server: server_url,
        pick: "#picker"
    });

    e.on("fileQueued", function(f) {
        filesNum++;
        a.append('<div id="' + f.id + '" class="item"><h4 class="info">' + f.name + '</h4><p class="state">等待上传...</p></div>');
        console.log('已成功上传！ ',filesNum);
    });
    e.on("uploadProgress", function(h, f) {
        var i = d("#" + h.id)
          , g = i.find(".progress .progress-bar");
        if (!g.length) {
            g = d('<div class="progress progress-striped active"><div class="progress-bar" role="progressbar" style="width: 0%"></div></div>').appendTo(i).find(".progress-bar")
        }
        i.find("p.state").text("上传中");
        g.css("width", f * 100 + "%")
    });
    e.on("uploadSuccess", function(f, g) {
        if (g.success) {
            d("#" + f.id).find("p.state").text(fileUploadFinishInfo);
            if (page_version_type == 0) {
                filesNum--;
               if(!filesNum){
                   L.href = "/voice/downloadList"
               }

            } else {
                if (page_version_type == 1) {
                    L.href = "/checkout/pro?voiceId=" + g.voiceId
                } else {
                    if (page_version_type == 2) {
                        L.href = "/checkout/international?voiceId=" + g.voiceId
                    }
                }
            }
        } else {
            d("#" + f.id).find("p.state").html("<span style='color:red'>" + g.message + "</span>");
            L.href = "/voice/downloadList" // 今日已达上传次数
        }
    });
    e.on("uploadError", function(f) {
        L.href = success_forward_url
    });
    e.on("uploadComplete", function(f) {
        d("#" + f.id).find(".progress").fadeOut()
    });
    e.on("uploadBeforeSend", function(g, f) {
        f.voiceName = d("#id_voiceName").val();
        f.captionLength = d("#id_captionLength").val();
        f.languageSelect = d("#id_languageSelect").val()
    });
    e.on("all", function(f) {
        if (f === "startUpload") {
            c = "uploading"
        } else {
            if (f === "stopUpload") {
                c = "paused"
            } else {
                if (f === "uploadFinished") {
                    c = "done"
                }
            }
        }
        if (c === "uploading") {
            b.text(pauseUploadButton)
        } else {
            b.text(beginUploadButton)
        }
    });
    b.on("click", function() {
        if (c === "uploading") {
            e.stop()
        } else {
            e.upload()
        }
    })

})(window, jQuery);