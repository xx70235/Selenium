let _ = (function() {
  var stringBundle = (function() {
    var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1']
      .getService(Components.interfaces.nsIStringBundleService);

    var stringBundle = stringBundleService.createBundle('chrome://ntab/locale/ntab.properties');

    return {
      getString: function(strName) {
        return stringBundle.GetStringFromName(strName);
      },

      getFormattedString: function(strName, values) {
        return stringBundle.formatStringFromName(strName, values, values.length);
      }
    }
  })();

  var _ = function (strName, values) {
    if (!values)
      return stringBundle.getString(strName);
    else
      return stringBundle.getFormattedString(strName, values);
  }

  return _;
})();
