/**
 * Отслеживание изменений в указанном скрипте, см AutoRefreshPlugin
 * */
export default (eventType, cb) => {
  let ws;
  let reconnectTimeout = 1;
  let reconnectScheduled;

  const onMessage = message => {
    const [event, hasCompilationErrors] = message.data.split('|');
    if (eventType === event) {
      if (hasCompilationErrors === 'true') {
        console.error('Скрипт не перезагружен из-за ошибки компиляции'); // eslint-disable-line
      } else {
        cb();
      }
    }
  };

  const onOpen = () => {
    reconnectTimeout = 1;

    if (reconnectScheduled) {
      clearTimeout(reconnectScheduled);
      reconnectScheduled = null;
    }
  };

  const reconnect = () => {
    if (reconnectScheduled) {
      return;
    }

    if (reconnectTimeout < 15) {
      reconnectTimeout += 1;
    }

    reconnectScheduled = setTimeout(() => {
      reconnectScheduled = null;
      // eslint-disable-next-line no-use-before-define
      connectToWs();
    }, reconnectTimeout * 1000);
  };

  const connectToWs = () => {
    if (ws) {
      ws.removeEventListener('message', onMessage);
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', reconnect);
      ws.removeEventListener('close', reconnect);

      ws.close();
    }

    ws = new WebSocket('ws://localhost:8899');
    ws.addEventListener('message', onMessage);
    ws.addEventListener('open', onOpen);
    ws.addEventListener('error', reconnect);
    ws.addEventListener('close', reconnect);
  };

  connectToWs();
};
