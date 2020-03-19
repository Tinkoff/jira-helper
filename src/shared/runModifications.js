/* eslint-disable no-continue */
import { getCurrentRoute, onUrlChange, Routes } from '../routing';

const currentModifications = new Map();
let route;

const applyModification = async (Modification, modificationInstance) => {
  const id = modificationInstance.getModificationId();
  currentModifications.set(Modification, { id, instance: modificationInstance });

  await modificationInstance.preloadData();

  const loadingPromise = modificationInstance.waitForLoading();
  const dataPromise = modificationInstance.loadData();

  const [loadingElement, data] = await Promise.all([loadingPromise, dataPromise]);

  // if (loadingElement.dataset[Modification.name]) return;
  // loadingElement.dataset[Modification.name] = true;

  const styles = modificationInstance.appendStyles();
  if (styles) document.body.insertAdjacentHTML('beforeend', styles);
  modificationInstance.apply(data, loadingElement);
};

const applyModifications = modificationsMap => {
  const currentRoute = getCurrentRoute();

  if (route !== currentRoute) {
    route = currentRoute;
  }

  const modificationsForRoute = new Set(modificationsMap[Routes.ALL].concat(modificationsMap[route] || []));
  for (const Modification of currentModifications.keys()) {
    if (!modificationsForRoute.has(Modification)) {
      currentModifications.get(Modification).instance.clear();
      currentModifications.delete(Modification);
    }
  }

  for (const Modification of modificationsForRoute) {
    const modificationInstance = new Modification();

    Promise.resolve(modificationInstance.shouldApply()).then(shouldApply => {
      if (currentModifications.has(Modification)) {
        const { id: currentModificationId, instance: currentInstance } = currentModifications.get(Modification);

        if (!shouldApply) {
          currentInstance.clear();
          currentModifications.delete(Modification);
          return;
        }

        if (currentModificationId !== modificationInstance.getModificationId()) {
          currentInstance.clear();
          currentModifications.delete(Modification);
        } else {
          return;
        }
      }

      if (shouldApply) {
        applyModification(Modification, modificationInstance);
      }
    });
  }
};

export default modificationsMap => {
  applyModifications(modificationsMap);
  onUrlChange(() => applyModifications(modificationsMap));
};
