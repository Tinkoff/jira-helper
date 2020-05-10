const blurSensitive = isBlure => {
  const html = document.getElementsByTagName('html')[0];
  if (isBlure) {
    html.classList.add('blur');
    return;
  }
  html.classList.remove('blur');
};

const cnahgeBlureSensitive = isBlure => {
  localStorage.setItem('blurSensitive', isBlure);
  blurSensitive(isBlure);
};

export const initOnPageBlurSensitive = () => {
  const isBlure = localStorage.getItem('blurSensitive') === 'true';
  blurSensitive(!!isBlure);
};

export const initBlurSensitive = () => {
  window.chrome.runtime.onMessage.addListener((request, sender) => {
    if (!sender.tab && Object.prototype.hasOwnProperty.call(request, 'blurSensitive')) {
      cnahgeBlureSensitive(request.blurSensitive);
    }
  });

  window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!sender.tab && Object.prototype.hasOwnProperty.call(request, 'getBlurSensitive')) {
      sendResponse({ blurSensitive: localStorage.getItem('blurSensitive') === 'true' });
    }
  });
};
