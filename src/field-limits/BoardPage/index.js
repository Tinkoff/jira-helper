import mapObj from '@tinkoff/utils/object/map';
import isEmpty from '@tinkoff/utils/is/empty';
import { PageModification } from '../../shared/PageModification';
import { BOARD_PROPERTIES, COLORS } from '../../shared/constants';
import { limitsKey, normalize } from '../shared';
import { fieldLimitBlockTemplate, fieldLimitsTemplate, fieldLimitTitleTemplate } from './htmlTemplates';
import { settingsJiraDOM as DOM } from '../../swimlane/constants';

export default class FieldLimitsSettingsPage extends PageModification {
  static jiraSelectors = {
    subnavTitle: '#subnav-title',
    extraField: '.ghx-extra-field',
    swimlane: '.ghx-swimlane',
    column: '.ghx-column',
    ghxPool: '#ghx-pool',
  };

  static classes = {
    fieldLimitsBlock: 'field-limit-block-stat-jh',
    issuesCount: 'field-issues-count',
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
    this.normalizedExtraFields = normalize('fieldId', boardData.cardLayoutConfig.currentFields);

    this.applyLimits();
    this.onDOMChange(FieldLimitsSettingsPage.jiraSelectors.ghxPool, () => this.applyLimits(), {
      childList: true,
      subtree: true,
    });
  }

  applyLimits() {
    const limitsStats = this.getLimitsStats();

    this.doColorCardsIssue(limitsStats);
    this.applyLimitsList(limitsStats);
  }

  doColorCardsIssue(limitsStats) {
    Object.keys(limitsStats).forEach(limitKey => {
      const stat = limitsStats[limitKey];
      if (isEmpty(stat.issues)) return;

      if (stat.issues.length > stat.limit)
        stat.issues.forEach(issue => {
          issue.style.backgroundColor = COLORS.OVER_WIP_LIMITS;
        });
    });
  }

  applyLimitsList(limitsStats) {
    if (!this.fieldLimitsList || !document.body.contains(this.fieldLimitsList)) {
      if (!document.querySelector(FieldLimitsSettingsPage.jiraSelectors.subnavTitle)) {
        return;
      }
      this.fieldLimitsList = this.insertHTML(
        document.querySelector(FieldLimitsSettingsPage.jiraSelectors.subnavTitle),
        'beforeend',
        fieldLimitsTemplate({
          listBody: Object.keys(limitsStats)
            .map(limitKey => {
              const { visualValue, bkgColor } = limitsStats[limitKey];

              return fieldLimitBlockTemplate({
                blockClass: FieldLimitsSettingsPage.classes.fieldLimitsBlock,
                dataFieldLimitKey: limitKey,
                bkgColor,
                innerText: visualValue,
                limitValue: limitsStats[limitKey].limit,
                issuesCountClass: FieldLimitsSettingsPage.classes.issuesCount,
              });
            })
            .join(''),
        })
      );
    }

    this.fieldLimitsList.getElementsByClassName(FieldLimitsSettingsPage.classes.fieldLimitsBlock).forEach(fieldNode => {
      const limitKey = fieldNode.getAttribute('data-field-limit-key');
      const { fieldValue, fieldId } = limitsKey.decode(limitKey);
      const stat = limitsStats[limitKey];
      const currentIssueNode = fieldNode.querySelector(`.${FieldLimitsSettingsPage.classes.issuesCount}`);

      if (!fieldId || !fieldValue) return;

      const amountOfFieldIssuesOnBoard = stat.issues.length;
      const limitOfFieldIssuesOnBoard = stat.limit;

      switch (Math.sign(limitOfFieldIssuesOnBoard - amountOfFieldIssuesOnBoard)) {
        case -1:
          currentIssueNode.style.backgroundColor = COLORS.OVER_WIP_LIMITS;
          break;
        case 0:
          currentIssueNode.style.backgroundColor = COLORS.ON_THE_LIMIT;
          break;
        default:
          currentIssueNode.style.backgroundColor = COLORS.BELOW_THE_LIMIT;
          break;
      }

      currentIssueNode.innerHTML = `${amountOfFieldIssuesOnBoard}/${limitOfFieldIssuesOnBoard}`;

      fieldNode.setAttribute(
        'title',
        fieldLimitTitleTemplate({
          limit: limitOfFieldIssuesOnBoard,
          current: amountOfFieldIssuesOnBoard,
          fieldValue,
          fieldName: this.normalizedExtraFields.byId[fieldId].name,
        })
      );
    });
  }

  hasCustomSwimlines() {
    const someSwimline = document.querySelector(DOM.swimlaneHeaderContainer);

    if (someSwimline == null) {
      return false;
    }

    return someSwimline.getAttribute('aria-label').indexOf('custom:') !== -1;
  }

  countAmountPersonalIssuesInColumn(column, stats, swimlaneId) {
    const { columnId } = column.dataset;

    column.querySelectorAll(this.cssSelectorOfIssues).forEach(issue => {
      const extraFieldsForIssue = issue.querySelectorAll(FieldLimitsSettingsPage.jiraSelectors.extraField);

      Object.keys(stats).forEach(fieldLimitKey => {
        const stat = stats[fieldLimitKey];

        if (!stat.columns.includes(columnId)) return;
        if (swimlaneId && !stat.swimlanes.includes(swimlaneId)) return;

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

        swimlane.querySelectorAll(FieldLimitsSettingsPage.jiraSelectors.column).forEach(column => {
          this.countAmountPersonalIssuesInColumn(column, stats, swimlaneId);
        });
      });

      return stats;
    }

    document.querySelectorAll(FieldLimitsSettingsPage.jiraSelectors.column).forEach(column => {
      this.countAmountPersonalIssuesInColumn(column, stats);
    });

    return stats;
  }
}
