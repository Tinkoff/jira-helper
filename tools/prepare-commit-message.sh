#!/bin/sh

set -- $HUSKY_GIT_PARAMS

BRANCH_NAME=$(git symbolic-ref --short HEAD)

BRANCH_IN_COMMIT=0
if [ -f $1 ]; then
    BRANCH_IN_COMMIT=$(grep -c "\[$BRANCH_NAME\]" $1)
fi

if [ -n "$BRANCH_NAME" ] && ! [[ $BRANCH_IN_COMMIT -ge 1 ]]; then
  if [ -f $1 ]; then
    BRANCH_NAME="${BRANCH_NAME/\//\/}"
    sed -i.bak -e "1s@^@[$BRANCH_NAME] @" $1
  else
    echo "[$BRANCH_NAME] " > "$1"
  fi
fi

exit 0
