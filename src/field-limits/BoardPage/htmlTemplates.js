import s from './styles.css';

export const fieldLimitsTemplate = ({ listBody }) => `<div class="${s.fieldLimitsList}">${listBody}</div>`;

export const fieldLimitBlockTemplate = ({ blockClass, dataFieldLimitKey, innerText, bkgColor, issuesCountClass }) => `
                          <div class="${blockClass} ${s.fieldLimitsItem}"
                          style="background-color:${bkgColor || 'none'}"
                          data-field-limit-key="${dataFieldLimitKey}">
                              <div><span>${innerText}</span></div>
                              <div class="${s.limitStats} ${issuesCountClass}"></div>
                          </div>`;

export const fieldLimitTitleTemplate = ({ limit = 0, current = 0, fieldName, fieldValue }) =>
  `current: ${current} \nlimit: ${limit} \nfield name: ${fieldName}\nfield value: ${fieldValue}`;
