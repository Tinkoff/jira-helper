import style from './styles.css';

export const settingsEditBtnTemplate = btnId => `<div class="${style.settingsEditBtn}">
            <button id="${btnId}" class="aui-button" type="button">Edit team limits</button>
        </div>`;

export const teamLimitsTableTemplate = ({
  tableId,
  tableBodyId,
  addLimitBtnId,
  selectTeamWrpForProjectId,
  searchProjectInput,
  searchProjectBtn,
}) => `
   <form class="aui">
     <table id="${tableId}" class="${style.addTeamLimitTable}">
        <thead>
          <tr>
            <th>Project</th>
            <th>Team</th>
            <th>Limit</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="${tableBodyId}">
        </tbody>
      </table>
      <div class="${style.findTeam}">
        <h3>Find team</h3>
        <div class="${style.findTeamsForProjects}">
          <input id="${searchProjectInput}" class="text" type="text" value="" placeholder="Project Key, f.e. PFI" />
          <button id="${searchProjectBtn}" type="button" class="aui-button">Search</button>
        </div>
        <div id="${selectTeamWrpForProjectId}"></div>
        <button disabled type="button" id="${addLimitBtnId}" class="aui-button ${style.addTeamLimitBtn}">Add limit</button>
      </div>
      <p class="${style.teamLimitsHint}">
        * To visualize team limits, you should show "Team" field on kanban cards
      </p>
  </form>
`;

export const teamLimitsTableRowTemplate = ({
  rowClass,
  projectKey,
  teamName,
  dataTeamProject = '',
  limit = 0,
  removeBtnClass = '',
}) =>
  `<tr class="${rowClass}" data-team-project-row="${dataTeamProject}">
      <td>
        <input readonly disabled data-type="project-key" class="text" type="text" value="${projectKey}" />
      </td>
      <td>
        <input readonly disabled data-type="team-name" class="text" type="text" value="${teamName}" />
      </td>
      <td>
        <input data-type="team-limits" class="text" type="number" value="${limit}"/>
      </td>
      <td>
        <button type="button" class="aui-button ${removeBtnClass}">Delete</button>
      </td>
  </tr>`;

export const selectTeamTemplate = ({ options, id }) => `
  <select class="select" name="select-team-jh" id="${id}" defaultValue="${options[0]}">
    ${options.map(
      (option, i) => `<option ${i === 0 ? 'selected="selected"' : ''} value="${option}">${option}</option>`
    )}
  </select>
`;
