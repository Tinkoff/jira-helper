import { getIssueDataFromServer } from '../shared/jiraApi';
import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';

export default class extends PageModification {
  waitForLoading() {
    return this.waitForElement('.ghx-swimlane');
  }

  getModificationId() {
    return `SLAIndicatorTitle-shows-${this.getBoardId()}`;
  }

  shouldApply() {
    const view = this.getSearchParam('view');
    return !view || view === 'detail';
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), Promise.all([this.getBoardProperty(BOARD_PROPERTIES.SLA_INDICATOR)])]);
  }

  async showSLAindicators() {
    const issues = await document.getElementsByClassName('js-issue');
    const issuesList = [];
    issues.forEach(async element => {
      issuesList.push(element.dataset.issueKey);
    });

    const maxCountOnPart = 100;
    const countOfParts = await Math.ceil(issues.length / maxCountOnPart);
    for (let part = 0; part < countOfParts; part++) {
      this.getIssueData(issuesList, part, maxCountOnPart).then(value =>
        value.forEach(element => this.renderSLA(element))
      );
    }
  }

  renderSLA(element) {
    let [divElementDays] = document.querySelector(`[data-issue-key=${element.key}]`).getElementsByClassName('ghx-row');
    if (!divElementDays) {
      [divElementDays] = document.querySelector(`[data-issue-key=${element.key}]`).getElementsByClassName('ghx-days');
    }
    const divElement = divElementDays.parentElement.parentElement;
    const swimlaneId = divElement.closest('.ghx-swimlane').getAttribute('swimlane-id');
    const SLA = this.getSLA(element.type, swimlaneId);
    divElement.insertAdjacentHTML('beforeEnd', this.createHTMLTag(element.CommitmentPoint, SLA));
  }

  async apply(settings) {
    if (!settings[1][0]) {
      return null;
    }

    const [, jiraCustomSetting] = settings;
    const [SLASettings] = jiraCustomSetting;
    this.settings = SLASettings;

    if (!this.settings.customFieldKey) {
      return null;
    }
    if (this.settings.renderWhenPageLoaded) {
      this.showSLAindicators();
      this.onDOMChange('#ghx-pool', () => this.showSLAindicators());
    } else {
      this.button = this.getButton();
      const menu = document.getElementById('ghx-modes-tools');
      menu.append(this.button);
      this.button.addEventListener('click', () => this.showSLAindicators());
    }
    return '';
  }

  getButton() {
    const button = document.createElement('button');
    button.id = 'SLAindicator';
    button.className = 'aui-button favourite-btn aui-button-subtle';
    button.insertAdjacentHTML('beforeend', 'SLA');
    return button;
  }

  setTimeout(func, time) {
    const timeoutID = setTimeout(func, time);
    this.sideEffects.push(() => clearTimeout(timeoutID));
    return timeoutID;
  }

  async getIssueData(issuesList, part, maxCountOnPart) {
    const { customFieldKey } = this.settings;
    const fields = [customFieldKey, 'issuetype'];
    const request = await getIssueDataFromServer(issuesList, part, maxCountOnPart, fields);
    const elements = [];
    await request.issues.forEach(element => {
      if (element.fields[customFieldKey]) {
        elements.push({
          key: element.key,
          CommitmentPoint: new Date(element.fields[customFieldKey]),
          type: element.fields.issuetype.id,
        });
      }
    });
    const elem = await elements;
    return elem;
  }

  getSLA(typeId, swimlaneId) {
    let value = '';
    const SLASettings = this.settings.SLA;

    if (SLASettings[typeId]) {
      const swimlaneValue = SLASettings[typeId];
      if (swimlaneValue) {
        value = swimlaneValue[swimlaneId];
      }
    }
    return value;
  }

  createHTMLTag(date = undefined, SLA) {
    if (!date) {
      return '';
    }

    if (!this.settings.showOnAllCards) {
      if (!SLA) {
        return '';
      }
    }

    const today = new Date();
    date.setHours(0, 0, 0);
    today.setHours(0, 0, 0);
    const days = Math.round((today - date) / 24 / 60 / 60 / 1000);
    const percent = SLA ? Math.round((days / SLA) * 100) : 0;
    const width = percent > 96 ? 96 : percent;
    const dateTag = `
    <div class="SLAProgress"  title='Осталось ${SLA ? SLA - days : 0} дней до нарушения SLA'>
      <div class='progress gradient-bk'>
      <div class="incomplete" style="width: ${SLA ? 96 - width : 96}%;"></div>
        <span>
            ${days}
        </span>
      </div>
    </div>
      `;

    return dateTag;
  }

  appendStyles() {
    return `
    <style type="text/css">

      .progress {
        width: 98%;
        height: 20px;
        margin-left:4px;
        position: relative;
        border-radius: 8px;
        text-align: center
    }
  
      .gradient-bk {
      /* Permalink - use to edit and share this gradient: https://colorzilla.com/gradient-editor/#00d338+0,fcfc00+47,fcfc00+55,fcfc00+55,fcfc00+62,fcfc00+62,ff2e00+100 */
      background: rgb(0,211,56); /* Old browsers */
      background: -moz-linear-gradient(left,  rgba(0,211,56,1) 0%, rgba(252,252,0,1) 47%, rgba(252,252,0,1) 55%, rgba(252,252,0,1) 55%, rgba(252,252,0,1) 62%, rgba(252,252,0,1) 62%, rgba(255,46,0,1) 100%); /* FF3.6-15 */
      background: -webkit-linear-gradient(left,  rgba(0,211,56,1) 0%,rgba(252,252,0,1) 47%,rgba(252,252,0,1) 55%,rgba(252,252,0,1) 55%,rgba(252,252,0,1) 62%,rgba(252,252,0,1) 62%,rgba(255,46,0,1) 100%); /* Chrome10-25,Safari5.1-6 */
      background: linear-gradient(to right,  rgba(0,211,56,1) 0%,rgba(252,252,0,1) 47%,rgba(252,252,0,1) 55%,rgba(252,252,0,1) 55%,rgba(252,252,0,1) 62%,rgba(252,252,0,1) 62%,rgba(255,46,0,1) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
      filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00d338', endColorstr='#ff2e00',GradientType=1 ); /* IE6-9 */
      }
      
      .progress .incomplete {
        position: absolute;
        width: 20%;
        float: right;
        background-color: white !important;
        top: 1px;
        right: 1px;
        height: 18px;
        border-radius: 7px;
      }

      .SLAProgress{
        width: 100%;
      }

      .progress span {
        color: black;
        opacity: .8;
        font-size: 1.0rem;
        font-weight: 700;
        vertical-align: top;
      }

    </style>
    `;
  }
}
