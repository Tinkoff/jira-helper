const noopWithCallback = cb => cb();

export class Popup {
  constructor({
    title = '',
    initialContentInnerHTML = '',
    onCancel = noopWithCallback,
    onConfirm = noopWithCallback,
    okButtonText = 'Ok',
    size = 'medium', // large, medium, small
  }) {
    this.isOpened = false;

    this.initialProps = {
      title,
      initialContentInnerHTML,
      onCancel,
      onConfirm,
      okButtonText,
      size,
    };

    this.popupIdentifiers = {
      wrapperId: 'jh-popup-wrapper',
      contentWrapperId: 'jh-popup-content',
      confirmBtnId: 'jh-popup-confirm-btn',
      cancelBtnId: 'jh-popup-cancel-btn',
    };

    this.htmlElement = null;
    this.contentBlock = null;
    this.confirmBtn = null;
    this.cancelBtn = null;
  }

  onClose = () => {
    this.initialProps.onCancel(this.unmount);
  };

  onOk = () => {
    this.initialProps.onConfirm(this.unmount);
  };

  html() {
    return `<section open id="${this.popupIdentifiers.wrapperId}" class="aui-dialog2 aui-dialog2-${this.initialProps.size} aui-layer" role="dialog" data-aui-focus="false" data-aui-blanketed="true" aria-hidden="false" style="z-index: 3000;">
      <header class="aui-dialog2-header">
          <h2 class="aui-dialog2-header-main">${this.initialProps.title}</h2>
      </header>
      <div class="aui-dialog2-content" id="${this.popupIdentifiers.contentWrapperId}"></div>
      <footer class="aui-dialog2-footer">
          <div class="aui-dialog2-footer-actions">
                <button id="${this.popupIdentifiers.confirmBtnId}" class="aui-button aui-button-primary">${this.initialProps.okButtonText}</button>
                <button id="${this.popupIdentifiers.cancelBtnId}" class="aui-button">Cancel</button>
            </div>
      </footer>
    </section>
    `;
  }

  attachButtonHandlers() {
    if (!this.confirmBtn || !this.cancelBtn) return;

    this.confirmBtn.addEventListener('click', this.onOk);
    this.cancelBtn.addEventListener('click', this.onClose);
  }

  deattachButtonHandlers() {
    if (!this.confirmBtn || !this.cancelBtn) return;

    this.confirmBtn.removeEventListener('click', this.onOk);
    this.cancelBtn.removeEventListener('click', this.onClose);
  }

  renderDarkBackground() {
    if (document.querySelector('.aui-blanket')) {
      document.querySelector('.aui-blanket').setAttribute('aria-hidden', 'false');

      // На Jira v8.12.3 используется аттрибут hidden на бэкграунде
      document.querySelector('.aui-blanket').removeAttribute('hidden');
    } else {
      document.body.insertAdjacentHTML('beforeend', '<div class="aui-blanket" tabindex="0" aria-hidden="false"></div>');
    }
  }

  removeDarkBackground() {
    document.querySelector('.aui-blanket').setAttribute('aria-hidden', 'true');
    document.querySelector('.aui-blanket').setAttribute('hidden', true);
  }

  // PUBLIC METHODS

  render() {
    this.isOpened = true;
    document.body.insertAdjacentHTML('beforeend', this.html());

    this.htmlElement = document.getElementById(this.popupIdentifiers.wrapperId);
    this.contentBlock = document.getElementById(this.popupIdentifiers.contentWrapperId);
    this.confirmBtn = document.getElementById(this.popupIdentifiers.confirmBtnId);
    this.cancelBtn = document.getElementById(this.popupIdentifiers.cancelBtnId);

    this.renderDarkBackground();
    this.attachButtonHandlers();
  }

  unmount = () => {
    if (this.htmlElement) {
      this.isOpened = false;

      this.deattachButtonHandlers();
      this.removeDarkBackground();

      this.htmlElement.remove();
    }
  };

  appendToContent(str = '') {
    this.contentBlock.insertAdjacentHTML('beforeend', str);
  }

  clearContent() {
    while (this.contentBlock.lastElementChild) {
      this.contentBlock.removeChild(this.contentBlock.lastElementChild);
    }
  }

  toggleConfirmAvailability(isAvailable) {
    if (!this.confirmBtn) return;

    if (isAvailable) this.confirmBtn.removeAttribute('disabled');
    else this.confirmBtn.disabled = 'true';
  }
}
