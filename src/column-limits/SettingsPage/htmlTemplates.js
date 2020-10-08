import style from './styles.css';
import { generateColorByFirstChars as generateColor } from '../shared/utils';

export const groupSettingsBtnTemplate = ({ groupOfBtnsId = '', addGroupBtnId = '', text = 'Group Settings' }) =>
  `<div id="${groupOfBtnsId}" class="aui-buttons ${style.jhGroupOfBtns}"><button id="${addGroupBtnId}" class="aui-button">${text}</button></div>`;

export const formTemplate = ({ leftBlock = 'khkhkkh', rightBlock = 'khkhkkh', id = 'jh-wip-limits-id' }) =>
  `<form class="aui ${style.form}" id="${id}">
    <div class="${style.formLeftBlock}">${leftBlock}</div>
    <div class="${style.formRightBlock}">${rightBlock}</div>
    </form>`;

export const groupsTemplate = ({ id = 'jh-groups-template', children = '' }) => `<div id="${id}">${children}</div>`;

export const groupTemplate = ({
  dropzoneClass = '',
  groupLimitsClass = '',
  withoutGroupName = '',
  groupId = '',
  groupMax = '',
  columnsHtml = '',
}) => `
        <div
          class="${style.columnGroupJH} "
          style="${groupId !== withoutGroupName ? `background-color: ${generateColor(groupId)}` : ''}"
        >
            ${
              groupId === withoutGroupName
                ? ''
                : `<section class="${style.columnGroupLimitsJH}">
                  <span>Limit for group:</span>
                  <input data-group-id="${groupId}" class="${groupLimitsClass}" value="${groupMax}"/>
                </section>`
            }
          <div class="${style.columnListJH} ${dropzoneClass}" data-group-id="${groupId}">${columnsHtml}</div>
      </div>
    `;

export const columnTemplate = ({ columnId = '', dataGroupId = '', columnTitle = '', draggableClass }) =>
  `<div data-column-id="${columnId}" data-group-id="${dataGroupId}" class="${style.columnDraggableJH} ${draggableClass}" draggable="true">${columnTitle}</div>`;

export const dragOverHereTemplate = ({ dropzoneId = '', dropzoneClass = '' }) =>
  `<div  class="${style.addGroupDropzoneJH} ${dropzoneClass}" id="${dropzoneId}">Drag column over here to create group</div>`;
