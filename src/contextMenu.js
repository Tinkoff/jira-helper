/* global chrome */
// Blure

// Manifest V3 extension
function greetUser(name) {
  alert(`Hello, ${name}!`);
}
chrome.action.onClicked.addListener(async tab => {
  const userReq = await fetch('/https://example.com/user-data.json');
  const user = await userReq.json();
  const givenName = user.givenName || '<GIVEN_NAME>';

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: greetUser,
    args: [givenName],
  });
});

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
