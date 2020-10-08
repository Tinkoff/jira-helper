import { PageModification } from '../shared/PageModification';
import { getSettingsTab } from '../routing';
import { btnGroupIdForColumnsSettingsPage, BOARD_PROPERTIES } from '../shared/constants';
import { openPersonLimitsModal } from './personLimitsModal';

export default class extends PageModification {
  async shouldApply() {
    return (await getSettingsTab()) === 'columns';
  }

  getModificationId() {
    return `add-person-settings-${this.getBoardId()}`;
  }

  waitForLoading() {
    return this.waitForElement(`#columns #${btnGroupIdForColumnsSettingsPage}`);
  }

  loadData() {
    return Promise.all([this.getBoardEditData(), this.getBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS)]);
  }

  apply([boardData = {}, personLimits = { limits: [] }]) {
    if (!boardData.canEdit) return;

    this.boardData = boardData;
    this.personLimits = personLimits;

    this.appendPersonLimitsButton();
    this.onDOMChange('#columns', () => {
      this.appendPersonLimitsButton();
    });
  }

  appendPersonLimitsButton() {
    const personLimitsButton = this.insertHTML(
      document.getElementById(btnGroupIdForColumnsSettingsPage),
      'beforeend',
      '<button class="aui-button">Manage per-person WIP-limits</button>'
    );

    this.addEventListener(personLimitsButton, 'click', () =>
      openPersonLimitsModal(this, this.boardData, this.personLimits)
    );
  }
}
