// ==UserScript==
// @name       Github Git2It
// @author       1xin
// @collaborator ChandlerVer5
// @namespace   https://greasyfork.org/users/183871
// @version    0.0.5
// @description  Put "git clone https://github.com/*/*.git" into page.
// @noframes
// @match    *://github.com/*/*
// @grant    GM.getValue
// @grant    GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    //getUrl() 获取git 地址
    var getUrl = {
        getGitUrl:function(){
            var git_url;
            var input_lable=$("div.clone-options.https-clone-options > div > input");
            git_url=input_lable.attr("value");
            return git_url;
        }
    };

    //addButton() 增加复制按钮
    var addButton={
        thisButton:null,
        addButton:function(){
            var next_btn_html = '';
            next_btn_html += '<a class="btn btn-sm BtnGroup-item" id ="me">';
            next_btn_html +='<font color="#fa7d3c">';
            next_btn_html += 'Git Clone It';
            next_btn_html +='</font>';
            next_btn_html += '</a>';
            //增加下一个视频按钮
            var flag_tag = $("div.BtnGroup > form");
            if (flag_tag) {
                flag_tag.append(next_btn_html);
            }
        },
        buttonClick:function(gitUrl){
            $("#me").click(function(){
                GM_setClipboard(gitUrl, 'text');
            });
        }
    };
    var t="git clone " + getUrl.getGitUrl();
    addButton.addButton();
    addButton.buttonClick(t);
})();