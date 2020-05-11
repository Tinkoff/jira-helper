#!/bin/sh

set -- $HUSKY_GIT_PARAMS

BRANCH_NAME=$(git symbolic-ref --short HEAD)
# sample "19_blure_sensitive_text" -> "19"
BRANCH_NAME_ID_ISSUE=$(git symbolic-ref --short HEAD | sed -e 's/\([0-9]*\)[^0-9]*/\1/')

BRANCH_IN_COMMIT=0
if [ -f $1 ]; then
    BRANCH_IN_COMMIT=$(grep -c "\[$BRANCH_NAME\]" $1)
fi

if [ -n "$BRANCH_NAME_ID_ISSUE" ] && ! [[ $BRANCH_IN_COMMIT -ge 1 ]]; then
  if [ -f $1 ]; then
    BRANCH_NAME="${BRANCH_NAME/\//\/}"
    sed -i.bak -e "1s@^@[#$BRANCH_NAME_ID_ISSUE] @" $1
  else
    echo "[$BRANCH_NAME] " > "$1"
  fi
fi

exit 0
