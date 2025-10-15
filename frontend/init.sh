#!/bin/sh
npm run build-all

npm run $LAUNCH
exec $@