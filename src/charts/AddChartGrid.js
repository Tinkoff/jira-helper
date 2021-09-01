/* eslint-disable max-classes-per-file */
import Draggable from 'gsap/Draggable';
import { TweenLite, gsap } from 'gsap';
import { PageModification } from '../shared/PageModification';
import { getChartLinePosition, getChartTics, getChartValueByPosition } from './utils';

class ResizableDraggableGrid {
  static gridOptions = {
    fibonacci: [
      [1, 2, 3, 5],
      [1, 2, 3, 5, 8],
      [1, 2, 3, 5, 8, 13],
    ],
    linear: (function s(min, max) {
      const result = [];
      for (let i = min; i <= max; i++) {
        result[i - min] = [];

        for (let j = 1; j <= i; j++) {
          result[i - min][j - 1] = j;
        }
      }
      return result;
    })(2, 10),
  };

  static ids = {
    gridContainer: 'jira-helper-grid-container',
    gridDraggable: 'jira-helper-grid-draggable',
    gridDragResizer: 'jira-helper-grid-drag-resizer',
    gridFormSelect: 'jira-helper-grid-select',
    gridFormCheckbox: 'jira-helper-grid-checkbox-visibility',
    gridLines: 'jira-helper-grid-lines-wrp',
  };

  static jiraSelectors = {
    layerGrid: '.layer.grid',
    controlChart: '#control-chart',
    chartOptionsColumn: '#ghx-chart-options-view',
  };

  constructor(chartElement, pageModificationEventListener) {
    this.chartElement = chartElement;
    this.addEventListener = pageModificationEventListener;

    this.gridSelectedOption = 'linear_0'; // type-in-grid-options_index
    this.gridContainer = null;
    this.gridDraggable = null;
  }

  handleChangeOption = val => {
    this.gridSelectedOption = val;
    this.renderLines(this.numberArrayBySelectedOption);
  };

  addManipulationAbilities() {
    const resizer = document.createElement('div');
    resizer.id = `${ResizableDraggableGrid.ids.gridDragResizer}`;
    this.gridDraggable.appendChild(resizer);

    const rect1 = this.gridDraggable.getBoundingClientRect();
    TweenLite.set(resizer, { x: rect1.width, y: 0 });

    const onResize = (x, y) => {
      TweenLite.set(this.gridDraggable, {
        width: x + 0,
        height: rect1.height - y,
      });
      this.renderLines(this.numberArrayBySelectedOption);
    };

    Draggable.create(resizer, {
      bounds: this.gridContainer,
      autoScroll: 1,
      onPress(e) {
        e.stopPropagation();
      },
      onDrag() {
        // "this" points to special gsap object event
        onResize(this.x, this.y);
      },
    });
  }

  renderOptionsForm() {
    const optionsColumn = document.querySelector(ResizableDraggableGrid.jiraSelectors.chartOptionsColumn);

    const { fibonacci, linear } = ResizableDraggableGrid.gridOptions;
    const gridOptionsForm = document.createElement('div');
    gridOptionsForm.innerHTML = `
    <form class="aui">
        <div class="field-group">
            <label>Grid</label>
            <div style="display: flex; align-items: center">
                <input type="checkbox" style="margin-right: 8px" id="${
                  ResizableDraggableGrid.ids.gridFormCheckbox
                }" alt="Toggle Grid Visibility"/>
                <select class="select" id="${ResizableDraggableGrid.ids.gridFormSelect}">
                    ${fibonacci.map((arr, i) => `<option value="fibonacci_${i}">Fibonacci - ${arr.join()}</option>`)}
                    ${linear.map((arr, i) => `<option value="linear_${i}">Linear - ${arr.join()}</option>`)}
                </select>
            </div>
        </div>
    </form>
  `;
    optionsColumn.appendChild(gridOptionsForm);

    const gridSelect = document.getElementById(ResizableDraggableGrid.ids.gridFormSelect);
    gridSelect.value = 'linear_0';
    this.addEventListener(gridSelect, 'change', e => this.handleChangeOption(e.target.value));

    const gridCheckBox = document.getElementById(ResizableDraggableGrid.ids.gridFormCheckbox);
    this.addEventListener(gridCheckBox, 'change', e => {
      if (this.gridContainer) {
        this.gridContainer.style.display = e.target.checked ? 'block' : 'none';
        if (e.target.checked) this.renderLines(this.numberArrayBySelectedOption);
      } else {
        this.renderGrid();
      }
    });
  }

  renderLines(linesStops) {
    const oldLines = document.getElementById(ResizableDraggableGrid.ids.gridLines);
    if (oldLines) oldLines.remove();

    const ticsVals = getChartTics(this.chartElement);

    const maxNumber = Math.max(...linesStops);
    const chartHeight = this.gridContainer.getBoundingClientRect().height;

    const gridHeight = this.gridDraggable.getBoundingClientRect().height;
    const gridTopPosition = chartHeight - gridHeight;
    const gridTopValue = getChartValueByPosition(ticsVals, gridTopPosition);

    const getLineValue = num => (num / maxNumber) * gridTopValue;
    const getPositionOfLine = num => chartHeight - getChartLinePosition(ticsVals, getLineValue(num));

    const lines = document.createElement('div');
    lines.id = ResizableDraggableGrid.ids.gridLines;
    lines.innerHTML = linesStops
      .map(
        number =>
          `<div style="bottom: ${getPositionOfLine(number)}px">${number} SP, ${Math.round(getLineValue(number) * 10) /
            10} days</div>`
      )
      .join('');
    this.gridDraggable.append(lines);
  }

  renderContainer() {
    const layerGrid = document.querySelector(ResizableDraggableGrid.jiraSelectors.layerGrid);
    const controlChart = document.querySelector(ResizableDraggableGrid.jiraSelectors.controlChart);
    const layerGridBoundingClientRect = layerGrid.getBoundingClientRect();

    const gridContainer = document.createElement('div');
    gridContainer.id = ResizableDraggableGrid.ids.gridContainer;

    const gridDraggable = document.createElement('div');
    gridDraggable.id = ResizableDraggableGrid.ids.gridDraggable;

    const styles = document.createElement('style');
    styles.innerHTML = `
      #${ResizableDraggableGrid.ids.gridContainer} {
        width: ${layerGridBoundingClientRect.width}px;
        height: ${layerGridBoundingClientRect.height}px;
        top: 11px;
        left: 62px;
        position: absolute;
      }

      #${ResizableDraggableGrid.ids.gridDragResizer} {
        position: absolute;
        bottom: 110px;
        width: 0px;
        height: 0px;
        margin-left: -17px;
        border-style: solid;
        border-width: 16px 0 0 16px;
        border-color: #aaa transparent transparent transparent;
        cursor: ne-resize !important;
        pointer-events: all !important;
      }

      #${ResizableDraggableGrid.ids.gridDraggable} {
        position: absolute;
        border: 1px solid #aaa;
        bottom: 0;
        left: 0;
        width: 300px;
        height: 125px;
        pointer-events: all !important;
        transform: translate3d(0px, 0px, 0px);
      }

      #${ResizableDraggableGrid.ids.gridDraggable} svg {
        width: 100%; height: 100%;
      }

      #${ResizableDraggableGrid.ids.gridLines} > div {
        position: absolute;
        bottom: 0;
        height: 1px;
        background: gray;
        width: 100%;
        pointer-events: none;
      }

      #${ResizableDraggableGrid.ids.gridLines} > div:last-child {
        background: none;
      }

      #${ResizableDraggableGrid.ids.gridLines} {
        width: 100%;
        height:100%;
        pointer-events: none;
      }
`;

    gridContainer.append(gridDraggable, styles);
    controlChart.append(gridContainer);

    this.gridContainer = gridContainer;
    this.gridDraggable = gridDraggable;
  }

  renderGrid() {
    this.renderContainer();
    this.addManipulationAbilities();

    this.renderLines(this.numberArrayBySelectedOption);
  }

  init() {
    gsap.registerPlugin(Draggable);
    this.renderOptionsForm();
  }

  get numberArrayBySelectedOption() {
    const [type, index] = this.gridSelectedOption.split('_');
    return ResizableDraggableGrid.gridOptions[type][index];
  }
}

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
    return Promise.all([]);
  }

  async apply(_, chartElement) {
    await this.waitForElement('.tick', this.chartElement);

    const grid = new ResizableDraggableGrid(chartElement, this.addEventListener);
    grid.init();
  }
}
