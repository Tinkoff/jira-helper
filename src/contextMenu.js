// Blure
const blureSecretDataJira = (info, tab) => {
  const code = `document.body.parentNode.classList.${info.checked ? 'add' : 'remove'}('blure')`;
  chrome.tabs.executeScript(tab.id, { code });
};

const checkboxSecretData = chrome.contextMenus.create({
  title: 'Blure secret data',
  type: 'checkbox',
  onclick: blureSecretDataJira,
});
