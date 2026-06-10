declare module "fit-file-parser" {
  interface FitOptions {
    force?: boolean;
    speedUnit?: "m/s" | "km/h" | "mph";
    lengthUnit?: "m" | "km" | "mi";
    temperatureUnit?: "celsius" | "fahrenheit" | "kelvin";
    elapsedRecordField?: boolean;
    pressureUnit?: "bar" | "psi";
    mode?: "list" | "cascade" | "both";
  }

  interface FitRecord {
    timestamp?: Date;
    position_lat?: number;
    position_long?: number;
    altitude?: number;
    heart_rate?: number;
    speed?: number;
    distance?: number;
  }

  interface FitSession {
    start_time?: Date;
    timestamp?: Date;
    total_elapsed_time?: number;
    total_timer_time?: number;
    total_distance?: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
    avg_speed?: number;
    max_speed?: number;
    total_ascent?: number;
    total_calories?: number;
    sport?: string;
  }

  interface FitActivity {
    timestamp?: Date;
  }

  interface FitData {
    records?: FitRecord[];
    sessions?: FitSession[];
    activities?: FitActivity[];
  }

  export default class FitParser {
    constructor(options?: FitOptions);
    parse(
      content: ArrayBuffer,
      callback: (error: string | null, data?: FitData) => void,
    ): void;
    parseAsync(content: ArrayBuffer): Promise<FitData>;
  }
}
