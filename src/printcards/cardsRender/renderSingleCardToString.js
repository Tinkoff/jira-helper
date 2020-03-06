import styles from './printCard.css';
import { sortTitle, getDisplayName, getEpicByKey, getEpicColors, getRoleName } from '../utils/common';

const MAX_LEN_SUMMARY = 120;
const MAX_LEN_EPIC_NAME = 25;

const defaultEpicColors = {
  bgColor: '#f4f5f7',
  color: '#0052cc',
  borderColor: '#dfe1e6',
};

export function renderSingleCardToString({ issue, epics, neededFields = [], specialFields }) {
  const { fields = '', key = '' } = issue;
  const { epicStyles = {} } = specialFields;
  const {
    [specialFields.epic]: epicKey = '',
    [specialFields.storyPoints]: storyPoints = '',
    summary = '',
    issuetype,
    priority,
  } = fields;
  const { iconUrl: issuetypeIcon = '' } = issuetype || {};
  const { iconUrl: priorityIcon } = priority || {};
  const epic = (epics && epicKey && getEpicByKey(epics, epicKey)) || '';
  const { [specialFields.epicName]: epicName = '', [specialFields.epicColor]: cssClassEpicColor } = epic && epic.fields;

  const { backgroundColor: epicBgColor, color: epicColor } = getEpicColors(cssClassEpicColor, epicStyles);

  const resultBgEpicColor = epicBgColor || defaultEpicColors.bgColor;
  const resultEpicColor = epicColor || defaultEpicColors.color;

  return `
      <div class="${styles.root}">
      <div class="${styles.content}">
      <div class="${styles.header}">
      <span class="${styles.epic}"
       style="background-color: ${epic && resultBgEpicColor}; color: ${epic && resultEpicColor}; width: 100%"
       >
        ${issuetype.name === 'Epic' ? '' : sortTitle(epicName, MAX_LEN_EPIC_NAME)}
     </span>
    </div>
    <div class="${styles.info}">
    <div class="${styles.space}">
    <div class="${styles.people}">

    ${specialFields.roleFields
      .map(roleField => {
        const field = fields[roleField.id];
        return field && neededFields.includes(roleField.id)
          ? `<div class="${styles.name}">
                <span class="${styles.roleName}">${getRoleName(roleField.name)}</span>
                ${getDisplayName(field)}</div>`
          : '';
      })
      .join('')}
  </div>
    </div>
    <div class="${styles.summary}" style="${issuetype.name === 'Epic' ? 'font-size: 25px' : ''}">
      <span>
        ${issuetype.name === 'Epic' ? sortTitle(epicName, MAX_LEN_SUMMARY) : sortTitle(summary, MAX_LEN_SUMMARY)}
      </span>
    </div>
  </div>
  <div class="${styles.footer}">
    <div class="${styles.number}">
      <div class="${styles.icon}"><img src="${issuetypeIcon}" /></div>
    ${priorityIcon ? `<div class="${styles.icon}"><img src="${priorityIcon}" /></div>` : ''}
    <div class="${styles.key}">${key}</div>
      </div>
      <div class="${styles.point}">${storyPoints || ''}</div>
      </div>
      </div>
      </div>`;
}
