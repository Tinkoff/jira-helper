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
    const jql = document.querySelector('#jql').value;

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

  render() {
    const { printCardsBtnId } = this.identifiers;
    const isPageAlreadyContainsBtn = this.isExistJqElem(`#${printCardsBtnId}`);
    const isOptionsContainerExist = this.isExistJqElem('.search-options-container');

    if (isPageAlreadyContainsBtn) return;
    if (!isOptionsContainerExist) return;

    document.querySelector('.search-container').insertAdjacentHTML('beforeend', this.getBtnTemplate());
    this.$printCardBtn = document.querySelector(`#${printCardsBtnId}`);

    this.$printCardBtn.addEventListener('click', this.onClick);
    this.subscribeToSwitchingSearchMechanism();
  }
}
