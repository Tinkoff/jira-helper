import { getCards, getRoles } from '../../background/actions';
import { getEpicKey } from '../utils/common';
import { renderSingleCardToString } from './renderSingleCardToString';
import { extensionApiService } from '../../shared/ExtensionApiService';

function renderCards(issues, epics, neededFields, specialFields) {
  const cards = issues.sort(
    (a, b) => (getEpicKey(a, specialFields.epic) || '').localeCompare(getEpicKey(b, specialFields.epic) || '') || []
  );

  document
    .querySelector('.root')
    .insertAdjacentHTML(
      'beforeend',
      cards.map(issue => renderSingleCardToString({ issue, epics, neededFields, specialFields })).join('')
    );
}

function init() {
  Promise.all([extensionApiService.bgRequest(getCards()), extensionApiService.bgRequest(getRoles())])
    .then(([jiraCards, roles]) => {
      if (!jiraCards.issues || !jiraCards.epics) {
        return alert('Data is not found. Repeat please search issues on the page of search.');
      }

      const { issues, epics, specialFields } = jiraCards;

      // askSettings(issues, epics, host);
      return renderCards(issues, epics, roles, specialFields);
    })
    .catch(err => {
      console.error('printcards-page Error: ', err); // eslint-disable-line no-console
    });
}

init();
