export function findGroupByColumnId(columnId, groupsFromAPI) {
  let result = {};

  Object.entries(groupsFromAPI || {}).forEach(([group, data]) => {
    if (data.columns && data.columns.indexOf(columnId) > -1) {
      result = {
        name: group,
        value: data.columns,
      };
    }
  });

  return result;
}

const colors = [
  '#70cde0',
  '#d3d1ff',
  '#f9aa9b',
  '#90bfb7',
  '#fff9b8',
  '#c3ceed',
  '#76ad75',
  '#94bcdb',
  '#dfca98',
  '#c8afd4',
  '#fddcea',
  '#aacde1',
  '#fedfb6',
  '#ce9ef1',
  '#ec8ba0',
  '#74af84',
  '#ffc1b8',
  '#a391bd',
  '#dd9294',
  '#69c58f',
  '#40aca4',
  '#f192b4',
];

const strLengthForGenerating = 5;

export const generateColorByFirstChars = str => {
  const integerCharCodes = str
    .replace(/[^а-яёА-ЯЁA-Za-z0-9]/gi, '') // exclude all symbols except а-яёА-ЯЁА-Za-z0-9
    .split('')
    .slice(0, strLengthForGenerating)
    .map(char => char.charCodeAt(0));

  const sumOfIntegers = integerCharCodes.reduce((sum, integer) => sum + integer, 0);

  const generatedColorIndex = sumOfIntegers % colors.length;

  return colors[generatedColorIndex];
};
