"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      // `relative` lives here, not in classNames.root: a classNames key REPLACES the default rdp-*
      // class, and dropping `rdp-root` would remove the library's own DOM hook.
      className={cn("relative p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-7 items-center justify-center pt-1",
        caption_label: "text-sm font-medium",
        // react-day-picker v9 renders nav as a SIBLING of month, and nothing inside the calendar is
        // positioned, so absolute arrows resolve against the popover and land on top of the dates.
        // The nav itself carries the positioning: pinned to the caption row (inset-x-3 matches the
        // root's p-3), with the buttons in normal flow pushed to either end.
        nav: "absolute inset-x-3 top-3 z-10 flex h-7 items-center justify-between",
        button_previous: "inline-flex h-7 w-7 items-center justify-center rounded-md opacity-50 hover:opacity-100",
        button_next: "inline-flex h-7 w-7 items-center justify-center rounded-md opacity-50 hover:opacity-100",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md p-0 font-normal hover:bg-secondary",
        selected: "bg-primary text-primary-foreground rounded-md",
        today: "bg-secondary text-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" {...rest} /> : <ChevronRight className="h-4 w-4" {...rest} />,
      }}
      {...props}
    />
  );
}
