/* eslint-disable */
import path from '@tinkoff/utils/object/path';
import isArray from '@tinkoff/utils/is/array';
import isEqual from '@tinkoff/utils/is/equal';
import mapObj from '@tinkoff/utils/object/map';
import compose from '@tinkoff/utils/function/compose';
import test from '@tinkoff/utils/string/test';
import keys from '@tinkoff/utils/object/keys';
import defaultEpicStyles from '../cardsRender/styleColorEpic';
import { getAllFields } from '../../shared/jiraApi';

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
function dayDifference(date1, date2) {
  // https://levelup.gitconnected.com/find-difference-between-two-dates-in-javascript-117be3e73caf
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
  return diffDays;
}

export class SpecialFields {
  constructor({ extensionService }) {
    this.extensionService = extensionService;

    this.EPIC_KEY_STORAGE_POSTFIX = '__epic_key';
  }

  /*
   * Запрашивает ключ в локальном хранилище, если нет или прошло больше 2-х дней со дня обновления ключа,
   * то снова ищет ключ в JIRA (через запрос всех полей)
   *  */
  findSpecialFields() {
    return this.fetchSpecialFields().catch(() =>
      this.updateSpecialFieldsThroughJira().then(() => this.fetchSpecialFields())
    );
  }

  fetchSpecialFields(host) {
    return this.fetchSpecialFieldsFromStorage(host).then(fields => this.normalizeSpecialFields(fields));
  }

  // REQUEST FOR EPIC KEY
  updateSpecialFieldsThroughJira() {
    const epicStyles = this.getEpicStyles();

    const rulesForSpecialFields = {
      epic: compose(isEqual('com.pyxis.greenhopper.jira:gh-epic-link'), path(['schema', 'custom'])),
      epicColor: compose(isEqual('com.pyxis.greenhopper.jira:gh-epic-color'), path(['schema', 'custom'])),
      epicName: compose(isEqual('com.pyxis.greenhopper.jira:gh-epic-label'), path(['schema', 'custom'])),
      storyPoints: compose(test(/story points/gim), path(['name'])),
    };

    const ruleForRolesField = compose(isEqual('user'), path(['schema', 'type']));

    return getAllFields().then(fields => {
      if (!isArray(fields)) return Promise.reject('Invalid data');

      const requiredFieldsKeys = keys(rulesForSpecialFields);
      const matchedFields = mapObj(() => null, rulesForSpecialFields);

      const roleFields = [];

      fieldsLoop: for (
        let i = 0, fieldsLength = fields.length;
        i < fieldsLength || keys(matchedFields).length !== requiredFieldsKeys.length;
        i++
      ) {
        // matching rule for role customfields
        if (ruleForRolesField(fields[i])) {
          roleFields.push(fields[i]);
          continue;
        }

        // matching rules for specific customfields
        for (let j = 0, requiredFieldsLength = requiredFieldsKeys.length; j < requiredFieldsLength; j++) {
          const key = requiredFieldsKeys[j];
          const validator = rulesForSpecialFields[key];

          if (validator(fields[i])) {
            matchedFields[key] = fields[i].id;
            continue fieldsLoop;
          }
        }
      }

      return this.updateSpecialFieldsInStorage({
        ...matchedFields,
        epicStyles,
        roleFields,
      });
    });
  }
  // -------------------------

  // STORAGE MANIPULATING EPIC KEY
  updateSpecialFieldsInStorage(specialFieldsObj, options = { fieldsWasSettedByUser: false }) {
    const syncDate = new Date().toISOString();
    const { host } = window.location;

    return this.extensionService.updateStorageValue(
      `${host}${this.EPIC_KEY_STORAGE_POSTFIX}`,
      JSON.stringify({
        specialFields: specialFieldsObj,
        syncDate,
        fieldsWasSettedByUser: options.fieldsWasSettedByUser,
      })
    );
  }

  fetchSpecialFieldsFromStorage(jiraHost) {
    const host = jiraHost || window.location.host;

    return this.extensionService.fetchStorageValueByKey(`${host}${this.EPIC_KEY_STORAGE_POSTFIX}`).then(JSON.parse);
  }

  normalizeSpecialFields(epicField) {
    if (epicField.fieldsWasSettedByUser) {
      return Promise.resolve(epicField.specialFields);
    }

    const currentDate = new Date();
    const fieldKeyDate = new Date(epicField.syncDate);

    const isOutdatedSpecialFields = dayDifference(currentDate, fieldKeyDate) > 2;

    if (isOutdatedSpecialFields) return Promise.reject('Outdated special Fields');
    return Promise.resolve(epicField.specialFields);
  }
  // -------------------------

  // SEARCHING FOR COLORS
  getEpicStyles() {
    const result = {
      /* 'ghx-color-<N>': {
        backgroundColor: <computedStyle>,
        borderColor: <computedStyle>,
        color: <computedStyle>
      } */
    };

    const elementForCalculations = document.createElement('div');
    elementForCalculations.style.display = 'none';
    document.body.appendChild(elementForCalculations);

    const colorsMaxRange = 9;
    const colorsClassPrefix = 'ghx-label-';

    for (let i = 0, length = colorsMaxRange; i <= length; i++) {
      const currentClassName = `${colorsClassPrefix}${i}`;

      elementForCalculations.classList.add(currentClassName);
      const { backgroundColor, color, borderColor } = window.getComputedStyle(elementForCalculations);
      const {
        backgroundColor: mainJiraBgColor,
        color: mainJiraColor,
        borderColor: mainJiraBorderColor,
      } = defaultEpicStyles[currentClassName];

      result[currentClassName] = {
        backgroundColor: backgroundColor || mainJiraBgColor,
        color: color || mainJiraColor,
        borderColor: borderColor || mainJiraBorderColor,
      };

      elementForCalculations.classList.remove(currentClassName);
    }

    return result;
  }
  // -----------------------
}
