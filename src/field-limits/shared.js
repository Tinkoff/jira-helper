import indexBy from '@tinkoff/utils/array/indexBy';
import pluck from '@tinkoff/utils/array/pluck';

export const limitsKey = {
  encode: (projectKey, fieldValue, fieldId) => `${projectKey}@@@${fieldValue}@@@${fieldId}`,
  decode: limitKey => {
    const [projectKey, fieldValue, fieldId] = limitKey.split('@@@');
    return {
      projectKey,
      fieldValue,
      fieldId,
    };
  },
};

export const normalize = (byField, obj) => ({
  byId: indexBy(x => x[byField], obj),
  allIds: pluck(byField, obj),
});
