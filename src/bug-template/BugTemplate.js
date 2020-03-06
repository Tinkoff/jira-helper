import each from '@tinkoff/utils/array/each';
import { PageModification } from '../shared/PageModification';
import style from './styles.css';

import defaultIframeTemplate from './template.html';

const defaultTextareaTemplate = defaultIframeTemplate.replace(/<br \/>/g, '\n');
const parentDivSelectorPopap = '#create-issue-dialog .jira-wikifield';
const parentDivSelector = '#issue-create .jira-wikifield';
const buttonAddCls = style.buttonJiraAddTemplateForBug;
const buttonSaveCls = style.buttonJiraSaveTemplateForBug;
const localStorageTemplateTextarea = 'jira_helper_textarea_bug_template';
const textToHtml = text => text.replace(/\n/g, '<br />');

export default class extends PageModification {
  getModificationId() {
    return 'bug-template';
  }

  apply() {
    this.applyTemplate();
    this.onDOMChange('body', this.applyTemplate);
  }

  applyTemplate = () => {
    if (!document.querySelector(parentDivSelector) && !document.querySelector(parentDivSelectorPopap)) return;

    each(el => el.remove(), document.querySelectorAll(`.${buttonAddCls}, .${buttonSaveCls}`));

    // setTimeout нужен, для того чтобы кнопка не пропадала при обновлении элементов формы
    this.setTimeout(() => {
      this.makeButton({
        text: '&#9998;',
        title: 'Add template',
        handleClick: this.addTemplate,
        cls: buttonAddCls,
      });
      this.makeButton({
        text: '&#128190;',
        title: 'Save template',
        handleClick: this.saveTemplate,
        cls: buttonSaveCls,
      });
    }, 100);
  };

  makeButton({ text, title, handleClick, cls }) {
    const divDescription = document.querySelector(parentDivSelector) || document.querySelector(parentDivSelectorPopap);

    const btn = this.insertHTML(
      divDescription,
      'beforeend',
      `<button class="${cls}" title="${title}">${text}</button>`
    );
    this.addEventListener(btn, 'click', handleClick);
  }

  addTemplate = () => {
    const iframe =
      document.querySelector(`${parentDivSelector} iframe`) ||
      document.querySelector(`${parentDivSelectorPopap} iframe`);
    const textarea =
      document.querySelector(`${parentDivSelector} textarea#description`) ||
      document.querySelector(`${parentDivSelectorPopap} textarea#description`);

    const textTextarea = localStorage.getItem(localStorageTemplateTextarea);
    const templateIframe = textTextarea ? textToHtml(textTextarea) : defaultIframeTemplate;
    const templateTextarea = textTextarea || defaultTextareaTemplate;

    if (iframe) {
      const text = iframe.contentDocument.getElementById('tinymce').firstChild;
      text.innerHTML = text.innerHTML.length > 0 ? `${text.innerHTML}<br />${templateIframe}` : templateIframe;
    }

    if (textarea) {
      textarea.value = textarea.value.length > 0 ? `${textarea.value}\n${templateTextarea}` : templateTextarea;
    }
  };

  saveTemplate = () => {
    const textarea =
      document.querySelector(`${parentDivSelector} textarea#description`) ||
      document.querySelector(`${parentDivSelectorPopap} textarea#description`);

    if (!window.confirm(`Are you sure you want to save the text "${textarea.value}" in the template?`)) {
      return;
    }

    localStorage.setItem(localStorageTemplateTextarea, textarea.value);
  };
}
