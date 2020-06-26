import personLimitsModal from './personLimitsModal.html';
import { extensionApiService } from '../shared/ExtensionApiService';
import { getUser } from '../shared/jiraApi';
import { BOARD_PROPERTIES } from '../shared/constants';

const renderRow = ({ id, person, limit, columns, swimlanes }, deleteLimit) => {
  document.querySelector('#persons-limit-body').insertAdjacentHTML(
    'beforeend',
    `
    <tr id="row-${id}">
      <td>${person.displayName}</td>
      <td>${limit}</td>
      <td>${columns.join(', ')}</td>
      <td>${swimlanes.join(', ')}</td>
      <td><button class="aui-button" id="delete-${id}">Delete</button></td>
    </tr>
  `
  );

  document.querySelector(`#delete-${id}`).addEventListener('click', async () => {
    await deleteLimit(id);
    document.querySelector(`#row-${id}`).remove();
  });
};

export const openPersonLimitsModal = async (modification, boardData, personLimits) => {
  const deleteLimit = async id => {
    personLimits.limits = personLimits.limits.filter(limit => limit.id !== id);
    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);
  };

  const modal = modification.insertHTML(document.body, 'beforeend', personLimitsModal);

  const columnsSelect = modal.querySelector('.columns select');
  boardData.rapidListConfig.mappedColumns.forEach(({ name }) => {
    const option = document.createElement('option');
    option.text = name;
    option.value = name;
    option.selected = true;
    columnsSelect.appendChild(option);
  });

  const swimlanesSelect = modal.querySelector('.swimlanes select');
  boardData.swimlanesConfig.swimlanes.forEach(({ name }) => {
    const option = document.createElement('option');
    option.text = name;
    option.value = name;
    option.selected = true;
    swimlanesSelect.appendChild(option);
  });

  modal.querySelector('#person-limit-save-button').addEventListener('click', async e => {
    e.preventDefault();

    const person = modal.querySelector('#person-name').value;
    const limit = modal.querySelector('#limit').valueAsNumber;
    const columns = [...columnsSelect.selectedOptions].map(option => option.value);
    const swimlanes = [...swimlanesSelect.selectedOptions].map(option => option.value);

    const fullPerson = await getUser(person);

    const personLimit = {
      id: Date.now(),
      person: {
        name: fullPerson.name ?? fullPerson.displayName,
        displayName: fullPerson.displayName,
        self: fullPerson.self,
        avatar: fullPerson.avatarUrls['16x16'],
      },
      limit,
      columns,
      swimlanes,
    };

    personLimits.limits.push(personLimit);

    await modification.updateBoardProperty(BOARD_PROPERTIES.PERSON_LIMITS, personLimits);

    renderRow(personLimit, deleteLimit);
  });

  personLimits.limits.forEach(personLimit => renderRow(personLimit, deleteLimit));

  //  window.AJS is not available here
  const script = document.createElement('script');
  script.setAttribute('src', extensionApiService.getUrl('nativeModalScript.js'));
  document.body.appendChild(script);
};
