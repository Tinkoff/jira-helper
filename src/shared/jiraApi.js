import request from '@tinkoff/request-core';
import transformUrl from '@tinkoff/request-plugin-transform-url';
import deduplicateCache from '@tinkoff/request-plugin-cache-deduplicate';
import memoryCache from '@tinkoff/request-plugin-cache-memory';
import http from '@tinkoff/request-plugin-protocol-http';
import compose from '@tinkoff/utils/function/compose';
import map from '@tinkoff/utils/array/map';
import prop from '@tinkoff/utils/object/prop';
import filter from '@tinkoff/utils/array/filter';
import complement from '@tinkoff/utils/function/complement';
import isNil from '@tinkoff/utils/is/nil';
import path from '@tinkoff/utils/object/path';
import pathOr from '@tinkoff/utils/object/pathOr';
import { getSearchParam } from '../routing';

export const configVersion = 'v1';
const getPropName = property => `${property}${configVersion}`;

const boardPropertiesUrl = boardId => `agile/1.0/board/${boardId}/properties`;
const boardConfigurationURL = boardId => `agile/1.0/board/${boardId}/configuration`;
const boardEditDataURL = 'greenhopper/1.0/rapidviewconfig/editmodel.json?rapidViewId=';
const boardEstimationDataURL = 'greenhopper/1.0/rapidviewconfig/estimation.json?rapidViewId=';

const invalidatedProperties = {};
const requestJira = request([
  transformUrl({
    baseUrl: `${window.location.origin}/rest/`,
  }),
  deduplicateCache(),
  memoryCache({ allowStale: true }),
  http(),
]);

const getBoardProperties = boardId => {
  const cacheKey = `${boardId}_propertiesList`;
  const memoryCacheForce = invalidatedProperties[cacheKey] != null;
  delete invalidatedProperties[cacheKey];

  return requestJira({
    url: boardPropertiesUrl(getSearchParam('rapidView')),
    memoryCacheForce,
    type: 'json',
  });
};

export const getBoardProperty = async (boardId, property, params = {}) => {
  const boardProps = await getBoardProperties(boardId);
  if (!boardProps.keys.find(boardProp => boardProp.key === getPropName(property))) return undefined;

  const cacheKey = `${boardId}_${property}`;
  const memoryCacheForce = invalidatedProperties[cacheKey] != null;
  delete invalidatedProperties[cacheKey];

  return requestJira({
    url: `${boardPropertiesUrl(boardId)}/${getPropName(property)}`,
    memoryCacheForce,
    type: 'json',
    ...params,
  }).then(result => result.value);
};

export const updateBoardProperty = (boardId, property, value, params = {}) => {
  const cacheKey = `${boardId}_${property}`;
  invalidatedProperties[cacheKey] = true;
  invalidatedProperties[`${boardId}_propertiesList`] = true;

  requestJira({
    url: `${boardPropertiesUrl(boardId)}/${getPropName(property)}`,
    httpMethod: 'PUT',
    type: 'json',
    payload: value,
    ...params,
  });
};

export const deleteBoardProperty = (boardId, property, params = {}) => {
  const cacheKey = `${boardId}_${property}`;
  invalidatedProperties[cacheKey] = true;
  invalidatedProperties[`${boardId}_propertiesList`] = true;

  requestJira({
    url: `${boardPropertiesUrl(boardId)}/${getPropName(property)}`,
    httpMethod: 'DELETE',
    type: 'json',
    ...params,
  });
};

export const getBoardEditData = (boardId, params = {}) => {
  return requestJira({
    url: `${boardEditDataURL}${boardId}`,
    type: 'json',
    ...params,
  });
};

export const getBoardConfiguration = async (boardId, params = {}) => {
  return requestJira({
    url: boardConfigurationURL(boardId),
    type: 'json',
    ...params,
  });
};

export const getBoardEstimationData = (boardId, params = {}) => {
  return requestJira({
    url: `${boardEstimationDataURL}${boardId}`,
    type: 'json',
    ...params,
  });
};

export const searchIssues = (jql, params = {}) =>
  requestJira({
    url: `api/2/search?jql=${jql}`,
    type: 'json',
    ...params,
  });

export const loadNewIssueViewEnabled = (params = {}) =>
  requestJira({
    url: 'greenhopper/1.0/profile/labs-panel/issue-details-popup',
    type: 'json',
    ...params,
  }).then(
    res => res.isEnabled,
    () => false
  );

export const getAllFields = () =>
  requestJira({
    url: 'api/2/field',
    type: 'json',
  });

export const getFlaggedField = async () =>
  getAllFields().then(fields => fields.find(field => field.name === 'Flagged').id);

const getFlaggedIssues = flagField =>
  compose(map(prop('key')), filter(compose(complement(isNil), path(['fields', flagField]))), pathOr(['issues'], []));

export const loadFlaggedIssues = keys => {
  return getFlaggedField().then(flagField =>
    searchIssues(`key in (${keys.join(',')})&fields=${flagField}`).then(getFlaggedIssues(flagField))
  );
};
