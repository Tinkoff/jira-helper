import personLimitsModal from './personLimitsModal.html';
import { extensionApiService } from '../shared/ExtensionApiService';
import { getUser } from '../shared/jiraApi';
import { BOARD_PROPERTIES } from '../shared/constants';

const renderRow = ({ id, person, limit, columns, swimlanes }, deleteLimit, onEdit) => {
  document.querySelector('#persons-limit-body').insertAdjacentHTML(
    'beforeend',
    `
    <tr id="row-${id}" class="person-row">
      <td><input type="checkbox" class="checkbox select-user-chb" data-id="${id}"></td>
      <td>${person.displayName}</td>
      <td>${limit}</td>
      <td>${columns.map(c => c.name).join(', ')}</td>
      <td>${swimlanes.map(s => s.name).join(', ')}</td>
      <td><div><button class="aui-button" id="delete-${id}">Delete</button></div><hr><div><button class="aui-button" id="edit-${id}">Edit</button></div></td>
    </tr>
  `
  );

  document.querySelector(`#delete-${id}`).addEventListener('click', async () => {
    await deleteLimit(id);
    document.querySelector(`#row-${id}`).remove();
  });

  document.querySelector(`#edit-${id}`).addEventListener('click', async () => {
    await onEdit(id);
  });
};

const renderAllRow = ({ modal, personLimits, deleteLimit, onEdit }) => {
  modal.querySelectorAll('.person-row').forEach(row => row.remove());
  personLimits.limits.forEach(personLimit => renderRow(personLimit, deleteLimit, onEdit));
};

export const openPersonLimitsModal = async (modification, boardData, personLimits) => {
  const deleteLimit = async id => {
    personLimits.limits = personLimits.limits.filter(limit => limit.id !== id);
    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);
  };

  const onEdit = async id => {
    const personalWIPLimit = personLimits.limits.find(limit => limit.id === id);

    document.querySelector('#limit').value = personalWIPLimit.limit;
    document.querySelector('#person-name').value = personalWIPLimit.person.name;

    const columns = document.querySelector('#column-select');
    const selectedColumnsIds = personalWIPLimit.columns.map(c => c.id);

    columns.options.forEach(option => {
      option.selected = selectedColumnsIds.indexOf(option.value) > -1;
    });

    const swimlanes = document.querySelector('#swimlanes-select');
    const selectedSwimlanesIds = personalWIPLimit.swimlanes.map(c => c.id);

    swimlanes.options.forEach(option => {
      option.selected = selectedSwimlanesIds.indexOf(option.value) > -1;
    });

    const editBtn = document.querySelector('#person-limit-edit-button');
    editBtn.disabled = false;
    editBtn.setAttribute('person-id', id);
    document.querySelector(`#row-${id}`).style.background = '#ffd989c2';

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);
  };

  const modal = modification.insertHTML(document.body, 'beforeend', personLimitsModal);

  const columnsSelect = modal.querySelector('.columns select');
  boardData.rapidListConfig.mappedColumns.forEach(({ id, name }) => {
    const option = document.createElement('option');
    option.text = name;
    option.value = id;
    option.selected = true;
    columnsSelect.appendChild(option);
  });

  const swimlanesSelect = modal.querySelector('.swimlanes select');
  boardData.swimlanesConfig.swimlanes.forEach(({ id, name }) => {
    const option = document.createElement('option');
    option.text = name;
    option.value = id;
    option.selected = true;
    swimlanesSelect.appendChild(option);
  });

  const getDataForm = () => {
    const name = modal.querySelector('#person-name').value;
    const limit = modal.querySelector('#limit').valueAsNumber;
    const columns = [...columnsSelect.selectedOptions].map(option => ({ id: option.value, name: option.text }));
    const swimlanes = [...swimlanesSelect.selectedOptions].map(option => ({ id: option.value, name: option.text }));

    return {
      person: {
        name,
      },
      limit,
      columns,
      swimlanes,
    };
  };

  modal.querySelector('#person-limit-edit-button').addEventListener('click', async e => {
    e.preventDefault();
    const personId = parseInt(e.target.getAttribute('person-id'), 10);
    e.target.disabled = true;

    if (!personId) return;

    const index = personLimits.limits.findIndex(pl => pl.id === personId);

    if (index === -1) return;

    const data = getDataForm();

    personLimits.limits[index] = {
      ...personLimits.limits[index],
      ...data,
      person: {
        ...data.person,
        ...personLimits.limits[index].person,
      },
    };

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);

    renderAllRow({ modal, personLimits, deleteLimit, onEdit });
  });

  modal.querySelector('#person-limit-save-button').addEventListener('click', async e => {
    e.preventDefault();

    const data = getDataForm();
    const fullPerson = await getUser(data.person.name);

    const personLimit = {
      id: Date.now(),
      person: {
        name: fullPerson.name ?? fullPerson.displayName,
        displayName: fullPerson.displayName,
        self: fullPerson.self,
        avatar: fullPerson.avatarUrls['32x32'],
      },
      limit: data.limit,
      columns: data.columns,
      swimlanes: data.swimlanes,
    };

    personLimits.limits.push(personLimit);

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);

    renderRow(personLimit, deleteLimit, onEdit);
  });

  modal.querySelector('#apply-columns').addEventListener('click', async e => {
    e.preventDefault();

    const columns = [...columnsSelect.selectedOptions].map(option => ({ id: option.value, name: option.text }));
    const persons = [...modal.querySelectorAll('.select-user-chb:checked')].map(elem => Number(elem.dataset.id));

    personLimits.limits = personLimits.limits.map(limit =>
      persons.includes(limit.id)
        ? {
            ...limit,
            columns,
          }
        : limit
    );

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);
    renderAllRow({ modal, personLimits, deleteLimit, onEdit });
  });

  modal.querySelector('#apply-swimlanes').addEventListener('click', async e => {
    e.preventDefault();

    const swimlanes = [...swimlanesSelect.selectedOptions].map(option => ({ id: option.value, name: option.text }));
    const persons = [...modal.querySelectorAll('.select-user-chb:checked')].map(elem => Number(elem.dataset.id));

    personLimits.limits = personLimits.limits.map(limit =>
      persons.includes(limit.id)
        ? {
            ...limit,
            swimlanes,
          }
        : limit
    );

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);

    modal.querySelectorAll('.person-row').forEach(row => row.remove());
    personLimits.limits.forEach(personLimit => renderRow(personLimit, deleteLimit, onEdit));
  });

  personLimits.limits.forEach(personLimit => renderRow(personLimit, deleteLimit, onEdit));

  //  window.AJS is not available here
  const script = document.createElement('script');
  script.setAttribute('src', extensionApiService.getUrl('nativeModalScript.js'));
  document.body.appendChild(script);
};
