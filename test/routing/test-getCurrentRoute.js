import each from 'jest-each';
import { getCurrentRoute } from '../../src/routing';

describe('Routing should', () => {
  each([
    ['https://www.example.com/RapidView.jspa', 'SETTINGS'],
    ['https://www.example.com/RapidBoard.jspa', 'BOARD'],
    ['https://www.example.com/RapidBoard.jspa?config=1', 'SETTINGS'],
    ['https://www.example.com/RapidBoard.jspa?view=reporting', 'REPORTS'],
    ['https://www.example.com/browse', 'ISSUE'],
    ['https://www.example.com/browse?jql=1', 'SEARCH'],
    ['https://www.example.com/issues/', 'SEARCH'],
    ['https://www.example.com/', null],
  ]).it('when "%s" is given then return "%s"', (url, route) => {
    delete window.location;
    window.location = new URL(url);
    expect(getCurrentRoute()).toEqual(route);
  });
});
