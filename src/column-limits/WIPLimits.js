import map from '@tinkoff/utils/array/map';
import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { mergeSwimlaneSettings } from '../swimlane/utils';
import { findGroupByColumnId, generateColorByFirstChars } from './utils';
import styles from './style.css';

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `add-wip-limits-${this.getSearchParam('rapidView')}`;
  }

  waitForLoading() {
    return this.waitForElement('.ghx-column-header-group');
  }

  loadData() {
    return Promise.all([
      this.getBoardConfiguration(),
      this.getBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS),
      Promise.all([
        this.getBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS),
        this.getBoardProperty(BOARD_PROPERTIES.OLD_SWIMLANE_SETTINGS),
      ]).then(mergeSwimlaneSettings),
    ]);
  }

  apply([boardConfig = {}, boardGroups = {}, swimlanesSettings = {}]) {
    this.boardGroups = boardGroups;
    this.swimlanesSettings = swimlanesSettings;
    this.constraintType = (boardConfig.columnConfig && boardConfig.columnConfig.constraintType) || '';

    this.styleColumnHeaders();
    this.styleColumnsWithLimitations();

    this.onDOMChange('#ghx-pool', () => {
      this.styleColumnHeaders();
      this.styleColumnsWithLimitations();
    });
  }

  styleColumnHeaders() {
    const columnsInOrder = this.getOrderedColumns();
    // for jira v8 header.
    // One of the parents has overfow: hidden
    const headerGroup = document.querySelector('#ghx-pool-wrapper');

    if (headerGroup != null) {
      headerGroup.style.paddingTop = '10px';
    }

    columnsInOrder.forEach((columnId, index) => {
      const { name, value } = findGroupByColumnId(columnId, this.boardGroups);

      if (!name || !value) return;

      const columnByLeft = findGroupByColumnId(columnsInOrder[index - 1], this.boardGroups);
      const columnByRight = findGroupByColumnId(columnsInOrder[index + 1], this.boardGroups);

      const isColumnByLeftWithSameGroup = columnByLeft.name !== name;
      const isColumnByRightWithSameGroup = columnByRight.name !== name;

      if (isColumnByLeftWithSameGroup)
        document.querySelector(`.ghx-column[data-id="${columnId}"]`).style.borderTopLeftRadius = '10px';
      if (isColumnByRightWithSameGroup)
        document.querySelector(`.ghx-column[data-id="${columnId}"]`).style.borderTopRightRadius = '10px';

      Object.assign(document.querySelector(`.ghx-column[data-id="${columnId}"]`).style, {
        backgroundColor: '#deebff',
        borderTop: `4px solid ${generateColorByFirstChars(name)}`,
      });
    });
  }

  styleColumnsWithLimitations() {
    const columnsInOrder = this.getOrderedColumns();
    if (!columnsInOrder.length) return;

    Object.values(this.boardGroups).forEach(group => {
      const { columns: groupColumns, max: groupLimit } = group;
      if (!groupColumns || !groupLimit) return;

      const ignoredSwimlanes = Object.keys(this.swimlanesSettings).filter(
        swimlaneId => this.swimlanesSettings[swimlaneId].ignoreWipInColumns
      );

      const swimlanesFilter = ignoredSwimlanes.map(swimlaneId => `:not([swimlane-id="${swimlaneId}"])`).join('');
      const notUseSubTask = this.constraintType === 'issueCountExclSubs' ? ':not(.ghx-issue-subtask)' : '';

      const amountOfGroupTasks = groupColumns.reduce((acc, columnId) => {
        const amountIssuesOneColumn = document.querySelectorAll(
          `.ghx-swimlane${swimlanesFilter} .ghx-column[data-column-id="${columnId}"] .ghx-issue:not(.ghx-done)${notUseSubTask}`
        ).length;

        return acc + amountIssuesOneColumn;
      }, 0);

      if (groupLimit < amountOfGroupTasks) {
        groupColumns.forEach(columnId => {
          document.querySelectorAll(`.ghx-column[data-column-id="${columnId}"]`).forEach(el => {
            el.style.backgroundColor = '#ff5630';
          });
        });
      }

      const leftTailColumnIndex = Math.min(
        ...groupColumns.map(columnId => columnsInOrder.indexOf(columnId)).filter(index => index != null)
      );
      const leftTailColumnId = columnsInOrder[leftTailColumnIndex];
      this.insertHTML(
        document.querySelector(`.ghx-column[data-id="${leftTailColumnId}"]`),
        'beforeend',
        `
          <span class="${styles.limitColumnBadge}">
              ${amountOfGroupTasks}/${groupLimit}
              <span class="${styles.limitColumnBadge__hint}">Issues per group / Max number of issues per group</span>
          </span>`
      );
    });
  }

  getOrderedColumns() {
    return map(
      column => column.dataset.columnId,
      document.querySelectorAll('.ghx-first ul.ghx-columns > li.ghx-column')
    );
  }
}
