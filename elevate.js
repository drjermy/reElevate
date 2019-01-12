let wrapperPaddingTop, wrapperPaddingBottom, largeImageMarginLeft;

function init() {
    let wrapper = $('#wrapper');
    wrapperPaddingTop = wrapper.css('padding-top');
    wrapperPaddingBottom = wrapper.css('padding-bottom');
    largeImageMarginLeft = $('#largeImage').css('margin-left');

    if ($('.slide').length > 0) {
        maximise.hide();
    }
    wrapper.css('opacity', 1);
}


function calculateImageWrapperSize() {
    let wrapper = $('.offline-workflow-outer-wrapper');
    let wrapperHeight = wrapper.height();
    let wrapperWidth = wrapper.width();
    let imageDimension, top;
    if (wrapperHeight < wrapperWidth) {
        imageDimension = wrapperHeight;
        top = 0;
    } else {
        imageDimension = wrapperWidth;
        top = (wrapperHeight - imageDimension)/2;
    }
    return {
        height: imageDimension + 'px',
        width: imageDimension + 'px',
        top: top + 'px',
        left: 0
    }
}

function setImageWrapperSize() {
    let imageWrapperSize = calculateImageWrapperSize();
    $('.offline-workflow-image-wrapper').css(imageWrapperSize);
    $('#offline-workflow-study-large-image').css({width: imageWrapperSize.width, height: imageWrapperSize.height});
}

init();