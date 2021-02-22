import { getUser } from '../../../src/shared/jiraApi';

jest.mock('@tinkoff/request-core', () =>
  jest.fn().mockImplementation(() => request => {
    expect(request.url).toEqual('api/2/user/search');
    expect(request.query.username || request.query.query).toEqual('John');
    expect(request.type).toEqual('json');
    return Promise.resolve([{ name: 'John' }, { name: 'Mike' }]);
  })
);

describe('JiraApi should', () => {
  test('return User by name', () => {
    expect.assertions(2 * 3 + 1);
    return expect(getUser('John')).resolves.toEqual({ name: 'John' });
  });
});
