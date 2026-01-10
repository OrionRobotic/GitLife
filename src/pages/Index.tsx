import { useState } from 'react';
import { ContributionGrid } from '@/components/ContributionGrid';
import { DayEditor } from '@/components/DayEditor';
import { Legend } from '@/components/Legend';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-2xl font-medium text-foreground tracking-tight">
            LifeGit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your daily habits
          </p>
        </header>

        {/* Main content */}
        <div className="space-y-8">
          {/* Contribution grid */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-foreground">
                {currentYear} contributions
              </h2>
              <Legend />
            </div>
            <ContributionGrid
              year={currentYear}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>

          {/* Day editor */}
          {selectedDate && (
            <DayEditor
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
            />
          )}

          {/* Instructions */}
          {!selectedDate && (
            <p className="text-sm text-muted-foreground text-center">
              Click on a day to log your habits
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
