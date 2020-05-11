/* global chrome */
// Blure
const blurSecretDataJira = (info, tab) => {
  chrome.tabs.sendMessage(tab.id, { blurSensitive: info.checked });
};

const createContextMenu = tabId => {
  chrome.contextMenus.removeAll(() => {
    chrome.tabs.sendMessage(tabId, { getBlurSensitive: true }, response => {
      if (response && Object.prototype.hasOwnProperty.call(response, 'blurSensitive')) {
        const checked = response.blurSensitive;
        chrome.contextMenus.create({
          title: 'Blur secret data',
          type: 'checkbox',
          checked,
          onclick: blurSecretDataJira,
        });
      }
    });
  });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    createContextMenu(tabId);
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  createContextMenu(activeInfo.tabId);
});
