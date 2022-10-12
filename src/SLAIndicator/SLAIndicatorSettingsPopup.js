import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { Popup } from '../shared/getPopup';
import {
  ClearDataButton,
  emptyData,
  getCollumnsTable,
  getInputShowSLAIndicatorOnAllCards,
  getInputShowSLARRenderWhenPageLoaded,
  getIssueTypesRow,
  selectDate,
  settingsEditBtnTemplate,
  settingsJiraSLADOM as DOM,
  settingsPopupTableTemplate,
} from './constants';
import { getAllFields, getProjectData } from '../shared/jiraApi';

export default class SLAIndicatorSettings extends PageModification {
  static ids = {
    editLimitsBtn: 'edit-SLAindicators-btn-jh',
  };

  static classes = {
    editSLARow: 'edit-SLA-row-jh',
  };

  static jiraSelectors = {
    panelConfig: '#ghx-view-board-admins-edit',
  };

  getModificationId() {
    return `SLAIndicatorTitle-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return Promise.all([this.waitForElement(SLAIndicatorSettings.jiraSelectors.panelConfig)]);
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), Promise.all([this.getBoardProperty(BOARD_PROPERTIES.SLA_INDICATOR)])]);
  }

  apply([boardData, settings]) {
    this.settings = settings;
    this.boardData = boardData;

    if (!(boardData && boardData.canEdit)) return;
    const [SLAsettings] = settings;

    if (SLAsettings) {
      this.SLAsettings = SLAsettings;
    } else {
      this.SLAsettings = { ...emptyData };
    }

    this.getAllFieldsFromJira();

    if (boardData?.boardLocationModel?.projectId) {
      this.getIssueTypes([boardData.boardLocationModel.projectId]);
    } else {
      const keys = [];
      boardData.filterConfig.queryProjects.projects.forEach(element => {
        keys.push(element.key);
      });
      this.getIssueTypes(keys);
    }
    this.renderEditButton();
  }

  async getIssueTypes(projectsId) {
    this.issueTypes = [];
    const promises = [];
    for (const project of projectsId) {
      promises.push(getProjectData(project));
    }

    const projectsData = await Promise.all(promises);

    let issueTypes = [];
    for (const data of projectsData) {
      issueTypes = issueTypes.concat(data.issueTypes);
    }

    const issueTypesUniqie = [];
    for (const element of issueTypes) {
      let findElement = false;
      for (const element2 of issueTypesUniqie) {
        if (element2.id === element.id) {
          findElement = true;
          break;
        }
      }

      if (!findElement) {
        issueTypesUniqie.push(element);
      }
    }
    this.issueTypes = issueTypesUniqie;
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(SLAIndicatorSettings.jiraSelectors.panelConfig),
      'beforebegin',
      settingsEditBtnTemplate(SLAIndicatorSettings.ids.editLimitsBtn)
    );

    this.popup = new Popup({
      title: 'Edit SLA',
      onConfirm: this.handleConfirmEditing,
      okButtonText: 'Save',
    });

    this.editBtn = document.getElementById(SLAIndicatorSettings.ids.editLimitsBtn);
    this.addEventListener(this.editBtn, 'click', this.handleEditClick);
    this.swimlanes = this.boardData.swimlanesConfig.swimlanes;
  }

  handleEditClick = () => {
    this.popup.render();
    this.popup.appendToContent(
      getInputShowSLAIndicatorOnAllCards(this.SLAsettings.showOnAllCards) +
        getInputShowSLARRenderWhenPageLoaded(this.SLAsettings.renderWhenPageLoaded) +
        selectDate(this.fields, this.SLAsettings?.customFieldKey) +
        settingsPopupTableTemplate(
          getIssueTypesRow(this.issueTypes, this.boardData.swimlanesConfig.swimlanes, this.SLAsettings.SLA),
          getCollumnsTable(this.boardData.swimlanesConfig.swimlanes)
        ) +
        ClearDataButton()
    );

    const clearBtn = document.getElementById(DOM.ClearData);
    this.addEventListener(clearBtn, 'click', this.handleClearSettings);
  };

  handleClearSettings = () => {
    this.SLAsettings = { ...emptyData };
    this.popup.unmount();
    this.handleEditClick();
    this.deleteBoardProperty(BOARD_PROPERTIES.SLA_INDICATOR);
  };

  removeEditBtn() {
    this.editBtn.remove();
  }

  handleConfirmEditing = unmountCallback => {
    const updatedSettings = {};

    this.issueTypes.forEach(issueType => {
      const swimlaneValue = {};
      this.swimlanes.forEach(swimlane => {
        const row = document.querySelectorAll(`#${DOM.TableId} #IS_${issueType.id} #SL_${swimlane.id}`);
        const { value: rawLimitValue } = row[0].querySelector('input[type="number"]');
        const value = Number.parseInt(rawLimitValue, 10);
        if (value && value > 0) {
          swimlaneValue[swimlane.id] = value;
          updatedSettings[issueType.id] = { ...swimlaneValue };
        }
      });
    });

    const { checked: showOnAllCards } = document.querySelector(`#${DOM.ShowOnAllCard}`);
    const { checked: renderWhenPageLoaded } = document.querySelector(`#${DOM.RenderWhenPageLoaded}`);
    const { value: customFieldKey } = document.querySelector(`#${DOM.Select}`).selectedOptions[0];
    this.SLAsettings.SLA = updatedSettings;
    this.SLAsettings.customFieldKey = customFieldKey;
    this.SLAsettings.showOnAllCards = showOnAllCards;
    this.SLAsettings.renderWhenPageLoaded = renderWhenPageLoaded;
    this.updateBoardProperty(BOARD_PROPERTIES.SLA_INDICATOR, this.SLAsettings);
    unmountCallback();
  };

  async getAllFieldsFromJira() {
    await getAllFields().then(result => {
      this.fields = result.filter(filed => {
        return filed?.schema?.type === 'datetime' || filed?.schema?.type === 'date';
      });
    });
  }
}
