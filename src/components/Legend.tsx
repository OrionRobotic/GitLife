export const Legend = () => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Less</span>
      <div className="flex gap-[3px]">
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-0" />
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-1" />
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-2" />
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-3" />
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-4" />
        <div className="w-[11px] h-[11px] rounded-sm bg-contribution-5" />
      </div>
      <span>More</span>
    </div>
  );
};
