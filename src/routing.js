import { types } from './background/actions';
import { waitForElement } from './shared/utils';
import { extensionApiService } from './shared/ExtensionApiService';

export const Routes = {
  BOARD: 'BOARD',
  SETTINGS: 'SETTINGS',
  SEARCH: 'SEARCH',
  REPORTS: 'REPORTS',
  ISSUE: 'ISSUE',
  ALL: 'ALL',
};

export const getSearchParam = param => new URLSearchParams(window.location.search).get(param);

export const getCurrentRoute = () => {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);

  if (pathname.includes('RapidView.jspa')) return Routes.SETTINGS;

  if (pathname.includes('RapidBoard.jspa')) {
    if (params.get('config')) return Routes.SETTINGS;
    if (params.get('view') === 'reporting') return Routes.REPORTS;

    return Routes.BOARD;
  }

  if (pathname.startsWith('/browse')) {
    return params.get('jql') ? Routes.SEARCH : Routes.ISSUE;
  }

  if (pathname.startsWith('/issues/')) return Routes.SEARCH;

  return null;
};

export const getSettingsTab = () => {
  const search = new URLSearchParams(window.location.search);

  const tabFromUrl = search.get('tab') || search.get('config');

  return tabFromUrl
    ? Promise.resolve(tabFromUrl)
    : waitForElement('.aui-nav-selected').promise.then(selectedNav => selectedNav.dataset.tabitem);
};

export const getIssueId = () => {
  if (window.location.pathname.startsWith('/browse')) {
    return window.location.pathname.split('/')[2];
  }

  if (getSearchParam('selectedIssue') && (getSearchParam('view') || getSearchParam('modal')))
    return getSearchParam('selectedIssue');

  return null;
};

export const onUrlChange = cb => {
  extensionApiService.onMessage(message => {
    if (message.type === types.TAB_URL_CHANGE) {
      cb(message.url);
    }
  });
};
