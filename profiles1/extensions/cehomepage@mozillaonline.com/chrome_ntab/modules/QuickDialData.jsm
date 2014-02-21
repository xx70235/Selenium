var EXPORTED_SYMBOLS = ['QuickDialData'];

const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
if (XPCOMUtils.hasOwnProperty('defineLazyModuleGetter')) {
  XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
    "resource://gre/modules/NetUtil.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "OS",
    "resource://gre/modules/osfile.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "Services",
    "resource://gre/modules/Services.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "FileUtils",
    "resource://gre/modules/FileUtils.jsm");
  XPCOMUtils.defineLazyModuleGetter(this, "quickDialModule",
    "resource://ntab/quickdial.jsm");
} else {
  Cu.import('resource://gre/modules/NetUtil.jsm');
  try {
    Cu.import('resource://gre/modules/osfile.jsm');
  } catch(e) {};
  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import('resource://gre/modules/FileUtils.jsm');
  XPCOMUtils.defineLazyGetter(this, "quickDialModule", function () {
    let jsm = {};
    Cu.import('resource://ntab/quickdial.jsm', jsm);
    return jsm.quickDialModule;
  });
}
XPCOMUtils.defineLazyGetter(this, "gUnicodeConverter", function () {
  let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = 'utf8';
  return converter;
});

let LOG = function(m) Services.console.logStringMessage(m);

let QuickDialData = {
  get prefs() {
    let branch = Services.prefs.getBranch('moa.ntab.dial.');
    delete this.prefs;
    return this.prefs = branch;
  },
  get verifier() {
    delete this.verifier;
    return this.verifier = Cc["@mozilla.org/security/datasignatureverifier;1"].
      getService(Ci.nsIDataSignatureVerifier);
  },

  get key() {
    delete this.key;
    return this.key = this._getCharPref('key', '');
  },
  get LastModified() {
    let _latestData = this._latestData.exists() && this._latestData.fileSize;
    return _latestData ? this._getCharPref('lastmodified2', '') : '';
  },
  set LastModified(lastmodified) {
    try {
      this.prefs.setCharPref('lastmodified2', lastmodified);
    } catch(e) {};
  },
  get updateUrl() {
    let branch = this._getCharPref('branch', 'master-ii');
    let updateUrl = ['http://ntab.firefoxchina.cn',
                     branch, 'quickdialdata.json'];
    delete this.updateUrl;
    return this.updateUrl = updateUrl.join('/');
  },

  get _bundleData() {
    let uri = Services.io.newURI('resource://ntab/quickdialdata.json',
      null, null);
    return uri.QueryInterface(Ci.nsIFileURL).file;
  },
  get _latestData() {
    return FileUtils.getFile('ProfLD', ['ntab', 'quickdialdata',
                                        'latest.json'], false);
  },
  get _defaultData() {
    let _latestData = this._latestData.exists() && this._latestData.fileSize;
    return _latestData ? this._latestData : this._bundleData;
  },

  get _userData() {
    return FileUtils.getFile('ProfD', ['ntab', 'quickdialdata',
                                       'user.json'], false);
  },

  _getCharPref: function(aPrefKey, aDefault) {
    let ret = aDefault;
    try {
      ret = this.prefs.getCharPref(aPrefKey);
    } catch(e) {}
    return ret;
  },

  _fetch: function(aUrl, aLastModified, aCallback) {
    if (!aUrl) {
      return;
    }
    let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Ci.nsIXMLHttpRequest);
    xhr.open('GET', aUrl, true);
    if (aLastModified) {
      xhr.setRequestHeader('If-Modified-Since', aLastModified);
    }
    xhr.onload = function(evt) {
      if (xhr.status == 200) {
        let data = JSON.parse(xhr.responseText);
        aCallback(data, xhr.getResponseHeader('Last-Modified') || '');
      }
    };
    xhr.onerror = function(evt) {};
    xhr.send();
  },
  _validate: function(aData) {
    try {
      let data = aData.data;
      let signature = aData.signature;
      return this.verifier.verifyData(data, signature, this.key);
    } catch(e) {
      LOG(e);
      return false;
    }
  },

  _loadData: function(aFile) {
    let text = null;
    if (aFile.exists() && aFile.fileSize) {
      let fstream = Cc['@mozilla.org/network/file-input-stream;1'].
                      createInstance(Ci.nsIFileInputStream);
      fstream.init(aFile, -1, 0, 0);
      text = NetUtil.readInputStreamToString(fstream, fstream.available());
      text = gUnicodeConverter.ConvertToUnicode(text);
    }
    return text && JSON.parse(text);
  },
  _dumpData: function(aFile, aData, aCallback) {
    aData = JSON.stringify(aData);

    try {
      // OS.File only available since Fx 16
      OS.File.open(aFile.path, {
        append: false,
        truncate: true
      }).then(function(aFile) {
        let encoder = new TextEncoder();
        let data = encoder.encode(aData);
        aFile.write(data).then(function() {
          aFile.close().then(function() {
            if (aCallback) {
              aCallback();
            }
          });
        });
      });
    } catch(e) {
      let ostream = Cc["@mozilla.org/network/safe-file-output-stream;1"].
                      createInstance(Ci.nsIFileOutputStream);
      ostream.init(aFile, -1, -1, ostream.DEFER_OPEN);

      let istream = gUnicodeConverter.convertToInputStream(aData);
      NetUtil.asyncCopy(istream, ostream, function(aResult) {
        if (Components.isSuccessCode(aResult)) {
          if (aCallback) {
            aCallback();
          }
        }
      });
    }
  },

  _legacyMigration: function(aItem) {
    switch(aItem.url) {
      case "http://click.mz.simba.taobao.com/rd?w=mmp4ptest&f=http%3A%2F%2Fwww.taobao.com%2Fgo%2Fchn%2Ftbk_channel%2Fonsale.php%3Fpid%3Dmm_28347190_2425761_9313996&k=e02915d8b8ad9603":
      case "http://click.mz.simba.taobao.com/rd?w=mmp4ptest&f=http%3A%2F%2Fwww.taobao.com%2Fgo%2Fchn%2Ftbk_channel%2Fonsale.php%3Fpid%3Dmm_28347190_2425761_9313997&k=e02915d8b8ad9603":
      case "http://redirect.simba.taobao.com/rd?c=un&w=channel&f=http%3A%2F%2Fwww.taobao.com%2Fgo%2Fchn%2Ftbk_channel%2Fonsale.php%3Fpid%3Dmm_28347190_2425761_9313997%26unid%3D&k=e02915d8b8ad9603&p=mm_28347190_2425761_9313997":
        aItem.url = "http://www.taobao.com/go/chn/tbk_channel/onsale.php?pid=mm_28347190_2425761_13466329&eventid=101329";
        break;
      case "http://click.union.360buy.com/JdClick/?unionId=206&siteId=8&to=http://www.360buy.com/":
      // remove item when counts per day < 10?
      // case "http://click.union.360buy.com/JdClick/?unionId=316&siteId=21946&to=http://www.360buy.com":
      case "http://click.union.360buy.com/JdClick/?unionId=20&siteId=433588__&to=http://www.360buy.com":
      case "http://www.yihaodian.com/?tracker_u=10977119545":
        if ((aItem.icon && aItem.icon.indexOf('chrome://') == 0) || aItem.rev) {
          aItem.url = "http://youxi.baidu.com/yxpm/pm.jsp?pid=11016500091_877110";
        }
        break;
      default:
        break;
    }

    delete aItem.icon;
    delete aItem.rev;
    delete aItem.thumbnail;

    return aItem;
  },
  _itemMigration: function(aItem) {
    switch(aItem.url) {
      case "http://count.chanet.com.cn/click.cgi?a=498315&d=365155&u=&e=&url=http%3A%2F%2Fwww.jd.com":
        aItem.url = "http://www.jd.com/";
        break;
      default:
        break;
    }

    return aItem;
  },
  _migrateUserData: function(aDefaultData) {
    let _legacyUserData = FileUtils.getFile('ProfD',
                                            ['ntab', 'quickdial.json'], false);
    let legacyUserData = null;
    if (_legacyUserData.exists() && !this._userData.exists()) {
      try {
        let reverseLookup = {};
        for (let index in aDefaultData) {
          reverseLookup[aDefaultData[index].url] = index;
        }

        legacyUserData = this._loadData(_legacyUserData);
        for (let index in legacyUserData) {
          let item = this._legacyMigration(legacyUserData[index]);
          legacyUserData[index] = reverseLookup[item.url] || item;
        }

        this._dumpData(this._userData, legacyUserData);
        _legacyUserData.remove(false);
      } catch(e) {
        LOG('Oops, migration failed: ' + e);
      }
    }
    return legacyUserData;
  },

  read: function() {
    let defaultData = this._loadData(this._defaultData);

    let userData = this._migrateUserData(defaultData) ||
                   this._loadData(this._userData);

    let ret = {};
    if (userData) {
      for (let index in userData) {
        let item = userData[index];
        if (/^\d+$/.test(item)) {
          let defaultItem = defaultData[item];
          if (defaultItem) {
            defaultItem.defaultposition = item;
          }
          item = defaultItem;
        } else {
          item = this._itemMigration(item);
          userData[index] = item;
        }
        ret[index] = item;
      }
      this._dumpData(this._userData, userData);
    } else {
      for (let index in defaultData) {
        let defaultItem = defaultData[index];
        defaultItem.defaultposition = index;
        ret[index] = defaultItem;
      }
    }
    return ret;
  },
  persist: function(aData) {
    let data = {}
    for (let index in aData) {
      data[index] = aData[index].defaultposition || aData[index];
    }
    this._dumpData(this._userData, data);
  },
  reset: function() {
    if (this._userData.exists()) {
      this._userData.remove(false);

      quickDialModule.refresh();
    }
  },

  update: function() {
    let self = this;
    this._fetch(this.updateUrl, this.LastModified,
                function(aData, aLastModified) {
      if (self._validate(aData)) {
        self._dumpData(self._latestData, JSON.parse(aData.data), function() {
          self.LastModified = aLastModified;
          quickDialModule.refresh();
        });
      }
    });

  }
};
