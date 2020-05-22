import { getSearchParam } from '../routing';
import { waitForElement } from './utils';
import {
  deleteBoardProperty,
  getBoardEditData,
  getBoardEstimationData,
  getBoardProperty,
  getBoardConfiguration,
  updateBoardProperty,
  searchIssues,
} from './jiraApi';

export class PageModification {
  sideEffects = [];

  // life-cycle methods

  shouldApply() {
    return true;
  }

  getModificationId() {
    return null;
  }

  appendStyles() {}

  preloadData() {
    return Promise.resolve();
  }

  waitForLoading() {
    return Promise.resolve();
  }

  loadData() {
    return Promise.resolve();
  }

  apply() {}

  clear() {
    this.sideEffects.forEach(se => se());
  }

  // methods with side-effects

  waitForElement(selector, container) {
    const { promise, cancel } = waitForElement(selector, container);
    this.sideEffects.push(cancel);
    return promise;
  }

  getBoardProperty(property) {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);
    return getBoardProperty(getSearchParam('rapidView'), property, { abortPromise });
  }

  getBoardConfiguration() {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);
    return getBoardConfiguration(getSearchParam('rapidView', { abortPromise }));
  }

  updateBoardProperty(property, value) {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);
    return updateBoardProperty(getSearchParam('rapidView'), property, value, { abortPromise });
  }

  deleteBoardProperty(property) {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);
    return deleteBoardProperty(getSearchParam('rapidView'), property, { abortPromise });
  }

  getBoardEditData() {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);

    return getBoardEditData(getSearchParam('rapidView', { abortPromise }));
  }

  getBoardEstimationData() {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);

    return getBoardEstimationData(getSearchParam('rapidView', { abortPromise }));
  }

  searchIssues(jql, params = {}) {
    const { cancelRequest, abortPromise } = this.createAbortPromise();
    this.sideEffects.push(cancelRequest);

    return searchIssues(jql, { ...params, abortPromise });
  }

  createAbortPromise() {
    let cancelRequest;
    const abortPromise = new Promise(resolve => {
      cancelRequest = resolve;
    });

    return { cancelRequest, abortPromise };
  }

  setTimeout(func, time) {
    const timeoutID = setTimeout(func, time);
    this.sideEffects.push(() => clearTimeout(timeoutID));
    return timeoutID;
  }

  addEventListener = (target, event, cb) => {
    target.addEventListener(event, cb);
    this.sideEffects.push(() => target.removeEventListener(event, cb));
  };

  onDOMChange(selector, cb, params = { childList: true }) {
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new MutationObserver(cb);
    observer.observe(element, params);
    this.sideEffects.push(() => observer.disconnect());
  }

  onDOMChangeOnce(selectorOrElement, cb, params = { childList: true }) {
    const element =
      selectorOrElement instanceof HTMLElement ? selectorOrElement : document.querySelector(selectorOrElement);
    if (!element) return;

    const observer = new MutationObserver(() => {
      observer.disconnect();
      cb();
    });
    observer.observe(element, params);
    this.sideEffects.push(() => observer.disconnect());
  }

  insertHTML(container, position, html) {
    container.insertAdjacentHTML(position, html.trim());

    let insertedElement;
    switch (position) {
      case 'beforebegin':
        insertedElement = container.previousElementSibling;
        break;
      case 'afterbegin':
        insertedElement = container.firstElementChild;
        break;
      case 'beforeend':
        insertedElement = container.lastElementChild;
        break;
      case 'afterend':
        insertedElement = container.nextElementSibling;
        break;
      default:
        throw Error('Wrong position');
    }

    this.sideEffects.push(() => insertedElement.remove());
    return insertedElement;
  }

  setDataAttr(element, attr, value) {
    element.dataset[attr] = value;
    this.sideEffects.push(() => {
      delete element.dataset[attr];
    });
  }

  // helpers

  getSearchParam(param) {
    return getSearchParam(param);
  }
}
