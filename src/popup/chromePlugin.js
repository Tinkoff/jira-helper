document.addEventListener('DOMContentLoaded', function() {
  const buttonTetris = document.getElementById('btn_settings');

  buttonTetris.addEventListener('click', () => {
    window.chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];

      if (/rapidView=(\d*)/im.test(tab.url)) {
        buttonTetris.addEventListener('click', () => {
          window.chrome.tabs.executeScript(null, {
            code: 'window.openTetrisPlanningWindow && window.openTetrisPlanningWindow();',
          });
        });
      }
    });
  });
});
