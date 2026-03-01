if (process.env.BOT_TYPE === 'task') {
  require('./task_bot');
} else {
  require('./bot_server');
}
