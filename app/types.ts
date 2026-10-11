import { ScaleDiverging, ScaleSequential } from "d3-scale";

export type AREA_TYPE = "ta" | "sa3" | "sa2" | "sa1";

export type MapColours = {
  background: string;
  areaFill: string;
  areaBorder: string;
  areaBorderHover: string;
  areaBorderSelected: string;
  areaFillOpacity: number;
};

export type ColourScale = ScaleDiverging<string> | ScaleSequential<string>;