window.onload = () =>
  (function(global) {
    const { document } = global;

    function printPdf(url) {
      const iframe = document.createElement('iframe');
      iframe.className = 'pdfIframe';
      document.body.appendChild(iframe);
      iframe.style.display = 'none';
      iframe.onload = function() {
        setTimeout(function() {
          iframe.focus();
          iframe.contentWindow.print();
          URL.revokeObjectURL(url);
        }, 1);
      };
      iframe.src = url;
    }

    function initBtnPrint() {
      const printBtn = document.querySelector('#print_template_btn');
      printBtn.onclick = () => {
        printPdf('/options_static/jira_stickers_template.pdf');
      };
    }

    initBtnPrint();
  })(window);
