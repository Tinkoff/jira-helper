import runModifications from '../../src/shared/runModifications';

describe('RunModifications should', () => {
  test('applyModifications', () => {
    /**
     * Need to mock window object
     * @see ../../src/shared/ExtensionApiService.js:3
     */
    expect(() => runModifications({ ALL: '' })).toThrowError();
  });
});
