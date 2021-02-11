import each from 'jest-each';
import { getSettingsTab } from '../../src/routing';

describe('Routing should', () => {
  delete window.location;

  each([
    ['tab=settings-tab', 'settings-tab'],
    ['config=config-tab', 'config-tab'],
  ]).it('when "%s" is given then return "%s"', (search, tab) => {
    window.location = { search };
    expect.assertions(1);
    return expect(getSettingsTab()).resolves.toEqual(tab);
  });
});
