export class TableRangeWipLimit {
  constructor(props) {
    this.tableDOM = props.dom;
    this.ids = {
      tbody: 'WipLimitCells_tbody',
      table: 'WipLimitCells_table',
    };
    if (Array.isArray(props.data)) {
      this.data = props.data;
    } else {
      this.data = [];
    }
    this.getNameLabel = props.handleGetNameLabel;
  }

  clear() {
    while (this?.tbody?.firstChild) {
      this.tbody.removeChild(this.tbody.firstChild);
    }
  }

  setData(data) {
    if (this.data === data) {
      return;
    }
    if (!Array.isArray(data)) {
      return;
    }

    this.data = data;
    this.refresh();
  }

  refresh() {
    this.clear();
    this.render();
  }

  setDiv(div) {
    if (this.tableDOM === div) {
      return;
    }
    this.tableDOM = div;
    this.clear();
    this.createTable();
  }

  render() {
    if (!Array.isArray(this.data)) {
      return;
    }
    this.data.forEach(element => {
      const id = element.name;
      const tr = document.createElement('tr');
      tr.id = id;

      let td = document.createElement('td');
      const inputCheckBox = document.createElement('input');
      inputCheckBox.type = 'checkbox';
      inputCheckBox.id = `WIP_${id}_limitChoose`;
      inputCheckBox.checked = element.choose;
      inputCheckBox.addEventListener('input', () => {
        const { checked } = document.getElementById(`WIP_${id}_limitChoose`);
        this.changeField(element.name, 'choose', checked);
      });

      td.appendChild(inputCheckBox);
      tr.appendChild(td);

      // Name
      td = document.createElement('td');
      let input = document.createElement('input');
      input.value = id;
      input.id = `Input_${id}`;
      input.type = 'text';
      input.addEventListener('blur', () => {
        const { value } = document.getElementById(`Input_${id}`);
        this.changeField(element.name, 'name', value);
      });

      td.appendChild(input);
      const span = document.createElement('span');
      span.insertAdjacentHTML(
        'beforeend',
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="WipLimitHover" viewBox="0 0 16 16"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/> </svg>'
      );
      span.addEventListener('click', () => {
        this.deleteRange(id);
      });
      td.appendChild(span);
      tr.appendChild(td);

      // WIPLIMIT
      td = document.createElement('td');
      input = document.createElement('input');
      input.id = `Input_${id}_WIPLIMIT`;
      input.type = 'number';
      input.style.maxWidth = '75px';
      input.value = element.wipLimit;
      input.addEventListener('blur', () => {
        const { value } = document.getElementById(`Input_${id}_WIPLIMIT`);
        this.changeField(id, 'wipLimit', value);
      });
      td.appendChild(input);
      tr.appendChild(td);
      td = document.createElement('td');
      input = document.createElement('input');
      input.id = `Input_${id}_Disable`;
      input.type = 'checkbox';
      input.checked = element.disable;
      input.addEventListener('input', () => {
        const { checked } = document.getElementById(`Input_${id}_Disable`);
        this.changeField(id, 'disable', checked);
      });
      td.appendChild(input);
      tr.appendChild(td);

      // Cells
      td = document.createElement('td');
      if (Array.isArray(element.cells)) {
        element.cells.forEach(elem => {
          const badge = document.createElement('span');
          badge.innerText = this.getNameLabel(elem.swimline, elem.column);
          badge.style.minHeight = '21px';
          badge.style.margin = '2px';
          badge.classList.add('aui-badge');
          if (elem.showBadge) {
            badge.insertAdjacentHTML(
              'beforeend',
              '<span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="WipLimitHover" viewBox="0 0 16 16"> <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/> <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/> </svg></span>'
            );
          }
          const trashTag = document.createElement('span');
          trashTag.classList.add('WipLimitHover');
          trashTag.insertAdjacentHTML(
            'beforeend',
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="WipLimitHover" viewBox="0 0 16 16"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/> </svg>'
          );
          trashTag.style.margin = '1px';
          trashTag.addEventListener('click', () => {
            this.deleteCells(id, elem.swimline, elem.column);
          });
          badge.appendChild(trashTag);
          td.appendChild(badge);
        });
        tr.appendChild(td);
      }
      this.tbody.appendChild(tr);
    });
  }

  deleteRange(name) {
    this.data = this.data.filter(elem => elem.name !== name);
    this.refresh();
  }

  changeField(name, field, value) {
    for (const range of this.data) {
      if (range.name === name) {
        range[field] = value;
      }
    }
    this.refresh();
  }

  addRange(name) {
    if (name === '') {
      alert('Enter range name');
      return;
    }

    const searchDouble = this.data.filter(element => element.name === name);
    if (searchDouble.length > 0) {
      alert('Enter unique range name');
      return;
    }
    this.data.push({
      name,
      wipLimit: 0,
      cells: [],
    });
    this.refresh();
  }

  deleteCells(id, swimline, column) {
    this.data.forEach(range => {
      if (range.name === id) {
        const newCells = range.cells.filter(
          elem => !(elem.swimline === swimline.toString() && elem.column === column.toString())
        );
        range.cells = newCells;
      }
    });
    this.refresh();
  }

  getData() {
    const newData = [...this.data];
    for (const range of newData) {
      range.wipLimit = parseInt(range.wipLimit, 10);
      range.choose = undefined;
    }
    return newData;
  }

  addCells(cell) {
    this.data.forEach(elem => {
      if (elem.choose) {
        let unique = true;
        for (const cellData of elem.cells) {
          if (cell.swimline === cellData.swimline && cell.column === cellData.column) {
            unique = false;
          }
        }
        if (unique) {
          elem.cells.push({ ...cell });
        }
      }
    });
    this.refresh();
  }

  createTable() {
    const form = document.createElement('form');
    form.classList.add('aui');

    const table = document.createElement('table');
    table.id = this.ids.table;
    table.classList.add('aui');
    table.classList.add('aui-table-list');
    const thead = document.createElement('thead');
    thead.insertAdjacentHTML(
      'beforeend',
      `<tr>
            <th style="width:2%"></th>
            <th style="width:30%" >Range name</th>
            <th style="width:10%">WIP limit</th>
            <th style="width:3%">Disable</th>
            <th style="width:50%">Cells (swimeline/column)</th>
          </tr>`
    );
    const tbody = document.createElement('tbody');
    thead.id = this.ids.tbody;
    table.appendChild(thead);
    table.appendChild(tbody);
    form.appendChild(table);
    this.tableDOM.appendChild(form);

    this.tbody = tbody;
  }
}
