import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { settingsJiraDOM as DOM } from '../swimlane/constants';

const isPersonLimitAppliedToIssue = (personLimit, assignee, columnId, swimlaneId) => {
  if (swimlaneId == null) {
    return (
      (personLimit.person.displayName === assignee || personLimit.person.name === assignee) &&
      personLimit.columns.some(column => column.id === columnId)
    );
  }

  return (
    (personLimit.person.displayName === assignee || personLimit.person.name === assignee) &&
    personLimit.columns.some(column => column.id === columnId) &&
    personLimit.swimlanes.some(swimlane => swimlane.id === swimlaneId)
  );
};

const getNameFromTooltip = tooltip => {
  return tooltip
    .split(':')[1]
    .split('[')[0]
    .trim(); // Assignee: Pavel [x]
};

const getAssignee = avatar => {
  if (!avatar) return null;

  const label = avatar.alt ?? avatar.dataset.tooltip;
  if (!label) return null;

  return getNameFromTooltip(label);
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
            margin-left: 30px;
        }

        #avatars-limits .person-avatar {
            cursor: pointer;
            position: relative;
            margin-right: 4px;
            width: 32px;
            height: 32px;
        }

        #avatars-limits .person-avatar img {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            border: none;
        }

        #avatars-limits .person-avatar img[view-my-cards="block"] {
            border: solid 1px red;
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

        .ghx-issue.no-visibility {
            display: none!important;
        }
    </style>
    `;
  }

  waitForLoading() {
    return this.waitForElement('.ghx-swimlane');
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS)]);
  }

  apply([editData = {}, personLimits]) {
    if (!personLimits || !personLimits.limits.length) return;

    this.cssSelectorOfIssues = this.getCssSelectorOfIssues(editData);
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
      const html = stats
        .map(
          personLimit => `
        <div class="person-avatar">
            <img src="${personLimit.person.avatar}" title="${personLimit.person.displayName}" class="jira-tooltip" />
            <div class="limit-stats">
                <span class="stats-current"></span>/<span>${personLimit.limit}</span>
            </div>
        </div>`
        )
        .join('');

      this.avatarsList = document.createElement('div');

      this.avatarsList.id = 'avatars-limits';
      this.avatarsList.innerHTML = html;

      this.addEventListener(this.avatarsList, 'click', event => this.onClickAvatar(event));
      document.querySelector('#subnav-title').insertBefore(this.avatarsList, null);
    }

    this.avatarsList.querySelectorAll('.limit-stats').forEach((stat, index) => {
      if (stats[index].issues.length > stats[index].limit) stat.style.background = '#ff5630';
      else if (stats[index].issues.length === stats[index].limit) stat.style.background = '#ffd700';
      else stat.style.background = '#1b855c';

      stat.querySelector('.stats-current').textContent = stats[index].issues.length;
    });
  }

  onClickAvatar(event) {
    if (event.target.nodeName !== 'IMG') return;
    const cardsVisibility = event.target.getAttribute('view-my-cards');

    if (!cardsVisibility) {
      event.target.setAttribute('view-my-cards', 'block');
    } else {
      event.target.removeAttribute('view-my-cards');
    }

    this.showOnlyChosen();
  }

  showOnlyChosen() {
    const cards = Array.from(document.querySelectorAll('.ghx-issue'));
    const isHaveChoose = document.querySelectorAll('[view-my-cards="block"]').length > 0;

    if (!isHaveChoose) {
      cards.forEach(node => {
        node.classList.remove('no-visibility');
      });
      return;
    }

    const avatar = Array.from(document.querySelectorAll('[view-my-cards]'));
    const avaTitles = avatar.map(el => el.title);

    cards.forEach(node => {
      const img = node.querySelector('.ghx-avatar img');
      if (!img) {
        node.classList.add('no-visibility');
        return;
      }

      const name = getNameFromTooltip(img.getAttribute('data-tooltip'));
      if (avaTitles.indexOf(name) > -1) {
        node.classList.remove('no-visibility');
      } else {
        node.classList.add('no-visibility');
      }
    });
  }

  hasCustomSwimlines() {
    const someSwimline = document.querySelector(DOM.swimlaneHeaderContainer);

    if (someSwimline == null) {
      return false;
    }

    // TODO: Shouldn't work for any other language except English, so we have to think about it. F.e., in Russian, it is "Дорожка для custom"
    return someSwimline.getAttribute('aria-label').indexOf('Swimlane for custom') !== -1;
  }

  countAmountPersonalIssuesInColumn(column, stats, swimlaneId) {
    const { columnId } = column.dataset;

    column.querySelectorAll(this.cssSelectorOfIssues).forEach(issue => {
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
  }

  getLimitsStats(personLimits) {
    const stats = personLimits.limits.map(personLimit => ({
      ...personLimit,
      issues: [],
    }));

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
