import isEmpty from '@tinkoff/utils/is/empty';
import { PageModification } from '../../shared/PageModification';
import { getSettingsTab } from '../../routing';
import {
  settingsEditBtnTemplate,
  teamLimitsTableTemplate,
  teamLimitsTableRowTemplate,
  selectTeamTemplate,
} from './htmlTemplates';
import { Popup } from '../../shared/getPopup';
import { BOARD_PROPERTIES } from '../../shared/constants';
import { limitsKey } from '../shared';
import { getCreateIssueMetadata } from '../../shared/jiraApi';

export default class TeamLimitsSettingsPage extends PageModification {
  static jiraSelectors = {
    detailView: '#ghx-config-detailView',
    detailViewDesc: '#ghx-config-detailView > p',
  };

  static ids = {
    settingsBtn: 'jh-edit-wip-team-limits-btn',
    popupTable: 'jh-team-limits-table',
    popupTableBody: 'jh-team-limits-tbody',
    popupTableAddLimitRow: 'jh-team-limits-add-btn',
    selectWrpTeamForProject: 'jh-select-wrp-team-for-project',
    selectTeamForProject: 'jh-select-team-for-project',
    inputSearchForProjectTeams: 'jh-input-search-for-project-team',
    btnSearchForProjectTeams: 'jh-btn-search-for-project-team',
  };

  static classes = {
    teamRow: 'jh-team-limits-table-row',
    teamRemoveBtn: 'jh-remove-team-limit',
  };

  async shouldApply() {
    return (await getSettingsTab()) === 'detailView';
  }

  getModificationId() {
    return `add-quick-filters-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(TeamLimitsSettingsPage.jiraSelectors.detailView);
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.TEAM_LIMITS)]);
  }

  apply([
    boardData = {},
    quickFilterSettings = {
      limits: {
        /* [filter.id]: { limit: number, isOnlyEpics: boolean } */
      },
    },
  ]) {
    if (!boardData.canEdit) return;

    // Hide if field Team is not using on board
    const teamField = boardData.detailViewFieldConfig.currentFields.find(field => field.name === 'Team');
    if (!teamField) return;

    this.boardData = boardData;
    this.settings = {
      limits: quickFilterSettings.limits || {},
    };

    this.renderEditButton();
  }

  renderEditButton() {
    this.insertHTML(
      document.querySelector(TeamLimitsSettingsPage.jiraSelectors.detailViewDesc),
      'afterend',
      settingsEditBtnTemplate(TeamLimitsSettingsPage.ids.settingsBtn)
    );

    this.popup = new Popup({
      title: 'Edit filters WIP limits',
      onConfirm: this.handleConfirmEditing,
      okButtonText: 'Save',
    });

    this.editBtn = document.getElementById(TeamLimitsSettingsPage.ids.settingsBtn);
    this.addEventListener(this.editBtn, 'click', this.handleEditClick);
  }

  handleEditClick = () => {
    this.popup.render();
    this.popup.appendToContent(
      teamLimitsTableTemplate({
        tableId: TeamLimitsSettingsPage.ids.popupTable,
        tableBodyId: TeamLimitsSettingsPage.ids.popupTableBody,
        addLimitBtnId: TeamLimitsSettingsPage.ids.popupTableAddLimitRow,
        selectTeamWrpForProjectId: TeamLimitsSettingsPage.ids.selectWrpTeamForProject,
        searchProjectInput: TeamLimitsSettingsPage.ids.inputSearchForProjectTeams,
        searchProjectBtn: TeamLimitsSettingsPage.ids.btnSearchForProjectTeams,
        tBody: '',
      })
    );

    const tBody = document.getElementById(TeamLimitsSettingsPage.ids.popupTableBody);
    Object.keys(this.settings.limits).forEach(teamLimitKey => {
      const { projectKey, teamName } = limitsKey.decode(teamLimitKey);
      const { limit } = this.settings.limits[teamLimitKey];

      tBody.innerHTML += this.getRowLimitHTML(projectKey, teamName, limit);
    });

    this.handleAddTeamLimitRowClick();
    this.handleRemoveTeamLimitRowClick();

    this.handleSearchingForTeam();
  };

  getRowLimitHTML(projectKey, teamName, limit) {
    return teamLimitsTableRowTemplate({
      rowClass: TeamLimitsSettingsPage.classes.teamRow,
      removeBtnClass: TeamLimitsSettingsPage.classes.teamRemoveBtn,
      projectKey,
      teamName,
      limit,
      dataTeamProject: limitsKey.encode(projectKey, teamName),
    });
  }

  handleAddTeamLimitRowClick() {
    this.addEventListener(document.getElementById(TeamLimitsSettingsPage.ids.popupTableAddLimitRow), 'click', () => {
      const teamName = document.getElementById(TeamLimitsSettingsPage.ids.selectTeamForProject).value;
      const projectKey = document.getElementById(TeamLimitsSettingsPage.ids.inputSearchForProjectTeams).value;
      const tableLimitsBody = document.getElementById(TeamLimitsSettingsPage.ids.popupTableBody);

      if (!document.querySelector(`[data-team-project-row="${limitsKey.encode(projectKey, teamName)}"]`))
        tableLimitsBody.innerHTML += this.getRowLimitHTML(projectKey, teamName, 0);

      document.getElementById(TeamLimitsSettingsPage.ids.inputSearchForProjectTeams).value = '';
      document.getElementById(TeamLimitsSettingsPage.ids.selectWrpTeamForProject).innerHTML = '';
      document.getElementById(TeamLimitsSettingsPage.ids.popupTableAddLimitRow).setAttribute('disabled', true);
    });
  }

  handleRemoveTeamLimitRowClick() {
    this.addEventListener(document.getElementById(TeamLimitsSettingsPage.ids.popupTable), 'click', e => {
      if (!e.target.classList.contains(TeamLimitsSettingsPage.classes.teamRemoveBtn)) return;

      return e.target?.parentElement?.parentElement.remove();
    });
  }

  handleSearchingForTeam() {
    this.addEventListener(document.getElementById(TeamLimitsSettingsPage.ids.btnSearchForProjectTeams), 'click', () => {
      const searchInput = document.getElementById(TeamLimitsSettingsPage.ids.inputSearchForProjectTeams);
      const selectWrp = document.getElementById(TeamLimitsSettingsPage.ids.selectWrpTeamForProject);
      const searchedProjectKey = searchInput.value;
      searchInput.setAttribute('disabled', true);

      getCreateIssueMetadata(searchedProjectKey)
        .then(res => {
          const { projects } = res;

          const project = projects.find(pr => pr.key === searchedProjectKey);
          if (!project) return Promise.reject();

          const issuetypeFields = project.issuetypes[0]?.fields;
          const teamFieldKey = Object.keys(issuetypeFields).find(f => issuetypeFields[f].name === 'Team');
          const teamField = issuetypeFields[teamFieldKey];
          if (!teamField || isEmpty(teamField.allowedValues)) return Promise.reject();

          selectWrp.innerHTML = selectTeamTemplate({
            id: TeamLimitsSettingsPage.ids.selectTeamForProject,
            options: teamField.allowedValues.map(allowedValue => allowedValue.value),
          });
          document.getElementById(TeamLimitsSettingsPage.ids.popupTableAddLimitRow).removeAttribute('disabled');
        })
        .catch(() => {
          selectWrp.innerText = 'Teams not found for this project key';
        })
        .finally(() => {
          searchInput.removeAttribute('disabled');
        });
    });
  }

  handleConfirmEditing = unmountCallback => {
    const rows = document.querySelectorAll(
      `#${TeamLimitsSettingsPage.ids.popupTable} .${TeamLimitsSettingsPage.classes.teamRow}`
    );
    const updatedLimits = {};

    rows.forEach(row => {
      const { value: projectKey } = row.querySelector('input[data-type="project-key"]');
      const { value: teamName } = row.querySelector('input[data-type="team-name"]');
      const { value: rawTeamLimits } = row.querySelector('input[data-type="team-limits"]');
      const teamLimits = Number.parseInt(rawTeamLimits, 10);

      const limitKey = limitsKey.encode(projectKey, teamName);

      updatedLimits[limitKey] = {
        limit: teamLimits < 1 ? undefined : teamLimits,
      };
    });

    this.settings.limits = updatedLimits;
    this.updateBoardProperty(BOARD_PROPERTIES.TEAM_LIMITS, this.settings);
    unmountCallback();
  };
}
