/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

let EXPORTED_SYMBOLS = ["PageThumbs", "PageThumbsStorage"];

const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const PREF_STORAGE_VERSION = "moa.ntab.thumbs_version";
const LATEST_STORAGE_VERSION = 1;

const NTAB_DIRECTORY = "ntab";
const THUMBNAIL_DIRECTORY = "cache";

const THUMBNAIL_BG_COLOR = "#fff";

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

if (XPCOMUtils.hasOwnProperty('defineLazyModuleGetter')) {
  XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
    "resource://gre/modules/NetUtil.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "Services",
    "resource://gre/modules/Services.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "FileUtils",
    "resource://gre/modules/FileUtils.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
    "resource://gre/modules/PlacesUtils.jsm");
} else {
  Cu.import('resource://gre/modules/NetUtil.jsm');
  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import('resource://gre/modules/FileUtils.jsm');
  Cu.import('resource://gre/modules/PlacesUtils.jsm');
}

XPCOMUtils.defineLazyGetter(this, "gCryptoHash", function () {
  return Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
});

XPCOMUtils.defineLazyGetter(this, "gUnicodeConverter", function () {
  let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = 'utf8';
  return converter;
});

let PageThumbs = {
  _initialized: false,

  _thumbnailWidth : 0,
  _thumbnailHeight : 0,

  get scheme() "cehp-page-thumb",

  get staticHost() "thumbnail",

  get contentType() "image/png",

  getThumbnailURL: function PageThumbs_getThumbnailURL(aUrl) {
    return this.scheme + "://" + this.staticHost +
           "?url=" + encodeURIComponent(aUrl);
  },

  getThumbnailType: function PageThumbs_getThumbnailURL(aUrl) {
    if (PageThumbsStorage.getFileForURL(aUrl).exists()) {
      return "snapshot";
    }
    return "icon";
  },

  capture: function PageThumbs_capture(aWindow, aCallback) {
    let [sw, sh, scale] = this._determineCropSize(aWindow);

    let canvas = this._createCanvas();
    let ctx = canvas.getContext("2d");

    ctx.scale(scale, scale);

    try {
      ctx.drawWindow(aWindow, 0, 0, sw, sh, THUMBNAIL_BG_COLOR,
                     ctx.DRAWWINDOW_DO_NOT_FLUSH);
    } catch (e) {
    }

    Services.tm.currentThread.dispatch(function () {
      canvas.mozFetchAsStream(aCallback, this.contentType);
    }.bind(this), Ci.nsIThread.DISPATCH_NORMAL);
  },

  captureAndStore: function PageThumbs_captureAndStore(aBrowser, aCallback) {
    let url = aBrowser.currentURI.spec;
    let channel = aBrowser.docShell.currentDocumentChannel;
    let originalURL = channel.originalURI.spec;

    this.capture(aBrowser.contentWindow, function (aInputStream) {
      function finish(aSuccessful) {
        if (aSuccessful) {
          if (url != originalURL)
            PageThumbsStorage.copy(url, originalURL);
        }

        if (aCallback)
          aCallback(aSuccessful);
      }

      PageThumbsStorage.write(url, aInputStream, finish);
    });
  },

  _determineCropSize: function PageThumbs_determineCropSize(aWindow) {
    let sw = aWindow.innerWidth;
    let sh = aWindow.innerHeight;

    let [thumbnailWidth, thumbnailHeight] = this._getThumbnailSize();
    let scale = Math.max(thumbnailWidth / sw, thumbnailHeight / sh);
    let scaledWidth = sw * scale;
    let scaledHeight = sh * scale;

    if (scaledHeight > thumbnailHeight)
      sh -= Math.floor(Math.abs(scaledHeight - thumbnailHeight) * scale);

    if (scaledWidth > thumbnailWidth)
      sw -= Math.floor(Math.abs(scaledWidth - thumbnailWidth) * scale);

    return [sw, sh, scale];
  },

  _createCanvas: function PageThumbs_createCanvas() {
    let doc = Services.appShell.hiddenDOMWindow.document;
    let canvas = doc.createElementNS(HTML_NAMESPACE, "canvas");
    canvas.mozOpaque = true;
    canvas.mozImageSmoothingEnabled = true;
    let [thumbnailWidth, thumbnailHeight] = this._getThumbnailSize();
    canvas.width = thumbnailWidth;
    canvas.height = thumbnailHeight;
    return canvas;
  },

  _getThumbnailSize: function PageThumbs_getThumbnailSize() {
    if (!this._thumbnailWidth || !this._thumbnailHeight) {
      let screenManager = Cc["@mozilla.org/gfx/screenmanager;1"]
                            .getService(Ci.nsIScreenManager);
      let left = {}, top = {}, width = {}, height = {};
      screenManager.primaryScreen.GetRect(left, top, width, height);
      this._thumbnailWidth = Math.round(width.value / 3);
      this._thumbnailHeight = Math.round(height.value / 3);
    }
    return [this._thumbnailWidth, this._thumbnailHeight];
  },
};

let PageThumbsStorage = {
  getFileForURL: function Storage_getFileForURL(aURL, aOptions) {
    let hash = this._calculateMD5Hash(aURL);
    let parts = [NTAB_DIRECTORY, THUMBNAIL_DIRECTORY];
    let file = FileUtils.getDir("ProfD", parts, aOptions && aOptions.createPath);
    file.append(hash + ".png");
    return file;
  },

  write: function Storage_write(aURL, aDataStream, aCallback) {
    let file = this.getFileForURL(aURL, {createPath: true});
    let fos = FileUtils.openSafeFileOutputStream(file);

    NetUtil.asyncCopy(aDataStream, fos, function (aResult) {
      FileUtils.closeSafeFileOutputStream(fos);
      aCallback(Components.isSuccessCode(aResult));
    });
  },

  copy: function Storage_copy(aSourceURL, aTargetURL) {
    let sourceFile = this.getFileForURL(aSourceURL);
    let targetFile = this.getFileForURL(aTargetURL);

    try {
      sourceFile.copyTo(targetFile.parent, targetFile.leafName);
    } catch (e) {
    }
  },

  remove: function Storage_remove(aURL) {
    try {
      this.getFileForURL(aURL).remove(false);
    } catch (e) {
    }
  },

  wipe: function Storage_wipe() {
    try {
      FileUtils.getDir("ProfD", [NTAB_DIRECTORY, THUMBNAIL_DIRECTORY]).remove(true);
    } catch (e) {
    }
  },

  _calculateMD5Hash: function Storage_calculateMD5Hash(aValue) {
    let hash = gCryptoHash;
    let value = gUnicodeConverter.convertToByteArray(aValue);

    hash.init(hash.MD5);
    hash.update(value, value.length);
    return this._convertToHexString(hash.finish(false));
  },

  _convertToHexString: function Storage_convertToHexString(aData) {
    let hex = "";
    for (let i = 0; i < aData.length; i++)
      hex += ("0" + aData.charCodeAt(i).toString(16)).slice(-2);
    return hex;
  },

};
