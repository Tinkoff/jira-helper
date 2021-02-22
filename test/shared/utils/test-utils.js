import { getRandomString } from '../../../src/shared/utils';

describe('Utils should', () => {
  test('return random number by given length', () => {
    const randomString1 = getRandomString(10);
    const randomString2 = getRandomString(10);

    expect(randomString1.length).toBeLessThanOrEqual(10);
    expect(randomString2.length).toBeLessThanOrEqual(10);
    expect(randomString1).not.toEqual(randomString2);
  });
});
