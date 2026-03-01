#!/bin/sh
if [ "$BOT_TYPE" = "task" ]; then
  exec npx ts-node scripts/task_bot.ts
else
  exec npx ts-node scripts/bot_server.ts
fi
