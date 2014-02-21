const { interfaces: Ci, utils: Cu } = Components;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://ntab/FrameStorage.jsm');

const CEHP_FRAME_UPDATER_CID = Components.ID('{3452c050-e6ba-443a-a7e5-b04ebe69d5b3}');
const CEHP_FRAME_UPDATER_CONTRACTID = '@mozillaonline.com/cehp-frame-updater;1';

function CehpFrameUpdater() {
}

CehpFrameUpdater.prototype = {
  classDescription: 'CEHP NTab Frame Updater',
  classID:          CEHP_FRAME_UPDATER_CID,
  contractID:       CEHP_FRAME_UPDATER_CONTRACTID,
  QueryInterface:   XPCOMUtils.generateQI([Ci.nsISupports,
                                           Ci.nsITimerCallback]),

  // nsITimerCallback
  notify: function CehpFrameUpdater_notify(aTimer) {
    FrameStorage.update();
  }
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([CehpFrameUpdater])
