import each from '@tinkoff/utils/array/each';
import styles from '../styles/printCards.css';

export class PrintCardButton {
  constructor({ extensionService, popupService }) {
    this.extensionService = extensionService;
    this.popupService = popupService;

    this.identifiers = {
      printCardsBtnId: 'print-cards-btn',
    };
    this.iconSrc = this.extensionService.getUrl('/img/printIcon.png');
    this.$printCardBtn = null;

    this.onClick = this.onClick.bind(this);
  }

  isExistJqElem(selector) {
    return document.querySelector(selector) != null;
  }

  getBtnTemplate() {
    const { printCardsBtnId } = this.identifiers;

    const htmlPrintIcon = `<img src="${this.iconSrc}" class="${styles.printCardIcon}">`;

    return `<div class="${styles.printCardBtn_Wrapper}">
         <button class="${styles.printCardBtn}" id="${printCardsBtnId}">
            ${htmlPrintIcon}
         </button>
       </div>`;
  }

  getAmountOfIssues() {
    // Есть несколько видов отображения результатов поиска запроса - списком, либо разделённым с деталями задач.
    // Переключатель есть справа сверху, под кнопкой настроек
    try {
      const listViewCounter = document.querySelector('.results-count-link');
      const listAmountOfIssues = listViewCounter && listViewCounter.textContent;

      const detailsViewCounter = document.querySelector('#content .pager-container .showing');
      const detailsAmountOfIssues = detailsViewCounter && detailsViewCounter.textContent.split(' ').pop();

      return +(listAmountOfIssues || detailsAmountOfIssues || 0);
    } catch (err) {
      return 0;
    }
  }

  onClick() {
    const elm = document.querySelector('#jql');
    let jql = '';

    if (elm) {
      jql = document.querySelector('#jql').value;
    } else {
      jql = new URL(document.location).searchParams.get('jql');
    }

    const issueCount = this.getAmountOfIssues();
    if ((!jql && !jql.length) || jql === 'ORDER BY updated DESC')
      return alert('You should first search the query on the current page');

    return this.popupService.renderPopup(jql, issueCount);
  }

  subscribeToSwitchingSearchMechanism() {
    each(
      link => link.addEventListener('click', () => setTimeout(() => this.render()), { once: true }),
      document.querySelectorAll('a[data-id="advanced"], a[data-id="basic"]')
    );
  }

  bindBtb() {
    const { printCardsBtnId } = this.identifiers;
    this.$printCardBtn = document.querySelector(`#${printCardsBtnId}`);

    this.$printCardBtn.addEventListener('click', this.onClick);
    this.subscribeToSwitchingSearchMechanism();
  }

  render() {
    const { printCardsBtnId } = this.identifiers;
    const isPageAlreadyContainsBtn = this.isExistJqElem(`#${printCardsBtnId}`);
    const cloudJiraContainer = document.querySelector('[data-testid="jql-editor-input"]');
    const isOptionsContainerExist = this.isExistJqElem('.search-options-container');

    if (isPageAlreadyContainsBtn) return;
    let container;

    if (cloudJiraContainer) {
      container = document.querySelector('[data-testid="jql-editor-input"]').parentElement.parentElement;
      container.insertAdjacentHTML('afterbegin', this.getBtnTemplate());
      this.bindBtb();
      const sampleBtn = container.querySelector('[role="presentation"]');
      this.$printCardBtn.parentElement.classList.remove(styles.printCardBtn_Wrapper);
      sampleBtn.classList.forEach(cls => this.$printCardBtn.parentElement.classList.add(cls));
      return;
    }

    if (!isOptionsContainerExist) return;
    container = document.querySelector('.search-container');
    container.insertAdjacentHTML('beforeend', this.getBtnTemplate());

    this.bindBtb();
  }
}
