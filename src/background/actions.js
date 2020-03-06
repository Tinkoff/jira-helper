export const types = {
  SET_CARDS: 'BG_SET_CARDS',
  GET_CARDS: 'BG_GET_CARDS',
  SET_ROLES: 'BG_SET_ROLES',
  GET_ROLES: 'BG_GET_ROLES',

  TAB_URL_CHANGE: 'TAB_URL_CHANGE',
};

export const setCards = ({ issues, epics, specialFields }) => ({
  action: types.SET_CARDS,
  issues,
  epics,
  specialFields,
});
export const getCards = () => ({ action: types.GET_CARDS });

export const setRoles = roles => ({ action: types.SET_ROLES, roles });
export const getRoles = () => ({ action: types.GET_ROLES });
