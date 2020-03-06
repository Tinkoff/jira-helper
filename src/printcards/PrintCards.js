import { PageModification } from '../shared/PageModification';
import { SpecialFields } from './services/specialFields';
import { PopupService } from './services/popupService';
import { PrintCardButton } from './services/printButton';
import { extensionApiService as extensionService } from '../shared/ExtensionApiService';

export default class extends PageModification {
  getModificationId() {
    return 'print-cards';
  }

  waitForLoading() {
    return this.waitForElement('#jql');
  }

  apply() {
    const specialFieldsService = new SpecialFields({ extensionService });
    const popupService = new PopupService({ extensionService, specialFieldsService });

    const printCardButton = new PrintCardButton({ extensionService, popupService });
    printCardButton.render();
  }
}
