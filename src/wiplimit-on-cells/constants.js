// settings
export const settingsJiraDOM = {
  swimlineSelect: 'WIPLC_SwimLine',
  columnSelect: 'WIPLC_Column',
  showBadge: 'WIPLC_showBadge',
  buttonAddCells: 'WIPLC_buttonAddCells',
  table: 'WIP_tableDiv',
  ClearData: 'SLAClearData',
  inputRange: 'WIP_inputRange',
  disableRange: 'WIP_disableRange',
  buttonRange: 'WIP_buttonRange',
  chooseCheckbox: 'WIP_chooseCheckbox',
};

export const settingsEditWipLimitOnCells = btnId => `<div style="margin-top: 1rem">
            <button id="${btnId}" class="aui-button" type="button">Edit Wip limits by cells</button>
        </div>`;

export const ClearDataButton = btnId => `<div style="margin-top: 1rem">
            <button id="${btnId}" class="aui-button" type="button">Clear and save all data</button>
        </div>`;

export const RangeName = () => `
<form class="aui">
  <div class="field-group">
    <label for="${settingsJiraDOM.inputRange}">Add range </label>
    <input class="text" id="${settingsJiraDOM.inputRange}" placeholder="name" />
    <button id="${settingsJiraDOM.buttonRange}" class="aui-button" type="button">Add range</button>
  </div>
</form>`;
// <input type="checkbox" class="checkbox select-user-chb" data-id="${id}"></input>

export const cellsAdd = (swimlines, collums) => {
  if (!Array.isArray(collums) || !Array.isArray(swimlines)) {
    return '';
  }
  const swimlinesHTML = [];
  swimlines.forEach(element => {
    swimlinesHTML.push(`<option value=${element.id} >${element.name}</option>`);
  });
  const collumsHTML = [];
  collums.forEach(element => {
    collumsHTML.push(`<option value=${element.id} >${element.name}</option>`);
  });
  return `
  <hr/>
    <div style="margin-top: 1rem">
              <form class="aui">
              <div class="field-group">
              <label for="${settingsJiraDOM.swimlineSelect}">Swimline </label>
    <select id="${settingsJiraDOM.swimlineSelect}">
        <option>-</option>
        ${swimlinesHTML.join('')}
    </select>
    </div>

    <div class="field-group">
    <label for="${settingsJiraDOM.columnSelect}">Collumn </label>
    <select id="${settingsJiraDOM.columnSelect}">
    <option>-</option>
        ${collumsHTML.join('')}
    </select>
    </div>
    <div class="field-group">
    <label for="${settingsJiraDOM.columnSelect}">show indicator</label>
    <input type="checkbox" class="checkbox select-user-chb" id="${settingsJiraDOM.showBadge}"></input>
    <button id="${settingsJiraDOM.buttonAddCells}" class="aui-button" type="button">add cell</button>
    </div>
    </form>
    </div >
    <hr/>`;
};

export const settingsPopupTableTemplate = tableBody => `
   <form class="aui">
     <table>
        <thead>
          <tr>
            <th></th>
            <th>Range name</th>
            <th>WIP limit</th>
            <th>Disable range</th>
            <th>Cells</th>
          </tr>
        </thead>
        <tbody>
        <tr class="aui-row-subtle"> </tr>
          ${tableBody}
        </tbody>
      </table>
  </form>
`;
