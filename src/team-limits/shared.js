export const limitsKey = {
  encode: (projectKey, teamName) => `${projectKey}_${teamName}`,
  decode: limitKey => {
    const [projectKey, ...others] = limitKey.split('_');
    const teamName = others.join('_');
    return {
      projectKey,
      teamName,
    };
  },
};
