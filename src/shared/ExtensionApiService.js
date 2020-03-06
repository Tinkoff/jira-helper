class ExtensionApiService {
  constructor() {
    this.extensionAPI = window.chrome || window.browser;
  }

  getUrl(resource) {
    return this.extensionAPI.runtime.getURL(resource);
  }

  onMessage(cb) {
    return this.extensionAPI.runtime.onMessage.addListener(cb);
  }

  onTabsUpdated(cb) {
    return this.extensionAPI.tabs.onUpdated.addListener(cb);
  }

  sendMessageToTab(tabId, message) {
    return this.extensionAPI.tabs.sendMessage(tabId, message);
  }

  reload() {
    this.extensionAPI.runtime.reload();
  }

  bgRequest(action) {
    return new Promise(resolve => {
      this.extensionAPI.runtime.sendMessage(action, response => {
        resolve(response);
      });
    });
  }

  updateStorageValue(key, value) {
    return new Promise(resolve => {
      this.extensionAPI.storage.local.set({ [key]: value }, () => resolve());
    });
  }

  fetchStorageValueByKey(key) {
    return new Promise((resolve, reject) => {
      this.extensionAPI.storage.local.get([key], result =>
        result[key] ? resolve(result[key]) : reject(Error('Not found the key in the storage of chrome browser'))
      );
    });
  }
}

export const extensionApiService = new ExtensionApiService();
