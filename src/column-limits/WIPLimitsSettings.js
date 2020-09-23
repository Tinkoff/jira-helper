import map from '@tinkoff/utils/array/map';
import each from '@tinkoff/utils/array/each';
import mapObj from '@tinkoff/utils/object/map';
import filterObj from '@tinkoff/utils/object/filter';
import isEmpty from '@tinkoff/utils/is/empty';
import compose from '@tinkoff/utils/function/compose';
import { PageModification } from '../shared/PageModification';
import { getSettingsTab } from '../routing';
import { settingsDOM } from './constants';
import { BOARD_PROPERTIES } from '../shared/constants';
import style from './style.css';
import { getRandomString } from '../shared/utils';
import { generateColorByFirstChars } from './utils';

const ACTIVE_GROUP_COLUMN_COLOR = '#ff5630';

export default class extends PageModification {
  async shouldApply() {
    return (await getSettingsTab()) === 'columns';
  }

  getModificationId() {
    return `add-wip-settings-${this.getSearchParam('rapidView')}`;
  }

  getColumns() {
    let allColumns = document.querySelector('ul.ghx-column-wrapper:not(.ghx-fixed-column)')
      ? document.querySelectorAll('.ghx-column-wrapper:not(.ghx-fixed-column).ghx-mapped')
      : document.querySelectorAll('.ghx-column-wrapper:not(.ghx-fixed-column) > .ghx-mapped');

    // for JIRA 7.1.x
    // JIRA 7.1.x not have the "ul.ghx-column-wrapper"
    if (!allColumns || allColumns.length === 0) {
      allColumns = document.querySelectorAll('.ghx-mapped.ui-droppable[data-column-id]');
    }

    return allColumns;
  }

  appendStyles() {
    return `
      <style type="text/css">
          #${settingsDOM.groupOfBtns} { margin-top: 1rem; }
          #${settingsDOM.hintForPickGroups} { margin-left: 1rem; }
          #${settingsDOM.saveGroupBtn} {
            background-color: #0747a6;
            color: white;
          }
          .jiraHelperGroupMax__width {
            max-width: 50%;
          }
      </style>`;
  }

  waitForLoading() {
    return this.waitForElement('#columns');
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS)]);
  }

  apply([boardData = {}, wipLimits = {}]) {
    if (!boardData.canEdit) return;

    this.wipLimits = wipLimits;

    this.appendBtnsBeforeColumnTable();
    this.onDOMChange('#columns', () => {
      this.appendBtnsBeforeColumnTable();
    });

    this.modifyColumns();
  }

  modifyColumns() {
    Object.entries(this.wipLimits || {}).forEach(([groupId, groupData]) => {
      const { columns = [], max } = groupData;

      if (isEmpty(columns)) return;

      this.appendMaxOnColumn(columns, groupId, max);
      this.colorizeColumns(columns, groupId);
    });
  }

  colorizeColumns(columns, groupId) {
    if (document.querySelector(`style[data-group="${groupId}"]`)) return;

    let resultedStyles = '';
    columns.forEach(dataColumnId => {
      resultedStyles += ` #columns .ghx-mapped[data-column-id="${dataColumnId}"] { background-color: ${generateColorByFirstChars(
        groupId
      )}; }`;
    });

    this.insertHTML(
      document.head,
      'beforeend',
      `<style data-group="${groupId}" type="text/css">${resultedStyles}</style>`
    );
  }

  appendMaxOnColumn(columns, groupId, max) {
    const allColumns = this.getColumns();

    const allColumnIds = map(column => column.dataset.columnId, allColumns);

    const leftTailColumnIndex = Math.min(
      ...columns.map(columnId => allColumnIds.indexOf(columnId)).filter(index => index != null)
    );
    const leftTailColumnId = allColumnIds[leftTailColumnIndex];
    const leftTailColumn = document.querySelector(`[data-column-id="${leftTailColumnId}"]`);

    this.insertHTML(
      leftTailColumn.querySelector('.ghx-header-name'),
      'afterend',
      `<section class="${style.jiraHelperSubgroupMaximumWrapper}">
         <span for="jiraHelperGroupMaximum">Group Max.:</span>
         <input class="jiraHelperGroupMax__${groupId} jiraHelperGroupMax__width" name="jiraHelperGroupMaximum" value="${max}"/>
       </section>`
    );

    this.addEventListener(document.querySelector(`.jiraHelperGroupMax__${groupId}`), 'change', async event => {
      this.wipLimits[groupId] = {
        ...this.wipLimits[groupId],
        max: Number(event.target.value) || 0,
      };

      await this.updateBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS, this.wipLimits);

      event.target.classList.add(style.highlightUpdatedLimit);
      this.setTimeout(() => event.target.classList.remove(style.highlightUpdatedLimit), 1000);
    });
  }

  appendBtnsBeforeColumnTable() {
    const addGroup = this.insertHTML(
      document.querySelector('#ghx-config-columns > *:last-child'),
      'beforebegin',
      `<div id="${settingsDOM.groupOfBtns}" class="aui-buttons"><button id="${settingsDOM.addGroupBtn}" class="aui-button">Merge columns into a subgroup</button></div>`
    );

    const clearGroupsBtn = this.insertHTML(
      addGroup,
      'beforeend',
      '<button class="aui-button">Remove groups for the board</button>'
    );

    this.addEventListener(
      document.querySelector(`#${settingsDOM.addGroupBtn}`),
      'click',
      this.initiateGroupModification
    );
    this.addEventListener(clearGroupsBtn, 'click', this.clearGroups);
  }

  initiateGroupModification = () => {
    const groupAddBtn = document.querySelector(`#${settingsDOM.addGroupBtn}`);
    groupAddBtn.disabled = true;
    this.insertHTML(
      groupAddBtn,
      'afterend',
      `<button id="${settingsDOM.saveGroupBtn}" class="aui-button">Save</button>`
    );

    const columnAddBtn = document.querySelector('#ghx-config-columns > *:last-child');
    this.insertHTML(
      columnAddBtn,
      'afterend',
      `<span id="${settingsDOM.hintForPickGroups}">To select a subgroup, click on the columns</span>`
    );

    this.addHandlersForModificationInProgress();
  };

  addHandlersForModificationInProgress() {
    let inProgressGroup = [];
    const allColumns = this.getColumns();

    const allColumnIds = map(column => column.dataset.columnId, allColumns);

    const setColumnBgColor = bgColor => column => {
      if (column) column.style.backgroundColor = bgColor;
    };

    each(column => {
      this.addEventListener(column, 'click', event => {
        event.preventDefault();

        const { columnId } = column.dataset;

        if (!this.isClickableColumn(columnId, inProgressGroup, allColumnIds)) return;

        if (inProgressGroup.indexOf(columnId) < 0) {
          setColumnBgColor(ACTIVE_GROUP_COLUMN_COLOR)(column);

          // removes from other groups
          this.wipLimits = compose(
            filterObj(columnLimits => !isEmpty(columnLimits.columns)),
            mapObj(columnLimits => ({
              ...columnLimits,
              columns: columnLimits.columns.filter(id => columnId !== id),
            }))
          )(this.wipLimits);

          inProgressGroup.push(columnId);
        } else {
          setColumnBgColor(null)(column);
          inProgressGroup = inProgressGroup.filter(id => id !== columnId);
        }
      });
    }, allColumns);

    const saveGroupBtn = document.querySelector(`#${settingsDOM.saveGroupBtn}`);

    this.addEventListener(saveGroupBtn, 'click', () => {
      document.querySelector(`#${settingsDOM.addGroupBtn}`).disabled = false;
      saveGroupBtn.remove();
      document.querySelector(`#${settingsDOM.hintForPickGroups}`).remove();

      if (isEmpty(inProgressGroup)) return;

      this.wipLimits[getRandomString(7)] = {
        columns: [...inProgressGroup],
        max: 100,
      };
      this.updateBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS, this.wipLimits);

      each(setColumnBgColor(null), allColumns);
      this.clearColumns();
      this.modifyColumns();
    });
  }

  isClickableColumn(id, selectedColumns, columnsInOrder) {
    if (selectedColumns.length === 0 || (selectedColumns.length === 1 && selectedColumns[0] === id)) {
      return true;
    }

    const indexOfColumnInOrder = columnsInOrder.indexOf(id);
    const columnToTheRightHand = columnsInOrder[indexOfColumnInOrder + 1];
    const columnToTheLeftHand = columnsInOrder[indexOfColumnInOrder - 1];

    const isColumnToTheRightSelected = selectedColumns.indexOf(columnToTheRightHand) > -1;
    const isColumnToTheLeftSelected = selectedColumns.indexOf(columnToTheLeftHand) > -1;

    const isSelectedBoth = isColumnToTheRightSelected && isColumnToTheLeftSelected;

    if (isSelectedBoth) return false;
    if (isColumnToTheLeftSelected || isColumnToTheRightSelected) return true;
  }

  clearGroups = () => {
    if (!window.confirm('Are you sure you want to remove saved groups?')) return;

    this.deleteBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS);

    this.wipLimits = {};
    this.clearColumns();
  };

  clearColumns() {
    each(wrapper => wrapper.remove(), document.querySelectorAll(`.${style.jiraHelperSubgroupMaximumWrapper}`));
    each(st => st.remove(), document.querySelectorAll('style[data-group]'));
  }
}
