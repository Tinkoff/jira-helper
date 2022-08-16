import { Routes } from './routing';
import { isJira } from './shared/utils';
import AddSlaLine from './charts/AddSlaLine';
import AddChartGrid from './charts/AddChartGrid';
import runModifications from './shared/runModifications';
import SwimlaneStats from './swimlane/SwimlaneStats';
import SwimlaneLimits from './swimlane/SwimlaneLimits';
import SwimlaneSettingsPopup from './swimlane/SwimlaneSettingsPopup';
import WIPLimitsSettingsPage from './column-limits/SettingsPage';
import WIPLimitsBoardPage from './column-limits/BoardPage';
import TetrisPlanningButton from './tetris-planning/TetrisPlanningButton';
import TetrisPlanning from './tetris-planning/TetrisPlanning';
import BugTemplate from './bug-template/BugTemplate';
import MarkFlaggedIssues from './issue/MarkFlaggedIssues';
import FieldLimitsSettingsPage from './field-limits/SettingsPage';
import FieldLimitsBoardPage from './field-limits/BoardPage';
import PrintCards from './printcards/PrintCards';
import { setUpBlurSensitiveOnPage, initBlurSensitive } from './blur-for-sensitive/blurSensitive';
import PersonLimitsSettings from './person-limits/PersonLimitsSettings';
import PersonLimits from './person-limits/PersonLimits';
import LeadTimeOnBoard from './lead-time-on-board/LeadTimeOnBoard';

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
    [Routes.BOARD]: [
      WIPLimitsBoardPage,
      SwimlaneStats,
      SwimlaneLimits,
      TetrisPlanning,
      MarkFlaggedIssues,
      PersonLimits,
      FieldLimitsBoardPage,
      LeadTimeOnBoard,
    ],
    [Routes.SETTINGS]: [
      SwimlaneSettingsPopup,
      WIPLimitsSettingsPage,
      PersonLimitsSettings,
      TetrisPlanningButton,
      FieldLimitsSettingsPage,
    ],
    [Routes.ISSUE]: [MarkFlaggedIssues],
    [Routes.SEARCH]: [MarkFlaggedIssues, PrintCards],
    [Routes.REPORTS]: [AddSlaLine, AddChartGrid],
    [Routes.ALL]: [BugTemplate],
  };

  runModifications(modificationsMap);
}

initBlurSensitive();
start();
