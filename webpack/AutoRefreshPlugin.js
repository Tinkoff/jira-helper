const WebSocket = require('ws');

class AutoRefreshPlugin {
  constructor(trackedEntries) {
    this.trackedEntries = trackedEntries;

    this.sockets = [];

    const wss = new WebSocket.Server({ port: 8899 });

    wss.on('connection', ws => {
      this.sockets.push(ws);
      const removeSocket = () => {
        this.sockets = this.sockets.filter(socket => socket !== ws);
      };

      ws.on('error', removeSocket);
      ws.on('close', removeSocket);
    });
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap('AutoRefreshPlugin', comp => {
      this.changedFiles = Object.keys(comp.watchFileSystem.watcher.mtimes);
    });

    compiler.hooks.done.tap('AutoRefreshPlugin', stats => {
      const hasCompilationErrors = stats.compilation.errors.some(error => error.name === 'ModuleBuildError');

      const dependencies = new Set();

      this.trackedEntries.forEach(entry => {
        this.collectAllDependencies(
          dependencies,
          stats.compilation.entries.find(e => e.name === entry.name).dependencies
        );

        const sentEvents = {};
        const sendEvent = event => {
          if (sentEvents[event]) return;

          this.sockets.forEach(ws => ws.send(`${event}|${hasCompilationErrors}`));
          sentEvents[event] = true;
        };

        if (this.changedFiles.some(file => dependencies.has(file))) {
          entry.events.forEach(event => {
            if (typeof event === 'string') {
              sendEvent(event);
            } else {
              setTimeout(() => sendEvent(event.name), event.timeout);
            }
          });
        }

        dependencies.clear();
      });
    });
  }

  collectAllDependencies(result, dependencies) {
    if (!dependencies || !dependencies.length) {
      return;
    }

    dependencies.forEach(dep => {
      if (!dep.module) {
        return;
      }

      if (dep.module.resource && !dep.module.resource.includes('node_modules')) {
        result.add(dep.module.resource);
        this.collectAllDependencies(result, dep.module.dependencies);
      }
    });
  }
}

module.exports = AutoRefreshPlugin;
