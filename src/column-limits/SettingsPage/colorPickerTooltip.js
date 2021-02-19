/* eslint-disable no-underscore-dangle */
import ColorPicker from 'simple-color-picker';
import noop from '@tinkoff/utils/function/noop';
import { colorPickerTooltipTemplate } from './htmlTemplates';
import styles from './styles.css';

/*
 * Usage:
 * 1. Run html() which returns html-string and append to required block
 * 2. Run init()
 * */
export class ColorPickerTooltip {
  static ids = {
    colorPickerTooltip: 'jh-wip-limits-color-picker-tooltip',
    colorPicker: 'jh-color-picker-inner-tooltip',
    colorPickerResult: 'jh-color-picker-inner-tooltip-result',
    okBtn: 'jh-color-picker-ok-btn',
    closeBtn: 'jh-color-picker-cancel-btn',
  };

  constructor({ onClose = noop, onOk = (/* hexStr */) => {} }) {
    this.colorPicker = new ColorPicker({
      color: '#FF0000',
      background: '#454545',
      width: 200,
      height: 200,
    });
    this.onClose = onClose;
    this.onOk = onOk;
  }

  html() {
    return colorPickerTooltipTemplate({
      tooltipClass: styles.tooltip,
      id: ColorPickerTooltip.ids.colorPickerTooltip,
      colorPickerId: ColorPickerTooltip.ids.colorPicker,
      colorPickerResultId: ColorPickerTooltip.ids.colorPickerResult,
      btnWrpClass: styles.tooltipButtonsWrp,
      colorPickerResultClass: styles.tooltipResult,
      okBtnId: ColorPickerTooltip.ids.okBtn,
      closeBtnId: ColorPickerTooltip.ids.closeBtn,
    });
  }

  init() {
    this.tooltip = document.getElementById(ColorPickerTooltip.ids.colorPickerTooltip);
    this.pickerResultElem = document.getElementById(ColorPickerTooltip.ids.colorPickerResult);

    this.colorPicker.appendTo(`#${ColorPickerTooltip.ids.colorPicker}`);
    this.colorPicker.onChange(hexColorString => {
      this.pickerResultElem.style.background = hexColorString;
    });

    this._initBtnHandlers();
  }

  get isVisible() {
    return this.tooltip.style.visibility !== 'hidden';
  }

  hideTooltip() {
    if (this.isVisible) {
      this.tooltip.style.visibility = 'hidden';
      this.colorPickerGroupId = null;
    }
    this.onClose();
  }

  showTooltip(position) {
    if (!this.tooltip) return;

    this.tooltip.style.visibility = 'visible';
    this.tooltip.style.top = `${position}px`;
  }

  _save = () => {
    this.onOk(this.colorPicker.getColor());
    this.hideTooltip();
  };

  _cancel = () => {
    this.hideTooltip();
  };

  _initBtnHandlers() {
    const okBtn = document.getElementById(ColorPickerTooltip.ids.okBtn);
    const closeBtn = document.getElementById(ColorPickerTooltip.ids.closeBtn);

    okBtn.addEventListener('click', this._save);
    closeBtn.addEventListener('click', this._cancel);
  }
}
