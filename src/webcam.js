/*global navigator, window */

/**
 * A simple interface to capture set up a web camera decoupled from optical flow.
 * Also includes a canvas similar to videoFlow.js where we give access to pixels.
 * @param defaultVideoTag {DOMElement} optional reference to <video> tag
 *   where web camera output should be rendered. If parameter is not
 *   present a new invisible <video> tag is created.
 */
/* public export */ 
function WebCam(defaultVideoTag) {
    var videoTag,
        isCapturing = false,
        localStream,
        canvas,
        ctx,
        width,
        height,
        currentPixels,
        lastPixels,
        loopId,
        updatedCallbacks = [],

        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function( callback ) { window.setTimeout(callback, 1000 / 60); },
        cancelAnimFrame =  window.cancelAnimationFrame ||
                           window.mozCancelAnimationFrame;

        onWebCamFail = function onWebCamFail(e) {
            if(e.code === 1){
                console.error('You have denied access to your camera. I cannot do anything.');
            } else { 
                console.error('getUserMedia() is not supported in your browser.');
            }
        },
        initCapture = function() {
            videoTag = defaultVideoTag || window.document.createElement('video');
            videoTag.setAttribute('autoplay', true);
            
            // start capture
            navigator.getUserMedia({ video: true }, function(stream) {
                isCapturing = true;
                localStream = stream;
                videoTag.src = window.URL.createObjectURL(stream);
                if (stream) {
                    return true;
                }
            }, onWebCamFail);
        },

        initView = function () {
            width = videoTag.videoWidth;
            height = videoTag.videoHeight;

            if (!canvas) { canvas = window.document.createElement('canvas'); }
            ctx = canvas.getContext('2d');
        },

        animloop = function () { 
            loopId = requestAnimFrame(animloop); 
            if (isCapturing) {
                // current pixels
                width = videoTag.videoWidth;
                height = videoTag.videoHeight;
                canvas.width  = width;
                canvas.height = height;

                if (width && height) {
                    lastPixels = currentPixels;

                    ctx.drawImage(videoTag, 0, 0);
                    var imgd = ctx.getImageData(0, 0, width, height);
                    currentPixels = imgd.data;

                    updatedCallbacks.forEach(function (callback) {
                        callback();
                    });
                }
            }
        };

    if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;
    }
    
    // our public API
    this.startCapture = function () {
        if (!isCapturing) {
            initCapture(); // capture
            initView();    // canvas
            animloop();    // animation
        }
    };

    this.stopCapture = function() {
        isCapturing = false;
        if (videoTag) { videoTag.pause(); }
        if (localStream) { localStream.stop(); }
        cancelAnimFrame(loopId);
    };

    this.onUpdated = function (callback) {
        updatedCallbacks.push(callback);
    };

    this.getCurrentPixels = function(){
        return currentPixels;
    };

    this.getLastPixels = function(){
        return lastPixels;
    };

    this.getWidth = function(){
        return width;
    };

    this.getHeight = function(){
        return height;
    }

}