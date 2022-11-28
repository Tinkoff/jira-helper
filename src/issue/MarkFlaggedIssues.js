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

const postUnFlagged = (issueKey, text) => {
  const getOptions = {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  };

  const url = '/rest/greenhopper/1.0/xboard/issue/flag/flag.json';
  return fetch(url, {
    ...getOptions,
    body: JSON.stringify({
      issueKeys: [issueKey],
      flag: false,
      // formToken: "5a2a433c3066f81dac0e5be53f5f114f5ec83373"
      comment: `(flagoff) Flag removed\n\n${text}`,
    }),
  });
};

const getFlag = issueKey => {
  const flag = document.createElement('img');
  flag.src = extensionApiService.getUrl('/img/flagNew.svg');
  flag.style.width = '16px';
  flag.style.height = '16px';
  flag.style.cursor = 'pointer';
  flag.addEventListener('click', event => {
    event.stopPropagation();
    const text = window.prompt(
      'Are you whant remove the flag?\nEnter text if you need to specify a reason, or leave the field blank',
      ''
    );
    if (text != null) {
      window.console.log('flag removed', text);
      postUnFlagged(issueKey, text).then(respose => {
        if (respose.ok) {
          flag.remove();
        }
      });
    }
  });
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
      // old view
      if (!this.newIssueView && issueKey === issueId) {
        const mainField = document.querySelector('#priority-val') || document.querySelector('#type-val');
        mainField.parentNode.insertBefore(getFlag(issueKey, this.newIssueView), mainField.nextSibling);
        return;
      }
      // new view
      (issuesElements[issueKey] || []).forEach(({ type, element }) => {
        element.style.backgroundColor = this.newIssueView ? '#fffae6' : '#ffe9a8';

        const flag = getFlag(issueKey, this.newIssueView);

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
    });
  }
}
