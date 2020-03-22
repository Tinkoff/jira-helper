# Функционал расширения "jira-helper"

_Версия 2.0.0_

## Chart Bar - показывает загрузку колонок на board

- Код функционала [./swimlane/SwimlaneStats.*](./swimlane)

Работает в заголовках Swimlane.

При наведении курсора мыши на bar всплывает подсказка (title) в которой показывается название
ассоциированной колонки доски с bar и количество задач в этой колонке для этого swimline.

![Chart Bar](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_ChartBar.gif)

Удобно использовать при большом количестве swimlane.

Например, когда swimlane используются для отображения задач по Epic или Stories или Assigne.

![Settings Base swimlane on](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_swimlane_base_swimlanes_on.gif)


## Показ флажка на панели задач

На board по клику правой кнопкой мыши можно добавлять красный флажок к задаче.

Данный флажок не показывается на панели задач (`jira.server.com/browse/PROJECTID-0001`).

Плагин *jira-helper* добавляет отображение флажка на панели задач рядом сo значением поля `priority`

Пример JIRA Cloud:

![issue flag jira cloud](https://github.com/TinkoffCreditSystems/jira-helper/raw/images/features/jirahelper_issue_flag.gif)

Пример JIRA v7.\*.\*:

![issue flag jira 7](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_issue_flag_jira7.gif)

## Template for Description

При редактировании поля `Description` во время создания задач и их редактирования, рядом с полем появляются две кнопки.

При помощи которых можно сохранить Template для этого типа задач к себе в localStorage браузера (шаблон сохранится к на вашем компьютере).

![description template](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_description_template.gif)

## Тетрис планирование

Тетрис-планирование позволяет для разных специалистов указывать свой параметр размера задачи. 

>Если в вашей команде есть специалисты программисты и специалисты по тестированию, и они работают только в рамках своего >специализированного колодца, то общая оценка по задаче будет затруднительна.
>
>Это происходит потому, что специалисты из разных колодцев плохо понимают контекст друг друга.
>
>Для решения этой проблемы можно воспользоваться техникой Тетрис-планирования.
>
>Такой подход был популяризирован Максимом Дорофеевым на [этом докладе](https://www.youtube.com/watch?v=fsqXlW_m0Bo&t=1365s)
>
>Однако, есть и критика такого подхода: ["Как сейчас «неправильно планируют» в Agile"](https://filipyev.ru/2020/01/04/planirovanie-v-agile/)

При использовании Scrum-доскок в JIRA, у вас появляется возможность использовать объединение задач в Sprint.

Стандартно JIRA предоставляет оценку только по одному выбранному значению, например по Story Points.

Тогда, в заголовке Sprint будут видны суммы по Story Points от задач, которые еще не взяты в работу (_серые_), в работе (_синие_) и выполненные (_зеленые_).

![sprint head with story points](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_sprinthead_with_storypoints.png)

Плагин *jira-helper* добавляет функционал позволяющий визуализировать оценку сразу по нескольким числовым параметрам.

Не важно, это будут Story Points, или любой другой численный Estimate.

В бэклоге Scrum доски, для каждого Sprint в его заголовке появятся выбранные значения по нескольким выбранным параметрам.

В виде: `param name: (the sum of estimate in sprint)/(max sum of estimate)`

Где
- `param name` - название параметра по которому считаеться оценка
- `the sum of estimate in sprint` - сумма оценки по этому параметру для всех оценненных задач попавших в этот Sprint
- `max sum of estimate` – максимально возомжная сумма для этого Sprint

В случае если `the sum of estimate in sprint` будет превышать `max sum of estimate` тег будет красного цвета - сигнализируя о том, что для данного Sprint по этому параметру больше нельзя добавлять задач.

В ином случае тег будет зеленого цвета.

_"Board Settings (Scrum board) -> Estimates"_  Сохранять значение может только Администратор board.

![tetris planning](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_tetris_planning.gif)

## Печать стикеров на принтере

Используется для печати множества стикеров при помощи офисного лазерного принтера.

![как использозвать печать](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print.gif)

Для печати стикеров на обычной бумаге формата A4 можно воспользоваться [шаблоном](chrome-extension://egmbomekcmpieccamghfgjgnlllgbgdl/options.html)

![шаблон печати стикеров](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print_template.gif)

Шаблон для печати использует 
* шрифты [GOST A](https://ffont.ru/font/gost-type-a) и [GOST B](https://ffont.ru/font/gost-type-b)
* особую форму отображения номера задачи снизу стикера
* цветное отображение связанного эпика задачи (в примере ниже Epic Name: "Песни")

Это позволяет удобно использовать напечатанные стикеры на доске таким образом
![sample position a stickers on a desck](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_jql_print_stiker_position_on_desk_w600.png)

## Общие WIP-ограничения для колонок
_WIP – work in progress_

В JIRA можно добавлять wip-ограничения только отдельно на каждую колонку.

Для визаулизации Kanban-системы необходима возможность сделать [wip-ограничение на несколько колонок](http://kanbanguide.ru/essential-condenced-kanban-guide/).

*jira-helper* добавляет такой функционал.

Чтобы им воспользоваться, необходимо в настройках доски указать какие колонки будут использовать одно wip-ограничение.

Сохранять значение может только Администратор board.

_"Board Settings -> Columns"_

![settings wip-limit for column](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_wip_limit_settings_columns.gif)

При этом, можно пользоваться функциональностью ограничений колонок предоставленной JIRA!

На board визаулизация ограничений будет поверх заголовков колонок.

При нарушении wip-limit background колонки подсветиться красным цветом.

![wip-limit of column](https://github.com/TinkoffCreditSystems/jira-helper/blob/images/features/jirahelper_wip_limit_columns.gif)


## WIP-ограничения для swimlanes

Канбан-система может использовать разные ограничения WIP. В том числе и ограничения на swimlane.

Существуют swimlane особого типа, например Expedite, для которых WIP-ограничение действует только то, которое указано на swimlane.

При этом ограничения на колонках не учитывают задачи которые находятся в Expedite колонке.

При настройке wip-ограничений для swimlane посредством *jira-helper* вы можете указать какие swimlane у вас являются особенными и задачи в них не нужно использовать в подсчете количества задач для общего ограничения на колонках.

Сохранять значение может только Администратор board.

_"Board Settings -> Swimlane"_
![swimlane wip-limits](https://github.com/TinkoffCreditSystems/jira-helper/blob/images/features/jirahelper_wip_limit_settings_swim_ex.gif)

Используя комбинацию wip-ограничений колонок и swimlane вы можете визуализировать управление сложной системой с разными типами и классами задач.

## Наложение сетки измерений на Control Chart

_Control Chart - это наверное то, за что можно любить JIRA._

[Доклад "Control Chart в JIRA, все ее тайны" с конференции https://kanbaneurasia.com/](https://www.dropbox.com/sh/wkuk3n1xx4yld0w/AADvVyFtucbRpQp0wiiiOUkZa?dl=0&fbclid=IwAR3NIhkRDAGytpuTmmqbjpq7eC-01Ko3KLVM8szZmS3VNsW44qlZq2tzXsQ&preview=%D0%9F%D0%B0%D0%B2%D0%B5%D0%BB+%D0%90%D1%85%D0%BC%D0%B5%D1%82%D1%87%D0%B0%D0%BD%D0%BE%D0%B2+-+Control+Chart+%D0%B2+JIRA%2C+%D0%B2%D1%81%D0%B5+%D0%B5%D0%B5+%D1%82%D0%B0%D0%B9%D0%BD%D1%8B.pdf)

*jira-helper* добавляет специальную линию SLA на график Control Chart.

Используя эту линию вы можете задать желаемый уровень времени обслуживания выполнения задач для вашего сервиса, команды.

Сохранять значение может только Администратор board.

Кроме этого используя эту линию, без использования сохранения, вы можете анализировать время выполнения и граничные условия на графике.

SLA показывает значение в днях.

![sla-line for control chart](https://raw.githubusercontent.com/TinkoffCreditSystems/jira-helper/images/features/jirahelper_sla_for_controlchart.gif)
