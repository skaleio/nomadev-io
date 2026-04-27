import { DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@react-types/datepicker";

interface NomaDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minValue?: string;
  maxValue?: string;
}

/** Ancho mínimo para 7 columnas (días) sin recortar; HeroUI usa 256 por defecto y queda justo. */
const CALENDAR_WIDTH = 312;

export function NomaDatePicker({ label, value, onChange, className, minValue, maxValue }: NomaDatePickerProps) {
  const parsedValue = value ? parseDate(value) : null;
  const parsedMin = minValue ? parseDate(minValue) : undefined;
  const parsedMax = maxValue ? parseDate(maxValue) : undefined;

  return (
    <DatePicker
      label={label}
      labelPlacement="outside-top"
      value={parsedValue as DateValue | null}
      onChange={(date: DateValue | null) => {
        if (date) onChange(date.toString());
      }}
      minValue={parsedMin}
      maxValue={parsedMax}
      granularity="day"
      variant="bordered"
      size="md"
      calendarWidth={CALENDAR_WIDTH}
      className={className}
      classNames={{
        // Sin max-w estrecho: antes forzaba ~180px y recortaba el popover / rejilla del calendario.
        base: "min-w-[220px] max-w-[280px] gap-1.5",
        label: "text-xs font-medium text-muted-foreground mb-0",
        inputWrapper: [
          "bg-input/50 border-border",
          "hover:border-border/80",
          "group-data-[focus=true]:border-ring group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-ring/20",
          "rounded-lg min-h-10 py-1.5 shadow-none",
          "items-center",
          "transition-all duration-200",
        ].join(" "),
        innerWrapper: "items-center gap-0.5",
        input: "text-sm text-foreground font-medium",
        segment: "text-foreground tabular-nums data-[editable=true]:text-foreground py-0.5",
        selectorButton: "text-muted-foreground hover:text-foreground shrink-0",
        popoverContent: [
          "bg-popover border border-border rounded-xl p-0",
          "min-w-[min(100vw-1.5rem,320px)] w-max max-w-[min(100vw-1.5rem,360px)]",
          "overflow-visible",
          "shadow-[0_8px_30px_rgb(0,0,0,0.18)]",
          "z-[9999]",
        ].join(" "),
        calendarContent: "p-3 overflow-visible",
      }}
      popoverProps={{
        placement: "bottom-start",
        offset: 8,
        shouldFlip: true,
        shouldCloseOnBlur: true,
        portalContainer: typeof document !== "undefined" ? document.body : undefined,
        motionProps: {
          className: "overflow-visible",
        },
        classNames: {
          content: [
            "bg-popover border border-border rounded-xl p-0",
            "min-w-[min(100vw-1.5rem,320px)] w-max max-w-none",
            "overflow-visible",
            "shadow-[0_8px_30px_rgb(0,0,0,0.18)]",
          ].join(" "),
        },
      }}
      calendarProps={{
        color: "primary",
        classNames: {
          // Evita overflow-hidden del tema que recorta columnas; ancho viene de calendarWidth.
          base: "max-w-none min-w-0 overflow-x-visible overflow-y-visible shadow-none bg-transparent dark:bg-transparent",
          gridWrapper: "overflow-visible max-w-none",
          grid: "w-full min-w-0",
          gridHeaderCell: "w-9 min-w-[2.25rem] text-[11px] font-medium text-muted-foreground uppercase",
          // No sobreescribir cellButton completo: el tema aplica data-[hover=true] y data-[selected=true].
          cellButton: "rounded-lg",
        },
      }}
    />
  );
}
