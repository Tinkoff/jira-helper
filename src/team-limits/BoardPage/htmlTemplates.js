import s from './styles.css';

export const teamLimitsTemplate = ({ listBody }) => `<div class="${s.teamLimitsList}">${listBody}</div>`;

export const teamLimitBlockTemplate = ({ blockClass, dataTeamLimitKey, innerText }) => `
                          <div class="${blockClass} ${s.teamLimitsItem}" data-team-limit-key="${dataTeamLimitKey}">
                              ${innerText}
                          </div>`;

export const teamLimitTitleTemplate = ({ limit = 0, current = 0, projectKey, teamName }) =>
  `current: ${current} \nlimit: ${limit} \nproject: ${projectKey} \nname: ${teamName}`;
