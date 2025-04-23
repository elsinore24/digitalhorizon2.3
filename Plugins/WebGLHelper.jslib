// WebGLHelper.jslib
// This file provides JavaScript functions that can be called from C# in Unity WebGL builds.

mergeInto(LibraryManager.library, {

  // Function to get the user agent string from the browser
  GetUserAgent: function() {
    return UTF8ToString(stringToUTF8(navigator.userAgent));
  },

  // Add other JavaScript helper functions here if needed

});