import { PageModification } from '../shared/PageModification';
import { getSettingsTab } from '../routing';
import { BOARD_PROPERTIES } from '../shared/constants';
import { mergeSwimlaneSettings } from './utils';
import { Popup } from '../shared/getPopup';
import { settingsEditBtnTemplate, settingsPopupTableRowTemplate, settingsPopupTableTemplate } from './constants';

export default class SwimlaneSettingsLimit extends PageModification {
  static ids = {
    editLimitsBtn: 'edit-limits-btn-jh',
    editTable: 'edit-table-jh',
  };

  static classes = {
    editSwimlaneRow: 'edit-swimlane-row-jh',
  };

  static jiraSelectors = {
    swimlanes: '#swimlanes',
    swimlaneConfig: '#ghx-swimlane-strategy-config',
  };

  async shouldApply() {
    return (await getSettingsTab()) === 'swimlanes';
  }

  getModificationId() {
    return `add-swimlane-settings-${this.getSearchParam('rapidView')}`;
  }

  waitForLoading() {
    return this.waitForElement(SwimlaneSettingsLimit.jiraSelectors.swimlanes);
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
    this.boardData = boardData;

    if (boardData && boardData.canEdit) {
      this.renderEditButton();
    }
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(SwimlaneSettingsLimit.jiraSelectors.swimlaneConfig),
      'beforebegin',
      settingsEditBtnTemplate(SwimlaneSettingsLimit.ids.editLimitsBtn)
    );

    this.popup = new Popup({
      title: 'Edit swimlane limits',
      onConfirm: this.handleConfirmEditing,
      okButtonText: 'Save',
    });

    const editBtn = document.getElementById(SwimlaneSettingsLimit.ids.editLimitsBtn);
    this.addEventListener(editBtn, 'click', () => {
      this.popup.render();
      this.popup.appendToContent(
        settingsPopupTableTemplate(
          SwimlaneSettingsLimit.ids.editTable,
          this.boardData.swimlanesConfig.swimlanes
            .map(item =>
              settingsPopupTableRowTemplate({
                id: item.id,
                name: item.name,
                limit: this.settings[item.id] ? this.settings[item.id].limit : 0,
                isIgnored: this.settings[item.id] ? this.settings[item.id].ignoreWipInColumns : false,
                rowClass: SwimlaneSettingsLimit.classes.editSwimlaneRow,
              })
            )
            .join('')
        )
      );
    });
  }

  handleConfirmEditing = unmountCallback => {
    const rows = document.querySelectorAll(
      `#${SwimlaneSettingsLimit.ids.editTable} .${SwimlaneSettingsLimit.classes.editSwimlaneRow}`
    );
    const updatedSettings = {};

    rows.forEach(row => {
      const { value: rawLimitValue } = row.querySelector('input[type="number"]');
      const { checked: isExpediteValue } = row.querySelector('input[type="checkbox"]');

      const swimlaneId = row.getAttribute('data-swimlane-id');
      const limitValue = Number.parseInt(rawLimitValue, 10);

      if (limitValue < 1) return;

      updatedSettings[swimlaneId] = {
        limit: limitValue,
        ignoreWipInColumns: isExpediteValue,
      };
    });

    this.settings = updatedSettings;
    this.updateBoardProperty(BOARD_PROPERTIES.SWIMLANE_SETTINGS, updatedSettings);
    unmountCallback();
  };
}
