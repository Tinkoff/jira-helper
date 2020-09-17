[![Build Status](https://travis-ci.com/TinkoffCreditSystems/jira-helper.svg?branch=master)](https://travis-ci.com/TinkoffCreditSystems/jira-helper)

## “jira-helper” features

_version 2.6.0_

- [Chart Bar - showed count issues in columns for every swimlane on a board](./src/README.md#swimline-chart-bar)
- [showed a red-flag on the issue panel](./src/README.md#flag-on-issue-panel)
- [Tetris-planning for the Scrum backlog](./src/README.md#tetris-planning-for-scrum)
- [Printing stickers 76x76мм on a usual laser printer by the set many issues of JIRA](./src/README.md#printing-many-stickers)
- [WIP-limit for several columns](./src/README.md#wip-limits-for-several-columns)
- [WIP-limit for Swimlane](./src/README.md#wip-limits-for-swimlanes)
- [Personal WIP-limit](./src/README.md#wip-limit-for-person)
- [SLA-line for Control Chart with percentile](./src/README.md#sla-line-for-control-chart)
- [Overlay Measurement Ruler on the Control Chart](./src/README.md#control-chart-ruler)
- [Secret data blurring](./src/README.md#the-blurring-of-secret-data)

## Issuing project tasks

All tasks are created at [github issues](https://github.com/TinkoffCreditSystems/jira-helper/issues)

Before creating a task, please make sure that a similar task was not created earlier. Please be sure to check closed tasks - there is a chance that your request has already been fulfilled and will be released soon.


### Requesting a feature

[Create a new task](https://github.com/TinkoffCreditSystems/jira-helper/issues/new)

After adding description, please specify the following attributes only:

- Labels: `feature`
- Project: `jira-helper`


### Requesting a fix

_In case some feature doesn’t operate as expected._

[Create a new task](https://github.com/TinkoffCreditSystems/jira-helper/issues/new)

After adding description, please specify the following attributes only:

- Labels: `invalid`, [`cloud jira`, `jira 7`, `jira 8`] – specify in which JIRA version the problem is reproduced.
- Project: `jira-helper`


### Adding a description for a bug/problem

[Create a new task](https://github.com/TinkoffCreditSystems/jira-helper/issues/new)

After adding description, please specify the following attributes only:

- Labels: `bug`, [`cloud jira`, `jira 7`, `jira 8`] – specify in which JIRA version the problem is reproduced.
- Project: `jira-helper`


### List of most often used labels

|   labels     |    Meaning                                                               |
|--------------|:--------------------------------------------------------------------------|
| `feature`    | new feature                                                          |
| `invalid`    | a feature doesn’t work as expected                                  |
| `bug`        | a problem/error, please be sure to specify a JIRA version label, where one could reproduce it |
| `jira 7`     | reproducible in JIRA 7.x.x                                       |
| `jira 8`     | reproducible in JIRA 8.x.x                                       |
| `cloud jira` | reproducible in JIRA Cloud                                       |


## Installing the extension for development purposes

Execute:

```
npm run bootstrap
npm run dev
```

In Chrome:

Open the menu, choose “More tools”, then ["Extensions"](chrome://extensions/)

On the ["Extensions"](chrome://extensions/) page toggle “Developer mode”, press “Load unpacked” in the appeared menu.

Choose the folder where the extension was built, `~/jira-helper/dist`.


### During development

When code changes Webpack will automatically update the codebase in the `dist` folder.

Press “Update” in the ["Extensions"](chrome://extensions/) developer menu  and then reload the page, where the extension is being tested.


### Maintaining a git branch and git commits

The branch name should start with an associated task number.

Example: `2-title-issue`, where `2` is the mandatory task number.

Every `commit` should have a task number associated with it.

Example: `[#15] rename *.feature to *.ru.feature`

Please use `english` language only to name branches and commits.

## Publishing information

The official version of the extension is published in ["Chrome WebStore"](https://chrome.google.com/webstore/detail/jira-helper/egmbomekcmpieccamghfgjgnlllgbgdl)

The extension is published after the release [is assembled at github](https://github.com/TinkoffCreditSystems/jira-helper/releases)

Release version is the same as the application version in package.json  [package.json](./package.json) and the version published in ["Chrome WebStore"](https://chrome.google.com/webstore/detail/jira-helper/egmbomekcmpieccamghfgjgnlllgbgdl)

_Minimum required Chrome [version is >= 55](./src/manifest.json)_
