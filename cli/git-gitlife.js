#!/usr/bin/env node

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function completeTask(taskName) {
  const taskMap = {
    'workout': 'workout',
    'eat': 'eating',
    'read': 'reading',
    'sleep': 'sleep',
  };
  
  const habitKey = taskMap[taskName.toLowerCase()];
  
  if (!habitKey) {
    console.error(`Unknown task: ${taskName}`);
    console.log('Available: workout, eat, read, sleep');
    process.exit(1);
  }
  
  // TODO: Here we have to save to Supabase
  console.log(`${habitKey}: done`);
}

function showToday() {
  // TODO: Fetch from Supabase
  console.log('\nToday\'s Progress:');
  console.log('─────────────────────');}

function showHelp() {
  console.log(`
GitLife - Commit to a better version of yourself

Usage:
  gitlife -t <task>   Complete a task (workout, eat, read, sleep)
  gitlife -s          Show today's status
  gitlife -h          Show help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'summary') {
    showToday();
    return;
  }

  if (args[0] === 'add') {
    const taskName = args[1];

    if (!taskName) {
      console.error('Please specify a task name');
      process.exit(1);
    }

    completeTask(taskName);
    return;
  }
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  if (args.includes('-s') || args.includes('--status')) {
    showToday();
    return;
  }
  
  if (args.includes('-t')) {
    const taskIndex = args.findIndex(arg => arg === '-t');
    const taskName = args[taskIndex + 1];
    
    if (!taskName) {
      console.error('Please specify a task name');
      process.exit(1);
    }
    
    completeTask(taskName);
    return;
  }
  
  console.error('Invalid command');
  showHelp();
  process.exit(1);
}

main();
