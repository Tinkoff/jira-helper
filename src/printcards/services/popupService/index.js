import splitEvery from '@tinkoff/utils/array/splitEvery';
import each from '@tinkoff/utils/array/each';
import { getEpicKey } from '../../utils/common';
import {
  getAboutTemplate,
  getProgressTemplate,
  getRoleSettingsTemplate,
  getTaskLimitTemplate,
} from './helpers/popupTemplates';
import { setCards, setRoles } from '../../../background/actions';
import { searchIssues } from '../../../shared/jiraApi';
import { Popup } from '../../../shared/getPopup';

export class PopupService {
  constructor({ extensionService, specialFieldsService }) {
    this.extensionService = extensionService;
    this.specialFieldsService = specialFieldsService;

    this.currentJql = ' ';
    this.SPLIT_ISSUES_EVERY_NUMBER = 50;
    this.messageForClosedPopup = 'CLOSED_POPUP_TRIGGERED';
    this.popup = null;

    this.settingsIdentifiers = {
      startBtnId: 'printcards__start-prepare',
      maxTasksInputId: 'maxTasksInputId',
    };

    this.progressBarSelectors = {
      inProgress: '.progress_in-progress',
      complete: '.progress_complete',
    };

    this.progressesIds = {
      issues: 'issues_progressbar',
      epics: 'epics_progressbar',
    };

    this.rolesSettingsId = {
      requiredRolesBlock: 'requiredRolesBlockId',
    };

    this.checkboxSelector = '.role_checkbox_jh';

    this.onConfirmForm = this.onConfirmForm.bind(this);
    this.onCancelForm = this.onCancelForm.bind(this);
    this.onStartLoading = this.onStartLoading.bind(this);
  }

  onConfirmForm() {
    const requiredFields = [];
    each(input => {
      requiredFields.push(input.value);
    }, document.querySelectorAll(`#${this.rolesSettingsId.requiredRolesBlock} input[name='needed_fields']:checked`));

    if (requiredFields.length > 5) {
      return alert('You may select only 5 fields!');
    }

    this.extensionService.bgRequest(setRoles(requiredFields)).then(() => {
      window.open(this.extensionService.getUrl('printcards.html'), '_blank').focus();
    });
  }

  onCancelForm(closeCallback) {
    // Здесь создаётся таска для того, чтобы могли выполниться какие-нибудь микротаски в это время, например запросы issues,epics
    // И остановиться, если увидят `isOpened = false`.
    setTimeout(() => {
      closeCallback();
    }, 0);
  }

  onStartLoading(e) {
    e.preventDefault();

    const countOfIssues = parseInt(document.querySelector(`#${this.settingsIdentifiers.maxTasksInputId}`).value, 10);
    const resultedAmountOfIssue = countOfIssues && countOfIssues >= 0 ? countOfIssues : this.issueCount;

    document.querySelector(`#${this.settingsIdentifiers.startBtnId}`).disabled = true;

    this.startLoadingIssues(resultedAmountOfIssue)
      .then(issues => {
        return Promise.all([this.specialFieldsService.findSpecialFields(), Promise.resolve(issues)]);
      })
      .then(([specialFields, issues]) => {
        const { epic } = specialFields;

        const epicsKeys = issues.map(issue => getEpicKey(issue, epic)).filter(i => i && i.length > 0);

        const epicsPromise = epicsKeys.length > 0 ? this.startLoadingEpics(epicsKeys) : Promise.resolve([]);

        return epicsPromise
          .then(epics => this.extensionService.bgRequest(setCards({ issues, epics, specialFields })))
          .then(() => specialFields);
      })
      .then(({ roleFields }) => this.renderRoleSettings(roleFields))
      .catch(err => {
        // if closed - do nothing
        if (err === this.messageForClosedPopup) return Promise.resolve();

        return Promise.reject(err);
      });
  }

  async startLoadingEpics(epicKeys) {
    this.popup.appendToContent(
      getProgressTemplate({
        inProgressPercent: 100,
        completePercent: 0,
        desc: 'Loading epics for issues',
        id: this.progressesIds.epics,
      })
    );

    const keysForPartialRequesting = splitEvery(25, epicKeys);

    const result = [];
    let accum = 0;
    for (const keys of keysForPartialRequesting) {
      if (!this.popup.isOpened) return Promise.reject(this.messageForClosedPopup);

      // eslint-disable-next-line no-await-in-loop
      const res = await searchIssues(`issuekey  in (${keys.join(',')})&maxResults=1000`);

      result.push(...res.issues);
      accum += keys.length;

      // Не используем result.length потому что можно запросить 25 ключей разных а придёт только 15 и что делать?
      // Делать вид как-будто их и не было
      const completePercent = (accum / epicKeys.length) * 100;
      const inProgressPercent = 100 - completePercent;

      this.setWidthForProgressBar({ progressbarId: this.progressesIds.epics, inProgressPercent, completePercent });
    }

    return result;
  }

  async startLoadingIssues(amountOffIssues = 1000) {
    this.popup.appendToContent(
      getProgressTemplate({
        inProgressPercent: 100,
        completePercent: 0,
        desc: 'Loading issues',
        id: this.progressesIds.issues,
      })
    );

    let startAt = 0;
    const result = [];
    while (startAt < amountOffIssues) {
      if (!this.popup.isOpened) return Promise.reject(this.messageForClosedPopup);

      // eslint-disable-next-line no-await-in-loop
      const res = await searchIssues(
        `${this.currentJql}&maxResults=${this.SPLIT_ISSUES_EVERY_NUMBER}&startAt=${startAt}`
      );
      result.push(...res.issues);
      startAt += this.SPLIT_ISSUES_EVERY_NUMBER;

      const completePercent = (startAt / amountOffIssues) * 100;
      const inProgressPercent = 100 - completePercent;

      this.setWidthForProgressBar({ progressbarId: this.progressesIds.issues, inProgressPercent, completePercent });
    }

    return result;
  }

  setWidthForProgressBar({ progressbarId, inProgressPercent, completePercent }) {
    document.querySelector(
      `#${progressbarId} ${this.progressBarSelectors.inProgress}`
    ).style.width = `${inProgressPercent}%`;
    document.querySelector(
      `#${progressbarId} ${this.progressBarSelectors.complete}`
    ).style.width = `${completePercent}%`;
  }

  renderBasicSettings() {
    this.popup.appendToContent(
      getTaskLimitTemplate({
        startBtnId: this.settingsIdentifiers.startBtnId,
        maxTasksInputId: this.settingsIdentifiers.maxTasksInputId,
        maxIssues: this.issueCount,
      })
    );
    document.querySelector(`#${this.settingsIdentifiers.startBtnId}`).addEventListener('click', this.onStartLoading);
  }

  renderRoleSettings(roleFields) {
    this.popup.appendToContent(
      getRoleSettingsTemplate({
        requiredRolesBlockId: this.rolesSettingsId.requiredRolesBlock,
        fields: roleFields,
      })
    );

    each(checkbox => {
      checkbox.addEventListener('click', () => {
        if (document.querySelectorAll(`${this.checkboxSelector}:checked`).length >= 5) {
          each(cb => {
            cb.disabled = true;
          }, document.querySelectorAll(`${this.checkboxSelector}:not(:checked)`));
        } else {
          each(cb => {
            cb.removeAttribute('disabled');
          }, document.querySelectorAll(`${this.checkboxSelector}:not(:checked)`));
        }
      });
    }, document.querySelectorAll(`${this.checkboxSelector}`));

    this.popup.toggleConfirmAvailability(true);
  }

  renderPopup(jql, issueCount) {
    this.currentJql = jql;
    this.issueCount = issueCount;

    this.popup = new Popup({
      title: 'Printing cards',
      onConfirm: this.onConfirmForm,
      onCancel: this.onCancelForm,
      okButtonText: 'Print',
      initialContentInnerHTML: getAboutTemplate({
        optionsURL: this.extensionService.getUrl('options.html'),
        text: 'More information about printing and template',
      }),
    });

    this.popup.render();
    this.popup.toggleConfirmAvailability(false);

    this.renderBasicSettings();
  }
}
