export const getAboutTemplate = ({ optionsURL, text }) => `
  <a href="${optionsURL}" class="jh-link-to-about-printing">${text}</a>
  <br/><br />
`;

export const getProgressTemplate = ({ id, desc, completePercent, inProgressPercent }) => `
        <div id="${id}" class="printcards-block">
        <style>
            .progressbar-container {
                border-radius: 3px;
                display: inline-block;
                overflow: hidden;
                width: 100%;
            }
            .progressbar {
                display: table;
                min-width: 150px;
                width: 100%;
            }
            .progressbar__entry {
                display: table-cell;
                height: 10px;
                will-change: width;
                transition: all 0.2s ease-in-out;
            }
            .progressbar__entry_complete {
                background: #14892c;
            }
            .progressbar__entry_in-progress {
                background: #f6c342;
            }
            .printcards-block {
                margin: 17px auto;
            }
        </style>
            <div class="progressbar-container">
                <div class="progressbar">
                    <div class="progressbar__entry progressbar__entry_complete progress_complete" style="width: ${completePercent}%"></div>
                    <div class="progressbar__entry progressbar__entry_in-progress progress_in-progress" style="width: ${inProgressPercent}%"></div>
                </div>
            </div>
            <div class="sidebar-text">
                ${desc}
            </div>
        </div>
`;

export const getTaskLimitTemplate = ({ startBtnId, maxTasksInputId, maxIssues }) => `
    <div class="settingsWrapper">
        <style>
            .settingsWrapper label {
                margin-right: 10px;
                color: gray;
            }
            .settingsWrapper input {
                border: 1px solid #c1c7d0;
                border-radius: 3.01px;
                padding: 4px 5px;
            }
        </style>
        <form action="">
          <div class="field-group">
            <label>Amount of issues to print</label><input id="${maxTasksInputId}" class="text short-field" type="number" min="0" max="${maxIssues}" value="${maxIssues}">
          </div>
          <br />
          <button class="aui-button" id="${startBtnId}">Prepare Data</button>
        </form>
    </div>
`;

export const getRoleSettingsTemplate = ({ requiredRolesBlockId, fields }) => `
  <div class="jh-roles-select">
    <h2>Set card roles, maximum for 5 roles:</h2>
    <br />
    <form id="${requiredRolesBlockId}">
        ${fields
          .map(
            field =>
              `<label><input class="role_checkbox_jh" type="checkbox" name="needed_fields" value="${field.id}">${field.name}</label>`
          )
          .join('<br />')}
    </form>
  </div>
`;
