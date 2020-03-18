import each from '@tinkoff/utils/array/each';
import { PageModification } from '../shared/PageModification';
import { getSettingsTab } from '../routing';
import style from './styles.css';
import { BOARD_PROPERTIES } from '../shared/constants';
import { mergeSwimlaneSettings } from './utils';
import { settingsJiraDOM as DOM } from './constants';

const EMPTY_LIMIT_VALUE = ' - ';

export default class extends PageModification {
  async shouldApply() {
    return (await getSettingsTab()) === 'swimlanes';
  }

  getModificationId() {
    return `add-swimlane-settings-${this.getSearchParam('rapidView')}`;
  }

  appendStyles() {
    return `
    <style>
      .${style.limitInput} { display: none; }
      .${style.ignoreWIPInColumnsInput} { display: none; }
      .aui-restfultable-focused > td.${style.limitInfo} > .${style.limitInput} { display: inline; }
      .aui-restfultable-focused > td.${style.limitInfo} > .${style.limitValue} { display: none; }
      .aui-restfultable-focused > td.${style.ignoreWIPInColumns} > .${style.ignoreWIPInColumnsInput} { display: inline; }
      .aui-restfultable-focused > td.${style.ignoreWIPInColumns} > .${style.ignoreWIPInColumnsValue} { display: none; }
      .aui-restfultable-create > .aui-restfultable-focused > td.${style.limitInfo} > .${style.limitValue} { visibility: hidden; }
      .aui-restfultable-create > .aui-restfultable-focused > td.${style.limitInfo} > .${style.limitInput} { display: none; }
      .aui-restfultable-create > .aui-restfultable-focused > td.${style.ignoreWIPInColumns} > .${style.ignoreWIPInColumnsValue} { visibility: hidden; }
      .aui-restfultable-create > .aui-restfultable-focused > td.${style.ignoreWIPInColumns} > .${style.ignoreWIPInColumnsInput} { display: none; }
    </style>
`;
  }

  waitForLoading() {
    return this.waitForElement('#swimlanes');
  }

  loadData() {
    return Promise.all([
      this.getBoardEditData(),
      Promise.all([
        this.getBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS),
        this.getBoardProperty(BOARD_PROPERTIES.OLD_SWIMLANE_SETTINGS),
      ]).then(mergeSwimlaneSettings),
    ]);
  }

  apply([boardData, settings]) {
    this.settings = settings;

    if (boardData && boardData.canEdit) {
      this.renderClearButton();
      this.modifyTableHeader();
      this.modifyCreationRow();
      this.modifySimpleRows();
    }
  }

  renderClearButton() {
    const resetSwimlaneLimitsBtnId = 'reset-swimlane-settings';

    this.insertHTML(
      document.querySelector('#ghx-swimlane-strategy-config'),
      'beforebegin',
      `
        <div class="${style.resetSwimlaneWrapper}">
            <button id="${resetSwimlaneLimitsBtnId}" class="aui-button" type="button">Reset swimlane limits</button>
        </div>
      `
    );

    const resetBtn = document.querySelector(`#${resetSwimlaneLimitsBtnId}`);
    resetBtn.addEventListener('click', async () => {
      try {
        resetBtn.disabled = true;
        await this.deleteBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS);
        this.settings = {};

        each(limit => {
          limit.querySelector('span').textContent = EMPTY_LIMIT_VALUE;
          limit.querySelector('input').value = EMPTY_LIMIT_VALUE;
        }, document.querySelectorAll('.wip-limit-cell'));

        each(ignoreWip => {
          ignoreWip.querySelector('span').textContent = 'false';
          ignoreWip.querySelector('input').removeAttribute('checked');
        }, document.querySelectorAll('.is-expedite-cell'));
      } finally {
        resetBtn.disabled = false;
      }
    });
  }

  modifyTableHeader() {
    const tableHeaderRow = document.querySelector(`${DOM.table} > ${DOM.tableHead} > ${DOM.row}`);
    const secondColumn = tableHeaderRow.querySelector(`${DOM.headCell}:nth-child(2)`);
    this.insertHTML(secondColumn, 'beforebegin', `<th class="${style.limitInfo}">WIP Limits</th>`);
    this.insertHTML(
      secondColumn,
      'beforebegin',
      `<th class="${style.ignoreWIPInColumns}">Is expedite <i title="Issues from this swimlane will be ignored from column WIP limits" style="font-style: normal; cursor: pointer;">&#9432;</i></th>`
    );
  }

  modifyCreationRow() {
    const selector = `${DOM.table} > ${DOM.createTbody} > ${DOM.row}`;
    const creationRow = document.querySelector(selector);

    const secondColumn = creationRow.querySelector(`${DOM.cell}:nth-child(2)`);
    this.insertHTML(secondColumn, 'beforebegin', this.renderLimitCell());
    this.insertHTML(secondColumn, 'beforebegin', this.renderIgnoreWIPLimitsCell());

    this.onDOMChangeOnce(selector, () => {
      this.modifyCreationRow();
      this.modifySimpleRows();
    });
  }

  renderLimitCell(swimlineId, swimlineLimit = EMPTY_LIMIT_VALUE) {
    return `
    <td class="${style.limitInfo} wip-limit-cell">
      <span class="${style.limitValue}" data-swimline-id="${swimlineId}">${swimlineLimit || EMPTY_LIMIT_VALUE}</span>
      <input type="text" value="${swimlineLimit}" class="${style.limitInput}"/>
    </td>
  `;
  }

  renderIgnoreWIPLimitsCell(swimlineId, ignoreWipInColumns = false) {
    return `
    <td class="${style.ignoreWIPInColumns} is-expedite-cell">
      <span class="${style.ignoreWIPInColumnsValue}"  data-swimline-id="${swimlineId}">${ignoreWipInColumns}</span>
      <input type="checkbox" ${ignoreWipInColumns ? 'checked' : ''} class="${style.ignoreWIPInColumnsInput}"/>
    </td>
  `;
  }

  modifySimpleRows = () => {
    const swimlaneRows = document.querySelectorAll(`${DOM.table} > ${DOM.sortableTbody} > ${DOM.row}`);
    each(row => {
      if (row.classList.contains(DOM.everythingElseRow)) return;

      const rowType = row.classList.contains('aui-restfultable-editrow') ? 'edit' : 'view';
      if (row.dataset.modifiedRowType === rowType) return;

      this.showInputBoxLimits(row);
      this.showIgnoreWipInColumns(row);

      this.setDataAttr(row, 'modifiedRowType', rowType);
    }, swimlaneRows);

    each(button => {
      this.addEventListener(button, 'click', e => this.handleSettingsChange(e));
    }, document.querySelectorAll(`${DOM.table} > ${DOM.sortableTbody} > ${DOM.row} input[type=submit]`));

    // переход в редактирование
    this.onDOMChangeOnce(`${DOM.table} > ${DOM.sortableTbody}`, () => this.modifySimpleRows(), {
      attributeFilter: ['class'],
      subtree: true,
    });
  };

  showInputBoxLimits(row) {
    const secondColumn = row.querySelector(`${DOM.cell}:nth-child(2)`);
    const swimlineId = row.getAttribute('data-id');
    const swimlineLimit = this.settings[swimlineId] && this.settings[swimlineId].limit;

    this.insertHTML(secondColumn, 'beforebegin', this.renderLimitCell(swimlineId, swimlineLimit));
  }

  showIgnoreWipInColumns(row) {
    const thirdColumn = row.querySelector(`${DOM.cell}:nth-child(3)`);
    const swimlineId = row.getAttribute('data-id');
    const ignoreWipInColumns = this.settings[swimlineId] && this.settings[swimlineId].ignoreWipInColumns;

    this.insertHTML(thirdColumn, 'beforebegin', this.renderIgnoreWIPLimitsCell(swimlineId, ignoreWipInColumns));
  }

  handleSettingsChange(event) {
    const row = event.target.parentElement.parentElement;
    const swimlaneId = Number(row.dataset.id);
    const limit = Number(row.querySelector(`.${style.limitInput}`).value) || null;
    const ignoreWipInColumns = row.querySelector(`.${style.ignoreWIPInColumnsInput}`).checked;

    this.settings[swimlaneId] = { limit, ignoreWipInColumns };

    this.updateBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS, this.settings);
  }
}
