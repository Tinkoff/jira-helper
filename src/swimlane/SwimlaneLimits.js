import each from '@tinkoff/utils/array/each';
import filter from '@tinkoff/utils/array/filter';
import { PageModification } from '../shared/PageModification';
import { settingsJiraDOM as DOM } from './constants';
import { BOARD_PROPERTIES } from '../shared/constants';
import style from './styles.css';
import { mergeSwimlaneSettings } from './utils';

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `add-swimlane-limits-${this.getSearchParam('rapidView')}`;
  }

  appendStyles() {
    return `
    <style>
      #js-swimlane-header-stalker .ghx-description {
        color: inherit !important;
      }
    </style>
  `;
  }

  waitForLoading() {
    return this.waitForElement(DOM.swimlane);
  }

  loadData() {
    return Promise.all([
      this.getBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS),
      this.getBoardProperty(BOARD_PROPERTIES.OLD_SWIMLANE_SETTINGS),
    ]).then(mergeSwimlaneSettings);
  }

  apply(settings) {
    if (!settings) return;

    this.renderLimits(settings);
    this.onDOMChange('#ghx-pool', () => this.renderLimits(settings));
  }

  renderLimits(settings) {
    const swimlanesIssuesCount = {};
    each(swimlane => {
      const swimlaneId = swimlane.getAttribute('swimlane-id');
      if (!settings[swimlaneId] || !settings[swimlaneId].limit) return;

      const { limit } = settings[swimlaneId];

      const swimlaneHeader = swimlane.querySelector(DOM.swimlaneHeader);
      const swimlaneColumns = Array.from(swimlane.getElementsByClassName('ghx-columns')[0].childNodes || []);

      const numberIssues = swimlaneColumns.reduce(
        (acc, column) =>
          acc +
          filter(
            issue => !issue.classList.contains('ghx-done') && !issue.classList.contains('ghx-issue-subtask'),
            column.querySelectorAll('.ghx-issue')
          ).length,
        0
      );

      swimlanesIssuesCount[swimlaneId] = numberIssues;

      const swimlaneDescription = swimlane.querySelector('.ghx-description');
      const innerSwimlaneHeader = swimlane.querySelector('.ghx-swimlane-header');

      if (numberIssues > limit) {
        swimlane.style.backgroundColor = '#ff5630';
        swimlaneDescription.style.color = '#ffd700';

        // Some JIRA-versions has white backgroundColor on swimlane header, f.e. v8.8.1
        innerSwimlaneHeader.style.backgroundColor = '#ff5630';
      }

      this.renderSwimlaneHeaderLimit(numberIssues, limit, swimlaneHeader);
    }, document.querySelectorAll(DOM.swimlane));

    const stalker = document.querySelector('#ghx-swimlane-header-stalker');
    if (stalker && stalker.firstElementChild) {
      const swimlaneId = stalker.firstElementChild.getAttribute('data-swimlane-id');
      if (!swimlaneId || !swimlanesIssuesCount[swimlaneId]) return;

      const swimlaneHeader = stalker.querySelector(DOM.swimlaneHeader);
      this.renderSwimlaneHeaderLimit(swimlanesIssuesCount[swimlaneId], settings[swimlaneId].limit, swimlaneHeader);
    }
  }

  renderSwimlaneHeaderLimit(numberIssues, limit, swimlaneHeader) {
    // Здесь по порядку определяется title, потому что у него нет селектора
    const swimlaneTitle = swimlaneHeader.querySelector('*:nth-child(2)');
    if (swimlaneTitle.classList.contains(style.limitBadge)) return;

    const badge = `
      <span class="${style.limitBadge}">${numberIssues}/${limit}<span class="${style.limitBadge__hint}">Issues / Max. issues</span></span>
    `;

    this.insertHTML(swimlaneTitle, 'beforebegin', badge);
  }
}
