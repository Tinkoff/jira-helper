import map from '@tinkoff/utils/array/map';
import each from '@tinkoff/utils/array/each';
import { PageModification } from '../shared/PageModification';
import { toPx } from '../shared/utils';
import style from './styles.css';

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `add-swimlane-stats-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement('.ghx-swimlane');
  }

  loadData() {
    return this.getBoardEditData();
  }

  apply(editData) {
    this.cssSelectorOfIssues = this.getCssSelectorOfIssues(editData);
    this.calcSwimlaneStatsAndRender();
    this.onDOMChange('#ghx-pool', this.calcSwimlaneStatsAndRender);
  }

  calcSwimlaneStatsAndRender = () => {
    const headers = map(
      i => i.innerText,
      document.querySelectorAll('.ghx-column-title, #ghx-column-headers .ghx-column h2')
    );

    const swimlanesStats = {};

    each(sw => {
      const header = sw.getElementsByClassName('ghx-swimlane-header')[0];

      if (!header) return;

      const list = sw.getElementsByClassName('ghx-columns')[0].childNodes;
      let numberIssues = 0;
      const arrNumberIssues = [];

      list.forEach(column => {
        const tasks = column.querySelectorAll(this.cssSelectorOfIssues);
        arrNumberIssues.push(tasks.length);
        numberIssues += tasks.length;
      });

      swimlanesStats[sw.getAttribute('swimlane-id')] = { numberIssues, arrNumberIssues };
      this.renderSwimlaneStats(header, headers, numberIssues, arrNumberIssues);
    }, document.querySelectorAll('.ghx-swimlane'));

    const stalker = document.querySelector('#ghx-swimlane-header-stalker');
    if (stalker && stalker.firstElementChild) {
      const swimlaneId = stalker.firstElementChild.getAttribute('data-swimlane-id');
      if (!swimlaneId || !swimlanesStats[swimlaneId]) return;

      const header = stalker.querySelector('.ghx-swimlane-header');
      const { numberIssues, arrNumberIssues } = swimlanesStats[swimlaneId];

      this.renderSwimlaneStats(header, headers, numberIssues, arrNumberIssues);
    }
  };

  renderSwimlaneStats(header, headers, numberIssues, arrNumberIssues) {
    const stats = `
  <div class="${style.wrapper}">
    ${arrNumberIssues
      .map((currentNumberIssues, index) => {
        const title = `${headers[index]}: ${currentNumberIssues}`;

        return `
      <div title="${title}" class="${style.column}" style="background: ${currentNumberIssues ? '#999' : '#eee'}">
        <div title="${title}" class="${style.bar}" style="height: ${toPx(
          ((20 * currentNumberIssues) / numberIssues).toFixed(2)
        )}"></div>
      </div>
    `;
      })
      .join('')}
  </div>
  `;

    header.classList.add(style.header);
    this.insertHTML(header, 'afterbegin', stats);
  }
}
