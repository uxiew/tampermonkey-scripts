// ==UserScript==
// @name         Github downloader
// @author       ChandlerVer5
// @namespace    ChandlerVer5@gmail.com
// @version      0.1
// @description  Github 文件下载
// @match        http*://*github.com/*/*
// @require https://lib.baomitu.com/FileSaver.js/latest/FileSaver.min.js
// @require https://lib.baomitu.com/jszip/latest/jszip.min.js
// @grant   GM_addStyle
// @refs	https://github.com/onlylemi/github-downloader/
// ==/UserScript==

GM_addStyle(`table.files td.download {
    width: 16px;
    text-align: right;
    padding-right: 6px;
    color: #6DBE51;
}
.display-none{
	display: none;
}
.loading{
	position: relative;
    top: 3px;
    display: inline-block;
    margin-top: -3px;
    margin-left: -2px;
}`);

(function(w, d) {

var $files = $('.js-active-navigation-container');
var prepareNewDirsOnPage = function() {
    var dirs = $files.find('.js-navigation-item').not('.select-menu-item').find('.content a:eq(0)').map(function() {
        var $self = $(this),
            dir = $self.text();

        $self.closest('.js-navigation-item');

        return dir;
    }).toArray();
    // alert(dirs);
    return unique(dirs);
};

var dirsUrls = function() {
    var dirsHref = $files.find('.js-navigation-item').not('.select-menu-item').find('.content a:eq(0)').map(function() {
        var $self = $(this),
            ahref = $self.attr("href");

        $self.closest('.js-navigation-item');

        return ahref;
    }).toArray();
    // alert(dirsHref);
    return unique(dirsHref);
};

var unique = function(array) {
    var temp = {};
    for (var i in array) {
        temp[array[i]] = {};
    }
    return Object.keys(temp);
};

var printImages = function(array) {
    var i = 0;
    $('.js-navigation-item:not(.select-menu-item, .download-ready) .age').each(function() {
        var $img = $("<td class='download'><a lid='" + i + "' href='javascript:void(0);' title='Download " + array[i] + "'><svg aria-hidden='true' class='octicon octicon-cloud-download' height='16' version='1.1' viewBox='0 0 16 16' width='16'><path d='M9 13h2l-3 3-3-3h2V8h2v5z m3-8c0-0.44-0.91-3-4.5-3-2.42 0-4.5 1.92-4.5 4C1.02 6 0 7.52 0 9c0 1.53 1 3 3 3 0.44 0 2.66 0 3 0v-1.3H3C1.38 10.7 1.3 9.28 1.3 9c0-0.17 0.05-1.7 1.7-1.7h1.3v-1.3c0-1.39 1.56-2.7 3.2-2.7 2.55 0 3.13 1.55 3.2 1.8v1.2h1.3c0.81 0 2.7 0.22 2.7 2.2 0 2.09-2.25 2.2-2.7 2.2H10v1.3c0.38 0 1.98 0 2 0 2.08 0 4-1.16 4-3.5 0-2.44-1.92-3.5-4-3.5z'></path></svg></a><img alt='' class='spinner' height='16' src='https://github.githubassets.com/images/spinners/octocat-spinner-32.gif' width='16' /></td>");
        var $self = $(this);
        $img.clone().insertAfter($self);
        $self.closest('.js-navigation-item').addClass('download-ready');
        i++;
    });
};

printImages(prepareNewDirsOnPage());

dirsUrls();

$(document).ready(function() {


    $(".download a").click(function() {
        var i = $(this).attr("lid");
        var url = "https://github.com" + dirsUrls()[i];

        $self = $(this);

        // alert(url);
        $self.addClass('display-none');
        $self.parent().find("img:eq(0)").removeClass('spinner').addClass('loading');

        GitZip.registerCallback(function(status, message, percent) {
            if (status == 'error' || status == 'done') {
                $self.removeClass('display-none');
                $self.parent().find("img:eq(0)").removeClass('loading').addClass('spinner');

                // alert(status);
            }
        });

        // alert(url);
        GitZip.zipRepo(url);
    });
});
})(window, document);
(function(scope){
    function fn(){};

    var repoExp = new RegExp("^https://github.com/([^/]+)/([^/]+)(/(tree|blob)/([^/]+)(/(.*))?)?");
    var githubProvidedUrl = new RegExp("^https://api.github.com/.*");
    var isBusy = false;

    var statusHandle = function(status){
        if(status == 'error' || status == 'done') isBusy = false;
        else isBusy = true;
    };

    /**
     * @typedef ResolvedURL
     * @type Object
     * @property {string} author - The project owner
     * @property {string} project - The project name
     * @property {string} branch - The default branch or other branches
     * @property {string} type - The type of url link, values: tree, blob, link?
     * @property {string} path - The path of target file/dir based on root repo url.
     * @property {string} inputUrl - The input url
     * @property {string} rootUrl - The root dir url
     */

    /**
     * This callback would call by each progress changes.
     * @callback progressCallback
     * @param {string} status - indicates the status description like 'error', 'prepare', 'processing', 'done'
     * @param {string} message - the messages of the above status.
     * @param {number} percent - from 0 to 100, indicates the progress percentage.
     */
    var progressCallback = function(status, message, percent){};

    /**
     * Resolve the github repo url for recognize author, project name, branch name, and so on.
     * @private
     * @param {string} repoUrl - The github repo url.
     * @param {ResolvedURL}
     */
    function resolveUrl(repoUrl){
        if(typeof repoUrl != 'string') return;
        var matches = repoUrl.match(repoExp);
        if(matches && matches.length > 0){
            var root = (matches[5])?
                "https://github.com/" + matches[1] + "/" + matches[2] + "/tree/" + matches[5] :
                repoUrl;
            return {
                author: matches[1],
                project: matches[2],
                branch: matches[5],
                type: matches[4],
                path: matches[7] || '',
                inputUrl: repoUrl,
                rootUrl: root
            };
        }
    }

    /**
     * Force to trigger download dialog for any mine-type files using Native A Element.
     * @param {string} url - The URL.
     * @param {object|undefined} callbackScope - The scope of the progressCallback function.
     */
    function downloadZipUseElement(url, callbackScope){
        var down = document.createElement('a');
        down.setAttribute('download', true);
        down.href = url;
        down.addEventListener('click', function(e){
            progressCallback.call(callbackScope, 'done', 'Saving File.');
        });
        setTimeout(function(){
            // link has to be in the page DOM for it to work with Firefox
            document.body.appendChild(down);
            down.click();
            down.parentNode.removeChild(down);
        },100);
    }

    /**
     * Force to trigger download dialog for any mine-type files.
     * @param {string} url - The URL.
     * @param {object|undefined} callbackScope - The scope of the progressCallback function.
     */
    function downloadZip(url, callbackScope){
        callbackScope = callbackScope || scope;
        if(url){
            progressCallback.call(callbackScope, 'processing', 'Fetching target url: ' + url);

            $.get(url)
                .fail(function(jqXHR, textStatus, errorThrown){
                  console.error('downloadZip > $.get fail:', textStatus);
                  if (errorThrown) throw errorThrown;
                })

                .done(function(data, textStatus, jqXHR){
                    var blob = new Blob([data], {
                        type: jqXHR.getResponseHeader('Content-Type') ||
                            'application/octet-stream'
                    });

                    var down = document.createElement('a');
                    down.download = url.substring(url.lastIndexOf('/') + 1);
                    down.href = URL.createObjectURL(blob);

                    down.addEventListener('click', function(e){
                        progressCallback.call(callbackScope, 'done', 'Saving File.');
                    });

                    setTimeout(function(){
                        // link has to be in the page DOM for it to work with Firefox
                        document.body.appendChild(down);
                        down.click();
                        down.parentNode.removeChild(down);
                    }, 100);
              });
        }
    }

    /**
     * Download zip file from github api url.
     * @param {string} zipName - The zip file name.
     * @param {string} url - The github api url.
     * @param {object|undefined} callbackScope - The scope of the progressCallback function.
     */
    function zipIt(zipName, url, callbackScope){
        callbackScope = callbackScope || scope;
        if(url && githubProvidedUrl.test(url)){
            progressCallback.call(callbackScope, 'prepare', 'Fetching list of Dir contains files.');
            $.ajax({
                url: url + "?recursive=1",
                success: function(results){
                    var promises = [];
                    var fileContents = [];
                    if(results.truncated){
                        progressCallback.call(callbackScope, 'error', 'The tree travels is over than API limitation (500 files)');
                        throw ("The tree travels is over than API limitation (500 files)");
                    };
                    progressCallback._idx = 0;
                    progressCallback._len = 0;
                    results.tree.forEach(function(item){
                        if(item.type == "blob") progressCallback._len++;
                    });
                    results.tree.forEach(function(item){
                        if(item.type == "blob"){
                            promises.push(Promise.resolve(
                                $.ajax({
                                    url: item.url,
                                    success: (function(path){
                                        return function(results){
                                            fileContents.push({path:path,content:results.content});
                                            progressCallback.call(callbackScope, 'processing', 'Fetched ' + path,
                                                ++progressCallback._idx / (progressCallback._len * 2) * 100);
                                        };
                                    })(item.path)
                                })
                            ));
                        }
                    });

                    Promise.all(promises).then(function() {
                        var zip = new JSZip();
                        fileContents.forEach(function(item){
                            progressCallback.call(callbackScope, 'processing', 'Compressing ' + item.path,
                                ++progressCallback._idx / (progressCallback._len * 2) * 100);
                            zip.file(item.path, item.content, {createFolders:true,base64:true});
                        });
                        saveAs(zip.generate({type:"blob"}), zipName + ".zip");
                        progressCallback.call(callbackScope, 'done', 'Saving ' + zipName + '.zip');
                    },function(item){
                        if(item){
                            progressCallback.call(callbackScope, 'error', 'Error: ' + JSON.stringify(item));
                            throw (JSON.stringify(item) + " ERROR");
                        }
                    });
                },
                error:function(e){
                    progressCallback.call(callbackScope, 'error', 'Error: ' + e);
                    throw (e);
                }
            });
        }
    }

    /**
     * Download zip for single file from input repo URL.
     * @param {string} pathToFolder - The URL of the Github repository.
     * @param {object|undefined} callbackScope - The scope of the progressCallback function.
     */
    function createURL(pathToFolder, callbackScope){
        if(isBusy) throw "GitZip is busy...";
        callbackScope = callbackScope || scope;
        progressCallback.call(callbackScope, 'prepare', 'Resolving URL');
        var resolved = resolveUrl(pathToFolder);
        if(!resolved){
            progressCallback.call(callbackScope, 'error', 'Invalid URL: value is [' + pathToFolder.toString() + ']');
            throw "INVALID URL";
        }
        if(!resolved.path){
            // root
            var durl = [
                "https://github.com", resolved.author, resolved.project,
                "archive", (resolved.branch || 'master')
            ].join('/');
            var gitURL = durl + ".zip";
            // downloadZip(gitURL, callbackScope);
            downloadZipUseElement(gitURL, callbackScope);
        } else{
            // get up level url
            var originInput = resolved.inputUrl;
            if(resolved.type == "tree"){
                var news = originInput.split('/');
                news.pop();
                resolved = resolveUrl(news.join('/'));
            }
            progressCallback.call(callbackScope, 'prepare', 'Finding file/dir content path from resolved URL');
            $.ajax({
                url: "https://api.github.com/repos/"+ resolved.author +
                    "/" + resolved.project + "/contents/" + resolved.path +
                    (resolved.branch? ("?ref=" + resolved.branch) : ""),
                success: function(results) {
                    var templateText = '';
                    if(!Array.isArray(results)){
                        if(results.message){
                            progressCallback.call(callbackScope, 'error', 'Github said: '+results.message);
                            throw ("Error: " +  results.message);
                        }else downloadZip(results.download_url, callbackScope);
                        return;
                    }
                    for(var i = 0, len = results.length; i < len; i++){
                        var item = results[i];
                        // target has found
                        if(item.type == "dir" && item.html_url == originInput){
                            var valueText = item.path;
                            var pathText = valueText.split('/').pop();
                            var urlText = item.git_url;
                            zipIt(pathText, urlText, callbackScope);
                            break;
                        }
                        if(i + 1 == len){
                            progressCallback.call(callbackScope, 'error', 'File/Dir content not found.');
                        }
                    }
                },
                error: function(results){
                    progressCallback.call(callbackScope, 'error', 'Github said: ' + JSON.stringify(results));
                    throw (JSON.stringify(results));
                }
            });
        }
    }

    /**
     * Register the progress callback for handleing the progress is changing.
     * @param {progressCallback} inputFn - The progress callback.
     */
    function registerCallback(inputFn){
        if(typeof inputFn == 'function'){
            // progressCallback = callback;
            progressCallback = function(){
                inputFn.apply(this, arguments);
                statusHandle.apply(this, arguments);
            };
        }
    }

    fn.zipRepo = createURL;
    fn.zipFromApiUrl = zipIt;
    fn.downloadFile = downloadZip;
    fn.registerCallback = registerCallback;

    scope.GitZip = fn;

})(window);