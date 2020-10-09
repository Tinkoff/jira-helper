import isEmpty from '@tinkoff/utils/is/empty';
import keys from '@tinkoff/utils/object/keys';
import { PageModification } from '../../shared/PageModification';
import { getSettingsTab } from '../../routing';
import { BOARD_PROPERTIES, btnGroupIdForColumnsSettingsPage } from '../../shared/constants';
import { mapColumnsToGroups } from '../shared/utils';
import { Popup } from '../../shared/getPopup';
import {
  formTemplate,
  groupSettingsBtnTemplate,
  groupTemplate,
  columnTemplate,
  dragOverHereTemplate,
  groupsTemplate,
} from './htmlTemplates';
import styles from './styles.css';
import { getRandomString } from '../../shared/utils';

const WITHOUT_GROUP_ID = 'Without Group';

export default class SettingsWIPLimits extends PageModification {
  static ids = {
    openEditorButton: 'jh-add-group-btn',
    formId: 'jh-wip-limits-form',
    createGroupDropzone: 'jh-column-dropzone',
    allGroups: 'jh-all-groups',
  };

  static classes = {
    draggable: 'draggable-jh',
    dropzone: 'dropzone-jh',
    groupLimitsInput: 'group-limits-input-jh',
  };

  static jiraSelectors = {
    ulColumnsWrapper: 'ul.ghx-column-wrapper:not(.ghx-fixed-column)',
    allColumns: '.ghx-column-wrapper:not(.ghx-fixed-column).ghx-mapped',
    allColumnsInner: '.ghx-column-wrapper:not(.ghx-fixed-column) > .ghx-mapped',
    allColumnsJira7: '.ghx-mapped.ui-droppable[data-column-id]',
    columnsConfigLastChild: '#ghx-config-columns > *:last-child',
    columnHeaderName: '.ghx-header-name',
  };

  async shouldApply() {
    return (await getSettingsTab()) === 'columns';
  }

  getModificationId() {
    return `add-wip-settings-${this.getSearchParam('rapidView')}`;
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

    this.renderSettingsButton();
  }

  getColumns() {
    let allColumns = document.querySelector(SettingsWIPLimits.jiraSelectors.ulColumnsWrapper)
      ? document.querySelectorAll(SettingsWIPLimits.jiraSelectors.allColumns)
      : document.querySelectorAll(SettingsWIPLimits.jiraSelectors.allColumnsInner);

    // for JIRA 7.1.x
    // JIRA 7.1.x not have the "ul.ghx-column-wrapper"
    if (!allColumns || allColumns.length === 0) {
      allColumns = document.querySelectorAll(SettingsWIPLimits.jiraSelectors.allColumnsJira7);
    }

    return allColumns;
  }

  draggingElement = null;

  editorFormListeners = {
    dragstart: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.draggable)) return;

      this.draggingElement = e.target;
    },
    dragend: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.draggable)) return;

      this.draggingElement = null;
    },
    dragleave: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.dropzone)) return;

      e.target.classList.remove(styles.addGroupDropzoneActiveJH);
    },
    drop: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.dropzone)) return;

      e.target.classList.remove(styles.addGroupDropzoneActiveJH);
      const columnId = this.draggingElement.getAttribute('data-column-id');
      const fromGroup = this.draggingElement.getAttribute('data-group-id');
      const toGroup = e.target.getAttribute('data-group-id') ?? getRandomString(7);

      const column = this.mappedColumnsToGroups.byGroupId[fromGroup].byColumnId[columnId];

      this.moveColumn(column, fromGroup, toGroup);
      this.draggingElement.remove();
    },
    dragover: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.dropzone)) return;

      e.preventDefault();
      e.stopPropagation();
      e.target.classList.add(styles.addGroupDropzoneActiveJH);
    },
    input: e => {
      if (!e.target.classList.contains(SettingsWIPLimits.classes.groupLimitsInput)) return;

      const groupId = e.target.getAttribute('data-group-id');
      if (this.wipLimits[groupId]) {
        this.wipLimits[groupId] = {
          ...this.wipLimits[groupId],
          max: e.target.value,
        };
      }
    },
  };

  renderSettingsButton() {
    const openModalBtn = this.insertHTML(
      document.querySelector(SettingsWIPLimits.jiraSelectors.columnsConfigLastChild),
      'beforebegin',
      groupSettingsBtnTemplate({
        openEditorBtn: SettingsWIPLimits.ids.openEditorButton,
        groupOfBtnsId: btnGroupIdForColumnsSettingsPage,
      })
    );

    this.addEventListener(openModalBtn, 'click', this.openGroupSettingsPopup);
  }

  openGroupSettingsPopup = () => {
    this.popup = new Popup({
      title: 'Limits for groups',
      okButtonText: 'Save',
      onConfirm: this.handleSubmit,
      onCancel: this.handleClose,
    });
    this.popup.render();

    this.mappedColumnsToGroups = mapColumnsToGroups({
      columnsHtmlNodes: this.getColumns(),
      wipLimits: this.wipLimits,
      withoutGroupId: WITHOUT_GROUP_ID,
    });

    this.renderGroupsEditor();
  };

  groupHtml(groupId) {
    const { max } = this.wipLimits[groupId] || {};
    const columns = this.mappedColumnsToGroups.byGroupId[groupId];

    return groupTemplate({
      dropzoneClass: SettingsWIPLimits.classes.dropzone,
      groupLimitsClass: SettingsWIPLimits.classes.groupLimitsInput,
      withoutGroupId: WITHOUT_GROUP_ID,
      groupId,
      groupMax: max,
      columnsHtml: columns
        ? columns.allColumnIds
            .map(columnId => {
              const { column, id } = columns.byColumnId[columnId];
              return this.columnHtml(id, column, groupId);
            })
            .join('')
        : '',
    });
  }

  columnHtml(id, column, groupId) {
    const columnHeader = column.querySelector(SettingsWIPLimits.jiraSelectors.columnHeaderName);
    const columnTitle = columnHeader.getAttribute('title');

    return columnTemplate({
      columnTitle,
      columnId: id,
      dataGroupId: groupId,
      draggableClass: SettingsWIPLimits.classes.draggable,
    });
  }

  renderGroupsEditor() {
    this.popup.appendToContent(
      formTemplate({
        id: SettingsWIPLimits.ids.formId,
        leftBlock: this.groupHtml(WITHOUT_GROUP_ID),
        rightBlock: `
          ${groupsTemplate({
            id: SettingsWIPLimits.ids.allGroups,
            children: this.mappedColumnsToGroups.allGroupIds
              .map(groupId => (groupId !== WITHOUT_GROUP_ID ? this.groupHtml(groupId) : ''))
              .join(''),
          })}
          ${dragOverHereTemplate({
            dropzoneId: SettingsWIPLimits.ids.createGroupDropzone,
            dropzoneClass: SettingsWIPLimits.classes.dropzone,
          })}
        `,
      })
    );
    this.initEditorListeners();
  }

  initEditorListeners() {
    const form = document.getElementById(SettingsWIPLimits.ids.formId);

    keys(this.editorFormListeners).forEach(listenerKey => {
      form.addEventListener(listenerKey, this.editorFormListeners[listenerKey]);
    });
  }

  moveColumn(column, fromGroup, toGroup) {
    if (this.wipLimits[fromGroup]) {
      this.wipLimits[fromGroup].columns = this.wipLimits[fromGroup].columns.filter(columnId => columnId !== column.id);
      if (isEmpty(this.wipLimits[fromGroup].columns)) delete this.wipLimits[fromGroup];
    }

    const isGroupAlreadyExist = keys(this.wipLimits).includes(toGroup);
    const isNewGroup = toGroup !== WITHOUT_GROUP_ID;

    switch (true) {
      case isGroupAlreadyExist:
        this.wipLimits[toGroup] = {
          columns: [...this.wipLimits[toGroup].columns, column.id],
          max: this.wipLimits[toGroup].max,
        };
        break;
      case isNewGroup:
        this.wipLimits[toGroup] = {
          columns: [column.id],
          max: 100,
        };
        break;
      default:
        break;
    }

    this.mappedColumnsToGroups = mapColumnsToGroups({
      columnsHtmlNodes: this.getColumns(),
      wipLimits: this.wipLimits,
      withoutGroupId: WITHOUT_GROUP_ID,
    });

    this.popup.clearContent();
    this.renderGroupsEditor();
  }

  handleSubmit = async unmountPopup => {
    await this.updateBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_SETTINGS, this.wipLimits);
    unmountPopup();
  };
}
