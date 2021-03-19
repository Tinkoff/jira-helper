import indexBy from '@tinkoff/utils/array/indexBy';
import pluck from '@tinkoff/utils/array/pluck';

export const limitsKey = {
  encode: (fieldValue, fieldId) => `${fieldValue}@@@${fieldId}`,
  decode: limitKey => {
    const [fieldValue, fieldId] = limitKey.split('@@@');
    return {
      fieldValue,
      fieldId,
    };
  },
};

export const normalize = (byField, obj) => ({
  byId: indexBy(x => x[byField], obj),
  allIds: pluck(byField, obj),
});
