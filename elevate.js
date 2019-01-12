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

let header = {
    visible: true,
    toggle: function () {
        if (header.visible === true) header.hide();
        else header.show();
    },
    show: function () {
        $('#wrapper').css('padding-top', wrapperPaddingTop);
        $('#headerWrapper').show();
        setImageWrapperSize();
        header.visible = true;
    },
    hide: function () {
        $('#headerWrapper').hide();
        $('#wrapper').css('padding-top', '16px');
        setImageWrapperSize();
        header.visible = false;
    }
};

let sidebar = {
    visible: true,
    toggle: function () {
        if (sidebar.visible === true) sidebar.hide();
        else sidebar.show();
    },
    show: function () {
        $('#largeImage').css('margin-left', largeImageMarginLeft);
        $('#navTab').show();
        setImageWrapperSize();
        sidebar.visible = true;
    },
    hide: function () {
        $('#navTab').hide();
        $('#largeImage').css('margin-left', 0);
        setImageWrapperSize();
        sidebar.visible = false;
    }
};

let footer = {
    visible: true,
    toggle: function () {
        if (footer.visible === true) footer.hide();
        else footer.show();
    },
    show: function () {
        $('#footer').show();
        $('#wrapper').css('padding-bottom', wrapperPaddingBottom);
        setImageWrapperSize();
        footer.visible = true;
    },
    hide: function () {
        $('#footer').hide();
        $('#wrapper').css('padding-bottom', 0);
        setImageWrapperSize();
        footer.visible = false;
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
    }
};

init();