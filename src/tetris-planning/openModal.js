function jiraHelperTetrisPlanningModal() {
  const dialog = window.AJS.dialog2('#static-dialog');
  dialog.show();

  document.querySelector('#dialog-cancel').addEventListener('click', () => {
    dialog.hide();
    document.querySelector('#static-dialog').remove();
  });
}

jiraHelperTetrisPlanningModal();
