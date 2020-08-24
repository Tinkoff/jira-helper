import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { getChartLinePosition, getChartTics } from './utils';

const SLA_COLOR = 'green';
const CHANGING_SLA_COLOR = '#91cd53';

const getBasicSlaPath = (chartElement, slaPathElementIdentifier, strokeColor) => {
  if (document.getElementById(slaPathElementIdentifier)) {
    return document.getElementById(slaPathElementIdentifier);
  }

  const namespace = chartElement.namespaceURI;

  const slaPath = document.createElementNS(namespace, 'path');
  slaPath.id = slaPathElementIdentifier;
  slaPath.setAttributeNS(null, 'fill', 'none');
  slaPath.setAttributeNS(null, 'stroke', strokeColor || SLA_COLOR);
  slaPath.setAttributeNS(null, 'stroke-width', '3');

  chartElement.querySelector('.layer.mean').appendChild(slaPath);

  return slaPath;
};

const renderSlaLine = (sla, chartElement, changingSlaValue = sla) => {
  const ticsVals = getChartTics(chartElement);

  const meanLine = chartElement.querySelector('.control-chart-mean');
  const [, rightPoint] = meanLine.getAttribute('d').split('L');
  const [lineLength] = rightPoint.split(',');

  const renderSvgLine = ({ value, pathId, strokeColor }) => {
    const slaPath = getBasicSlaPath(chartElement, pathId, strokeColor);
    const slaPosition = getChartLinePosition(ticsVals, value);
    slaPath.setAttributeNS(null, 'd', `M0,${slaPosition} L${lineLength},${slaPosition}`);
  };

  renderSvgLine({
    value: sla,
    pathId: 'jira-helper-sla-path',
    strokeColor: SLA_COLOR,
  });

  const changingSlaPathId = 'jira-helper-sla-path-changing';
  if (sla !== changingSlaValue) {
    renderSvgLine({
      value: changingSlaValue,
      pathId: changingSlaPathId,
      strokeColor: CHANGING_SLA_COLOR,
    });
  } else {
    const el = document.getElementById(changingSlaPathId);
    if (el) el.remove();
  }
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
                <input id="jira-helper-sla-input" type="number" class="text" style="width: 50px; margin-right: 4px;">
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

  const saveButton = document.getElementById('jira-helper-sla-save');

  addEventListener(slaInput, 'input', e => {
    onChange(Number(e.target.value) || 0);

    if (saveButton) {
      saveButton.disabled = false;
    }
  });

  if (canEdit) {
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
    let changingValue = slaValue;

    renderSlaLine(slaValue, chartElement, changingValue);
    renderSlaLegend();
    renderSlaInput(slaValue, canEdit, this.addEventListener, {
      onChange(newValue) {
        changingValue = newValue;
        renderSlaLine(slaValue, chartElement, changingValue);
      },
      onSave: () => {
        slaValue = changingValue;
        this.updateBoardProperty(BOARD_PROPERTIES.SLA_CONFIG, { value: slaValue });
        renderSlaLine(slaValue, chartElement, changingValue);
      },
    });
  }
}
