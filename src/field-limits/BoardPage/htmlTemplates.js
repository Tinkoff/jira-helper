import s from './styles.css';

export const fieldLimitsTemplate = ({ listBody }) => `<div class="${s.fieldLimitsList}">${listBody}</div>`;

export const fieldLimitBlockTemplate = ({ blockClass, dataFieldLimitKey, innerText }) => `
                          <div class="${blockClass} ${s.fieldLimitsItem}" data-field-limit-key="${dataFieldLimitKey}">
                              ${innerText}
                          </div>`;

export const fieldLimitTitleTemplate = ({ limit = 0, current = 0, projectKey, fieldName, fieldValue }) =>
  `current: ${current} \nlimit: ${limit} \nproject: ${projectKey} \nfield name: ${fieldName}\nfield value: ${fieldValue}`;
