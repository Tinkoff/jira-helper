export const BOARD_PROPERTIES = {
  WIP_LIMITS_SETTINGS: 'subgroupsJH',
  SWIMLANE_SETTINGS: 'jiraHelperSwimlaneSettings',
  OLD_SWIMLANE_SETTINGS: 'jiraHelperWIPLimits',
  SLA_CONFIG: 'slaConfig3',
  TETRIS_PLANNING: 'settingTetrisPlaning',
  PERSON_LIMITS: 'personLimitsSettings',
  FIELD_LIMITS: 'fieldLimitsJH',
  WIP_LIMITS_CELLS: 'wipLimitCells',
};

export const COLORS = {
  OVER_WIP_LIMITS: '#ff5630',
  ON_THE_LIMIT: '#ffd700',
  BELOW_THE_LIMIT: '#1b855c',
};

// TODO: Группа кнопок на странице с колонками используется в нескольких местах
// Желательно придумать более лучшее решение для использования общих UI-элементов
export const btnGroupIdForColumnsSettingsPage = 'jh-group-of-btns-setting-page';
