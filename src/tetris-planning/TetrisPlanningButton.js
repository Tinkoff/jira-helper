import map from '@tinkoff/utils/array/map';
import template from './template.html';
import { PageModification } from '../shared/PageModification';
import { getSettingsTab } from '../routing';
import { formatTemplateForInserting } from '../shared/utils';
import { extensionApiService } from '../shared/ExtensionApiService';
import { BOARD_PROPERTIES } from '../shared/constants';

export default class extends PageModification {
  async shouldApply() {
    return (await getSettingsTab()) === 'estimation';
  }

  getModificationId() {
    return `add-tetris-button-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement('#estimation');
  }

  loadData() {
    return this.getBoardEditData();
  }

  apply(boardData, element) {
    if (!boardData.canEdit) return;

    this.insertHTML(
      element,
      'beforeend',
      `
        <div class="ghx-view-section" id="tetris-planing-button-wrapper">
            <button class="aui-button ghx-actions-tools" id="tetris-planning-button">Settings Tetris-Planning</button>
        </div>`
    );

    this.addEventListener(document.querySelector('#tetris-planning-button'), 'click', this.openTetrisPlanningModal);
  }

  openTetrisPlanningModal = async () => {
    const [{ availableEstimationStatistics: fields }, tetrisPlanning = []] = await Promise.all([
      this.getBoardEstimationData(),
      this.getBoardProperty(BOARD_PROPERTIES.TETRIS_PLANNING),
    ]);

    this.insertHTML(
      document.body,
      'beforeend',
      formatTemplateForInserting(template).replace(/\$BOARD/g, this.getBoardId())
    );

    this.insertHTML(
      document.querySelector('#select2-example'),
      'beforeend',
      fields.map(({ fieldId, name }) => `<option value="${name}" data-id="${fieldId}">${name}</option>`).join('')
    );

    tetrisPlanning.forEach(({ id, name, max, divider }) => this.appendRow(id, name, max, divider));

    this.addEventListener(document.querySelector('#dialog_planning_btn_add'), 'click', () => {
      const name = document.querySelector('#select2-example').value;
      const { id } = document.querySelector(`[value="${name}"]`).dataset;

      this.appendRow(
        id,
        document.querySelector('#select2-example').value,
        document.querySelector('#dialog_planning_max_add').value,
        document.querySelector('#dialog_planning_value_divider').value || 1
      );
    });

    this.addEventListener(document.querySelector('#dialog-confirm'), 'click', () => {
      const value = map(row => {
        return {
          id: row.dataset.id,
          name: row.querySelector('.name').textContent,
          max: row.querySelector('.max').textContent,
          divider: Number(row.querySelector('.divider').textContent, 10),
        };
      }, document.querySelectorAll('#dialog_planning_tbody .aui-restfultable-row'));

      this.updateBoardProperty(BOARD_PROPERTIES.TETRIS_PLANNING, value);
      document.querySelector('#dialog-cancel').click();
    });

    //  window.AJS is not available here
    const script = document.createElement('script');
    script.setAttribute('src', extensionApiService.getUrl('openModal.js'));
    document.body.appendChild(script);
  };

  appendRow(id, name, max, divider) {
    const row = this.insertHTML(
      document.querySelector('#dialog_planning_tbody'),
      'beforeend',
      `<tr data-id="${id}" class="aui-restfultable-readonly aui-restfultable-row" id="dialog_planning_tr">
          <td></td>
          <td class="name">${name}</td>
          <td class="max">${max}</td>
          <td class="divider">${divider}</td>
          <td><a href="#" id="dialog_planning_btn_delete" class="aui-button">Delete</a></td>
          <td></td>
        </tr>`
    );

    this.addEventListener(row.querySelector('#dialog_planning_btn_delete'), 'click', () => row.remove());
  }
}
