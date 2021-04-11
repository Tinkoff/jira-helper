import { PageModification } from '../../shared/PageModification';
import { getSettingsTab } from '../../routing';
import { settingsEditBtnTemplate, fieldLimitsTableTemplate, fieldRowTemplate } from './htmlTemplates';
import { Popup } from '../../shared/getPopup';
import { BOARD_PROPERTIES } from '../../shared/constants';
import { limitsKey, normalize } from '../shared';
import { ColorPickerTooltip } from '../../shared/colorPickerTooltip';

export default class FieldLimitsSettingsPage extends PageModification {
  static jiraSelectors = {
    cardLayout: '#ghx-config-cardLayout',
    cardLayoutDesc: '#ghx-config-cardLayout > p',
    cardLayoutConfig: '#ghx-card-layout-config-work',
    cardLayoutCurrentFields: '#ghx-card-layout-config-work .ui-sortable > tr',
  };

  static ids = {
    settingsBtn: 'jh-edit-wip-field-limits-btn',
    popupTable: 'jh-field-limits-table',
    popupTableBody: 'jh-field-limits-tbody',
    popupTableAddLimitRow: 'jh-field-limits-add-btn',
    inputFieldValue: 'jh-input-field-value',
    visualNameInput: 'jh-input-visual-name',
    columnsSelectId: 'jh-columns-select',
    swimlanesSelectId: 'jh-swimlanes-select',
    wipLimitInputId: 'jh-wip-limit-input',
    fieldSelectId: 'jh-select-field',
    applyColumns: 'jh-apply-columns-limits',
    applySwimlanes: 'jh-apply-swimlanes-limits',
  };

  static classes = {
    deleteRowBtn: 'jh-delete-row-btn',
  };

  async shouldApply() {
    return (await getSettingsTab()) === 'cardLayout';
  }

  getModificationId() {
    return `add-field-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(FieldLimitsSettingsPage.jiraSelectors.cardLayout);
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.FIELD_LIMITS)]);
  }

  apply([
    boardData = {},
    quickFilterSettings = {
      limits: {
        /*
          [limitKeys.encode(....)]: {
              fieldValue: string,
              fieldId: string,
              limit: number,
              columns: string[],
              swimlanes: string[]
           }
        */
      },
    },
  ]) {
    if (!boardData.canEdit) return;

    this.boardData = boardData;

    this.normalizedFields = normalize('fieldId', this.getCurrentFields());
    this.normalizedSwimlanes = normalize('id', boardData.swimlanesConfig.swimlanes);
    this.normalizedColumns = normalize('id', boardData.rapidListConfig.mappedColumns);

    this.settings = {
      limits: quickFilterSettings.limits || {},
    };

    this.onDOMChange(
      FieldLimitsSettingsPage.jiraSelectors.cardLayoutConfig,
      () => {
        this.normalizedFields = normalize('fieldId', this.getCurrentFields());
      },
      { childList: true, subtree: true }
    );

    this.colorPickerTooltip = new ColorPickerTooltip({
      onClose: () => {
        this.colorPickerGroupId = null;
      },
      onOk: hexStrColor => {
        this.wipLimits[this.colorPickerGroupId].customHexColor = hexStrColor;
        this.popup.clearContent();
        this.renderGroupsEditor();
      },
      addEventListener: (target, event, cb) => this.addEventListener(target, event, cb),
    });

    this.renderEditButton();
  }

  getCurrentFields() {
    const currentFieldNodes = document.querySelectorAll(FieldLimitsSettingsPage.jiraSelectors.cardLayoutCurrentFields);

    const result = [];
    currentFieldNodes.forEach(node => {
      const fieldId = node.getAttribute('data-fieldid');
      result.push({ fieldId, name: node.children[1]?.innerText });
    });
    return result;
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(FieldLimitsSettingsPage.jiraSelectors.cardLayoutDesc),
      'afterend',
      settingsEditBtnTemplate(FieldLimitsSettingsPage.ids.settingsBtn)
    );

    this.popup = new Popup({
      title: 'Edit WIP Limits by field',
      onConfirm: this.handleConfirmEditing,
      okButtonText: 'Save',
      size: 'large',
    });

    this.editBtn = document.getElementById(FieldLimitsSettingsPage.ids.settingsBtn);
    this.addEventListener(this.editBtn, 'click', this.handleEditClick);
  }

  handleEditClick = () => {
    this.popup.render();
    this.popup.appendToContent(
      fieldLimitsTableTemplate({
        tableId: FieldLimitsSettingsPage.ids.popupTable,
        tableBodyId: FieldLimitsSettingsPage.ids.popupTableBody,
        addLimitBtnId: FieldLimitsSettingsPage.ids.popupTableAddLimitRow,
        fieldValueInputId: FieldLimitsSettingsPage.ids.inputFieldValue,
        visualNameInputId: FieldLimitsSettingsPage.ids.visualNameInput,
        columnsSelectId: FieldLimitsSettingsPage.ids.columnsSelectId,
        swimlanesSelectId: FieldLimitsSettingsPage.ids.swimlanesSelectId,
        wipLimitInputId: FieldLimitsSettingsPage.ids.wipLimitInputId,
        applyColumnsId: FieldLimitsSettingsPage.ids.applyColumns,
        applySwimlanesId: FieldLimitsSettingsPage.ids.applySwimlanes,
        selectFieldId: FieldLimitsSettingsPage.ids.fieldSelectId,
        selectFieldOptions: this.normalizedFields.allIds.map(fieldId => ({
          text: this.normalizedFields.byId[fieldId].name,
          value: fieldId,
        })),
        swimlaneOptions: this.normalizedSwimlanes.allIds.map(swimlaneId => ({
          text: this.normalizedSwimlanes.byId[swimlaneId].name,
          value: swimlaneId,
        })),
        columnOptions: this.normalizedColumns.allIds.map(columnId => ({
          text: this.normalizedColumns.byId[columnId].name,
          value: columnId,
        })),
      })
    );

    this.renderRows();
    this.handleAddFieldLimitRowClick();
    this.handleAppliesLimitsToRows();
  };

  handleAppliesLimitsToRows() {
    const mergeSelectedRows = mergedRowObj => {
      const rows = document.querySelectorAll(`#${FieldLimitsSettingsPage.ids.popupTableBody} > tr`);

      rows.forEach(row => {
        const isSelected = row.querySelector('input[type="checkbox"]:checked');
        if (!isSelected) return;

        const id = row.getAttribute('data-field-project-row');

        this.settings.limits[id] = {
          ...this.settings.limits[id],
          ...mergedRowObj,
        };
      });

      this.renderRows();
    };

    this.addEventListener(document.getElementById(FieldLimitsSettingsPage.ids.applyColumns), 'click', () => {
      const { columns } = this.getSelectedSwimlanesAndColumnsOptions();
      mergeSelectedRows({ columns });
    });
    this.addEventListener(document.getElementById(FieldLimitsSettingsPage.ids.applySwimlanes), 'click', () => {
      const { swimlanes } = this.getSelectedSwimlanesAndColumnsOptions();
      mergeSelectedRows({ swimlanes });
    });
  }

  handleAddFieldLimitRowClick() {
    this.addEventListener(document.getElementById(FieldLimitsSettingsPage.ids.popupTableAddLimitRow), 'click', () => {
      const { fieldId, fieldValue, visualValue, limit } = this.getInputValues();
      const { columns, swimlanes } = this.getSelectedSwimlanesAndColumnsOptions();
      const id = limitsKey.encode(fieldValue, fieldId);

      if (!this.settings.limits[id]) {
        this.settings.limits[id] = {
          visualValue,
          fieldValue,
          fieldId,
          limit: +limit,
          columns,
          swimlanes,
        };
      }

      this.renderRows();
    });
  }

  handleConfirmEditing = unmountCallback => {
    this.updateBoardProperty(BOARD_PROPERTIES.FIELD_LIMITS, this.settings);
    unmountCallback();
  };

  renderRows() {
    document.getElementById(FieldLimitsSettingsPage.ids.popupTableBody).innerHTML = '';

    Object.keys(this.settings.limits).forEach(limitKey => {
      const { limit, columns, swimlanes, fieldId, fieldValue, visualValue } = this.settings.limits[limitKey];

      this.renderLimitRow({
        id: limitKey,
        fieldValue,
        visualValue,
        fieldId,
        limit,
        columns,
        swimlanes,
      });
    });
  }

  renderLimitRow({ id, fieldValue, visualValue, fieldId, limit, columns, swimlanes }) {
    const row = this.insertHTML(
      document.getElementById(FieldLimitsSettingsPage.ids.popupTableBody),
      'beforeend',
      fieldRowTemplate({
        id,
        fieldValue,
        visualValue,
        fieldId,
        fieldName: this.normalizedFields.byId[fieldId].name,
        limit,
        columns: columns.map(columnId => this.normalizedColumns.byId[columnId]),
        swimlanes: swimlanes.map(swimlaneId => this.normalizedSwimlanes.byId[swimlaneId]),
        deleteClassBtn: FieldLimitsSettingsPage.classes.deleteRowBtn,
      })
    );

    this.addEventListener(row.querySelector(`.${FieldLimitsSettingsPage.classes.deleteRowBtn}`), 'click', () => {
      delete this.settings.limits[id];
      row.remove();
    });
  }

  getInputValues() {
    const fieldValue = document.getElementById(FieldLimitsSettingsPage.ids.inputFieldValue).value;
    const visualValue = document.getElementById(FieldLimitsSettingsPage.ids.visualNameInput).value;
    const limit = document.getElementById(FieldLimitsSettingsPage.ids.wipLimitInputId).value;

    const selectedField = document.getElementById(FieldLimitsSettingsPage.ids.fieldSelectId)?.selectedOptions[0];
    const fieldId = selectedField.value;

    return {
      visualValue,
      fieldValue,
      fieldId,
      limit,
    };
  }

  getSelectedSwimlanesAndColumnsOptions() {
    const columnsOptions = document.getElementById(FieldLimitsSettingsPage.ids.columnsSelectId).selectedOptions;
    const swimlaneOptions = document.getElementById(FieldLimitsSettingsPage.ids.swimlanesSelectId).selectedOptions;

    return {
      columns: [...columnsOptions].map(option => option.value),
      swimlanes: [...swimlaneOptions].map(option => option.value),
    };
  }
}
