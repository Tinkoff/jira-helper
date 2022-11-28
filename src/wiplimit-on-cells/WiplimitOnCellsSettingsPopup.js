import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES, btnGroupIdForColumnsSettingsPage } from '../shared/constants';
import { Popup } from '../shared/getPopup';
import { cellsAdd, ClearDataButton, RangeName, settingsEditWipLimitOnCells, settingsJiraDOM } from './constants';
import { TableRangeWipLimit } from './table';

export default class WipLimitOnCells extends PageModification {
  static ids = {
    editLimitsBtn: 'edit-WipLimitOnCells-btn-jh',
  };

  static jiraSelectors = {
    panelConfig: '#jh-group-of-btns-setting-page',
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
    this.onDOMChange('#columns', () => {
      this.renderEditButton();
    });

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
    const editBtn = this.insertHTML(
      document.getElementById(btnGroupIdForColumnsSettingsPage),
      'beforeend',
      settingsEditWipLimitOnCells(WipLimitOnCells.ids.editLimitsBtn)
    );

    this.popup = new Popup({
      title: 'Edit WipLimit on cells',
      onConfirm: this.handleConfirmEditing,
      size: 'large',
      okButtonText: 'Save',
    });

    this.addEventListener(editBtn, 'click', this.handleEditClick);
  }

  handleEditClick = async () => {
    await this.popup.render();

    await this.popup.appendToContent(RangeName());
    await this.popup.appendToContent(cellsAdd(this.swimline, this.column));
    await this.popup.appendToContent(`<div id=${settingsJiraDOM.table}></div>`);

    await this.popup.appendToContent(ClearDataButton(settingsJiraDOM.ClearData));

    this.editBtn = document.getElementById(settingsJiraDOM.buttonRange);
    this.addEventListener(this.editBtn, 'click', this.handleOnClickAddRange);

    const clearBtn = document.getElementById(settingsJiraDOM.ClearData);
    this.addEventListener(clearBtn, 'click', this.handleClearSettings);

    this.input = document.getElementById(settingsJiraDOM.inputRange);
    this.addEventListener(this.input, 'input', this.handleOnChangeRange);

    await this.table.setDiv(document.getElementById(settingsJiraDOM.table));
    await this.table.render();
  };

  handleOnChangeRange = () => {
    const { value: name } = document.getElementById(settingsJiraDOM.inputRange);
    const haveRange = this.table.findRange(name);
    if (haveRange) {
      this.editBtn.innerText = 'Add cell';
      this.input.dataset.range = name;
    } else {
      this.editBtn.innerText = 'Add range';
      delete this.input.dataset.range;
    }
  };

  handleOnClickAddRange = () => {
    const { value: name, dataset } = document.getElementById(settingsJiraDOM.inputRange);
    const { value: swimline } = document.getElementById(`${settingsJiraDOM.swimlineSelect}`).selectedOptions[0];
    const { value: column } = document.getElementById(`${settingsJiraDOM.columnSelect}`).selectedOptions[0];
    const { checked: showBadge } = document.getElementById(`${settingsJiraDOM.showBadge}`);

    if (swimline === '-' || column === '-') {
      alert('need choose swimline and column and try again.');
      return;
    }

    if (dataset.range && this.table.findRange(dataset.range)) {
      const cells = {
        swimline,
        column,
        showBadge,
      };
      this.table.addCells(name, cells);
    } else {
      const addRangeResult = this.table.addRange(name);
      if (addRangeResult) {
        const cells = {
          swimline,
          column,
          showBadge,
        };
        this.table.addCells(name, cells);
      }
      this.handleOnChangeRange();
    }
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
