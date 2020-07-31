/* eslint-disable max-classes-per-file */
import Draggable from 'gsap/Draggable';
import { TweenLite, gsap } from 'gsap';
import { PageModification } from '../shared/PageModification';

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value; // eslint-disable-line
}

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
    })(3, 10),
  };

  static usedIdentifiers = {
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
    resizer.id = `${ResizableDraggableGrid.usedIdentifiers.gridDragResizer}`;
    this.gridDraggable.appendChild(resizer);

    const rect1 = this.gridDraggable.getBoundingClientRect();
    TweenLite.set(resizer, { x: rect1.width, y: rect1.height });

    const rect2 = resizer.getBoundingClientRect();
    const offset = {
      x1: rect2.left - rect1.right,
      y1: rect2.top - rect1.bottom,
      x2: rect2.right - rect1.right,
      y2: rect2.bottom - rect1.bottom,
    };

    const onResize = (x, y) => {
      TweenLite.set(this.gridDraggable, {
        width: x + 0,
        height: y + 0,
      });
    };

    Draggable.create(this.gridDraggable, {
      bounds: this.gridContainer,
      autoScroll: 1,
    });

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
      liveSnap: {
        x(x) {
          return clamp(x, -offset.x1, x + offset.x2);
        },
        y(y) {
          return clamp(y, -offset.y1, y + offset.y2);
        },
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
                <input type="checkbox" style="margin-right: 8px" checked id="${
                  ResizableDraggableGrid.usedIdentifiers.gridFormCheckbox
                }" alt="Toggle Grid Visibility"/>
                <select class="select" id="${ResizableDraggableGrid.usedIdentifiers.gridFormSelect}">
                    ${fibonacci.map((arr, i) => `<option value="fibonacci_${i}">Fibonacci - ${arr.join()}</option>`)}
                    ${linear.map((arr, i) => `<option value="linear_${i}">Linear - ${arr.join()}</option>`)}
                </select>
            </div>
        </div>
    </form>
  `;
    optionsColumn.appendChild(gridOptionsForm);

    const gridSelect = document.getElementById(ResizableDraggableGrid.usedIdentifiers.gridFormSelect);
    gridSelect.value = 'linear_0';
    this.addEventListener(gridSelect, 'change', e => {
      this.handleChangeOption(e.target.value);
    });

    const gridCheckBox = document.getElementById(ResizableDraggableGrid.usedIdentifiers.gridFormCheckbox);
    this.addEventListener(gridCheckBox, 'change', e => {
      if (e.target.checked) {
        this.gridDraggable.style.display = 'block';
      } else {
        this.gridDraggable.style.display = 'none';
      }
    });
  }

  renderLines(arrOfNumbers) {
    const oldLines = document.getElementById(ResizableDraggableGrid.usedIdentifiers.gridLines);
    if (oldLines) oldLines.remove();

    const linesStops = arrOfNumbers;
    const maxLineHeight = Math.max(...linesStops);
    const getPositionOfLine = num => num / (maxLineHeight / 100);

    const lines = document.createElement('div');
    lines.id = ResizableDraggableGrid.usedIdentifiers.gridLines;
    lines.innerHTML = linesStops
      .map(number => {
        return `<div style="bottom: ${getPositionOfLine(number)}%"></div>`;
      })
      .join('');
    this.gridDraggable.append(lines);
  }

  renderContainer() {
    const layerGrid = document.querySelector(ResizableDraggableGrid.jiraSelectors.layerGrid);
    const controlChart = document.querySelector(ResizableDraggableGrid.jiraSelectors.controlChart);
    const layerGridBoundingClientRect = layerGrid.getBoundingClientRect();

    const gridContainer = document.createElement('div');
    gridContainer.id = ResizableDraggableGrid.usedIdentifiers.gridContainer;

    const gridDraggable = document.createElement('div');
    gridDraggable.id = ResizableDraggableGrid.usedIdentifiers.gridDraggable;

    const styles = document.createElement('style');
    styles.innerHTML = `
      #${ResizableDraggableGrid.usedIdentifiers.gridContainer} {
        width: ${layerGridBoundingClientRect.width}px;
        height: ${layerGridBoundingClientRect.height}px;
        top: 11px;
        left: 62px;
        position: absolute;
      }

      #${ResizableDraggableGrid.usedIdentifiers.gridDragResizer} {
        position: absolute;
        width: 0px;
        height: 0px;
        margin-top: -17px;
        margin-left: -17px;
        border-style: solid;
        border-width: 0 0 16px 16px;
        border-color: transparent transparent #aaa transparent;
        cursor: nw-resize !important;
        pointer-events: all !important;
      }

      #${ResizableDraggableGrid.usedIdentifiers.gridDraggable} {
        position: absolute;
        border: 1px solid #aaa;
        top: 0;
        left: 0;
        width: 300px;
        height: 125px;
        pointer-events: all !important;
        transform: translate3d(0px, 0px, 0px);
      }

      #${ResizableDraggableGrid.usedIdentifiers.gridDraggable} svg {
        width: 100%; height: 100%;
      }

      #${ResizableDraggableGrid.usedIdentifiers.gridLines} > div {
        position: absolute;
        bottom: 0;
        height: 1px;
        background: gray;
        width: 100%;
        pointer-events: none;
      }

      #${ResizableDraggableGrid.usedIdentifiers.gridLines} {
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
    this.renderGrid();
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
    return `add-sla-${this.getSearchParam('rapidView')}`;
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
