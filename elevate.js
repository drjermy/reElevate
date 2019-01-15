let wrapper, wrapperPaddingTop, wrapperPaddingBottom, largeImageMarginLeft, isSlide, stackedImages;

function init() {
    wrapper = $('#wrapper');
    wrapperPaddingTop = wrapper.css('padding-top');
    wrapperPaddingBottom = wrapper.css('padding-bottom');
    largeImageMarginLeft = $('#largeImage').css('margin-left');
    if ($('.slide').length > 0) isSlide = true;

    saveHistory();
    initVisibility();
    getPageVariables();
    setFirstSlice();
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
    wrapper.css({'opacity': 1, 'transition': 'opacity .2s ease-out'});
    $('#largeImage img').trigger('mouseover');

}


function saveHistory() {
    chrome.storage.local.get(['backAction'], function (result) {
        if (result.backAction === true) {
            chrome.storage.local.set({backAction: false}, function () {});
            chrome.storage.local.get(['history'], function (result) {
                result.history.pop();
                chrome.storage.local.set({history: result.history}, function () {});
            });
        } else {
            let currentURL = window.location.href;
            chrome.storage.local.get(['history'], function (result) {
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
                chrome.storage.local.set({history: history}, function () {});
            });
        }
    });
}


function getPageVariables()
{
    let pageVariables = retrieveWindowVariables(["stackedImages", "caseIDs", "currentCaseID", "studies", "components"])
    stackedImages = pageVariables['stackedImages'];
}


/**
 * Determine which is the first slice that should be shown and select it.
 */
function setFirstSlice()
{
    chrome.storage.sync.get(['defaultToTopImage'], function (result) {
        if (result.defaultToTopImage === true) {
            navigate.top();
        }
    });
}


// https://stackoverflow.com/questions/3955803/page-variables-in-content-script
function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', JSON.stringify(" + currVariable + "));\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $.parseJSON($("body").attr("tmp_" + currVariable));
        $("body").removeAttr("tmp_" + currVariable);
    }

    $("#tmpScript").remove();

    return ret;
}


var findIndex = function (key, val, arr) {
    for (var i = 0, j = arr.length; i < j; i++) {
        if (arr[i].hasOwnProperty(key)) {
            if (arr[i][key] == val) {
                return i;
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
    let currentTab = $('#navTab .thumbnails .active').parent('.thumb').attr('id');
    let currentSeries = Number(currentTab.replace('offline-workflow-thumb-', ''));
    return stackedImages[currentSeries]['images'];
}


function firstStudyImage()
{
    let images = currentStudyImages();
    let firstImageIndex = findIndex('position', 1, images);
    return images[firstImageIndex]['public_filename'];
}


function lastStudyImage()
{
    let images = currentStudyImages();
    let lastImageIndex = findIndex('position', images.length, images);
    return images[lastImageIndex]['public_filename'];
}


let header = {
    visible: true,
    setVisibility: function () {
        chrome.storage.local.get(['headerVisible'], function (result) {
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
        $('#wrapper').css('padding-top', wrapperPaddingTop);
        $('#headerWrapper').show();
        setImageWrapperSize();
        header.visible = true;
        chrome.storage.local.set({headerVisible: true}, function () {});
    },
    hide: function () {
        $('#headerWrapper').hide();
        $('#wrapper').css('padding-top', '16px');
        setImageWrapperSize();
        chrome.storage.local.set({headerVisible: false}, function () {});
        header.visible = false;
    },
    slideHide: function () {
        $('#headerWrapper').hide();
        $('#wrapper').css('padding-top', '16px');
        setImageWrapperSize();
    }
};


let sidebar = {
    visible: true,
    setVisibility: function () {
        chrome.storage.local.get(['sidebarVisible'], function (result) {
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
        $('#largeImage').css('margin-left', largeImageMarginLeft);
        $('#navTab').show();
        setImageWrapperSize();
        chrome.storage.local.set({sidebarVisible: true}, function () {});
        sidebar.visible = true;
    },
    hide: function () {
        $('#navTab').hide();
        $('#largeImage').css('margin-left', 0);
        setImageWrapperSize();
        chrome.storage.local.set({sidebarVisible: false}, function () {});
        sidebar.visible = false;
    },
    slideHide: function () {
        $('#navTab').hide();
        $('#largeImage').css('margin-left', 0);
        setImageWrapperSize();
    }
};


let footer = {
    setVisibility: function () {
        chrome.storage.local.get(['footerVisible'], function (result) {
            if (result.footerVisible === false) {
                footer.hide();
            }
        });
    },
    visible: true,
    toggle: function () {
        if (footer.visible === true) footer.hide();
        else footer.show();
    },
    show: function () {
        $('#footer').show();
        $('#wrapper').css('padding-bottom', wrapperPaddingBottom);
        setImageWrapperSize();
        chrome.storage.local.set({footerVisible: true}, function () {});
        footer.visible = true;
    },
    hide: function () {
        $('#footer').hide();
        $('#wrapper').css('padding-bottom', 0);
        setImageWrapperSize();
        chrome.storage.local.set({footerVisible: false}, function () {});
        footer.visible = false;
    },
    slideHide: function () {
        $('#footer').hide();
        $('#wrapper').css('padding-bottom', 0);
        setImageWrapperSize();
    }
};


let maximise = {
    visble: true,
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
    },
    hide: function () {
        maximise.state.header = header.visible;
        maximise.state.sidebar = sidebar.visible;
        maximise.state.footer = footer.visible;
        header.hide();
        sidebar.hide();
        footer.hide();
    },
    slideHide: function () {
        header.slideHide();
        sidebar.slideHide();
        footer.slideHide();
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
        console.log(firstImage);
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
        chrome.storage.local.set({backAction: true}, function () {});
        chrome.storage.local.get(['history'], function (result) {
            let history = result.history;
            if (Array.isArray(history) && history.slice(-2)[0]) {
                window.location.href = history.slice(-2)[0];
            } else {
                navigate.previous();
            }
        });
    },
    orange: function () {
        $('a.orange')[0].click();
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

init();


/**
 * When we click a thumb (with the mouse or triggered via js, select the first slice.
 */
$('.thumb a').click(function() {
    setFirstSlice();
});
