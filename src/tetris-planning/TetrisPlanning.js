import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view') || '';
    return view.startsWith('planning');
  }

  getModificationId() {
    return `tetris-planning-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement('.ghx-backlog-container.js-sprint-container');
  }

  loadData() {
    return this.getBoardProperty(BOARD_PROPERTIES.TETRIS_PLANNING);
  }

  apply(fields = []) {
    const sprintContainers = document.querySelectorAll('.ghx-backlog-container.js-sprint-container');
    sprintContainers.forEach(spContainer => this.addStatsToSprint(spContainer, fields));
  }

  addStatsToSprint = (spContainer, fields) => {
    const { sprintId } = spContainer.dataset;

    if (!sprintId || sprintId === '-1') return;

    const issueCountContainer = spContainer.querySelectorAll('.ghx-backlog-header .ghx-issue-count')[0];
    const jql = `sprint = ${sprintId} AND issuetype not in ( "Sub-Task", Epic)`;

    this.searchIssues(decodeURI(jql), { memoryCache: false })
      .then(data => (data.issues && data.issues.length > 0 ? data.issues : []))
      .then(issues =>
        issues.reduce((acc, i) => {
          return acc.map(f => {
            return {
              ...f,
              value: (f.value || 0) + (Number(i.fields[f.id]) || 0),
            };
          });
        }, fields)
      )
      .then(fieldsData => {
        spContainer.querySelectorAll('.sp-value-limitation').forEach(e => e.parentNode.removeChild(e));

        fieldsData.forEach(f => {
          const prefix = 'sp-value-limitation active-sprint-lozenge aui-lozenge aui-lozenge-';
          const el = document.createElement('span');

          el.className = prefix + (f.value <= f.max ? 'success' : 'error');
          el.style.marginRight = '5px';
          el.innerText = `${f.name}: ${f.value}/${f.max}`;
          this.setTimeout(() => issueCountContainer.appendChild(el), 10);
        });
      });

    this.onDOMChangeOnce(spContainer, () => {
      this.setTimeout(() => this.addStatsToSprint(spContainer, fields)); // need timeout for api to get ready
    });
  };
}
