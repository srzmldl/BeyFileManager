/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('bey.html', {
    id: 'main',
    bounds: { width: 1024, height: 1024 }
  });
});