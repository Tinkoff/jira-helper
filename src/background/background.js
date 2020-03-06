import { types } from './actions';
import { extensionApiService } from '../shared/ExtensionApiService';

const state = {
  jiraCards: {
    issues: null,
    epics: null,
    specialFields: {},
  },
  roles: {},
};

extensionApiService.onMessage((request, sender, sendResponse) => {
  switch (request.action) {
    case types.SET_CARDS:
      state.jiraCards = {
        issues: request.issues,
        epics: request.epics,
        specialFields: request.specialFields,
      };
      return sendResponse('OK');
    case types.GET_CARDS:
      return sendResponse(state.jiraCards);
    case types.SET_ROLES:
      state.roles = request.roles;
      return sendResponse('OK');
    case types.GET_ROLES:
      return sendResponse(state.roles);
    default:
  }
});

extensionApiService.onTabsUpdated((tabId, changeInfo) => {
  if (changeInfo.url) {
    extensionApiService.sendMessageToTab(tabId, {
      type: types.TAB_URL_CHANGE,
      url: changeInfo.url,
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  require('../shared/trackChanges') // eslint-disable-line
    .default('refresh_background', () => extensionApiService.reload());
}
