import path from '@tinkoff/utils/object/path';

/**
 * Возвращает цвет эпика
 * @name getEpicColors
 * @function
 * @param {string} epicCssColorClass - класс для эпика типа ghx-color-N, где N = [0, 9]
 * @param {object} epicStyles - объект со стилями для эпика
 * @return {string} - цвет для background-color
 */
export function getEpicColors(epicCssColorClass, epicStyles) {
  const styles = epicStyles[epicCssColorClass];
  return styles || {};
}

/**
 * Возвращает эпик из списка задач-эпиков
 * @name getEpicByKey
 * @function
 * @param {array} epics - задачи-эпики
 * @param {string} epicKey - идентификатор проекта
 * @return {object} - эпик
 */
export function getEpicByKey(epics = [], epicKey = '') {
  return epics.find(ep => ep.key === epicKey);
}

/**
 * Сокращает длину заголовка
 * @name sortTitle
 * @function
 * @param {string} title - заголовок
 * @param {integer} maxLen - максимальная длина заголовка
 * @return {string} title - укороченный заголовок
 */
export function sortTitle(title, maxLen) {
  return title ? title.substr(0, maxLen) + (title.length > maxLen ? '…' : '') : '';
}

/**
 * Возвращает имя и фамилию
 * @name getDisplayName
 * @function
 * @param {object} field - поля сотрудника
 * @return {string} - Имя Фамилия
 */
export function getDisplayName(field) {
  return (
    field && field.displayName && `${field.displayName.split(' ')[0] || ''} ${field.displayName.split(' ')[1] || ''}`
  );
}

export function getRoleName(name) {
  return (name && `${name.substring(0, 3)}.`) || '';
}

/**
 * Возвращает ID эпика из поля
 * @name getEpicKey
 * @function
 * @param {object} issue - задача
 * @param {string} epicFieldName - идентификатор поля типа customfield_999999 на JIRA
 * @return {*|string} - номер эпика
 */
export function getEpicKey(issue, epicFieldName) {
  return path(['fields', epicFieldName], issue);
}

export function getProject(issue) {
  return path(['fields', 'project'], issue);
}
