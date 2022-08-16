import { PageModification } from '../shared/PageModification';
import { getIssueDetailInfo } from '../shared/jiraApi';

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  waitForLoading() {
    return this.waitForElement('.ghx-swimlane');
  }

  appendStyles() {
    return `
    <style type="text/css">
        .issueProgressBar {
          width: 100%;
          text-align: center;
          height: 5px;
          padding: 10px 0px 0px 0px;
        }
        .barLess50 {
          width: 0%;
          height: 5px;
          background-image: linear-gradient(to right, #7de7ff, #2596be);
        }
        .barLess70 {
          width: 0%;
          height: 5px;
          background-image: linear-gradient(to right, #fffeb3, #fcb14e);
        }
        .barLess100 {
          width: 0%;
          height: 5px;
          background-image: linear-gradient(to right, #fcb14e, #fc8608);
        }
        .bar100AndMore {
          width: 0%;
          height: 5px;
          background-image: linear-gradient(to right, #fc8608, #fc2908);
        }
        .textDayCount {
          position: relative;
          top: -25px;
          font-size: 0.8em;
          color: black;
        }
    </style>
    `;
  }

  async apply() {
    this.renderIssuesLT();
  }

  addIssueProgressBar(issueKey, currentDays, limitDays) {
    let percentage = Math.round((currentDays / limitDays) * 100);
    let barType = '';

    if (percentage >= 100) {
      barType = 'bar100AndMore';
      percentage = 100;
    } else if (percentage < 100 && percentage >= 70) {
      barType = 'barLess100';
    } else if (percentage < 70 && percentage >= 50) {
      barType = 'barLess70';
    } else if (percentage < 50) {
      barType = 'barLess50';
    }
    const idProgressBar = `${Math.random()
      .toString()
      .slice(2, 11)}-${issueKey}`;
    this.insertHTML(
      document.querySelector(`div[data-issue-key=${issueKey}]  .ghx-card-footer`),
      'beforeend',
      `<div class="issueProgressBar">
      <div class="${barType}" id="${idProgressBar}"></div>
      <b class="textDayCount"> ${currentDays}/${limitDays}</b>
      </div>`
    );
    document.getElementById(idProgressBar).style.width = `${percentage}%`;
  }

  async renderIssuesLT() {
    const issues = document.querySelectorAll('[data-issue-key]');
    const issuesCommitInfo = [];
    let issuesCommitInfoLS = [];
    const issuesCommitInfoLSJson = localStorage.getItem('issuesCommitInfo');

    if (issuesCommitInfoLSJson) {
      issuesCommitInfoLS = JSON.parse(issuesCommitInfoLSJson);
    } else {
      localStorage.setItem('issuesCommitInfo', JSON.stringify(issuesCommitInfo));
    }

    issues.forEach(async issue => {
      const { issueKey } = issue.dataset;
      let commit = '-';
      const infoFromLS = issuesCommitInfoLS.find(element => element.issueKey === issueKey);
      if (infoFromLS) {
        commit = infoFromLS.commit;
      } else {
        const issueDetailsInfo = await getIssueDetailInfo(issueKey);
        const commitFromApi = issueDetailsInfo.changelog.histories
          .filter(curValue => curValue.items.some(element => element.toString === 'Analysis'))
          .pop();
        if (commitFromApi) {
          commit = commitFromApi.created;
        } else {
          commit = '-';
        }

        issuesCommitInfo.push({ issueKey, commit });
        localStorage.setItem('issuesCommitInfo', JSON.stringify(issuesCommitInfoLS.concat(issuesCommitInfo)));
      }

      if (commit !== undefined && commit !== '-') {
        const daysDiff = parseInt((Date.now() - Date.parse(commit)) / (1000 * 3600 * 24), 10);
        this.addIssueProgressBar(issueKey, daysDiff, 14);
      }
    });
  }
}
