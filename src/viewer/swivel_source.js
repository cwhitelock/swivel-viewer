/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @fileoverview A simple javascript image viewer that allows the user to drag
 *               left and right to flip through images, or use the scroll
 *               wheel to zoom in and out.
 *
 */

goog.provide('swivel_viewer.Swivel');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math.Size');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.Uri');

/**
 * Constructor for the Swivel object.  If containerDiv is NULL, appends
 * the viewer DIV to the DOM.  Otherwise, puts it inside the specified element.
 *
 * @param {element} containerDiv if not NULL, append to this DIV
 * @param {Array} imageUrls set of image urls for displaying swivel images.
 * @param {number} width width of the swivel view.
 * @param {number} height height of the swivel view.
 * @constructor
 */
swivel_viewer.Swivel = function(containerDiv, imageUrls, width, height) {

  if (containerDiv == null) {
    this.swivelContents_ = document.createElement('div');
    this.swivelContents_.id = "SwivelContents";
    this.swivelContents_.style.width = width + "px";
    this.swivelContents_.style.height = height + "px";
    this.swivelContents_.style.position = "relative";
    document.body.appendChild(this.swivelContents_);
  } else {
    this.swivelContents_ = containerDiv;
  }

  this.doc_ = document;
  this.nPreloadImages_ = 6;
  // IE counts ',' instead of fields.
  var last = imageUrls.pop();
  if (last != null)
    imageUrls.push(last);
  this.imageUrls_ = imageUrls;
  this.swivelWidth_ = width;
  this.swivelHeight_ = height;
  this.imageWidth_ = width;
  this.imageHeight_ = height;
  this.swivelSize_ = new goog.math.Size(width, height);
  this.imageSize_ = new goog.math.Size(width, height);
  this.mouseWheelHandler_ = null;
  this.autoSpin_ = true;
  // Useful if you're loading images from picasa; rewrites image
  // URLs to load the most appropriate size for the current zoom
  // level:
  this.rewriteURLs_ = false;
  this.showImageIsWaitingForATimeout_ = false;

  this.initImages();
};

/**
 * A closure animation for fading out the zoom amount.
 * @type {goog.fx.dom.FadeOutAndHide}
 * @private
 */
swivel_viewer.Swivel.prototype.zoomFadeFx_ = null;

/**
 * Time (ms) to delay before trying to re-display an image.
 */
swivel_viewer.Swivel.REDISPLAY_IMAGE_DELAY = 1000;

/**
 * Number of re-tries for display of image before giving up.
 */
swivel_viewer.Swivel.IMAGE_DISPLAY_RETRIES = 10;

/**
 * Size of the help icon, so that it can be centered.
 */
swivel_viewer.Swivel.HELP_ICON_WIDTH = 200;
swivel_viewer.Swivel.HELP_ICON_HEIGHT = 90;

/**
 * Amount (percentage) to scale the canvas incrementally (ie., when the user
 * uses shift + wheel to grow or shrink the viewer window).
 */
swivel_viewer.Swivel.SCALE_INCREMENT = 0.1;

/**
 * The minimum window size, as a fraction of the original size.
 */
swivel_viewer.Swivel.MIN_SCALE = 0.25;

/**
 * The maximum window size, as a fraction of the original size.
 */
swivel_viewer.Swivel.MAX_SCALE = 10;

/**
 * Amount to scale images on each zoom step.
 */
swivel_viewer.Swivel.ZOOM_INCREMENT = 0.25;

/**
 * The minimum allowed zoom factor. Most images start to disappear any smaller
 * than this.
 */
swivel_viewer.Swivel.MIN_ZOOM = 1;

/**
 * The maximum allowed zoom factor, so that users don't get stuck at absurd
 * zoom levels.
 */ 
swivel_viewer.Swivel.MAX_ZOOM = 8;

/**
 * In addition to limiting by zoom level, limit by the maximum image size to
 * request.  That lets the user zoom a 100px viewer up to the full 1600px,
 * and limits an 800px viewer from trying to zoom in 10x.
 * Picasa serves images up to 1600px tall or wide.
 */
swivel_viewer.Swivel.MAX_IMAGE_DIMENSION = 1600;

/**
 * Duration (in ms) of the fade-out effect on the zoom indicator after each
 * zoom action.
 */
swivel_viewer.Swivel.ZOOM_FADE_TIMEOUT = 1200;

/**
 * Adjust image size and offset in initialization.
 * @private
 */
swivel_viewer.Swivel.prototype.initializeSizeAndOffset = function() {
  // Scale the images if they are too large for the view. This will scale
  // them down to fit, but never scale up.
  if (!this.imageSize_.fitsInside(this.swivelSize_)) {
    this.imageSize_ = this.imageSize_.scaleToFit(this.swivelSize_);
  }

  // Center the images within the view.
  this.leftIncrement_ = 0;
  var horizontalDiff = this.swivelSize_.width - this.imageSize_.width;
  if (horizontalDiff > 0) {
    this.leftIncrement_ = Math.floor(horizontalDiff / 2);
  }
  this.topIncrement_ = 0;
  var verticalDiff = this.swivelSize_.height - this.imageSize_.height;
  if (verticalDiff > 0) {
    this.topIncrement_ = Math.floor(verticalDiff / 2);
  }
};

/**
 * Initializes loading and display of the swivel images. Creates an Image object
 * for each image url. Creates an array that's the appropriate size to hold all
 * of the images. Starts loading every nth image. Once these are loaded, fill in
 * the gaps with the rest of the images. When a user tries to swivel, we will
 * check whether the image at that position has been loaded yet. If not, we'll
 * find the closest image that has been loaded.
 */
swivel_viewer.Swivel.prototype.initImages = function() {
  var imageCount = this.imageUrls_.length;
  this.imageArray_ = new Array(imageCount);

  this.initializeSizeAndOffset();
  // load up the imageArray with the sketchUp images
  var i = 0;
  var remainingIndices = new Array();
  // We preload nPreloadImages_. Calculate how many images to skip (incr) during
  // the pre-load, which is the total number of images over the number of
  // preloaded images.
  var incr = imageCount / this.nPreloadImages_;
  while (i < imageCount) {
    this.createImage(i);
    i++;

    if (i >= imageCount) {
      break;
    }

    // Skip images that will be loaded later. Count up to 'incr', incrementing
    // the index each time, and keep track of the indices we skipped.
    for ( var skip = 1; skip < incr; skip++) {
      remainingIndices.push(i);
      this.imageArray_[i] = null;
      i++;
      if (i >= imageCount) {
        break;
      }
    }
  }
  // Initialize the display based on the full count of images.
  this.initDisplay(remainingIndices);
};

swivel_viewer.Swivel.prototype.autoRotate = function() {
  if (!this.autoSpin_) {
    return false;
  }
  var imageCount = this.imageUrls_.length;
  this.addToPos_ = 1;
  // handle wrap around
  var wrap = (this.currentPos_ + this.addToPos_) % imageCount;

  var newPos = (wrap < 0) ? imageCount + wrap : wrap;
  // If the image at newPos exists, hide all the others and show that image.
  var img = this.imageArray_[newPos];
  if (this.hasLoadedInBrowser(img)) {
    for ( var i = 0; i < imageCount; i++) {
      if (this.imageArray_[i] != null) {
        this.hideImage(this.imageArray_[i]);
      }
    }
    this.showImage(newPos, 1);
  }
  this.currentPos_ += this.addToPos_;
  return true;
}


swivel_viewer.Swivel.prototype.updateURLs = function(img_width,
                                                 img_height) {
  if (!this.rewriteURLs_) {
    return;
  }

  var size_list = [32, 48, 64, 72, 94, 104, 110, 128, 144, 150, 160, 200,
                   220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024,
                   1152, 1280, 1440, 1600
                   ];
  // Grab size that is the smallest one larger than or equal to
  // width or height.
  var url_size = size_list[size_list.length - 1];
  for (var n = 0; n < size_list.length; n++) {
    var size = size_list[n];
    var thumb_width, thumb_height;
    if (img_width == img_height) {
      thumb_width = size;
      thumb_height = size;
    } else if (img_width > img_height) {
      thumb_width = size;
      thumb_height = parseInt((size * img_height) / img_width, 10);
    } else {
      thumb_width = parseInt((size * img_width) / img_height, 10);
      thumb_height = size;
    }
    if ((thumb_width >= img_width) || (thumb_height >= img_height)) {
      url_size = size;
      break;
    }
  }

  for (var n = 0; n < this.imageUrls_.length; n++) {
    var url_split = this.imageUrls_[n].split('/');
    var image_name = url_split.pop();
    url_split.pop();
    url_split.push('s' + url_size);
    url_split.push(image_name);
    this.imageUrls_[n] = url_split.join('/');
  }
};

/**
 * Create an Image object and add it to the image array. If the image size is
 * greater than the view size, scale the image.
 * 
 * @param {number} indx Index of the image to be created.
 */
swivel_viewer.Swivel.prototype.createImage = function(indx) {
  // Create an image object. Once the src is set, the browser will begin
  // to load the image.
  var dom = new goog.dom.DomHelper(this.doc_);
  var image = dom.createDom('img', {
    'src' :this.imageUrls_[indx]
  });
  this.imageArray_[indx] = image;
  this.resizeImage_(indx);
  // Hide the image until we swivel to it.
  this.hideImage(image);
  goog.dom.appendChild(this.swivelContents_, image);
};

swivel_viewer.Swivel.prototype.reloadImages_ = function() {
  for (var indx = 0; indx < this.imageArray_.length; ++indx) {
    var image = this.imageArray_[indx];
    image.src = this.imageUrls_[indx];
  }
};

/**
 * Resize the sheet by swivelSize_.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeSheet_ = function(sheet) {
  sheet.style.width = this.swivelSize_.width + "px";
  sheet.style.height = this.swivelSize_.height + "px";
  sheet.style.position = 'absolute';
  sheet.style.zIndex = '5';
  sheet.style.top = 0 + "px";
  sheet.style.left = 0 + "px";
};

/**
 * Resize the indx-th image by imageSize_ and offsets.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeImage_ = function(indx) {
  var image = this.imageArray_[indx];
  image.style.width = this.imageSize_.width;
  image.style.height = this.imageSize_.height;
  image.style.left = this.leftIncrement_ + "px";
  image.style.top = this.topIncrement_ + "px";
  image.style.overflow = "hidden";
  image.style.position = "relative";
  image.style.zIndex = "2";
};

/**
 * Once the images are loaded, sets the sketchUpImageArray to the temporary
 * array and initialize swivel parameters.
 * 
 * @param {Array} remainingIndices Indices for images that have not yet been
 *     created.
 */
swivel_viewer.Swivel.prototype.initDisplay = function(remainingIndices) {
  // Create a help message display that is shown until the user's first mouse
  // down.
  this.initHelpIcon();
  this.initZoomIndicator();

  var imageCount = this.imageArray_.length;

  this.currentPos_ = 0;
  this.addToPos_ = 0;
  this.mouseXOrig_ = 0;
  this.mouseX_ = 0;
  this.mouseY_ = 0;
  this.mouseIsDown_ = false;
  this.currentZoom_ = 1;
  this.currentScale_ = 1;

  // create a transparent sheet over the images so that the mouse
  // events go to it
  var dom = new goog.dom.getDomHelper(this.doc_);
  var sheet = dom.createDom('div', {'class' :'sheet'});
  sheet.id = "sheet";
  this.resizeSheet_(sheet);
  goog.style.setOpacity(sheet, 0);

  goog.dom.appendChild(this.swivelContents_, sheet);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEMOVE,
      this.doMouseMove, true, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEDOWN,
      this.doMouseDown, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEUP,
      this.doMouseUp, true, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
      this.swivelContents_);
  goog.events.listen(this.mouseWheelHandler_,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.zoom, false,
      this);
  this.currentPos_ = 0;
  
  // Add the remaining images.
  for (var n = 0; n < remainingIndices.length; n++) {
    this.createImage(remainingIndices[n]);
  }

  this.showImage(this.currentPos_, 1);
};

/**
 * Shows or hides the given element, identified by ID.
 *
 * @param {string} id the ID of the element to show or hide.
 * @param {boolean} show if true, the element will be shown; otherwise, hidden.
 */
swivel_viewer.Swivel.prototype.showHideElement = function(id, show) {
  var element = goog.dom.getElement(id);
  goog.style.showElement(element, show);
};

/**
 * Initialize the help icon. This is in a separate method so we can override it
 * for unit tests.
 */
swivel_viewer.Swivel.prototype.initHelpIcon = function() {
  var imageSrc = "images/arrows_curved_small.png";
  
  // The png image looks better, but IE6 doesn't properly display png
  // transparency and IE7 doesn't properly show the png with a css
  // opacity setting; so show a gif with altered opacity for ie.
  if (goog.userAgent.IE) {
    imageSrc = "images/arrows_curved_small.gif";
  }
  var dom = new goog.dom.getDomHelper(this.doc_);
  this.helpIcon_ = dom.createDom('img', {
    'src' : imageSrc,
    'class' :"helpIcon"
  });
  this.helpIcon_.id = "helpIcon";

  this.resizeHelpIcon_();
  goog.dom.appendChild(this.swivelContents_, this.helpIcon_);
};

/**
 * Resize the HelpIcon properly according to the Swivel size.
 * @private
 */
swivel_viewer.Swivel.prototype.resizeHelpIcon_ = function() {
  // Center the icon in the view; if it is larger than the view,
  // scale it down proportionally first.
  var helpIconSize
      = new goog.math.Size(swivel_viewer.Swivel.HELP_ICON_WIDTH,
          swivel_viewer.Swivel.HELP_ICON_HEIGHT);
  if (!helpIconSize.fitsInside(this.swivelSize_)) {
    helpIconSize = helpIconSize.scaleToFit(this.swivelSize_);
  }
  this.helpIcon_.style.position = 'absolute';
  this.helpIcon_.style.zIndex = '4';
  this.helpIcon_.style.width = helpIconSize.width + 'px';
  this.helpIcon_.style.height = helpIconSize.height + 'px';
  this.helpIcon_.style.left
      = Math.floor((this.swivelSize_.width - helpIconSize.width) / 2);
  this.helpIcon_.style.top
      = Math.floor((this.swivelSize_.height - helpIconSize.height) / 2);
};

/**
 * Create a span to hold the zoom indicator.
 */
swivel_viewer.Swivel.prototype.initZoomIndicator = function() {
  // note this has a z-index of 3, so that it will stay on top of the image;
  // and an explicit background color for IE6 to avoid blur when changing
  // opacity.
  var style = 'color:gray;position:absolute;top:0;left:0;z-index:3;';
  if (goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    style += 'background-color:white;'
  }
  var dom = new goog.dom.getDomHelper(this.doc_);
  this.zoomIndicator_ = dom.createDom('span', {
    'style' : style
  });
  goog.dom.appendChild(this.swivelContents_, this.zoomIndicator_);
};

/**
 * When the mouse comes in to the frame, show the swivel cursor
 * 
 * @param {Event} e mouse-in event
 */
swivel_viewer.Swivel.prototype.doMouseIn = function(e) {
  if (this.mouseIsDown_) {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  this.cursorSwivel(e);
};

/**
 * When the mouse leaves the frame, show the default cursor then notify mouseUp.
 * 
 * @param {Event} e mouse-out event
 */
swivel_viewer..Swivel.prototype.doMouseOut = function(e) {
  // Address the problem with IE which generates "mouse out" event when
  // swapping the images.  This ensures that the mouse actually left the area.
  if (this.mouseIsDown_) {
    var mouseX_ = e.clientX + document.body.scrollLeft;
    var mouseY_ = e.clientY + document.body.scrollTop;

    var width = e.currentTarget.offsetWidth;
    var height = e.currentTarget.offsetHeight;

    if (mouseX_ < 0 || mouseX_ >= width || mouseY_ < 0 || mouseY_ >= height) {
      // Treat this as a mouse up, which will stop any current action.
      this.doMouseUp(e);

      // Reset to the default cursor in case the mouse up changed it.
      this.cursorDefault();
    }
    e.stopPropagation();
    e.preventDefault();
    return;
  }

  // Treat this as a mouse up, which will stop any current action.
  this.doMouseUp(e);

  // Reset to the default cursor in case the mouse up changed it.
  this.cursorDefault();
};

/**
 * When the mouse goes down, start rotating the image
 * 
 * @param {Event} e mouse-down event
 */
swivel_viewer.Swivel.prototype.doMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();

  // Hide the help image
  this.showHideElement(this.helpIcon_, false);

  // Set the cursor
  this.cursorSwivel(e);

  // Start tracking mouse state
  this.getMouseXY(e);
  this.mouseXOrig_ = this.mouseX_;
  this.mouseYOrig_ = this.mouseY_;
  this.addToPos_ = 0;
  this.mouseIsDown_ = true;
};

/**
 * When the mouse goes up, stop rotating the image On mouseUp, adjust the
 * current position to the "addToPos", which is the number of the image that we
 * last swiveled to.
 * 
 * @param {Event} e mouse-up event
 */
swivel_viewer.Swivel.prototype.doMouseUp = function(e) {
  e.stopPropagation();
  e.preventDefault();

  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.listen(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  this.currentPos_ += this.addToPos_;

  this.mouseIsDown_ = false;
  this.cursorSwivel(e);
};

/**
 * Handle mouse movements by rotating or panning if the mouse is down.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doMouseMove = function(e) {
  if (!this.mouseIsDown_) {
    this.cursorSwivel(e);
    return;
  }

  // This is an event we'll handle, so stop it here.
  e.stopPropagation();
  e.preventDefault();

  // If the shift key is down, this is a pan; otherwise it is a rotation.
  if (e.shiftKey) {
    this.doPan(e);
  } else {
    this.autoSpin_ = false;
    this.doRotate(e);
  }
};

/**
 * Divide the width of the html object by the number of images. As the mouse
 * moves over the html object, show the appropriate image giving the illusion
 * that the user is spinning the object.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doRotate = function(e) {
  this.getMouseXY(e);

  var imageCount = this.imageUrls_.length;

  // step is how many pixels equals an image swap
  var step = this.swivelSize_.width / imageCount;
  var delta = this.mouseX_ - this.mouseXOrig_;

  // addToPos represents how many positions we add to the current position
  // (e.g., if current position is 2 and addToPos is 5, we will next show the
  // image at position 7).
  this.addToPos_ = Math.round(delta / step);

  if (this.addToPos_ != 0) {
    // handle wrap around
    var wrap = (this.currentPos_ + this.addToPos_) % imageCount;
    var newPos = (wrap < 0) ? imageCount + wrap : wrap;

    // If the image at newPos exists, hide all the others and show that image.
    var img = this.imageArray_[newPos];
    if (this.hasLoadedInBrowser(img)) {
      for ( var i = 0; i < imageCount; i++) {
        if (this.imageArray_[i] != null) {
          this.hideImage(this.imageArray_[i]);
        }
      }

      this.showImage(newPos, 1);
    }
  }

  return false;
};

/**
 * Resize the whole Swivel object, including images.
 * @param {Event} event The mouse wheel event trigger.
 */
swivel_viewer.Swivel.prototype.doScale = function(event) {
  var inc = (event.detail > 0 ? -swivel_viewer.Swivel.SCALE_INCREMENT
             : +swivel_viewer.Swivel.SCALE_INCREMENT);
  var scale = this.currentScale_ + inc;
  if (inc > 0 && scale > swivel_viewer.Swivel.MAX_SCALE)
    return;
  if (inc < 0 && scale < swivel_viewer.Swivel.MIN_SCALE)
    return;
  // Scale frame first
  this.swivelContents_.resizeCallback(this.swivelWidth_ * scale,
                                      this.swivelHeight_ * scale);
  this.swivelSize_ = new goog.math.Size(this.swivelWidth_ * scale,
                                        this.swivelHeight_ * scale);
  this.imageSize_ = new goog.math.Size(this.imageWidth_ * scale,
                                       this.imageHeight_ * scale);
  this.removeSwivelListeners();
  goog.dom.removeChildren(this.swivelContents_);
  this.swivelContents_.style.width = this.swivelWidth_ * scale + 'px';
  this.swivelContents_.style.height = this.swivelHeight_ * scale + 'px';
  this.updateURLs(this.imageSize_.width, this.imageSize_.height);
  this.initImages();
  this.currentScale_ = scale;
};

/**
 * Pan the image by moving it the same number of pixels that the mouse has moved
 * since the click event.
 * 
 * @param {Event} e mouse-move event
 */
swivel_viewer.Swivel.prototype.doPan = function(e) {
  this.mouseXOrig_ = this.mouseX_;
  this.mouseYOrig_ = this.mouseY_;

  this.getMouseXY(e);

  this.leftIncrement_ -= (this.mouseXOrig_ - this.mouseX_);
  this.topIncrement_ -= (this.mouseYOrig_ - this.mouseY_);

  var width = Math.floor(this.imageSize_.width * this.currentZoom_);
  var height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Do not let the image go too far out of the frame.
  if (this.swivelSize_.width <= width) {
    this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                          this.swivelSize_.width - width,
                                          0);
  } else {
    this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                          0,
                                          this.swivelSize_.width - width);
  }
  if (this.swivelSize_.height <= height) {
    this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                          this.swivelSize_.height - height,
                                          0);
  }
  else {
    this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                          0,
                                          this.swivelSize_.height - height);
  }

  var imageCount = this.imageArray_.length;
  for ( var i = 0; i < imageCount; i++) {
    var image = this.imageArray_[i];
    image.style.top = this.topIncrement_ + 'px';
    image.style.left = this.leftIncrement_ + 'px';
  }
};

/**
 * Determines whether the given image has actually been loaded into the browser
 * (versus just created as an image object in javascript).
 * 
 * @param {Image} img The image to be checked.
 */
swivel_viewer.Swivel.prototype.hasLoadedInBrowser = function(img) {
  if (!img || !img.complete) {
    return false;
  }
  if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
    return false;
  }

  return true;
};

/**
 * Get the mouse position from the event e. This works around some event
 * issues that closure doesn't handle:
 * - ff2 reports mouse wheel event clientXY as screen relative, but mouse
 *   move events as relative to the target.
 * - ie (6 & 7) resizes the swivel container as the images zoom, so offsetXY
 *   becomes useless, and we need to use the coords relative to the viewport. 
 * 
 * Rather than special casing for different event types this will always use
 * viewport relative coords for IE, and target offset coords for everything
 * else.
 * 
 * @param {Event} e mouse move event
 */
swivel_viewer.Swivel.prototype.getMouseXY = function(e) {
  if (goog.userAgent.IE) {
    this.mouseX_ = e.clientX + document.body.scrollLeft;
    this.mouseY_ = e.clientY + document.body.scrollTop;
  
    if (this.mouseX_ < 0) {
      this.mouseX_ = 0;
    }
    if (this.mouseY_ < 0) {
      this.mouseY_ = 0;
    }
  } else {
    this.mouseX_ = e.offsetX;
    this.mouseY_ = e.offsetY;
  }
};

/**
 * Gets the left coordinate of the element.
 * 
 * @param {Object} element The element for which the left-alignment is being
 *     found.
 */
swivel_viewer.Swivel.prototype.getLeft = function(element) {
  var x = 0;
  while (element) {
    x += element.offsetLeft;
    element = element.offsetParent;
  }
  return x;
};

/**
 * Hides the image.
 * 
 * @param {Image} img The image to be hidden.
 */
swivel_viewer.Swivel.prototype.hideImage = function(img) {
  this.showHideElement(img, false);
};

/**
 * Shows the image. If the image hasn't been loaded yet, go into a loop and keep
 * checking until it is loaded.
 * 
 * @param {number} indx Index of the image to be shown.
 * @param {number} attempt Number of the attempt to show the message. Stops
 *     after IMAGE_DISPLAY_RETRIES attempts to show the image.
 */
swivel_viewer.Swivel.prototype.showImage = function(indx, attempt) {
  var img = this.imageArray_[indx];

  // initDisplay calls showImage(0, 1), which often times out, since we just
  // got instantiated.  But before the timeout fires, autospin (or something
  // else) may call showImage.  In that case, we should ignore the timed call
  // to showImage(X, Y), which we can recognize by attempt being > 1.
  // It might be easier to use clearTimeout() with the timer ID returned by
  // setTimeout(), but I can't find a formal spec for the function, so I don't
  // want to mess with it.
  if (attempt > 1 && !this.showImageIsWaitingForATimeout_) {
    return;
  }
  this.showImageIsWaitingForATimeout_ = false;

  if (this.hasLoadedInBrowser(img)) {
    this.showHideElement(img, true);
    this.cursorSwivel();
  } else if (attempt < (swivel_viewer.Swivel.IMAGE_DISPLAY_RETRIES + 1)) {
    this.cursorWait();
    attempt++;
    // Set a timeout and try again.

    this.showImageIsWaitingForATimeout_ = true;

    goog.global.setTimeout(goog.bind(this.showImage, this, indx, attempt),
        swivel_viewer.Swivel.REDISPLAY_IMAGE_DELAY);
  } else {
    // Reset the cursor and bail out.
    this.cursorSwivel();
  }
};

/**
 * Changes the cursor to a wait cursor.
 */
swivel_viewer.Swivel.prototype.cursorWait = function() {
  document.body.style.cursor = 'wait';
};

/**
 * Changes the cursor to a swivel cursor, or a move cursor if the shift key is
 * down.
 * @param {Event} opt_event An optional event that this is in response to.
 */
swivel_viewer.Swivel.prototype.cursorSwivel = function(opt_event) {
  if (opt_event && opt_event.shiftKey) {
    document.body.style.cursor = 'move';
  } else {
    document.body.style.cursor = 'col-resize';
  }
};

/**
 * Changes the cursor to the default cursor.
 */
swivel_viewer.Swivel.prototype.cursorDefault = function() {
  document.body.style.cursor = 'default';
};

/**
 * On unload of the swivel page, clean up the listeners.
 */
swivel_viewer.Swivel.prototype.removeSwivelListeners = function() {
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEMOVE,
      this.doRotate, true, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEDOWN,
      this.doMouseDown, false, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEUP,
      this.doMouseUp, true, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEOVER,
      this.doMouseIn, false, this);
  goog.events.unlisten(this.swivelContents_, goog.events.EventType.MOUSEOUT,
      this.doMouseOut, false, this);
  goog.events.removeAll(this.mouseWheelHandler_,goog.events.EventType.MOUSEWHEEL);
};

swivel_viewer.Swivel.prototype.getCropRatio = function() {
  var ratio = new Array();
  var imageWidth = Math.floor(this.imageSize_.width * this.currentZoom_);
  var imageHeight = Math.floor(this.imageSize_.height * this.currentZoom_);
  ratio["left"] = Math.abs(this.leftIncrement_) / imageWidth;
  ratio["right"] = 1 - ratio.left - this.swivelSize_.width / imageWidth;
  ratio["top"] = Math.abs(this.topIncrement_) / imageHeight;
  ratio["bottom"] = 1 - ratio.top - this.swivelSize_.height / imageHeight;
  return ratio;
}

/**
 * Responds to mouse wheel events by zooming the images. Since mouse wheel
 * increments are uneven we just zoom by the same increment for with each event.
 * While zooming in, the point under the mouse cursor remains stationary to
 * approximate the SketchUp zoom tools.
 * However, zoom out is performed around a weighted combination of the center
 * of frame and the center of image, with weight 1 (purely image center) when
 * zoom is at its maximum to 0 (purely frame center) when zoom goes to minimum.
 *
 * @param {Event} event The mouse wheel event.
 */
swivel_viewer.Swivel.prototype.zoom = function(event) {
  event.stopPropagation();
  event.preventDefault();

  if (event.shiftKey) {
    this.doScale(event);
    return;
  }

  // Positive mouse wheel is zoom in, negative is zoom out. Stop at a min and
  // max zoom level so the image won't "disappear" or get too pixelated.
  var inc = (event.detail > 0
      ? -swivel_viewer.Swivel.ZOOM_INCREMENT : swivel_viewer.Swivel.ZOOM_INCREMENT);
  if ((this.currentZoom_ == swivel_viewer.Swivel.MIN_ZOOM && inc < 0) ||
      (this.currentZoom_ == swivel_viewer.Swivel.MAX_ZOOM && inc > 0)) {
    return;
  }

  var width = Math.floor(this.imageSize_.width * this.currentZoom_);
  var height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Disallow zooming past the MAX_IMAGE_DIMENSION
  if (inc > 0 &&
      (width >= swivel_viewer.Swivel.MAX_IMAGE_DIMENSION ||
      height >= swivel_viewer.Swivel.MAX_IMAGE_DIMENSION)) {
    return;
  }

  // Update the URLs for better image.
  this.updateURLs(width, height);
  this.reloadImages_();

  var imageCenterX = this.leftIncrement_ + width / 2;
  var imageCenterY = this.topIncrement_ + height / 2;

  // Find where the scroll event happened, relative to the center of the image
  // based on the actual size of the image, so that we can keep that point
  // stable wrt mouse events.
  this.getMouseXY(event);
  var fromCenterDiffX = (this.mouseX_ - imageCenterX) / this.currentZoom_;
  var fromCenterDiffY = (this.mouseY_ - imageCenterY) / this.currentZoom_;

  var origZoom = this.currentZoom_;

  // Update the current zoom level.
  this.currentZoom_ += inc;

  // The following would be needed in the case the zoom step does not exactly
  // divide max_zoom - min_zoom, for example 0.5 to 4.2 step 0.25. In such
  // case, currentZoom could have changed from 4.0 to 4.25.  But with current
  // set of parameters (0.5 to 4.0 step 0.25), this will not make a difference.
  this.currentZoom_ = goog.math.clamp(this.currentZoom_,
                                      swivel_viewer.Swivel.MIN_ZOOM,
                                      swivel_viewer.Swivel.MAX_ZOOM);

  // Calculate the new size of the image based on the zoom level.
  width = Math.floor(this.imageSize_.width * this.currentZoom_);
  height = Math.floor(this.imageSize_.height * this.currentZoom_);

  // Calculate the left/top offsets based on the zoom level, the position of the
  // mouse event in the view, and the position of the mouse event in the
  // unscaled image. We want the part of the image under the mouse event to stay
  // constant so you can zoom in/out of specific points. This should roughly
  // match how sketchup's zoom tool works.

  // Calculate the point of the resized image that should be under the mouse by
  // multiplying the unscaled position by the new zoom level.
  fromCenterDiffX *= this.currentZoom_;
  fromCenterDiffY *= this.currentZoom_;

  if (inc > 0) {
    imageCenterX = this.mouseX_ - fromCenterDiffX;
    imageCenterY = this.mouseY_ - fromCenterDiffY;
  } else {
    // If zoom < 1, use weighted combination of frame center and image center.
    // The following alpha ensures that that any point in the image would not
    // move away from the position it is supposed to be at minimum zoom.
    var alpha = (this.currentZoom_ - swivel_viewer.Swivel.MIN_ZOOM) /
        (origZoom - swivel_viewer.Swivel.MIN_ZOOM);
    imageCenterX = alpha * imageCenterX
        + (1 - alpha) * this.swivelSize_.width / 2;
    imageCenterY = alpha * imageCenterY
        + (1 - alpha) * this.swivelSize_.height / 2;
  }

  // Base the offsets on that, and the absolute position of the mouse.
  this.leftIncrement_ = Math.floor(imageCenterX - width / 2);
  this.topIncrement_ = Math.floor(imageCenterY - height / 2);

  // Do not let the image go too far out of the frame.
  this.leftIncrement_ = goog.math.clamp(this.leftIncrement_,
                                        -width, this.swivelSize_.width);
  this.topIncrement_  = goog.math.clamp(this.topIncrement_,
                                        -height, this.swivelSize_.height);

  var imageCount = this.imageArray_.length;
  for ( var i = 0; i < imageCount; i++) {
    var image = this.imageArray_[i];
    image.style.width = width;
    image.style.height = height;
    image.style.top = this.topIncrement_ + 'px';
    image.style.left = this.leftIncrement_ + 'px';
    image.style.overflow = "hidden";
  }

  // Update the zoom indicator value.
  this.zoomIndicator_.innerHTML = (this.currentZoom_ * 100) + '%';

  // If we currently have a fade animation, make sure it's stopped, and
  // reset the opacity of the zoom indicator.
  if (this.zoomFadeFx_ != null) {
    this.zoomFadeFx_.stop(false);
    goog.style.setOpacity(this.zoomIndicator_, 1);
  }

  // Then make sure the zoom indicator is showing, create a new fade out
  // animation if necessary, and (re)start it.
  this.showHideElement(this.zoomIndicator_, true);
  if (this.zoomFadeFx_ == null) {
    this.zoomFadeFx_ = new goog.fx.dom.FadeOutAndHide(this.zoomIndicator_,
        swivel_viewer.Swivel.ZOOM_FADE_TIMEOUT);
  }
  this.zoomFadeFx_.play(true);

  // Make sure the help message is hidden.
  this.showHideElement(this.helpIcon_, false);
};
