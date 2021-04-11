export const colorPickerTooltipTemplate = ({
  tooltipClass,
  id,
  colorPickerId,
  colorPickerResultId,
  okBtnId,
  closeBtnId,
  btnWrpClass,
  colorPickerResultClass,
}) => `
  <div id="${id}" class="${tooltipClass}">
    <div class="${btnWrpClass}">
      <div class="${colorPickerResultClass}" id="${colorPickerResultId}"></div>
      <div>
        <button id="${okBtnId}" class="aui-button aui-button-primary" type="button">Ok</button>
        <button id="${closeBtnId}" class="aui-button" type="button">Close</button>
      </div>
    </div>
    <div id="${colorPickerId}"></div>
  </div>`;
