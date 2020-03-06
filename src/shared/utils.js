export function toPx(...args) {
  const sum = args.reduce((acc, i) => acc + i, 0);
  return `${sum}px`;
}

export const getRandomString = length =>
  Math.random()
    .toString(36)
    .substring(length);

export const isJira = document.body.id === 'jira';

export const waitForElement = (selector, container = document) => {
  let intervalId;
  const promise = new Promise(resolve => {
    intervalId = setInterval(() => {
      if (container.querySelector(selector)) {
        clearInterval(intervalId);
        resolve(container.querySelector(selector));
      }
    }, 100);
  });

  return {
    promise,
    cancel: () => clearInterval(intervalId),
  };
};

export const formatTemplateForInserting = str => {
  return `'${str.replace(/\r?\n?/g, '').trim()}'`;
};
