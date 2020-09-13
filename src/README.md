# “jira-helper” features


## Swimlane Chart Bar

Source code [./swimlane/SwimlaneStats.*](./swimlane)

Found in Swimlane titles

Shows column name and task count on bar hover. Title and count are shown for this swimlane only.

![Chart Bar](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_ChartBar.gif)

Convenient when you have lots of swimlanes, i.e. when you have swimlanes based on Epics, Stories or Assignees.

![Settings Base swimlane on](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_swimlane_base_swimlanes_on.gif)


## Flag on Issue panel

When in board view, right click on an issue to flag it.

By default, this flag won’t be shown in issue view (`jira.server.com/browse/PROJECTID-0001`)

Jira-helper extension adds flag display for issue view, right next to `priority` field.

JIRA Cloud example:
![issue flag jira cloud](https://github.com/TinkoffCreditSystems/jira-helper/raw/images/features/jirahelper_issue_flag.gif)

JIRA v7.*.* example:
![issue flag jira 7](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_issue_flag_jira7.gif)


## Template for Description

Two buttons are added near the `Description` field in issue create/edit mode.

Use them to save a Template for this issue type to your browser’s [localStorage](https://developers.google.com/web/tools/chrome-devtools/storage/localstorage)
(it means, the Template will be stored locally on your computer)

![description template](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_description_template.gif)


## Tetris-planning for Scrum

Tetris-planning allows you to specify separate size measures for different specialists on your team.

>When your team has programmers and testers doing work strictly according to their job titles, maintaining a joint estimation might get tricky.
>
>This happens, because different specialists don’t usually understand each other that well.
>
>Tetris-planning approach can be used to overcome that.
>
>The approach itself was popularised by Max Dorofeev in [one of his speeches](https://www.youtube.com/watch?v=fsqXlW_m0Bo&t=1365s)
>
>However, there are critics of this approach [here](https://www.youtube.com/watch?v=NPIKAvjuJXc)

When using JIRA Scrum-boards you have a feature to add issues to Sprint backlogs.

By default, JIRA only lets you use one value to estimate, i.e. Story Points.

This way, the Sprint header will show three sums: not started issues (_gray_), in progress issues (_blue_), done issues (_green_).

![sprint head with story points](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_sprinthead_with_storypoints.png)

**Jira-helper** adds a feature to use several values to visualize the estimates.

It doesn’t matter, whether they are Story Points or any other integer value.

Now, Scrum-backlog Sprint headers will show chosen values be the chosen parameters.

They are displayed like this: `param name: (sum of this estimate in sprint)/(max sum of this estimate)`

Where:
- `param name` is the name of the parameter, used for estimation
- `the sum of estimate in sprint` is all this Sprint’s estimates by this parameter summed up
- `max sum of this estimate` is the maximum value for this parameter for this Sprint

In the case of sum of `this estimate in sprint` exceeding `max sum of this estimate`, the tag will appear red to show that you shouldn’t add more tasks for this estimation parameter.

Otherwise, the tag will appear green.

_"Board Settings (Scrum board) -> Estimates"_ Only the Board Administrator can save this setting.

![tetris planning](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_tetris_planning.gif)


## Printing Many Stickers

This feature allows you to print lots of stickers using your basic office printer.

![how use printing](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print.gif)

Use the [template](chrome-extension://egmbomekcmpieccamghfgjgnlllgbgdl/options.html) to print post-its on ordinary A4 paper.

![template for stickers](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print_template.gif)

The print template uses
* [GOST A](https://ffont.ru/font/gost-type-a) and [GOST B](https://ffont.ru/font/gost-type-b) fonts
* a special way of showing the issue number at the bottom of the post-it
* color coding of the associated Epic (in the example below, the Epic name is “Песни”)

This lets you conveniently use the post-its like this
![sample position a stickers on a desck](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print_stiker_position_on_desk_w600.png)


## WIP-limits for several columns (CONWIP)
_WIP – work in progress_

By default, JIRA lets you constraint your columns separately.

However, to visualize a Kanban-system, you need [combined WIP-limit constraints](https://www.youtube.com/watch?v=TvPzFIs-ycQ).

**Jira-helper** provides this feature.

Set it up in the board settings by choosing columns which will share the constraint.

_"Board Settings -> Columns"_ Only the Board Administrator can save this setting.

![settings wip-limit for column](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_wip_limit_settings_columns.gif)

You can still use the default JIRA WIP-limits, while using the combined WIP-limits!

Constraint visualization will be shown above the column titles.

If the constraint is broken, the column background will become red.

![wip-limit of column](https://github.com/TinkoffCreditSystems/jira-helper/blob/images/features/jirahelper_wip_limit_columns.gif)

Versions [2.1.0](https://github.com/TinkoffCreditSystems/jira-helper/releases/tag/2.1.0)
und above let you choose whether sub-tasks are counted in the combined WIP-limits.

Use the default “Column constraint” setting to adjust this.
![sub-task & CONWIP](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_CONWIP_with_sub-task.gif)


## WIP-limits for Swimlanes

Kanban-systems may use different types of WIP-limits, including swimlane limits.

There certain types of swimlanes which are bound only by their own WIP-constraints (i.e. Expedite).

This way, the column constraints don’t influence the Expedite swimlane constraint.

When setting up WIP-limits using jira-helper, you can specify the swimlanes which are not subject to the column constraints.

_"Board Settings -> Swimlane"_ Only the Board Administrator can save this setting
![swimlane wip-limits](https://github.com/TinkoffCreditSystems/jira-helper/blob/images/features/jirahelper_wip_limit_settings_swim_ex.gif)

Using a combination of different types of WIP-constraints, you can visualize a very complex delivery system.

## WIP-limit for Person

Per pesrson WIP-limits are used in proto-Kanban-systems.

You can set up per person WIP-limits in Column settings of the board.

You can also set specific columns and swimlanes, which will be subject to this person’s WIP-limit.

![swimlane wip-limits](https://github.com/TinkoffCreditSystems/jira-helper/blob/images/features/WIP-limit-personal.gif)


## SLA-line for Control Chart

_Control Chart might just be the reason to love JIRA._

[”JIRA Control Chart and it’s mysteries” speech (rus. lang) at https://kanbaneurasia.com/](https://www.dropbox.com/sh/wkuk3n1xx4yld0w/AADvVyFtucbRpQp0wiiiOUkZa?dl=0&fbclid=IwAR3NIhkRDAGytpuTmmqbjpq7eC-01Ko3KLVM8szZmS3VNsW44qlZq2tzXsQ&preview=%D0%9F%D0%B0%D0%B2%D0%B5%D0%BB+%D0%90%D1%85%D0%BC%D0%B5%D1%82%D1%87%D0%B0%D0%BD%D0%BE%D0%B2+-+Control+Chart+%D0%B2+JIRA%2C+%D0%B2%D1%81%D0%B5+%D0%B5%D0%B5+%D1%82%D0%B0%D0%B9%D0%BD%D1%8B.pdf)

**jira-helper** introduces a special SLA-line to your Control Chart.

This line lets you specify the desired terms for your team’s Service Level Agreement.

Only the Board Administrator can save this setting.

Use this line without saving to analyze your leadtimes on the fly.

SLA value is shown in days.

![sla-line for control chart](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_sla_for_controlchart.gif)

## How to identify jira-helper requests

Your JIRA administrators can identify jira-helper requests
by the special request header "browser-plugin: jira-helper/{version}".

![jira-helper-reques](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jira-helper-request_300px.png)

## Control Chart Ruler

You can analyze issue sizes using the control chart ruler.

For example, this way you can check whether you can use different measurement scales (i.e. Fibonacci)

Use the dropdown list near the SLA field to choose the scale you want to check.

_The picture shows the Fibonacci scale with a size value of "6"._
![Ruller for Control chart](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_controlchart_rule.png)

We can see that the leadtimes do **not** correspond to the chosen scale.
This way we can say that Fibonacci scale it snot fit to measure the work in this system.
![Fibonacci distribution](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_controlchart_rule_sp.png)

## Blurring of secret data

