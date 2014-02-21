const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://ntab/PartnerBookmarks.jsm");

function collectPref() {
  let tracker = Cc["@mozilla.com.cn/tracking;1"];
  if (!tracker || !tracker.getService().wrappedJSObject.ude) {
    return "";
  }

  let prefs = Services.prefs.getBranch("moa.ntab.");
  let ret = [];

  try {
    ret.push(prefs.getCharPref("view"));
    ret.push(prefs.getCharPref("qdtab"));
    ret.push(prefs.getBoolPref("qdtab.used"));

    let col = prefs.getIntPref("dial.column");
    let row = prefs.getIntPref("dial.row");
    ret.push([col, row].join(","));

    let bgimage = prefs.prefHasUserValue("backgroundimage");
    let bgcolor = encodeURIComponent(prefs.getCharPref("backgroundcolor"));
    let bgimagestyle = prefs.getCharPref("backgroundimagestyle");
    ret.push(bgimage ? bgimagestyle : bgcolor);

    ret.push(prefs.getIntPref("dial.extrawidth"));
    ret.push(prefs.getBoolPref("dial.useopacity"));

    let dialModified = 0;
    Cu.import("resource://ntab/quickdial.jsm");
    for (var i = 1; i <= 8; i++) {
      let dial = quickDialModule.getDial(i);
      if (dial && dial.defaultposition && dial.defaultposition.indexOf(i) == 0) {
        dialModified = dialModified | (1 << (8 - i));
      }
    }
    ret.push(dialModified.toString(2));

    // this array should be manually updated, at least for now
    ret.push(PartnerBookmarks.getUpdateTracking(['taobao', 'tmall']));
  } catch(e) {}

  return ret.join("|");
}

function CehpUpdateParams() {
}

CehpUpdateParams.prototype = {
  classDescription: "CEHP Update Params",
  classID: Components.ID("{eac198fa-e173-4274-8fb3-5857c6a52d10}"),
  contractID: "@mozillaonline.com/cehp-update-params;1",
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIPropertyBag2]),

  getPropertyAsAString: function(param) {
    switch(param) {
      case "CEHP_PREF_TRACKING":
        return collectPref();
      default:
        return "NotSupported";
    }
  }
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([CehpUpdateParams]);
