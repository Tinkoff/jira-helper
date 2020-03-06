import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';

const SLA_COLOR = 'green';

const getSlaLinePosition = (ticksVals, sla) => {
  let prevTick = ticksVals[0];
  for (let i = ticksVals.length - 1; i >= 0; i--) {
    if (ticksVals[i].value <= sla) {
      prevTick = ticksVals[i];
      break;
    }
  }

  let nextTick = ticksVals[ticksVals.length - 1];
  for (let i = 0; i < ticksVals.length; i++) {
    if (ticksVals[i].value >= sla) {
      nextTick = ticksVals[i];
      break;
    }
  }

  if (!prevTick || !nextTick) return 0;

  const percentDistance =
    nextTick.value === prevTick.value ? 0 : (sla - prevTick.value) / (nextTick.value - prevTick.value);
  return prevTick.position - percentDistance * (prevTick.position - nextTick.position);
};

const getSlaPath = chartElement => {
  if (document.getElementById('jira-helper-sla-path')) {
    return document.getElementById('jira-helper-sla-path');
  }

  const namespace = chartElement.namespaceURI;

  const slaPath = document.createElementNS(namespace, 'path');
  slaPath.id = 'jira-helper-sla-path';
  slaPath.setAttributeNS(null, 'fill', 'none');
  slaPath.setAttributeNS(null, 'stroke', SLA_COLOR);
  slaPath.setAttributeNS(null, 'stroke-width', '3');

  chartElement.querySelector('.layer.mean').appendChild(slaPath);

  return slaPath;
};

const renderSlaLine = (sla, chartElement) => {
  const ticks = [...chartElement.querySelectorAll('.tick')].filter(
    elem => elem.lastChild.attributes.y.value === '0' && elem.lastChild.textContent
  );
  const ticsVals = ticks.map(elem => {
    const [, transform] = elem.attributes.transform.value.split(',');
    return {
      position: Number(transform.slice(0, -1)),
      value: Number(elem.lastChild.textContent),
    };
  });

  const meanLine = chartElement.querySelector('.control-chart-mean');
  const [, rightPoint] = meanLine.getAttribute('d').split('L');
  const [lineLength] = rightPoint.split(',');

  const slaPath = getSlaPath(chartElement);
  const slaPosition = getSlaLinePosition(ticsVals, sla);
  slaPath.setAttributeNS(null, 'd', `M0,${slaPosition} L${lineLength},${slaPosition}`);
};

const renderSlaLegend = () => {
  const legendList = document.querySelector('.ghx-legend-column:last-child');

  const slaLegend = document.createElement('ul');
  slaLegend.classList.add('ghx-legend-item');
  slaLegend.innerHTML = `
  <li class="ghx-legend-key"><svg height="100%" width="100%"><path d="M0,20L20,0" stroke="${SLA_COLOR}" stroke-width="3" fill="none"/></svg></li>
  <li class="ghx-legend-value">SLA</li>
  `;

  legendList.appendChild(slaLegend);
};

const renderSlaInput = (initialValue, canEdit, addEventListener, { onChange, onSave }) => {
  const optionsColumn = document.querySelector('#ghx-chart-options-view');
  const slaInputWrapper = document.createElement('div');
  slaInputWrapper.innerHTML = `
    <form class="aui">
        <div class="field-group">
            <label>SLA</label>
            <div style="display: flex">
                <input ${
                  !canEdit ? 'disabled' : ''
                } id="jira-helper-sla-input" type="number" class="text" style="width: 50px; margin-right: 4px;">
                ${
                  canEdit
                    ? '<input type="submit" class="aui-button aui-button-primary" id="jira-helper-sla-save" value="Save" disabled>'
                    : ''
                }
            </div>
        </div>
    </form>
  `;

  optionsColumn.appendChild(slaInputWrapper);

  const slaInput = document.getElementById('jira-helper-sla-input');
  slaInput.value = initialValue;

  if (canEdit) {
    const saveButton = document.getElementById('jira-helper-sla-save');
    addEventListener(slaInput, 'input', e => {
      onChange(Number(e.target.value) || 0);
      saveButton.disabled = false;
    });
    addEventListener(saveButton, 'click', () => {
      onSave();
      saveButton.disabled = true;
    });
  }
};

export default class extends PageModification {
  shouldApply() {
    return this.getSearchParam('chart') === 'controlChart';
  }

  getModificationId() {
    return `add-sla-${this.getSearchParam('rapidView')}`;
  }

  waitForLoading() {
    return this.waitForElement('#control-chart svg');
  }

  loadData() {
    return Promise.all([this.getBoardProperty(BOARD_PROPERTIES.SLA_CONFIG), this.getBoardEditData()]);
  }

  async apply([{ value = 0 } = {}, { canEdit }], chartElement) {
    await this.waitForElement('.tick', chartElement);

    let slaValue = Number(value);

    renderSlaLine(slaValue, chartElement);
    renderSlaLegend();
    renderSlaInput(slaValue, canEdit, this.addEventListener, {
      onChange(newValue) {
        slaValue = newValue;
        renderSlaLine(slaValue, chartElement);
      },
      onSave: () => this.updateBoardProperty(BOARD_PROPERTIES.SLA_CONFIG, { value: slaValue }),
    });
  }
}
