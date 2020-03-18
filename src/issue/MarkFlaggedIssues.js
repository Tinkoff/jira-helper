import each from '@tinkoff/utils/array/each';
import { PageModification } from '../shared/PageModification';
import { getCurrentRoute, getIssueId, Routes } from '../routing';
import { loadFlaggedIssues, loadNewIssueViewEnabled } from '../shared/jiraApi';
import { issueDOM } from './domSelectors';
import { extensionApiService } from '../shared/ExtensionApiService';

const RelatedIssue = {
  LINKED: 'LINKED',
  EPIC_ISSUE: 'EPIC_ISSUE',
  SUB_TASK: 'SUB_TASK',
  LINKED_NEW: 'LINKED_NEW',
};

const getFlag = newIssueView => {
  const flag = document.createElement('img');
  flag.src = extensionApiService.getUrl(newIssueView ? '/img/flagNew.svg' : '/img/flag.png');
  flag.style.width = '16px';
  flag.style.height = '16px';
  return flag;
};

const getIssueSelector = () => {
  if (getCurrentRoute() === Routes.BOARD) {
    return `[data-issuekey='${getIssueId()}'] ${issueDOM.detailsBlock}`; // При переходе по задачам на доске надо дождаться загрузки нужной задачи
  }

  if (getCurrentRoute() === Routes.SEARCH) {
    return `[data-issue-key='${getIssueId()}']`;
  }

  return issueDOM.detailsBlock;
};

export default class extends PageModification {
  shouldApply() {
    return getIssueId() != null;
  }

  getModificationId() {
    return `mark-flagged-issues-${getIssueId()}`;
  }

  preloadData() {
    return (this.getSearchParam('oldIssueView') ? Promise.resolve(false) : loadNewIssueViewEnabled()).then(
      newIssueView => {
        this.newIssueView = newIssueView;
      }
    );
  }

  waitForLoading() {
    if (this.newIssueView) {
      return this.waitForElement(issueDOM.linkButton);
    }

    return this.waitForElement(getIssueSelector());
  }

  async apply() {
    const issuesElements = {};
    const addIssue = (key, element, type) => {
      if (!key) return;
      if (!issuesElements[key]) issuesElements[key] = [];

      issuesElements[key].push({ type, element });
    };

    if (this.newIssueView) {
      each(issueLink => {
        const key = issueLink.textContent;
        addIssue(key, issueLink.parentElement.parentElement, RelatedIssue.LINKED_NEW);
      }, document.querySelectorAll(issueDOM.subIssueLink));
    } else {
      each(issueLink => {
        const key = issueLink.querySelector('a').dataset.issueKey;
        addIssue(key, issueLink.parentElement, RelatedIssue.LINKED);
      }, document.querySelectorAll(issueDOM.subIssue));

      each(epicIssue => {
        const key = epicIssue.dataset.issuekey;
        addIssue(key, epicIssue, RelatedIssue.SUB_TASK);
      }, document.querySelectorAll(issueDOM.subTaskLink));

      each(epicIssue => {
        const key = epicIssue.dataset.issuekey;
        addIssue(key, epicIssue, RelatedIssue.EPIC_ISSUE);
      }, document.querySelectorAll(issueDOM.epicIssueLink));
    }

    const issueId = getIssueId();
    const flaggedIssues = await loadFlaggedIssues([...Object.keys(issuesElements), issueId]);

    flaggedIssues.forEach(issueKey => {
      (issuesElements[issueKey] || []).forEach(({ type, element }) => {
        element.style.backgroundColor = this.newIssueView ? '#fffae6' : '#ffe9a8';

        const flag = getFlag(this.newIssueView);

        switch (type) {
          case RelatedIssue.LINKED: {
            const snap = element.querySelector('.link-snapshot');
            snap.insertBefore(flag, snap.children[0]);
            break;
          }
          case RelatedIssue.SUB_TASK:
          case RelatedIssue.EPIC_ISSUE: {
            flag.style.verticalAlign = 'top';
            const status = element.querySelector('.status');
            status.insertBefore(flag, null);
            break;
          }
          case RelatedIssue.LINKED_NEW: {
            const summary = element.querySelector(issueDOM.subIssueSummary);
            flag.style.marginRight = '4px';
            summary.parentElement.insertBefore(flag, summary.nextElementSibling);
            break;
          }
          default:
        }
      });

      if (!this.newIssueView && issueKey === issueId) {
        const mainField = document.querySelector('#priority-val') || document.querySelector('#type-val');
        mainField.insertBefore(getFlag(this.newIssueView), null);
      }
    });
  }
}
