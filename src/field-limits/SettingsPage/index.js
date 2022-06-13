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
    popupTableEditLimitRow: 'jh-field-limits-edit-btn',
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
    editRowBtn: 'jh-edit-row-btn',
    deleteRowBtn: 'jh-delete-row-btn',
  };

  static limitKeyOfEditable = undefined;

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
      onOk: (hexStrColor, dataId) => {
        this.settings.limits[dataId].bkgColor = hexStrColor;
        this.renderRows();
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
        editLimitBtnId: FieldLimitsSettingsPage.ids.popupTableEditLimitRow,
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
    this.renderColorPicker();
  };

  handleAppliesLimitsToRows() {
    const mergeSelectedRows = mergedRowObj => {
      const rows = document.querySelectorAll(`#${FieldLimitsSettingsPage.ids.popupTableBody} > tr`);

      rows.forEach(row => {
        const isSelected = row.querySelector('input[type="checkbox"]:checked');
        if (!isSelected) return;

        const limitKey = row.getAttribute('data-field-project-row');

        this.settings.limits[limitKey] = {
          ...this.settings.limits[limitKey],
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

  handleButtonsFieldLimitRowClick() {
    const btnAdd = document.getElementById(FieldLimitsSettingsPage.ids.popupTableAddLimitRow);
    const btnEdit = document.getElementById(FieldLimitsSettingsPage.ids.popupTableEditLimitRow);

    const setValuesToTable = limitKey => {
      const { fieldId, fieldValue, visualValue, limit } = this.getInputValues();
      const { columns, swimlanes } = this.getSelectedSwimlanesAndColumnsOptions();
      const isEdit = limitKey != null;

      if (!isEdit) {
        limitKey = limitsKey.encode(fieldValue, fieldId);
      }

      if (!this.settings.limits[limitKey] || isEdit) {
        this.settings.limits[limitKey] = {
          ...this.settings.limits[limitKey],
          visualValue,
          fieldValue,
          fieldId,
          limit: +limit,
          columns,
          swimlanes,
        };
      }

      this.renderRows();
      btnEdit.disabled = true;
      this.limitKeyOfEditable = undefined;
    };

    this.addEventListener(btnAdd, 'click', () => {
      setValuesToTable(null);
    });

    this.addEventListener(btnEdit, 'click', () => {
      if (this.limitKeyOfEditable == null) {
        btnEdit.disabled = true;
        return;
      }
      setValuesToTable(this.limitKeyOfEditable);
    });
  }

  handleConfirmEditing = unmountCallback => {
    this.updateBoardProperty(BOARD_PROPERTIES.FIELD_LIMITS, this.settings);
    unmountCallback();
  };

  renderColorPicker = () => {
    const table = document.getElementById(FieldLimitsSettingsPage.ids.popupTable);

    this.colorPickerTooltip.init(this.popup.contentBlock, 'colorpicker-data-id');

    this.addEventListener(table, 'click', event => {
      this.colorPickerTooltip.showTooltip(event);
    });
  };

  renderRows() {
    document.getElementById(FieldLimitsSettingsPage.ids.popupTableBody).innerHTML = '';

    Object.keys(this.settings.limits).forEach(limitKey => {
      const { limit, columns, swimlanes, fieldId, fieldValue, visualValue, bkgColor } = this.settings.limits[limitKey];

      this.renderLimitRow({
        limitKey,
        fieldValue,
        visualValue,
        bkgColor,
        fieldId,
        limit,
        columns,
        swimlanes,
      });
    });

    this.handleButtonsFieldLimitRowClick();
    this.handleAppliesLimitsToRows();
  }

  renderLimitRow({ limitKey, fieldValue, visualValue, bkgColor, fieldId, limit, columns, swimlanes }) {
    const nzFieldIdSettings = this.normalizedFields.byId[fieldId];

    const fieldName = nzFieldIdSettings ? nzFieldIdSettings.name : `[${fieldId}]`;
    const row = this.insertHTML(
      document.getElementById(FieldLimitsSettingsPage.ids.popupTableBody),
      'beforeend',
      fieldRowTemplate({
        limitKey,
        fieldValue,
        visualValue,
        bkgColor,
        fieldId,
        fieldName,
        limit,
        columns: columns.map(columnId => this.normalizedColumns.byId[columnId] || `column [${fieldId}]`),
        swimlanes: swimlanes.map(swimlaneId => this.normalizedSwimlanes.byId[swimlaneId] || `swimlane [${fieldId}]`),
        editClassBtn: FieldLimitsSettingsPage.classes.editRowBtn,
        deleteClassBtn: FieldLimitsSettingsPage.classes.deleteRowBtn,
      })
    );

    this.addEventListener(row.querySelector(`.${FieldLimitsSettingsPage.classes.editRowBtn}`), 'click', event => {
      this.setInputValues(limitKey);
      event.stopPropagation();
      event.stopPropagation();
    });

    this.addEventListener(row.querySelector(`.${FieldLimitsSettingsPage.classes.deleteRowBtn}`), 'click', event => {
      delete this.settings.limits[limitKey];
      row.remove();
      event.stopPropagation();
      event.stopPropagation();
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

  setInputValues(limitKey) {
    const { fieldValue, visualValue, limit, fieldId, columns, swimlanes } = this.settings.limits[limitKey];

    this.limitKeyOfEditable = limitKey;
    document.getElementById(FieldLimitsSettingsPage.ids.popupTableEditLimitRow).disabled = false;

    document.getElementById(FieldLimitsSettingsPage.ids.inputFieldValue).value = fieldValue;
    document.getElementById(FieldLimitsSettingsPage.ids.visualNameInput).value = visualValue;
    document.getElementById(FieldLimitsSettingsPage.ids.wipLimitInputId).value = limit;
    document.getElementById(FieldLimitsSettingsPage.ids.fieldSelectId).value = fieldId;
    this.setSelectedSwimlanesAndColumnsOptions(columns, swimlanes);
  }

  setSelectedSwimlanesAndColumnsOptions(columns, swimlanes) {
    const columnsOptions = document.getElementById(FieldLimitsSettingsPage.ids.columnsSelectId).options;
    const swimlaneOptions = document.getElementById(FieldLimitsSettingsPage.ids.swimlanesSelectId).options;

    columnsOptions.forEach(option => {
      option.selected = columns.includes(option.value);
    });
    swimlaneOptions.forEach(option => {
      option.selected = swimlanes.includes(option.value);
    });
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
