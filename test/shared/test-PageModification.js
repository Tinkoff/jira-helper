import { PageModification } from '../../src/shared/PageModification';

describe('MarkFlaggedIssues', () => {
  const pageModification = new PageModification();

  test(' shouldApply ', () => {
    expect(pageModification.shouldApply()).toEqual(true);
  });

  test('.getCssSelectorNotIssueSubTask should return "" when "rapidListConfig.currentStatisticsField.typeId" is not "issueCountExclSubs"', () => {
    const editData = { rapidListConfig: {} };
    expect(pageModification.getCssSelectorNotIssueSubTask(editData)).toEqual('');
  });

  test('.getCssSelectorNotIssueSubTask should return ":not(.ghx-issue-subtask)" when "rapidListConfig.currentStatisticsField.typeId" is "issueCountExclSubs"', () => {
    const editData = { rapidListConfig: { currentStatisticsField: { typeId: 'issueCountExclSubs' } } };
    expect(pageModification.getCssSelectorNotIssueSubTask(editData)).toEqual(':not(.ghx-issue-subtask)');
  });
});
