import { Routes } from './routing';
import { isJira } from './shared/utils';
import AddSlaLine from './charts/AddSlaLine';
import runModifications from './shared/runModifications';
import SwimlaneStats from './swimlane/SwimlaneStats';
import SwimlaneLimits from './swimlane/SwimlaneLimits';
import SwimlaneSettings from './swimlane/SwimlaneSettings';
import WIPLimitsSettings from './column-limits/WIPLimitsSettings';
import WIPLimits from './column-limits/WIPLimits';
import TetrisPlanningButton from './tetris-planning/TetrisPlanningButton';
import TetrisPlanning from './tetris-planning/TetrisPlanning';
import BugTemplate from './bug-template/BugTemplate';
import MarkFlaggedIssues from './issue/MarkFlaggedIssues';
import PrintCards from './printcards/PrintCards';
import { setUpBlurSensitiveOnPage, initBlurSensitive } from './blur-for-sensitive/blurSensitive';
import PersonLimitsSettings from './person-limits/PersonLimitsSettings';

const domLoaded = () =>
  new Promise(resolve => {
    if (document.readyState === 'interactive' || document.readyState === 'complete') return resolve();
    window.addEventListener('DOMContentLoaded', resolve);
  });

async function start() {
  if (!isJira) return;

  await domLoaded();

  setUpBlurSensitiveOnPage();

  const modificationsMap = {
    [Routes.BOARD]: [WIPLimits, SwimlaneStats, SwimlaneLimits, TetrisPlanning, MarkFlaggedIssues],
    [Routes.SETTINGS]: [SwimlaneSettings, WIPLimitsSettings, PersonLimitsSettings, TetrisPlanningButton],
    [Routes.ISSUE]: [MarkFlaggedIssues],
    [Routes.SEARCH]: [MarkFlaggedIssues, PrintCards],
    [Routes.REPORTS]: [AddSlaLine],
    [Routes.ALL]: [BugTemplate],
  };

  runModifications(modificationsMap);
}

initBlurSensitive();
start();
