let wrapper, wrapperPaddingTop, wrapperPaddingBottom, largeImageMarginLeft, isSlide, stackedImages, offlineMode, playlistVars, jumpURL;

function init() {
    wrapper = $('#wrapper');
    wrapperPaddingTop = wrapper.css('padding-top');
    wrapperPaddingBottom = wrapper.css('padding-bottom');
    largeImageMarginLeft = $('#largeImage').css('margin-left');
    if ($('.slide').length > 0) isSlide = true;

    getPageVariables();
    getPlaylistVarsFromURL();
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
        },
        show: () => {
            elements.header.show();
            elements.sidebar.show();
            elements.footer.show();
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
    },
};


function elementVisibility() {
    elements.presentingDefaults();
    global.get('hideFindings', function (global) {

        let caseEntry = global[store.case_id()];
        let study = global[store.name()];

        jumpURL = global.jumpURL;
        caseEntry = (typeof caseEntry !== "undefined" ? caseEntry : {});
        study = (typeof study !== "undefined" ? study : {});

        if (global.hideTabs === true) {
            elements.sidebar.tabs.hide();
        }

        if ((global.hideFindings === true && caseEntry.showFindings !== true) || (global.hideFindings !== true && caseEntry.hideFindings === true)) {
            elements.findingsTab.disable();
            elements.rid.hide();
        }

        if (global.showPresentation === true || caseEntry.showPresentation === true) {
            presentation.init(caseEntry);
        }

        if (study.maximiseCase === true) {
            elements.maximise.hide();
            maximise.visible = false;
        }

        // We save the starting Series as if they started from 1, but the thumbs are 0-indexed.
        if (typeof study.startingSeries !== "undefined") {
            let n = Number(study.startingSeries) - 1;
            navigate.series(n);
        }

        $('#offline-workflow-thumbnails-pane .thumb').each(function () {
            let id = $(this).attr('id').split('offline-workflow-thumb-')[1];
            if (study['hideSeries' + id] === true) {
                $(this).hide();
            }
            $('#offline-workflow-thumbnails-pane .thumb').removeClass('clear-left');
            $('#offline-workflow-thumbnails-pane .thumb:visible:even').addClass('clear-left');
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
        maximise.setVisibility();
    }
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


let thumbs = {
    currentSeriesNumber: () => {
        if (isSlide) return false;
        let currentTab = $('#navTab .thumbnails .active').parent('.thumb').attr('id');
        if (typeof currentTab !== "undefined") {
            return Number(currentTab.replace('offline-workflow-thumb-', ''));
        }
    },
    markCurrentRead: () => {
        let currentSeriesNumber = thumbs.currentSeriesNumber();
        $('#offline-workflow-thumb-' + currentSeriesNumber).attr('data-read', true);
    },
    isCurrentRead: () => {
        let currentSeriesNumber = thumbs.currentSeriesNumber();
        return $('#offline-workflow-thumb-' + currentSeriesNumber).attr('data-read');
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

                let isRead = thumbs.isCurrentRead();
                if (typeof isRead === "undefined") {
                    if ((globalDefaultToTopImage === true && pageDefaultSlice !== true) || (globalDefaultToTopImage !== true && pageDefaultToTopImage === true)) {
                        navigate.top();
                    } else {
                        if (result[studySliceName]) {
                            navigate.to(result[studySliceName] - 1);
                        }
                    }
                }

                fadeIn();
                $('#largeImage').css({'opacity': 1, 'transition': 'opacity .2s ease-out'});

                thumbs.markCurrentRead();
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
                if (arr[i][key] === val) {
                    return i;
                }
            }
        }
    }
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
    if (typeof currentSeriesNumber !== "undefined") {
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


/**
 * Get an object that records the last positions of the images in each series.
 */
function getLastImagePositions()
{
    let lastPositions = {};
    $('.thumb').each(function () {
        let id = $(this).attr('id').split('offline-workflow-thumb-')[1];
        lastPositions[id] = $(this).attr('data-last-image');
    });
    return lastPositions;
}


let current;
current = {
    image: function () {
        return $('#largeImage img').attr('src');
    },
    series: function () {
        return getCurrentSeriesNumber();
    },
    slice: function () {
        let filename = current.image();
        let images = currentStudyImages();
        let slice = findIndex('fullscreen_filename', filename, images);
        return images[slice]['position'];
    }
};


let presentation;
presentation = {
    response: '',
    storage: {},
    data: {},
    init: (storage) => {
        presentation.storage = storage;
        presentation.getData();
        presentation.createTab();
    },
    url: () => {
        if (offlineMode) {
            let urlSansFilename = location.href.replace(/[^/]*$/, '');
            return urlSansFilename + 'play_' + playlistVars.playlistId + '_entry_' + playlistVars.entryId + '_case_' + playlistVars.caseId + '_presentation.html';
        } else {
            return 'https://radiopaedia.org/play/' + playlistVars.playlistId + '/entry/' + playlistVars.entryId + '/case/' + playlistVars.caseId + '/presentation';
        }
    },
    loadFromStorage: () => {
        let storage = presentation.storage;
        if (storage.presentationAge) presentation.data.age = storage.presentationAge;
        if (storage.presentationGender) presentation.data.gender = storage.presentationGender;
        if (storage.presentationPresentation) presentation.data.presentation = storage.presentationPresentation;
    },
    getData: () => {
        $.ajax({
            url: presentation.url(),
            cache: false,
            success: function (response) {
                presentation.response = response;
                presentation.parse.all();
                presentation.loadFromStorage();
                presentation.injectionIntoQuestions();
            }
        });
    },
    parse: {
        all: () => {
            presentation.parse.presentation();
            presentation.parse.age();
            presentation.parse.gender();
        },
        presentation: () => {
            let response = presentation.response;
            presentation.data.presentation = $(response).find("div.presentation p:first").html();
        },
        age: () => {
            let response = presentation.response;
            $(response).find("div.presentation tr").each(function () {
                if (($(this).find('th').text()) == 'Age:') {
                    presentation.data.age = $(this).find('td').text();
                }
            })
        },
        gender: () => {
            let response = presentation.response;
            $(response).find("div.presentation tr").each(function () {
                if (($(this).find('th').text()) == 'Gender:') {
                    presentation.data.gender = $(this).find('td').text();
                }
            })
        }
    },
    createTab: () => {
        let questionsTab = $('.offline-workflow-tab-questions');
        questionsTab.removeClass('inactive');
        questionsTab.find('a').remove();
        questionsTab.append('<a class="questions offline-workflow-tab-link" id="offline-workflow-link-questions" href="#questions">Presentation</a>');
        navigate.imagesTab();
    },
    tabHTML: () => {
        return '\n' +
            '<p><strong>Age: </strong>\n' +
            '<span id="presentation-tab-age">' + presentation.data.age + '</span></p>\n' +
            '<p><strong>Gender: </strong>\n' +
            '<span id="presentation-tab-gender">' + presentation.data.gender + '</span></p>\n' +
            '<p><strong>Presentation: </strong>\n' +
            '<span id="presentation-tab-presentation">' + presentation.data.presentation + '</span></p>\n' +
            '</div>';
    },
    injectionIntoQuestions: () => {
        $('#offline-workflow-questions-pane').html(presentation.tabHTML());
    },
    open: () => {
        if ($('.offline-workflow-tabs .active a').attr('id') === 'offline-workflow-link-questions') {
            navigate.imagesTab();
        } else {
            navigate.questionsTab();
        }
    }
};


let store = {
    playlist_id: () => {
        return 'radiopaedia' + '-' + playlistVars.playlistId;
    },
    case_id: () => {
        return 'radiopaedia' + '-' + playlistVars.playlistId + '-' + playlistVars.entryId + '-' + playlistVars.caseId;
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
    },
    study: function (varName, value) {
        let gContext = global.name();
        chrome.storage.local.get([gContext], function(result) {
            if (typeof result[gContext] === "undefined") {
                result[gContext] = {};
            }
            let studyContext = store.name();
            if (typeof result[gContext][studyContext] === "undefined") {
                result[gContext][studyContext] = {};
            }
            result[gContext][studyContext][varName] = value;
            chrome.storage.local.set(result, function () {});
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
            } else {
                header.show();
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
            } else {
                sidebar.show();
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
            } else {
                footer.show();
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
    setVisibility: function () {
        store.get('maximiseCase', function (result) {
            if (result.maximiseCase === true) {
                maximise.hide();
            } else {
                maximise.show();
            }
        });
    },
    toggle: function () {
        if (maximise.visible === false) {
            maximise.show();
        } else {
            maximise.hide();
        }
    },
    show: function () {
        header.setVisibility();
        sidebar.setVisibility();
        footer.setVisibility();
        maximise.visible = true;
        store.study('maximiseCase', false);
    },
    hide: function () {
        maximise.visible = false;
        elements.maximise.hide();
        store.study('maximiseCase', true);
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
        window.history.back();
    },
    orange: function () {
        if (isSlide) {
            $('a.orange')[0].click();
        } else {
            $('.continue')[0].click();
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
    jumpTo: function () {
        if (typeof jumpURL !== "undefined") {
            if (offlineMode === true) {
                jumpURL = jumpURL.replace('/play', 'play').split('/').join('_') + '.html';
            } else {
                jumpURL = 'https://radiopaedia.org' + jumpURL;
            }
            window.location.replace(jumpURL);
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


    /**
     * Save the position of the last viewed image to the div.
     */
    $('#largeImage img').on('load', function (e) {
        let currentSeries = getCurrentSeriesNumber();
        let slice = findIndex('fullscreen_filename', $(this).attr('src'), stackedImages[currentSeries]['images']);
        $('#offline-workflow-thumb-' + currentSeries).attr('data-last-image', stackedImages[currentSeries]['images'][slice].position);
    });


    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        do {

            if (typeof request.action !== "undefined") {
                switch(request.action) {
                    case 'reload':
                        location.reload();
                        break;
                    case 'prev':
                        navigate.back();
                        break;
                    case 'next':
                        navigate.next();
                        break;
                    case 'up':
                        navigate.up(1);
                        break;
                    case 'down':
                        navigate.down(1);
                        break;
                }

                // Need to refresh the internal variables defined by current case.
                getPlaylistVarsFromURL();
                sendResponse({
                    study: store.name(),
                    playlist: global.name()
                });

            } else {

                if (typeof request.lastPositions !== "undefined") {
                    sendResponse(getLastImagePositions());
                    break;
                }

                if (typeof request.getData !== "undefined") {
                    sendResponse({
                        series: current.series(),
                        slice: current.slice()
                    });
                    break;
                }

                if (typeof request.series !== "undefined") {
                    navigate.series(request.series);
                    sendResponse({});
                    break;
                }

                if (typeof request.slice !== "undefined") {
                    navigate.to(request.slice);
                    sendResponse({});
                    break;
                }

                let series = {};
                for (let n in stackedImages) {
                    series[n] = {};
                    series[n].count = stackedImages[n].images.length;
                    series[n].default = stackedImages[n].images[0].position;
                }

                sendResponse({
                    study: store.name(),
                    case: store.case_id(),
                    playlist: global.name(),
                    series: series,
                    currentSeries: getCurrentSeriesNumber(),
                    isSlide: isSlide
                });

            }

        } while(false);

    });

});
