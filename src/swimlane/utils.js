export const mergeSwimlaneSettings = ([settings, oldLimits]) => {
  if (settings) return settings;

  const convertedSettings = {};

  if (oldLimits) {
    Object.keys(oldLimits).forEach(swimlaneId => {
      convertedSettings[swimlaneId] = {
        limit: oldLimits[swimlaneId],
      };
    });
  }

  return convertedSettings;
};
