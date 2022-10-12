// settings
export const settingsJiraSLADOM = {
  RenderWhenPageLoaded: 'SLARenderWhenPageLoaded',
  Select: 'SLASelectCustomField',
  ClearData: 'SLAClearData',
  ShowOnAllCard: 'SLAShowOnAllCard',
  TableId: 'SLATable',
};

export const emptyData = {
  showOnAllCards: false,
  renderWhenPageLoaded: false,
  SLA: null,
};

export const settingsEditBtnTemplate = btnId => `<div style="margin-top: 1rem">
            <button id="${btnId}" class="aui-button" type="button">Edit SLA</button>
        </div>`;

export const getCollumnsTable = swimlines => {
  let columns = '';
  swimlines.forEach(element => {
    columns += `<th id='${element}'>${element.name}</th>`;
  });
  return columns;
};

export const getInputShowSLAIndicatorOnAllCards = isChecked => {
  const checked = isChecked ? 'checked' : '';
  return `Show SLA indicator on all card <input id="${settingsJiraSLADOM.ShowOnAllCard}" type="checkbox" ${checked} /><br>`;
};

export const selectDate = (fields, selectedKey) => {
  const options = [];
  for (const filed of fields) {
    let selected = '';
    if (filed.id === selectedKey) {
      selected = 'selected';
    }
    options.push(`<option value=${filed.id} ${selected}>${filed.name}</option>`);
  }

  const innerHTML = `
  <form class="aui">
    <select id="${settingsJiraSLADOM.Select}">
        <option>-</option>
        ${options.join('')}
    </select>
</form>`;
  return innerHTML;
};

export const getInputShowSLARRenderWhenPageLoaded = isCheckedBool => {
  const checked = isCheckedBool ? 'checked' : '';
  return `Show SLA indicator when page will be load <input id="${settingsJiraSLADOM.RenderWhenPageLoaded}" type="checkbox" ${checked} /><br>`;
};

export const getIssueTypesRow = (types, swimlines, setting) => {
  let rows = '';

  types.forEach(issusType => {
    rows += `<tr id='IS_${issusType.id}' ><td><img src='${issusType.iconUrl}'width="16" height="16"/>${issusType.name}</td>`;
    swimlines.forEach(element => {
      let value = '';
      if (setting && setting[issusType.id]) {
        const swimlaneValue = setting[issusType.id];
        if (swimlaneValue) {
          value = swimlaneValue[element.id];
        }
      }
      rows += `<td id='SL_${element.id}'><input class="text" type="number" value="${value}" onChange=""/></th>`;
    });
    rows += '</tr>';
  });

  return rows;
};

export const settingsPopupTableTemplate = (tableBody, columns) => `
   <form class="aui">
     <table id="${settingsJiraSLADOM.TableId}">
        <thead>
          <tr>
            <th>issue types</th>
            ${columns}
          </tr>
        </thead>
        <tbody>
          ${tableBody}
        </tbody>
      </table>
      
  </form>
`;

export const settingsPopupTableRowTemplate = ({ id, name, limit, isIgnored, rowClass }) =>
  `<tr class="${rowClass}" data-swimlane-id="${id}">
      <td>${name}</td>
      <td>
        <input class="text" type="number" value="${limit}"/>
      </td>
      <td>
        <input type="checkbox" ${isIgnored ? 'checked' : ''} /> 
      </td>
  </tr>`;

export const ClearDataButton = () => {
  return `<button id="${settingsJiraSLADOM.ClearData}" class="aui-button" resolved="">Delete settings</button>`;
};
