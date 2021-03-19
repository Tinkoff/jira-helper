import style from './styles.css';

export const settingsEditBtnTemplate = btnId => `<div class="${style.settingsEditBtn}">
            <button id="${btnId}" class="aui-button" type="button">Edit WIP limits by field</button>
        </div>`;

export const fieldLimitsTableTemplate = ({
  tableId,
  tableBodyId,
  addLimitBtnId,
  fieldValueInputId,
  columnsSelectId,
  swimlanesSelectId,
  wipLimitInputId,
  applySwimlanesId,
  applyColumnsId,
  selectFieldId,
  selectFieldOptions = [],
  swimlaneOptions = [],
  columnOptions = [],
}) => `
   <form class="aui">
      <fieldset>
        <table>
          <tr>
            <td>
               <div class="field-group">
                <label for="field-name">Field</label>
                <select id="${selectFieldId}" class="select" name="field-name" defaultValue="${
  selectFieldOptions[0]?.value
}">
                    ${selectFieldOptions.map(
                      (option, i) =>
                        `<option ${i === 0 ? 'selected="selected"' : ''} value="${option.value}">${
                          option.text
                        }</option>`
                    )}
                </select>
              </div>
              <div class="field-group">
                <label for="field-value">Field Value</label>
                <input id="${fieldValueInputId}" class="text medium-field" type="text" name="field-value" placeholder="Field Value">
              </div>
              <div class="field-group">
                <label for="field-limit">WIP Limit</label>
                <input id="${wipLimitInputId}" class="text medium-field" type="number" name="field-limit" placeholder="0">
              </div>
            </td>
            <td>
              <div class="field-group" style="display: flex">
                <label>Columns</label>
                <select id="${columnsSelectId}" class="select2" multiple style="margin: 0 12px" size="4">
                  ${columnOptions.map(option => `<option selected value="${option.value}">${option.text}</option>`)}
                </select>
                <button type="button" id="${applyColumnsId}" class="aui-button aui-button-link">Apply columns<br/>for selected users</button>
              </div>
              <div class="field-group" style="display: flex">
                <label>Swimlanes</label>
                <select id="${swimlanesSelectId}" class="select2" multiple style="margin: 0 12px" size="5">
                  ${swimlaneOptions.map(option => `<option selected value="${option.value}">${option.text}</option>`)}
                </select>
                <button type="button" id="${applySwimlanesId}" class="aui-button aui-button-link">Apply swimlanes<br/>for selected users</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>&nbsp;</td>
            <td>
              <div class="buttons-container">
                <div class="buttons">
                  <button class="aui-button aui-button-primary ${
                    style.addFieldLimitBtn
                  }" type="button" id="${addLimitBtnId}">Add limit</button>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </fieldset>
     </div>
     <table id="${tableId}" class="aui ${style.addFieldLimitTable}">
        <thead>
          <tr>
            <th></th>
            <th>Field Name</th>
            <th>Field Value</th>
            <th>Limit</th>
            <th>Columns</th>
            <th>Swimlanes</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="${tableBodyId}">
        </tbody>
      </table>
  </form>
`;

export const fieldRowTemplate = ({
  id,
  fieldId,
  fieldName,
  fieldValue,
  limit,
  columns = [],
  swimlanes = [],
  deleteClassBtn,
}) => `
    <tr data-field-project-row="${id}">
      <td><input type="checkbox" class="checkbox" data-id="${id}"></td>
      <td data-type="field-name" data-value="${fieldId}">${fieldName}</td>
      <td data-type="field-value">${fieldValue}</td>
      <td data-type="field-limit">${limit}</td>
      <td data-type="field-columns">${columns.map(c => c.name).join(', ')}</td>
      <td data-type="field-swimlanes">${swimlanes.map(s => s.name).join(', ')}</td>
      <td><button class="aui-button ${deleteClassBtn}">Delete</button></td>
    </tr>
  `;
