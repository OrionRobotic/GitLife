// Test that all types can be imported correctly
import { BaseTable, Habit, HabitLog, HabitWithLogs, HabitLogWithHabit } from './src/types/database';

// Test that the types work correctly
const testBaseTable: BaseTable = {
  id: 'test-id',
  createdAt: '2023-01-01T00:00:00Z'
};

const testHabit: Habit = {
  ...testBaseTable,
  name: 'Test Habit'
};

const testHabitLog: HabitLog = {
  ...testBaseTable,
  habitId: 'habit-1',
  userId: 'user-1'
};

const testHabitWithLogs: HabitWithLogs = {
  ...testHabit,
  logs: [testHabitLog]
};

console.log('All type imports and usage tests passed!');
