import { PageModification } from '../shared/PageModification';
import { BOARD_PROPERTIES } from '../shared/constants';
import { getChartLinePosition, getChartTics } from './utils';

const SLA_COLOR = 'green';
const CHANGING_SLA_COLOR = '#91cd53';

const MIN_ISSUE_CLUSTER_COUNT = 2;
const MIN_ISSUE_CLUSTER_RADIUS = 6;
const ISSUE_CLUSTER_RADIUS_FACTOR = 9;

const SLA_QUERY_PARAMETER = 'sla';

const SLA_INPUT_FIELD_ID = 'jira-helper-sla-input';

const log10 = x => Math.log(x) / Math.log(10);

const getBasicSlaRect = (chartElement, slaPathElementIdentifier, strokeColor) => {
  const rectId = `${slaPathElementIdentifier}-rect`;
  if (document.getElementById(rectId)) {
    return document.getElementById(rectId);
  }

  const namespace = chartElement.namespaceURI;

  const slaRect = document.createElementNS(namespace, 'rect');
  slaRect.id = rectId;
  slaRect.setAttributeNS(null, 'fill', strokeColor || SLA_COLOR);
  slaRect.setAttributeNS(null, 'stroke', strokeColor || SLA_COLOR);
  slaRect.setAttributeNS(null, 'fill-opacity', '0.15');
  slaRect.setAttributeNS(null, 'stroke-width', '1');
  slaRect.setAttributeNS(null, 'x', '0');
  slaRect.setAttributeNS(null, 'y', '0');
  slaRect.setAttributeNS(null, 'width', '0');
  slaRect.setAttributeNS(null, 'height', '0');

  chartElement.querySelector('.layer.mean').appendChild(slaRect);

  return slaRect;
};

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

const getSlaLabel = (chartElement, slaPathElementIdentifier, fillColor) => {
  const slaLabelElementIdentifier = `${slaPathElementIdentifier}-label`;
  if (document.getElementById(slaLabelElementIdentifier)) {
    return document.getElementById(slaLabelElementIdentifier);
  }

  const namespace = chartElement.namespaceURI;

  const slaLabelText = document.createElementNS(namespace, 'text');
  slaLabelText.id = slaLabelElementIdentifier;
  slaLabelText.setAttributeNS(null, 'style', `fill: ${fillColor || SLA_COLOR};`);

  ['-1.25em', '1.25em'].forEach(dy => {
    const tspan = document.createElementNS(namespace, 'tspan');
    tspan.setAttributeNS(null, 'x', '10');
    tspan.setAttributeNS(null, 'dy', dy);
    tspan.appendChild(document.createTextNode(''));
    slaLabelText.appendChild(tspan);
  });

  chartElement.querySelector('.layer.mean').appendChild(slaLabelText);

  return slaLabelText;
};

const calculateSlaPercentile = ({ slaPosition, issues, issuesCluster }) => {
  const singleIssuesUnderSlaCount = issues.filter(issue => issue.attributes.cy.value >= slaPosition).length;

  const issuesInClustersUnderSlaCount = issuesCluster
    .filter(issue => issue.attributes.cy.value >= slaPosition)
    .map(cluster =>
      Math.round(
        Math.exp(
          (((cluster.attributes.r.value - MIN_ISSUE_CLUSTER_RADIUS) *
            (MIN_ISSUE_CLUSTER_COUNT - log10(MIN_ISSUE_CLUSTER_COUNT))) /
            ISSUE_CLUSTER_RADIUS_FACTOR +
            log10(MIN_ISSUE_CLUSTER_COUNT)) *
            Math.log(10)
        )
      )
    )
    .reduce((a, b) => a + b, 0);

  const totalIssuesCount = document.querySelector('.js-chart-snapshot-issue-count').innerText.replace(',', '');

  const percentUnderSla = Math.round(
    ((singleIssuesUnderSlaCount + issuesInClustersUnderSlaCount) / totalIssuesCount) * 100
  );

  return percentUnderSla;
};

const renderSlaPercentageLabel = ({ chartElement, value, slaPercentile, slaPosition, pathId, strokeColor }) => {
  const slaLabel = getSlaLabel(chartElement, pathId, strokeColor);

  slaLabel.firstChild.innerHTML = `${value}d`;
  slaLabel.lastChild.innerHTML = `${slaPercentile}%`;
  slaLabel.setAttributeNS(null, 'y', slaPosition + 12);
};

const findRangeForSlaRectPosition = ({ slaPercentile, ticsVals, issues, issuesCluster }) => {
  const maxDay = ticsVals[ticsVals.length - 1].value;
  const slaPosition = [0, 0];
  const step = maxDay < 50 ? 0.5 : 1;
  let pIn = 0;
  let day = ticsVals[0].value;

  let soughtPercentile = 0;
  let valPosition = 0;

  while (pIn < 2 && day <= maxDay) {
    valPosition = getChartLinePosition(ticsVals, day);
    soughtPercentile = calculateSlaPercentile({ slaPosition: valPosition, issues, issuesCluster });

    day += step; // for case if user set fractional number to input
    if (soughtPercentile === slaPercentile) {
      slaPosition[pIn] = valPosition;

      if (pIn === 0) {
        pIn += 1;
        slaPosition[pIn] = valPosition; // if one step on the one Percentile
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    if (pIn === 1 && soughtPercentile !== slaPercentile) {
      // exit from top board
      pIn += 1;
      break;
    }
  }

  slaPosition[0] = Number.isNaN(slaPosition[0]) ? 0 : slaPosition[0];
  slaPosition[1] = Number.isNaN(slaPosition[1]) ? 0 : slaPosition[1];

  return slaPosition;
};

const renderSlaLine = (sla, chartElement, changingSlaValue = sla) => {
  const ticsVals = getChartTics(chartElement);

  const issues = [...chartElement.querySelectorAll('g.layer.issues circle.issue')];
  const issuesCluster = [...chartElement.querySelectorAll('g.layer.issue-clusters circle.cluster')];

  const meanLine = chartElement.querySelector('.control-chart-mean');
  const [, rightPoint] = meanLine.getAttribute('d').split('L');
  const [lineLength] = rightPoint.split(',');

  const renderSvgLine = ({ value, pathId, strokeColor }) => {
    const slaPosition = getChartLinePosition(ticsVals, value);
    if (Number.isNaN(slaPosition)) return;

    const slaPercentile = calculateSlaPercentile({ slaPosition, issues, issuesCluster });
    const [minSlaPosition, maxSlaPosition] = findRangeForSlaRectPosition({
      slaPercentile,
      ticsVals,
      issues,
      issuesCluster,
    });

    const slaPath = getBasicSlaPath(chartElement, pathId, strokeColor);
    slaPath.setAttributeNS(null, 'd', `M0,${slaPosition} L${lineLength},${slaPosition}`);

    const slaRect = getBasicSlaRect(chartElement, pathId, strokeColor);
    const slaRectHeight = minSlaPosition - maxSlaPosition;
    slaRect.setAttributeNS(null, 'y', maxSlaPosition);
    slaRect.setAttributeNS(null, 'width', lineLength);
    slaRect.setAttributeNS(null, 'height', slaRectHeight);

    renderSlaPercentageLabel({ chartElement, value, slaPercentile, slaPosition, pathId, strokeColor });
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
    const path = document.getElementById(changingSlaPathId);
    if (path) path.remove();

    const text = document.getElementById(`${changingSlaPathId}-label`);
    if (text) text.remove();
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
                <input id="${SLA_INPUT_FIELD_ID}" type="number" class="text" style="width: 50px; margin-right: 4px;">
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

  const slaInput = document.getElementById(SLA_INPUT_FIELD_ID);
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
    return `add-sla-${this.getBoardId()}`;
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

    window.onpopstate = () => {
      const slaQueryParam = this.getSearchParam(SLA_QUERY_PARAMETER);
      if (slaQueryParam !== null) {
        document.getElementById(SLA_INPUT_FIELD_ID).value = slaQueryParam;
        renderSlaLine(slaValue, chartElement, Number(slaQueryParam));
      }
    };

    const slaQueryParam = this.getSearchParam(SLA_QUERY_PARAMETER);
    let changingValue = slaQueryParam !== null ? Number(slaQueryParam) : slaValue;

    renderSlaLine(slaValue, chartElement, changingValue);
    renderSlaLegend();
    renderSlaInput(changingValue, canEdit, this.addEventListener, {
      onChange(newValue) {
        changingValue = newValue;
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set(SLA_QUERY_PARAMETER, newValue);
        window.history.pushState(window.history.state, null, `?${queryParams.toString()}`);
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
