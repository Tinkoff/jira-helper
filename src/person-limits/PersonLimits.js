import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { settingsJiraDOM as DOM } from '../swimlane/constants';

const isPersonLimitAppliedToIssue = (personLimit, assignee, columnId, swimlaneId) => {
  return (
    (personLimit.person.displayName === assignee || personLimit.person.name === assignee) &&
    personLimit.columns.some(column => column.id === columnId) &&
    personLimit.swimlanes.some(swimlane => swimlane.id === swimlaneId)
  );
};

const getAssignee = avatar => {
  if (!avatar) return null;

  const label = avatar.alt ?? avatar.dataset.tooltip;
  if (!label) return null;

  return label
    .split(':')[1]
    .split('[')[0]
    .trim(); // Assignee: Pavel [x]
};

export default class extends PageModification {
  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  getModificationId() {
    return `add-person-limits-${this.getBoardId()}`;
  }

  appendStyles() {
    return `
    <style type="text/css">
        #avatars-limits {
            display: inline-flex;
            position: absolute;
            margin-left: 30px;
        }

        #avatars-limits .person-avatar {
        position: relative;
            margin-right: 4px;
            width: 32px;
            height: 32px;
        }

        #avatars-limits .person-avatar img {
            width: 32px;
            height: 32px;
        }

        #avatars-limits .person-avatar .limit-stats {
            position: absolute;
            top: -10px;
            right: -6px;
            border-radius: 50%;
            background: grey;
            color: white;
            padding: 5px 2px;
            font-size: 12px;
            line-height: 12px;
            font-weight: 400;
        }
    </style>
    `;
  }

  waitForLoading() {
    return this.waitForElement('.ghx-swimlane');
  }

  loadData() {
    return this.getBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS);
  }

  apply(personLimits) {
    if (!personLimits || !personLimits.limits.length) return;

    this.applyLimits(personLimits);
    this.onDOMChange('#ghx-pool', () => this.applyLimits(personLimits), { childList: true, subtree: true });
  }

  applyLimits(personLimits) {
    const stats = this.getLimitsStats(personLimits);

    stats.forEach(personLimit => {
      if (personLimit.issues.length > personLimit.limit) {
        personLimit.issues.forEach(issue => {
          issue.style.backgroundColor = '#ff5630';
        });
      }
    });

    if (!this.avatarsList || !document.body.contains(this.avatarsList)) {
      this.avatarsList = this.insertHTML(
        document.querySelector('#subnav-title'),
        'beforeend',
        `
    <div id="avatars-limits">
      ${stats
        .map(
          personLimit => `
        <div class="person-avatar">
            <img src="${personLimit.person.avatar}" />
            <div class="limit-stats">
                <span class="stats-current"></span>/<span>${personLimit.limit}</span>
            </div>
        </div>
      `
        )
        .join('')}
    </div>
    `
      );
    }

    this.avatarsList.querySelectorAll('.limit-stats').forEach((stat, index) => {
      if (stats[index].issues.length > stats[index].limit) stat.style.background = '#ff5630';
      else if (stats[index].issues.length === stats[index].limit) stat.style.background = '#ffd700';
      else stat.style.background = '#1b855c';

      stat.querySelector('.stats-current').textContent = stats[index].issues.length;
    });
  }

  getLimitsStats(personLimits) {
    const stats = personLimits.limits.map(personLimit => ({
      ...personLimit,
      issues: [],
    }));

    document.querySelectorAll(DOM.swimlane).forEach(swimlane => {
      const swimlaneId = swimlane.getAttribute('swimlane-id');

      swimlane.querySelectorAll('.ghx-column').forEach(column => {
        const { columnId } = column.dataset;

        column.querySelectorAll('.ghx-issue').forEach(issue => {
          const avatar = issue.querySelector('.ghx-avatar-img');
          const assignee = getAssignee(avatar);

          if (assignee) {
            stats.forEach(personLimit => {
              if (isPersonLimitAppliedToIssue(personLimit, assignee, columnId, swimlaneId)) {
                personLimit.issues.push(issue);
              }
            });
          }
        });
      });
    });

    return stats;
  }
}
