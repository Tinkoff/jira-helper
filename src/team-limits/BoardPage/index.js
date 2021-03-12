import mapObj from '@tinkoff/utils/object/map';
import isEmpty from '@tinkoff/utils/is/empty';
import { PageModification } from '../../shared/PageModification';
import { BOARD_PROPERTIES } from '../../shared/constants';
import { limitsKey } from '../shared';
import { teamLimitBlockTemplate, teamLimitsTemplate, teamLimitTitleTemplate } from './htmlTemplates';

export default class TeamLimitsBoardPage extends PageModification {
  static jiraSelectors = {
    boardName: '#ghx-board-name',
    projectKey: '.ghx-key-link-project-key',
    extraField: '.ghx-extra-field',
    swimlane: '.ghx-swimlane',
    ghxPool: '#ghx-pool',
  };

  static classes = {
    teamLimitsBlock: 'team-limit-block-stat-jh',
  };

  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `board-page-team-limits-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(TeamLimitsBoardPage.jiraSelectors.swimlane);
  }

  async loadData() {
    const boardData = await this.getBoardEditData();
    const teamLimits = (await this.getBoardProperty(BOARD_PROPERTIES.TEAM_LIMITS)) || { limits: {} };
    return [boardData, teamLimits];
  }

  apply([boardData = {}, teamLimits]) {
    if (isEmpty(teamLimits) || isEmpty(teamLimits.limits)) return;
    this.teamLimits = teamLimits;

    this.cssSelectorOfIssues = this.getCssSelectorOfIssues(boardData);

    this.applyLimits();
    this.onDOMChange(TeamLimitsBoardPage.jiraSelectors.ghxPool, () => this.applyLimits(), {
      childList: true,
      subtree: true,
    });
  }

  applyLimits() {
    const issuesByLimitKey = mapObj(() => [], this.teamLimits.limits || {});

    document.querySelectorAll(this.cssSelectorOfIssues).forEach(issue => {
      const projectKey =
        issue.querySelector(TeamLimitsBoardPage.jiraSelectors.projectKey)?.innerHTML ||
        issue.querySelector('.ghx-issuekey-pkey')?.innerHTML; // Old Jira || New Jira
      if (!projectKey) return;

      let teamName;
      {
        const extraFieldsForIssue = issue.querySelectorAll(TeamLimitsBoardPage.jiraSelectors.extraField);
        for (const exField of extraFieldsForIssue) {
          const tooltipAttr = exField.getAttribute('data-tooltip');
          if (tooltipAttr && tooltipAttr.startsWith('Team:')) {
            teamName = tooltipAttr.replace('Team: ', '');
            break;
          }
        }
      }
      if (!teamName) return;

      const limitKey = limitsKey.encode(projectKey, teamName);
      if (!issuesByLimitKey[limitKey]) return;

      issuesByLimitKey[limitKey].push(issue);
    });

    Object.keys(this.teamLimits.limits).forEach(limitKey => {
      if (isEmpty(issuesByLimitKey[limitKey])) return;

      if (issuesByLimitKey[limitKey].length > this.teamLimits.limits[limitKey].limit)
        issuesByLimitKey[limitKey].forEach(issue => {
          issue.style.backgroundColor = '#ff5630';
        });
    });

    this.applyLimitsList(issuesByLimitKey);
  }

  applyLimitsList(issuesByLimitKey) {
    if (!this.teamLimitsList || !document.body.contains(this.teamLimitsList)) {
      this.teamLimitsList = this.insertHTML(
        document.querySelector(TeamLimitsBoardPage.jiraSelectors.boardName),
        'beforeend',
        teamLimitsTemplate({
          listBody: Object.keys(this.teamLimits.limits)
            .map(teamLimitKey => {
              const { projectKey, teamName } = limitsKey.decode(teamLimitKey);

              return teamLimitBlockTemplate({
                blockClass: TeamLimitsBoardPage.classes.teamLimitsBlock,
                dataTeamLimitKey: teamLimitKey,
                innerText: `${projectKey}-${teamName}`,
              });
            })
            .join(''),
        })
      );
    }

    this.teamLimitsList.getElementsByClassName(TeamLimitsBoardPage.classes.teamLimitsBlock).forEach(teamNode => {
      const teamLimitKey = teamNode.getAttribute('data-team-limit-key');
      const { projectKey, teamName } = limitsKey.decode(teamLimitKey);

      if (!projectKey || !teamName) return;

      const amountOfTeamIssuesOnBoard = issuesByLimitKey[teamLimitKey].length;
      const limitOfTeamIssuesOnBoard = this.teamLimits.limits[teamLimitKey].limit;

      if (amountOfTeamIssuesOnBoard > limitOfTeamIssuesOnBoard) teamNode.style.color = '#ff5630';
      else if (amountOfTeamIssuesOnBoard === limitOfTeamIssuesOnBoard) teamNode.style.color = '#ffd700';
      else teamNode.style.color = '#1b855c';

      teamNode.setAttribute(
        'title',
        teamLimitTitleTemplate({
          limit: limitOfTeamIssuesOnBoard,
          current: amountOfTeamIssuesOnBoard,
          teamName,
          projectKey,
        })
      );
    });
  }
}
