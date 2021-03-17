import { PageModification } from '../../shared/PageModification';
import { getSettingsTab } from '../../routing';
import { settingsEditBtnTemplate, fieldLimitsTableTemplate, fieldRowTemplate } from './htmlTemplates';
import { Popup } from '../../shared/getPopup';
import { BOARD_PROPERTIES } from '../../shared/constants';
import { limitsKey, normalize } from '../shared';

export default class FieldLimitsSettingsPage extends PageModification {
  static jiraSelectors = {
    detailView: '#ghx-config-cardLayout',
    detailViewDesc: '#ghx-config-cardLayout > p',
  };

  static ids = {
    settingsBtn: 'jh-edit-wip-field-limits-btn',
    popupTable: 'jh-field-limits-table',
    popupTableBody: 'jh-field-limits-tbody',
    popupTableAddLimitRow: 'jh-field-limits-add-btn',
    inputProjectKey: 'jh-input-project-key',
    inputFieldValue: 'jh-input-field-value',
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
    return `add-quick-filters-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(FieldLimitsSettingsPage.jiraSelectors.detailView);
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.FIELD_LIMITS)]);
  }

  apply([
    boardData = {},
    quickFilterSettings = {
      limits: {
        /* [limitKeys.encode(....)]: { limit: number } */
      },
    },
  ]) {
    if (!boardData.canEdit) return;

    this.boardData = boardData;

    this.normalizedFields = normalize('fieldId', boardData.detailViewFieldConfig.currentFields);
    this.normalizedSwimlanes = normalize('id', boardData.swimlanesConfig.swimlanes);
    this.normalizedColumns = normalize('id', boardData.rapidListConfig.mappedColumns);

    this.settings = {
      limits: quickFilterSettings.limits || {},
    };

    this.renderEditButton();
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(FieldLimitsSettingsPage.jiraSelectors.detailViewDesc),
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
        projectKeyInputId: FieldLimitsSettingsPage.ids.inputProjectKey,
        fieldValueInputId: FieldLimitsSettingsPage.ids.inputFieldValue,
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
      const { fieldId, fieldValue, projectKey, limit } = this.getInputValues();
      const { columns, swimlanes } = this.getSelectedSwimlanesAndColumnsOptions();
      const id = limitsKey.encode(projectKey, fieldValue, fieldId);

      if (!this.settings.limits[id]) {
        this.settings.limits[id] = {
          fieldValue,
          fieldId,
          projectKey,
          limit,
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
      const { limit, columns, swimlanes, fieldId, fieldValue, projectKey } = this.settings.limits[limitKey];

      this.renderLimitRow({
        id: limitKey,
        fieldValue,
        fieldId,
        projectKey,
        limit,
        columns,
        swimlanes,
      });
    });
  }

  renderLimitRow({ id, projectKey, fieldValue, fieldId, limit, columns, swimlanes }) {
    const row = this.insertHTML(
      document.getElementById(FieldLimitsSettingsPage.ids.popupTableBody),
      'beforeend',
      fieldRowTemplate({
        id,
        projectKey,
        fieldValue,
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
    const projectKey = document.getElementById(FieldLimitsSettingsPage.ids.inputProjectKey).value;
    const limit = document.getElementById(FieldLimitsSettingsPage.ids.wipLimitInputId).value;

    const selectedField = document.getElementById(FieldLimitsSettingsPage.ids.fieldSelectId)?.selectedOptions[0];
    const fieldId = selectedField.value;

    return {
      projectKey,
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
