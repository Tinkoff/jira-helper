import mapObj from '@tinkoff/utils/object/map';
import isEmpty from '@tinkoff/utils/is/empty';
import { PageModification } from '../../shared/PageModification';
import { BOARD_PROPERTIES } from '../../shared/constants';
import { limitsKey, normalize } from '../shared';
import { fieldLimitBlockTemplate, fieldLimitsTemplate, fieldLimitTitleTemplate } from './htmlTemplates';
import { settingsJiraDOM as DOM } from '../../swimlane/constants';

export default class FieldLimitsSettingsPage extends PageModification {
  static jiraSelectors = {
    boardName: '#ghx-board-name',
    projectKey: '.ghx-key-link-project-key',
    extraField: '.ghx-extra-field',
    swimlane: '.ghx-swimlane',
    ghxPool: '#ghx-pool',
  };

  static classes = {
    fieldLimitsBlock: 'field-limit-block-stat-jh',
  };

  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `board-page-field-limits-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(FieldLimitsSettingsPage.jiraSelectors.swimlane);
  }

  async loadData() {
    const boardData = await this.getBoardEditData();
    const fieldLimits = (await this.getBoardProperty(BOARD_PROPERTIES.FIELD_LIMITS)) || { limits: {} };
    return [boardData, fieldLimits];
  }

  apply([boardData = {}, fieldLimits]) {
    if (isEmpty(fieldLimits) || isEmpty(fieldLimits.limits)) return;
    this.fieldLimits = fieldLimits;
    this.cssSelectorOfIssues = this.getCssSelectorOfIssues(boardData);
    this.normalizedExtraFields = normalize('fieldId', boardData.detailViewFieldConfig.currentFields);

    this.applyLimits();
    this.onDOMChange(FieldLimitsSettingsPage.jiraSelectors.ghxPool, () => this.applyLimits(), {
      childList: true,
      subtree: true,
    });
  }

  applyLimits() {
    const limitsStats = this.getLimitsStats();

    Object.keys(limitsStats).forEach(limitKey => {
      const stat = limitsStats[limitKey];
      if (isEmpty(stat.issues)) return;

      if (stat.issues.length > stat.limit)
        stat.issues.forEach(issue => {
          issue.style.backgroundColor = '#ff5630';
        });
    });

    this.applyLimitsList(limitsStats);
  }

  applyLimitsList(limitsStats) {
    if (!this.fieldLimitsList || !document.body.contains(this.fieldLimitsList)) {
      this.fieldLimitsList = this.insertHTML(
        document.querySelector(FieldLimitsSettingsPage.jiraSelectors.boardName),
        'beforeend',
        fieldLimitsTemplate({
          listBody: Object.keys(limitsStats)
            .map(limitKey => {
              const { projectKey, fieldId, fieldValue } = limitsKey.decode(limitKey);

              return fieldLimitBlockTemplate({
                blockClass: FieldLimitsSettingsPage.classes.fieldLimitsBlock,
                dataFieldLimitKey: limitKey,
                innerText: `[ ${projectKey} | ${this.normalizedExtraFields.byId[fieldId].name} | ${fieldValue} ]`,
              });
            })
            .join(''),
        })
      );
    }

    this.fieldLimitsList.getElementsByClassName(FieldLimitsSettingsPage.classes.fieldLimitsBlock).forEach(fieldNode => {
      const limitKey = fieldNode.getAttribute('data-field-limit-key');
      const { projectKey, fieldValue, fieldId } = limitsKey.decode(limitKey);
      const stat = limitsStats[limitKey];

      if (!projectKey || !fieldId || !fieldValue) return;

      const amountOfFieldIssuesOnBoard = stat.issues.length;
      const limitOfFieldIssuesOnBoard = stat.limit;

      if (amountOfFieldIssuesOnBoard > limitOfFieldIssuesOnBoard) fieldNode.style.color = '#ff5630';
      else if (amountOfFieldIssuesOnBoard === limitOfFieldIssuesOnBoard) fieldNode.style.color = '#ffd700';
      else fieldNode.style.color = '#1b855c';

      fieldNode.setAttribute(
        'title',
        fieldLimitTitleTemplate({
          limit: limitOfFieldIssuesOnBoard,
          current: amountOfFieldIssuesOnBoard,
          fieldValue,
          fieldName: this.normalizedExtraFields.byId[fieldId].name,
          projectKey,
        })
      );
    });
  }

  hasCustomSwimlines() {
    const someSwimline = document.querySelector(DOM.swimlaneHeaderContainer);
    return someSwimline != null;
  }

  countAmountPersonalIssuesInColumn(column, stats, swimlaneId) {
    const { columnId } = column.dataset;

    column.querySelectorAll(this.cssSelectorOfIssues).forEach(issue => {
      const extraFieldsForIssue = issue.querySelectorAll(FieldLimitsSettingsPage.jiraSelectors.extraField);

      Object.keys(stats).forEach(fieldLimitKey => {
        const stat = stats[fieldLimitKey];

        if (!stat.columns.includes(columnId)) return;
        if (!stat.swimlanes.includes(swimlaneId)) return;

        const projectKey =
          issue.querySelector(FieldLimitsSettingsPage.jiraSelectors.projectKey)?.innerHTML ||
          issue.querySelector('.ghx-issuekey-pkey')?.innerHTML; // Old Jira || New Jira

        if (projectKey !== stat.projectKey) return;

        for (const exField of extraFieldsForIssue) {
          const tooltipAttr = exField.getAttribute('data-tooltip');
          const expectedTooltipAttrValue = `${this.normalizedExtraFields.byId[stat.fieldId].name}: ${stat.fieldValue}`;

          if (tooltipAttr && tooltipAttr === expectedTooltipAttrValue) {
            stats[fieldLimitKey].issues.push(issue);
          }
        }
      });
    });
  }

  getLimitsStats() {
    const stats = mapObj(value => ({
      ...value,
      issues: [],
    }))(this.fieldLimits.limits);

    if (this.hasCustomSwimlines()) {
      document.querySelectorAll(DOM.swimlane).forEach(swimlane => {
        const swimlaneId = swimlane.getAttribute('swimlane-id');

        swimlane.querySelectorAll('.ghx-column').forEach(column => {
          this.countAmountPersonalIssuesInColumn(column, stats, swimlaneId);
        });
      });

      return stats;
    }

    document.querySelectorAll('.ghx-column').forEach(column => {
      this.countAmountPersonalIssuesInColumn(column, stats);
    });

    return stats;
  }
}
