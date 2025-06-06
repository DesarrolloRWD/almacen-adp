"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Nombres de los meses en español
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Nombres de los días de la semana en español
const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

// Colores personalizados para el tema naval
const NAVAL_COLORS = {
  primary: "#1e40af", // naval-600
  secondary: "#dbeafe", // naval-50
  accent: "#3b82f6", // naval-500
  hover: "#bfdbfe", // naval-100
  text: "#1e3a8a", // naval-700
  today: "#60a5fa", // naval-400
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Obtener el año actual para el selector de años
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Crear un array de años para el selector (desde 5 años atrás hasta 5 años adelante)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  // Estado para controlar el mes y año mostrados
  const [currentMonth, setCurrentMonth] = React.useState<Date>(props.defaultMonth || today);
  
  // Componente personalizado para el encabezado del calendario
  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    const month = displayMonth.getMonth();
    const year = displayMonth.getFullYear();
    
    // Función para cambiar el mes
    const handleMonthChange = (monthValue: string) => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(parseInt(monthValue));
      setCurrentMonth(newDate);
    };
    
    // Función para cambiar el año
    const handleYearChange = (yearValue: string) => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(parseInt(yearValue));
      setCurrentMonth(newDate);
    };
    
    // Función para ir al mes actual
    const goToToday = () => {
      setCurrentMonth(new Date());
    };
    
    return (
      <div className="flex justify-between items-center px-1 w-full">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-naval-500" />
          <div className="flex gap-1">
            <Select
              value={month.toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="h-8 w-[120px] text-sm font-medium bg-white border-naval-200 hover:border-naval-300 focus:ring-naval-300">
                <SelectValue placeholder={MESES[month]} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {MESES.map((mesNombre, index) => (
                  <SelectItem key={index} value={index.toString()} className="hover:bg-naval-50 hover:text-naval-700 focus:bg-naval-100">
                    {mesNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={year.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="h-8 w-[80px] text-sm font-medium bg-white border-naval-200 hover:border-naval-300 focus:ring-naval-300">
                <SelectValue placeholder={year.toString()} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()} className="hover:bg-naval-50 hover:text-naval-700 focus:bg-naval-100">
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={goToToday}
                className="rounded-full h-6 w-6 flex items-center justify-center text-xs bg-naval-50 text-naval-600 hover:bg-naval-100 transition-colors"
              >
                Hoy
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ir a hoy</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };
  
  return (
    <DayPicker
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-lg shadow-sm border border-naval-100", className)}
      locale={es}
      weekStartsOn={1} // Semana comienza el lunes
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-3",
        caption_label: "text-sm font-medium text-naval-700",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white border-naval-200 p-0 hover:bg-naval-50 hover:border-naval-300 transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex border-b border-naval-100 pb-2",
        head_cell:
          "text-naval-500 rounded-md w-10 font-medium text-[0.8rem] uppercase",
        row: "flex w-full mt-2",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-naval-100/50 [&:has([aria-selected])]:bg-naval-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-naval-50 hover:text-naval-700 transition-colors"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-naval-600 text-white hover:bg-naval-700 hover:text-white focus:bg-naval-600 focus:text-white",
        day_today: "bg-naval-100 text-naval-700 font-medium border border-naval-300",
        day_outside:
          "day-outside text-naval-300 aria-selected:bg-naval-100/50 aria-selected:text-naval-400",
        day_disabled: "text-naval-200 opacity-50",
        day_range_middle:
          "aria-selected:bg-naval-100 aria-selected:text-naval-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => <CustomCaption displayMonth={displayMonth} />
      }}
      labels={{
        labelMonthDropdown: () => "Seleccionar mes",
        labelYearDropdown: () => "Seleccionar año",
        labelNext: () => "Siguiente mes",
        labelPrevious: () => "Mes anterior",
        labelDay: () => "Día",
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
