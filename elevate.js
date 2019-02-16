let wrapper, wrapperPaddingTop, wrapperPaddingBottom, largeImageMarginLeft, hasImages, isSlide, stackedImages, offlineMode, playlistVars, jumpURL, context;

function init() {
    wrapper = $('#wrapper');
    wrapperPaddingTop = wrapper.css('padding-top');
    wrapperPaddingBottom = wrapper.css('padding-bottom');
    largeImageMarginLeft = $('#largeImage').css('margin-left');
    isSlide = ($('.slide').length > 0 ? true : false);
    hasImages = ($('#largeImage img').length > 0 ? true : false);
    
    bindKeyboardShortcuts();
    getPageVariables();
    getPlaylistVarsFromURL();
    saveHistory();
    elementVisibility();
    setFirstSlice();
    if (hasImages && !isSlide) {
        canvas.setup();
    } else {
        fadeIn();
    }
}


function getPageVariables()
{
    let pageVariables = retrieveWindowVariables(["stackedImages", "caseIDs", "currentCaseID", "studies", "components", "offlineMode"]);

    stackedImages = pageVariables['stackedImages'];
    offlineMode = pageVariables['offlineMode'];
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


function saveHistory() {
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
    },
    all: function (callback) {
        let playlistContext = global.name();
        chrome.storage.local.get([playlistContext], function(result) {
            if (typeof result[playlistContext] === "undefined") {
                result[playlistContext] = {};
            }
            callback(result[playlistContext]);
        });
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
    all: function (callback) {
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


function elementVisibility() {

    if (isSlide === true) {
        maximise.slideHide();
    } else {

        elements.presentingDefaults();
        global.all(function (global) {

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

                if (global.narrowSidebar) {
                    elements.sidebar.narrow();
                    elements.sidebar.tabs.hide();
                } else {
                    elements.sidebar.reflow();
                }
            });

            // Set maximise, and hide header, sidebar and footer if required.
            header.setVisibility();
            sidebar.setVisibility();
            footer.setVisibility();
            maximise.setVisibility();
        });

    }
}


elements = {
    header: {
        hide: () => {
            if (header.visible === true) {
                $('#headerWrapper').hide();
                $('#wrapper').css('padding-top', '16px');
                setImageWrapperSize();
            }
        },
        show: () => {
            if (header.visible === false) {
                $('#headerWrapper').show();
                $('#wrapper').css('padding-top', wrapperPaddingTop);
                setImageWrapperSize();
            }
        }
    },
    sidebar: {
        hide: () => {
            if (sidebar.visible === true) {
                $('#navTab').hide();
                $('#largeImage').css('margin-left', 0);
                setImageWrapperSize();
            }
        },
        show: () => {
            if (sidebar.visible === false) {
                $('#largeImage').css('margin-left', largeImageMarginLeft);
                $('#navTab').show();
                setImageWrapperSize();
            }
        },
        tabs: {
            hide: () => {
                $('.offline-workflow-tabs').hide();
                $('.offline-workflow-tabs-content-container').css('top', '0');
            }
        },
        narrow: () => {
            $('#offline-workflow-thumbnails-pane .thumb').addClass('clear-left');
            $('.thumb span').hide();
            $('#navTab .container').css('width', '96px');
            $('#largeImage').css('margin-left', '140px');
            largeImageMarginLeft = $('#largeImage').css('margin-left');
        },
        reflow: () => {
            $('#offline-workflow-thumbnails-pane .thumb').removeClass('clear-left');
            $('#offline-workflow-thumbnails-pane .thumb:visible:even').addClass('clear-left');
        }
    },
    footer: {
        hide: () => {
            if (footer.visible === true) {
                $('#footer').hide();
                $('#wrapper').css('padding-bottom', '16px');
                setImageWrapperSize();
            }
        },
        show: () => {
            if (footer.visible === false) {
                $('#footer').show();
                $('#wrapper').css('padding-bottom', wrapperPaddingBottom);
                setImageWrapperSize();
            }
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

                let isRead = thumbs.isCurrentRead();
                if (typeof isRead === "undefined") {
                    if ((globalDefaultToTopImage === true && pageDefaultSlice !== true) || (globalDefaultToTopImage !== true && pageDefaultToTopImage === true)) {
                        navigate.top();
                    } else {
                        if (typeof result['series' + getCurrentSeriesNumber()] !== "undefined") {
                            let startingSlice = result['series' + getCurrentSeriesNumber()]['startingSlice'];
                            if (startingSlice) {
                                navigate.to(startingSlice - 1);
                            }
                        }
                    }
                }

                if (Number(stackedImages[getCurrentSeriesNumber()].images.length) === 1) {
                    $('.scrollbar').hide();
                } else {
                    $('.scrollbar').show();
                }
                canvas.resize();

                fadeIn();
                canvas.visibility.fadeIn();

                thumbs.markCurrentRead();
            });
        });
    } else {
        fadeIn();
    }
}


function fadeIn()
{
    wrapper.css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
}


/**
 *
 * @type {{image: HTMLImageElement, setup: canvas.setup, load: canvas.load, resize: canvas.resize}}
 */
let canvas = {
    defaults: {
        zoom: 1,
        left: 0,
        top: 0,
        crop_top: 0,
        crop_right: 0,
        crop_bottom: 0,
        crop_left: 0,
        rotate: 0
    },
    settings: {},
    limits: {
        zoom: {
            in: 3,
            out: 0.5
        }
    },
    increments: {
        zoom: 0.02,
        left: 5,
        top: 5,
        crop: 5,
        rotate: 2
    },
    rounding: {
        zoom: 2
    },
    image: new Image(),
    visibility: {
        hide: function () {
            $('#largeImage').hide();
        },
        fadeIn: function () {
            $('#largeImage').fadeIn(250);
        }
    },
    getSeriesSettings: function (currentSeries) {

        if (typeof currentSeries === "undefined") {
            currentSeries = getCurrentSeriesNumber();
        }

        if (typeof canvas.settings[currentSeries] === "undefined") {
            canvas.settings[currentSeries] = {};
        }

        $.each(canvas.defaults, function (varName, varValue) {
            if (typeof canvas.settings[currentSeries][varName] === "undefined") {
                canvas.settings[currentSeries][varName] = varValue;
            }
        });

        let response = {};
        $.each(canvas.settings[currentSeries], function (varName, varValue) {
            if (typeof canvas.rounding[varName] !== "undefined") {
                response[varName] = Number(varValue).toFixed(canvas.rounding[varName]);
            } else {
                response[varName] = Number(varValue).toFixed(0);
            }
        });

        return response;
    },
    getStudySettings: function () {
        let lastPositions = {};
        $('.thumb').each(function () {
            let id = $(this).attr('id').split('offline-workflow-thumb-')[1];
            lastPositions[id] = canvas.getSeriesSettings(id);
        });
        return lastPositions;
    },
    saveSlicePosition: function () {
        let currentSeries = getCurrentSeriesNumber();
        let slice = findIndex('fullscreen_filename', $('#largeImage img').attr('src'), stackedImages[currentSeries]['images']);
        if (typeof stackedImages[currentSeries]['images'][slice] !== "undefined") {
            let sliceNumber = stackedImages[currentSeries]['images'][slice].position;
            if (typeof canvas.settings[currentSeries] === "undefined") canvas.settings[currentSeries] = {};
            canvas.settings[currentSeries].startingSlice = sliceNumber;
        }
    },
    set: {
        context: function () {
            context = document.getElementById('imageCanvas').getContext("2d");
        },
        width: function () {
            if ($('.scrollbar').is(':visible')) {
                context.canvas.width = $('#largeImage').width()-16-$('.scrollbar').width();
            } else {
                context.canvas.width = $('#largeImage').width();
            }
        },
        height: function () {
            context.canvas.height = $('#largeImage').height();
        }
    },
    setup: function () {
        $('.offline-workflow-outer-wrapper').prepend('<canvas id="imageCanvas"></canvas>');
        $('.offline-workflow-control-wrapper').hide();
        $(".scrollbar").appendTo(".offline-workflow-outer-wrapper");
        canvas.set.context();
        canvas.set.width();
        canvas.set.height();

        canvas.image.src = $('#offline-workflow-study-large-image').attr('src');

        $('#largeImage img').on('load', function (e) {
            canvas.image.src = $('#largeImage img').attr('src');
        });

        canvas.postLoad();
    },
    reload: function () {
        canvas.image.src = $('#largeImage img').attr('src');
    },
    postLoad: function () {
        store.all(function (result) {
            $.each(result, function (seriesName, stateObject) {
                if (seriesName.includes('series')) {
                    let n = Number(seriesName.split('series')[1]);
                    if (typeof canvas.settings[n] === "undefined") canvas.settings[n] = {};
                    $.each(stateObject, function (varName, varValue) {
                        canvas.settings[n][varName] = Number(varValue);
                    });
                }
            });
            canvas.reload();
        });
    },
    resize: function () {
        if (isSlide) return;
        canvas.set.width();
        canvas.set.height();
        canvas.reload();
    },
    study: {
        destate: function () {
            $('.thumb').removeAttr('data-state');
        }
    },
    series: {
        reset: function () {
            canvas.settings[getCurrentSeriesNumber()] = JSON.parse(JSON.stringify(canvas.defaults));
            canvas.series.destate();
            canvas.reload();
        },
        unsaved: function () {
            $('#navTab .thumbnails .active').parent('.thumb').attr('data-state', 'unsaved');
        },
        destate: function () {
            $('#navTab .thumbnails .active').parent('.thumb').removeAttr('data-state');
        }
    },
    zoom: {
        in: function () {
            if (canvas.settings[getCurrentSeriesNumber()].zoom < canvas.limits.zoom.in) {
                if (canvas.settings[getCurrentSeriesNumber()].zoom.toFixed(2) == 1.00) {
                    canvas.settings[getCurrentSeriesNumber()].zoom = 1.01;
                } else {
                    canvas.settings[getCurrentSeriesNumber()].zoom += canvas.increments.zoom;
                }
                canvas.reload();
                canvas.series.unsaved();
            }
        },
        out: function () {
            if (canvas.settings[getCurrentSeriesNumber()].zoom > canvas.limits.zoom.out) {
                if (canvas.settings[getCurrentSeriesNumber()].zoom.toFixed(2) == 1.01) {
                    canvas.settings[getCurrentSeriesNumber()].zoom = 1;
                } else {
                    canvas.settings[getCurrentSeriesNumber()].zoom -= canvas.increments.zoom;
                }
                canvas.reload();
                canvas.series.unsaved();
            }
        }
    },
    move: {
        left: function () {
            canvas.settings[getCurrentSeriesNumber()].left -= canvas.increments.left;
            canvas.series.unsaved();
            canvas.reload();
        },
        right: function () {
            canvas.settings[getCurrentSeriesNumber()].left += canvas.increments.left;
            canvas.series.unsaved();
            canvas.reload();
        },
        up: function () {
            canvas.settings[getCurrentSeriesNumber()].top -= canvas.increments.top;
            canvas.series.unsaved();
            canvas.reload();
        },
        down: function () {
            canvas.settings[getCurrentSeriesNumber()].top += canvas.increments.top;
            canvas.series.unsaved();
            canvas.reload();
        }
    },
    crop: {
        in: function (direction) {
            if (typeof direction !== "undefined") {
                canvas.settings[getCurrentSeriesNumber()][direction] += canvas.increments.crop;
            }
            canvas.series.unsaved();
            canvas.reload();
        },
        out: function (direction) {
            if (typeof direction !== "undefined") {
                canvas.settings[getCurrentSeriesNumber()][direction] -= canvas.increments.crop;
            }
            canvas.series.unsaved();
            canvas.reload();
        }
    },
    rotate: {
        clockwise: function () {
            canvas.settings[getCurrentSeriesNumber()].rotate += canvas.increments.rotate;
            canvas.series.unsaved();
            canvas.reload();
        },
        counter: function () {
            canvas.settings[getCurrentSeriesNumber()].rotate -= canvas.increments.rotate;
            canvas.series.unsaved();
            canvas.reload();
        }
    }
};


/**
 *
 */
canvas.image.onload = function () {

    let seriesCanvasSettings = canvas.getSeriesSettings();

    let canvasHeight, canvasWidth, canvasRatio;
    canvasHeight = context.canvas.height;
    canvasWidth = context.canvas.width;
    canvasRatio = canvasHeight/canvasWidth;

    let baseImageHeight, baseImageWidth, imageRatio;
    baseImageHeight = canvas.image.height;
    baseImageWidth = canvas.image.width;

    let sX, sY, sWidth, sHeight;

    sX = seriesCanvasSettings.crop_left;
    sY = seriesCanvasSettings.crop_top;
    sWidth = baseImageWidth - seriesCanvasSettings.crop_left - seriesCanvasSettings.crop_right;
    sHeight = baseImageHeight - seriesCanvasSettings.crop_top - seriesCanvasSettings.crop_bottom;

    imageRatio = sHeight/sWidth;

    let zoomImageHeight, zoomImageWidth, imageHeight, imageWidth, dX, dY;

    // Work out the image height based on current zoom level and orientation of image and canvas.
    if (imageRatio > canvasRatio) {
        zoomImageHeight = canvasHeight * seriesCanvasSettings.zoom;
        imageHeight = zoomImageHeight;
        imageWidth = (zoomImageHeight / imageRatio);
    } else {
        zoomImageWidth = canvasWidth * seriesCanvasSettings.zoom;
        imageWidth = zoomImageWidth;
        imageHeight = (zoomImageWidth * imageRatio);
    }

    // Calculate the image offset.
    dY = (canvasHeight-imageHeight)/2;
    dX = (canvasWidth - imageWidth)/2;

    // Alter base position of top, left.
    dX = Number(dX) + Number(seriesCanvasSettings.left);
    dY = Number(dY) + Number(seriesCanvasSettings.top);

    // Create a black rectangle behind a rotated image.
    let rotateDeg = seriesCanvasSettings.rotate * Math.PI/180;
    let rectWidth = Math.abs((imageHeight * Math.sin(rotateDeg))) + Math.abs((imageWidth * Math.cos(rotateDeg)));
    let rectHeight = Math.abs((imageWidth * Math.sin(rotateDeg))) + Math.abs((imageHeight * Math.cos(rotateDeg)));
    let rX = context.canvas.width/2 - rectWidth/2;
    let rY = context.canvas.height/2 - rectHeight/2;

    // Clear the canvas.
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Create a rectangle behind the rotated image.
    context.fillRect(rX, rY, rectWidth, rectHeight);
    context.save();
    context.translate(context.canvas.width/2, context.canvas.height/2);
    context.rotate(rotateDeg);

    // Draw the image.
    context.drawImage(canvas.image, sX, sY, sWidth, sHeight, dX - context.canvas.width/2, dY - context.canvas.height/2, imageWidth, imageHeight);
    context.restore();

};


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


function setImageWrapperSize()
{
    canvas.resize();
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
        if (maximise.hidden === true) {
            if (header.visible === true) {
                header.hide();
            } else {
                header.show();
            }
        } else {
            if (header.visible === true) {
                header.hide();
                global.set('headerVisible', false);
            } else {
                header.show();
                global.set('headerVisible', true);
            }
        }
    },
    show: function () {
        elements.header.show();
        header.visible = true;
    },
    hide: function () {
        elements.header.hide();
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
        if (maximise.hidden === true) {
            if (sidebar.visible === true) {
                sidebar.hide();
            } else {
                sidebar.show();
            }
        } else {
            if (sidebar.visible === true) {
                sidebar.hide();
                global.set('sidebarVisible', false);
            } else {
                sidebar.show();
                global.set('sidebarVisible', true);
            }
        }
    },
    show: function () {
        elements.sidebar.show();
        sidebar.visible = true;
    },
    hide: function () {
        elements.sidebar.hide();
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
        if (maximise.hidden === true) {
            if (footer.visible === true) {
                footer.hide();
            } else {
                footer.show();
            }
        } else {
            if (footer.visible === true) {
                footer.hide();
                global.set('footerVisible', false);
            } else {
                footer.show();
                global.set('footerVisible', true);
            }
        }
    },
    show: function () {
        elements.footer.show();
        footer.visible = true;
    },
    hide: function () {
        elements.footer.hide();
        footer.visible = false;
    }
};


let maximise = {
    hidden: false,
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
            store.study('maximiseCase', false);
        } else {
            maximise.hide();
            store.study('maximiseCase', true);
        }
    },
    show: function () {
        header.setVisibility();
        sidebar.setVisibility();
        footer.setVisibility();
        maximise.visible = true;
        maximise.hidden = false;
    },
    hide: function () {
        maximise.visible = false;
        maximise.hidden = true;
        header.visible = false;
        sidebar.visible = false;
        footer.visible = false;
        elements.maximise.hide();
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
            if (i++ > 300) break;
            console.log(firstImage === $('#largeImage img').attr('src'));
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
        global.get('history', function (result) {
            let history = result.history;
            if (Array.isArray(history)) {
                let currentURL = history.pop();
                let previousURL = history.pop();
                global.set('history', history);
                window.location.href = previousURL;
            } else {
                window.history.back();
            }
        });
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


function bindKeyboardShortcuts() {
    $(document).bind('keyup', 'h', function () {
        header.toggle();
    });

    $(document).bind('keyup', 's', function () {
        sidebar.toggle();
    });

    $(document).bind('keyup', 'f', function () {
        footer.toggle();
    });

    $(document).bind('keyup', 'm', function () {
        maximise.toggle();
    });

    $(document).bind('keyup', 'shift+left', function () {
        navigate.previous();
    });

    $(document).bind('keyup', 'b', function () {
        navigate.back();
        init();
    });

    $(document).bind('keyup', 'shift+right', function () {
        navigate.next();
    });

    $(document).bind('keyup', 'left', function () {
        // Need to have this to make maximised forward action work correctly.
        navigate.previous();
        init();
    });

    $(document).bind('keyup', 'right', function () {
        // Need to have this to make maximised forward action work correctly.
        navigate.orange();
    });

    $(document).bind('keyup', 'pageup', function () {
        navigate.up(5);
    });

    $(document).bind('keyup', 'pagedown', function () {
        navigate.down(5);
    });

    $(document).bind('keyup', 'home', function () {
        navigate.top();
    });

    $(document).bind('keyup', 'end', function () {
        navigate.bottom();
    });

    $(document).bind('keyup', 'q', function () {
        navigate.imagesTab();
    });

    $(document).bind('keyup', 'w', function () {
        navigate.questionsTab();
    });

    $(document).bind('keyup', 'e', function () {
        navigate.findingsTab();
    });

    $(document).bind('keyup', 'p', function () {
        presentation.open();
    });

    $(document).bind('keyup', 'j', function () {
        navigate.jumpTo();
    });


    $(document).bind('keyup', 'i', function () {
        init();
    });


    // ZOOM

    $(document).bind('keydown', '=', function () {
        canvas.zoom.in();
    });

    $(document).bind('keydown', '-', function () {
        canvas.zoom.out();
    });


    // PAN

    $(document).bind('keydown', ',', function () {
        canvas.move.left();
    });

    $(document).bind('keydown', '/', function () {
        canvas.move.right();
    });

    $(document).bind('keydown', ';', function () {
        canvas.move.up();
    });

    $(document).bind('keydown', '.', function () {
        canvas.move.down();
    });


    // CROP

    $(document).bind('keydown', '[', function () {
        canvas.crop.in('crop_left');
    });

    $(document).bind('keydown', 'shift+[', function () {
        canvas.crop.out('crop_left');
    });

    $(document).bind('keydown', ']', function () {
        canvas.crop.in('crop_right');
    });

    $(document).bind('keydown', 'shift+]', function () {
        canvas.crop.out('crop_right');
    });

    $(document).bind('keydown', 'o', function () {
        canvas.crop.in('crop_top');
    });

    $(document).bind('keydown', 'shift+o', function () {
        canvas.crop.out('crop_top');
    });

    $(document).bind('keydown', 'k', function () {
        canvas.crop.in('crop_bottom');
    });

    $(document).bind('keydown', 'shift+k', function () {
        canvas.crop.out('crop_bottom');
    });


    // ROTATE

    $(document).bind('keydown', '\\', function () {
        canvas.rotate.clockwise();
    });

    $(document).bind('keydown', 'shift+\\', function () {
        canvas.rotate.counter();
    });


    // RESET

    $(document).bind('keydown', 'r', function () {
        canvas.series.reset();
    });


    $('#offline-workflow-page-links li').each(function (n, value) {
        let key = n+1;
        $(document).bind('keyup', 'shift+' + key.toString(), function () {
            navigate.study(key);
        });
    });

    $('.thumb').each(function (n, value) {
        let key = n+1;
        $(document).bind('keyup', key.toString(), function () {
            navigate.series(n);
        });
    });

}


$(document).ready(function() {
    init();

    $( window ).resize(function() {
        setImageWrapperSize();
    });

    /**
     * When we click a thumb (with the mouse or triggered via js, select the first slice.
     */
    $('.thumb a').click(function() {
        canvas.visibility.hide();
        setFirstSlice();
    });


    /**
     * Save the position of the last viewed image to the div.
     */
    $('#largeImage img').on('load', function (e) {
        canvas.saveSlicePosition();
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
                    case 'zoom':
                        canvas.zoom.in();
                        break;
                    case 'unzoom':
                        canvas.zoom.out();
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
                    sendResponse(canvas.getStudySettings());
                    // We call this function to get all data to then save. Mark the study as not unsaved.
                    // TODO In reality, this should probably occur once we have confirmed save.
                    canvas.study.destate();
                    break;
                }

                if (typeof request.getData !== "undefined") {
                    sendResponse({
                        series: current.series(),
                        state: canvas.getSeriesSettings()
                    });
                    // We call this function to get data for this series. Mark this series as not unsaved.
                    // TODO In reality, this should probably occur once we have confirmed save.
                    canvas.series.destate();
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
                    series[n].state = $('#offline-workflow-thumb-' + n).attr('data-state');
                }

                let response = {
                    study: store.name(),
                    case: store.case_id(),
                    playlist: global.name(),
                    series: series,
                    currentSeries: getCurrentSeriesNumber(),
                    isSlide: isSlide,
                    hasImages: hasImages
                };

                sendResponse(response);

            }

        } while(false);

    });

});
