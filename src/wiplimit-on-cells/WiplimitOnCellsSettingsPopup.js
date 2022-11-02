import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { Popup } from '../shared/getPopup';
import { cellsAdd, ClearDataButton, RangeName, settingsEditWipLimitOnCells, settingsJiraDOM } from './constants';
import { TableRangeWipLimit } from './table';

export default class WipLimitOnCells extends PageModification {
  static ids = {
    editLimitsBtn: 'edit-WipLimitOnCells-btn-jh',
  };

  static jiraSelectors = {
    panelConfig: '#ghx-view-board-admins-edit',
  };

  getModificationId() {
    return `WipLimitByCells-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return Promise.all([this.waitForElement(WipLimitOnCells.jiraSelectors.panelConfig)]);
  }

  loadData() {
    return Promise.all([
      this.getBoardEditData(),
      Promise.all([this.getBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_CELLS)]),
    ]);
  }

  apply([boardData, settings]) {
    if (!(boardData && boardData.canEdit)) return;

    this.boardData = boardData;
    this.swimline = this.boardData?.swimlanesConfig?.swimlanes;
    this.column = this.boardData?.rapidListConfig?.mappedColumns;

    this.renderEditButton();
    [this.data] = settings;
    const handleGetNameLabel = (swimlaneId, columnid) => {
      const swimline = this.swimline.find(element => element.id.toString() === swimlaneId.toString());
      const column = this.column.find(element => element.id.toString() === columnid.toString());

      return `${swimline?.name} / ${column?.name}`;
    };
    this.table = new TableRangeWipLimit({ data: this.data, handleGetNameLabel });
  }

  appendStyles() {
    return `
    <style type="text/css">
    .WipLimitHover:hover{
      transform: scale(1.2);
    }
    .WipLimitHover{
      margin-right:2px;
      margin-left:2px;
    }
    </style>`;
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(WipLimitOnCells.jiraSelectors.panelConfig),
      'beforebegin',
      settingsEditWipLimitOnCells(WipLimitOnCells.ids.editLimitsBtn)
    );

    this.popup = new Popup({
      title: 'Edit WipLimit on cells',
      onConfirm: this.handleConfirmEditing,
      size: 'large',
      okButtonText: 'Save',
    });

    this.editBtn = document.getElementById(WipLimitOnCells.ids.editLimitsBtn);
    this.addEventListener(this.editBtn, 'click', this.handleEditClick);
  }

  handleEditClick = async () => {
    await this.popup.render();

    await this.popup.appendToContent(RangeName());
    await this.popup.appendToContent(cellsAdd(this.swimline, this.column));
    await this.popup.appendToContent(`<div id=${settingsJiraDOM.table}></div>`);

    await this.popup.appendToContent(ClearDataButton(settingsJiraDOM.ClearData));

    this.editBtn = document.getElementById(settingsJiraDOM.buttonRange);
    this.addEventListener(this.editBtn, 'click', this.handleOnClickAddRange);

    this.addcCellBtn = document.getElementById(settingsJiraDOM.buttonAddCells);
    this.addEventListener(this.addcCellBtn, 'click', this.handleOnClickAddCells);

    const clearBtn = document.getElementById(settingsJiraDOM.ClearData);
    this.addEventListener(clearBtn, 'click', this.handleClearSettings);

    await this.table.setDiv(document.getElementById(settingsJiraDOM.table));
    await this.table.render();
  };

  handleOnClickAddCells = () => {
    const { value: swimline } = document.getElementById(`${settingsJiraDOM.swimlineSelect}`).selectedOptions[0];
    const { value: column } = document.getElementById(`${settingsJiraDOM.columnSelect}`).selectedOptions[0];
    const { checked: showBadge } = document.getElementById(`${settingsJiraDOM.showBadge}`);
    if (swimline === '-' || column === '-') {
      return '';
    }

    const cells = {
      swimline,
      column,
      showBadge,
    };
    this.table.addCells(cells);
  };

  handleOnClickAddRange = () => {
    const { value: name } = document.getElementById(settingsJiraDOM.inputRange);
    this.table.addRange(name);
  };

  handleClearSettings = () => {
    this.table.setData([]);
    this.popup.unmount();
    this.handleEditClick();
    this.deleteBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_CELLS);
  };

  removeEditBtn() {
    this.editBtn.remove();
  }

  handleConfirmEditing = unmountCallback => {
    const data = this.table.getData();
    this.updateBoardProperty(BOARD_PROPERTIES.WIP_LIMITS_CELLS, data);
    unmountCallback();
  };
}
