let wrapper, wrapperPaddingTop, wrapperPaddingBottom, largeImageMarginLeft, isSlide, stackedImages, offlineMode, playlistVars;

function init() {
    wrapper = $('#wrapper');
    wrapperPaddingTop = wrapper.css('padding-top');
    wrapperPaddingBottom = wrapper.css('padding-bottom');
    largeImageMarginLeft = $('#largeImage').css('margin-left');
    if ($('.slide').length > 0) isSlide = true;

    getPageVariables();
    getPlaylistVarsFromURL();
    saveHistory();
    elementVisibility();
    initVisibility();
    setFirstSlice();
}


function fadeIn()
{
    wrapper.css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
}


elements = {
    header: {
        hide: () => {
            $('#headerWrapper').hide();
            $('#wrapper').css('padding-top', '32px');
            setImageWrapperSize();
        },
        show: () => {
            $('#headerWrapper').show();
            $('#wrapper').css('padding-top', wrapperPaddingTop);
            setImageWrapperSize();
        }
    },
    sidebar: {
        hide: () => {
            $('#navTab').hide();
            $('#largeImage').css('margin-left', 0);
            setImageWrapperSize();
        },
        show: () => {
            $('#largeImage').css('margin-left', largeImageMarginLeft);
            $('#navTab').show();
            setImageWrapperSize();
        },
        tabs: {
            hide: () => {
                $('.offline-workflow-tabs').hide();
                $('.offline-workflow-tabs-content-container').css('top', '0');
            }
        }
    },
    footer: {
        hide: () => {
            $('#footer').hide();
            $('#wrapper').css('padding-bottom', '32px');
            setImageWrapperSize();
        },
        show: () => {
            $('#footer').show();
            $('#wrapper').css('padding-bottom', wrapperPaddingBottom);
            setImageWrapperSize();
        }
    },
    maximise: {
        hide: () => {
            elements.header.hide();
            elements.sidebar.hide();
            elements.footer.hide();
        }
    },
    findingsTab: {
        disable: () => {
            $('#offline-workflow-link-findings').parent('li').addClass('inactive').removeClass('active');
        }
    },
    supporterOrnament: {
        hide: () => {
            $('#offline-workflow-footer-courtesy .supporter-ornament').attr('style', 'display: none !important');
        }
    },
    diagnosticCertainty: {
        hide: () => {
            $('#offline-workflow-footer-courtesy .diagnostic-certainty').hide();
        }
    },
    footerCourtesy: {
        disableLinks: () => {
            $('#offline-workflow-footer-courtesy a').addClass('disabled');
        }
    },
    rid: {
        hide: () => {
            let courtesy = $('#offline-workflow-footer-courtesy');
            let courtesyHTML = courtesy.html();
            courtesy.html(courtesyHTML.split(' rID:')[0]);
        }
    },
    presentingDefaults: () => {
        elements.supporterOrnament.hide();
        elements.diagnosticCertainty.hide();
        elements.footerCourtesy.disableLinks();
    },
};


function elementVisibility() {
    elements.presentingDefaults();
    global.get('hideFindings', function (global) {
        let globalHideFindings = global.hideFindings;

        store.get('hideFindings', function (result) {
            let pageHideFindings = result.hideFindings;
            let pageShowFindings = result.showFindings;
            if ((globalHideFindings === true && pageShowFindings !== true) || (globalHideFindings !== true && pageHideFindings === true)) {
                elements.findingsTab.disable();
                elements.rid.hide();
            }
            if (result.maximiseCase === true) {
                elements.maximise.hide();
            }
            if (global.hideTabs === true) {
                elements.sidebar.tabs.hide();
            }
            console.log(result.startingSeries);
            if (typeof result.startingSeries !== "undefined") {

                // We save the starting Series as if they started from 1, but the thumbs are 0-indexed.
                let n = Number(result.startingSeries) - 1;
                navigate.series(n);
            }
        });

    });
}


function initVisibility()
{
    if (isSlide === true) {
        maximise.slideHide();
    } else {
        header.setVisibility();
        sidebar.setVisibility();
        footer.setVisibility();
    }
}


function saveHistory() {
    global.get('backAction', function (result) {
        if (result.backAction === true) {
            global.get('history', function (result) {
                if (result.history) {
                    result.history.pop();
                    global.set('history', result.history);
                }
            });
        } else {
            let currentURL = window.location.href;
            global.get('history', function (result) {
                let history = result.history;
                if (Array.isArray(history)) {
                    if (history.slice(-1)[0] !== currentURL) {
                        // Only add the URL if it's not the same as the last one.
                        history.push(currentURL);
                    }
                } else {
                    history = [currentURL];
                }
                if (history.length > 20) {
                    history.splice(0, history.length - 20);
                }
                global.set('history', history);
            });
        }
    });
    global.set('backAction', false);
}


function getPageVariables()
{
    let pageVariables = retrieveWindowVariables(["stackedImages", "caseIDs", "currentCaseID", "studies", "components", "offlineMode"]);

    stackedImages = pageVariables['stackedImages'];
    offlineMode = pageVariables['offlineMode'];
}


function getPlaylistVarsFromURL()
{
    let playlistIds = {};

    let pathArray = window.location.pathname.split('/');
    if (offlineMode === true) {
        let lastPart = pathArray.pop();
        let partsArray = lastPart.split('.html')[0].split('_');
        playlistIds = {
            playlistId: partsArray[1],
            entryId: partsArray[3],
            caseId: partsArray[5],
            studyId: partsArray[7]
        };
    } else {
        playlistIds = {
            playlistId: pathArray[2],
            entryId: pathArray[4],
            caseId: pathArray[6],
            studyId: pathArray[8]
        };
    }

     playlistVars = playlistIds;
}


let getCurrentSeriesNumber = () => {
    if (isSlide) return false;
    let currentTab = $('#navTab .thumbnails .active').parent('.thumb').attr('id');
    if (typeof currentTab !== "undefined") {
        return Number(currentTab.replace('offline-workflow-thumb-', ''));
    }
};


/**
 * Determine which is the first slice that should be shown and select it.
 */
function setFirstSlice()
{
    if (!isSlide) {
        global.get('defaultToTopImage', function (result) {
            let globalDefaultToTopImage = result.defaultToTopImage;
            store.get('defaultToTopImage', function (result) {
                let pageDefaultToTopImage = result.defaultToTopImage;
                let pageDefaultSlice = result.defaultSlice;
                let studySliceName = 'startingSlice' + getCurrentSeriesNumber();

                if ((globalDefaultToTopImage === true && pageDefaultSlice !== true) || (globalDefaultToTopImage !== true && pageDefaultToTopImage === true)) {
                    navigate.top();
                } else {
                    if (result[studySliceName]) {
                        navigate.to(result[studySliceName]);
                    }
                }

                fadeIn();
                $('#largeImage').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
            });
        });
    } else {
        fadeIn();
    }
}


// https://stackoverflow.com/questions/3955803/page-variables-in-content-script
function retrieveWindowVariables(variables) {
    let ret = {};

    let scriptContent = "";
    for (let i = 0; i < variables.length; i++) {
        let currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', JSON.stringify(" + currVariable + "));\n"
    }

    let script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (let i = 0; i < variables.length; i++) {
        let currVariable = variables[i];
        let current = $("body").attr("tmp_" + currVariable);
        if (current) {
            ret[currVariable] = $.parseJSON(current);
        }
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}


let findIndex = function (key, val, arr) {
    if (Array.isArray(arr)) {
        for (let i = 0, j = arr.length; i < j; i++) {
            if (arr[i].hasOwnProperty(key)) {
                if (arr[i][key] == val) {
                    return i;
                }
            }
        }
    }
    return -1;
};


/**
 * Breaks on mobile/iPad.
 * @returns {{height: string, width: string, top: string, left: number}}
 */
function calculateImageWrapperSize()
{
    let imageWrapper = $('.offline-workflow-image-wrapper');
    let imageAspectRatio = imageWrapper.height()/imageWrapper.width();

    let wrapper = $('.offline-workflow-outer-wrapper');
    let wrapperWidth = wrapper.width();
    let wrapperHeight = wrapper.height();
    let wrapperAspectRatio = wrapperHeight/wrapperWidth;

    let imageHeight, imageWidth, imageOffsetTop;

    if (imageAspectRatio > wrapperAspectRatio) {
        imageHeight = wrapperHeight;
        imageWidth = wrapperHeight / imageAspectRatio;
        imageOffsetTop = 0;
    } else {
        imageWidth = wrapperWidth;
        imageHeight = wrapperWidth * imageAspectRatio;
        imageOffsetTop = (wrapperHeight - imageHeight)/2;
    }

    return {
        height: imageHeight + 'px',
        width: imageWidth + 'px',
        top: imageOffsetTop + 'px',
        left: 0
    }
}


function setImageWrapperSize()
{
    let imageWrapperSize = calculateImageWrapperSize();
    $('.offline-workflow-image-wrapper').css(imageWrapperSize);
    $('#offline-workflow-study-large-image').css({width: imageWrapperSize.width, height: imageWrapperSize.height});
}


function currentStudyImages()
{
    let currentSeriesNumber = getCurrentSeriesNumber();
    if (currentSeriesNumber) {
        return stackedImages[currentSeriesNumber]['images'];
    }
}


function firstStudyImage()
{
    let images = currentStudyImages();
    let firstImageIndex = findIndex('position', 1, images);
    if (firstImageIndex >= 0) {
        return images[firstImageIndex]['public_filename'];
    }
}


function lastStudyImage()
{
    let images = currentStudyImages();
    let lastImageIndex = findIndex('position', images.length, images);
    if (firstImageIndex >= 0) {
        return images[lastImageIndex]['public_filename'];
    }
}

let store = {
    playlist_id: () => {
        return 'radiopaedia' + '-' + playlistVars.playlistId;
    },
    name: () => {
        return 'radiopaedia' + '-' + playlistVars.playlistId + '-' + playlistVars.entryId + '-' + playlistVars.caseId + '-' + playlistVars.studyId;
    },
    get: (name, callback) => {
        let playlist_id = store.playlist_id();
        let study_id = store.name();
        chrome.storage.local.get([playlist_id], function(result) {
            if (typeof result[playlist_id] === "undefined") {
                result[playlist_id] = {};
            }
            if (typeof result[playlist_id][study_id] === "undefined") {
                result[playlist_id][study_id] = {};
            }
            callback(result[playlist_id][study_id]);
        });
    }
};

let global = {
    name: () => {
        return 'radiopaedia' + '-' + playlistVars.playlistId;
    },
    set: (name, value) => {
        let gContext = global.name();
        chrome.storage.local.get([gContext], function(result) {
            if (typeof result[gContext] === "undefined") {
                result[gContext] = {};
            }
            result[gContext][name] = value;
            chrome.storage.local.set(result, function () {});
        });
    },
    get: (name, callback) => {
        let gContext = global.name();
        chrome.storage.local.get([gContext], function(result) {
            if (typeof result[gContext] === "undefined") {
                result[gContext] = {};
            }
            callback(result[gContext]);
        });
    }
};


let header = {
    visible: true,
    setVisibility: function () {
        global.get('headerVisible', function (result) {
            if (result.headerVisible === false) {
                header.hide();
            }
        });
    },
    toggle: function () {
        if (header.visible === true) header.hide();
        else header.show();
    },
    show: function () {
        elements.header.show();
        header.visible = true;
        global.set('headerVisible', true);
    },
    hide: function () {
        elements.header.hide();
        global.set('headerVisible', false);
        header.visible = false;
    }
};


let sidebar = {
    visible: true,
    setVisibility: function () {
        global.get('sidebarVisible', function (result) {
            if (result.sidebarVisible === false) {
                sidebar.hide();
            }
        });
    },
    toggle: function () {
        if (sidebar.visible === true) sidebar.hide();
        else sidebar.show();
    },
    show: function () {
        elements.sidebar.show();
        global.set('sidebarVisible', true);
        sidebar.visible = true;
    },
    hide: function () {
        elements.sidebar.hide();
        global.set('sidebarVisible', false);
        sidebar.visible = false;
    }
};


let footer = {
    visible: true,
    setVisibility: function () {
        global.get('footerVisible', function (result) {
            if (result.footerVisible === false) {
                footer.hide();
            }
        });
    },
    toggle: function () {
        if (footer.visible === true) footer.hide();
        else footer.show();
    },
    show: function () {
        elements.footer.show();
        global.set('footerVisible', true);
        footer.visible = true;
    },
    hide: function () {
        elements.footer.hide();
        global.set('footerVisible', false);
        footer.visible = false;
    }
};


let maximise = {
    visible: true,
    state: {header, sidebar, footer},
    toggle: function () {
        if (header.visible || sidebar.visible || footer.visible) maximise.hide();
        else maximise.reShow();
    },
    reShow: function () {
        if (maximise.state.header === true) header.show();
        if (maximise.state.sidebar === true) sidebar.show();
        if (maximise.state.footer === true) footer.show();
    },
    show: function () {
        header.show();
        sidebar.show();
        footer.show();
        // TODO because of async, we can't saving all the state data - only the last one
    },
    hide: function () {
        maximise.state.header = header.visible;
        maximise.state.sidebar = sidebar.visible;
        maximise.state.footer = footer.visible;
        header.hide();
        sidebar.hide();
        footer.hide();
        // TODO because of async, we can't saving all the state data - only the last one
    },
    slideHide: function () {
        elements.header.hide();
        elements.sidebar.hide();
        elements.footer.hide();
    }
};


let navigate = {
    up: function (n) {
        for (let i = 0; i < n; i++) {
            $('#largeImage .scrollbar .up')[0].click();
        }
    },
    down: function (n) {
        for (let i = 0; i < n; i++) {
            $('#largeImage .scrollbar .down')[0].click();
        }
    },
    top: function () {
        let firstImage = firstStudyImage();
        let i = 0;
        do {
            $('#largeImage .scrollbar .up')[0].click();
            if (i++ > 100) break;
        }
        while (firstImage !== $('#largeImage img').attr('src'));
    },
    bottom: function () {
        let lastImage = lastStudyImage();
        let i = 0;
        do {
            $('#largeImage .scrollbar .down')[0].click();
            if (i++ > 100) break;
        }
        while (lastImage !== $('#largeImage img').attr('src'));
    },
    to: function (n) {
        navigate.top();
        navigate.down(n);
    },
    previous: function () {
        if (isSlide) {
            $('a.goback')[0].click();
        } else {
            $('#offline-workflow-prev-case')[0].click();
        }
    },
    next: function () {
        if (isSlide) {
            $('a.orange')[0].click();
        } else {
            $('#offline-workflow-next-slide')[0].click();
        }
    },
    back: function () {
        global.set('backAction', true);
        global.get('history', function (result) {
            let history = result.history;
            if (Array.isArray(history) && history.slice(-2)[0]) {
                window.location.href = history.slice(-2)[0];
            } else {
                navigate.previous();
            }
        });
    },
    orange: function () {
        if (isSlide) {
            $('a.orange')[0].click();
        } else {
            $('#offline-workflow-next-slide')[0].click();
        }
    },
    series: function (n) {
        let button = $('#offline-workflow-thumb-' + n + ' a');
        if (button.length > 0) {
            button[0].click();
        }
    },
    study: function (n) {
        let button = $('#offline-workflow-page-' + n + ' a');
        if (button.length > 0) {
            button[0].click();
        }
    },
    imagesTab: function () {
        $('#offline-workflow-link-images')[0].click();
    },
    questionsTab: function () {
        $('#offline-workflow-link-questions')[0].click();
    },
    findingsTab: function () {
        $('#offline-workflow-link-findings')[0].click();
    },
};

$(document).ready(function() {
    init();

    /**
     * When we click a thumb (with the mouse or triggered via js, select the first slice.
     */
    $('.thumb a').click(function() {
        $('#largeImage').css({'opacity': 0});
        setFirstSlice();
    });


    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        do {

            if (typeof request.series !== "undefined") {
                navigate.series(request.series);
                break;
            }

            if (typeof request.slice !== "undefined") {
                navigate.to(request.slice);
                break;
            }

            let series = {};
            for (let n in stackedImages) {
                series[n] = {};
                series[n].count = stackedImages[n].images.length;
                series[n].default = stackedImages[n].images[0].position;
            }

            sendResponse({
                name: store.name(),
                global: global.name(),
                series: series
            });

        } while(false);

    });

});
