
export interface DatasetFile {
  file: File;
  headers: string[];
  rows: any[][];
  dataTypes: Record<string, string>;
}

export interface VisualSuggestion {
  chart_name: string;
  description: string;
  visual_type: string;
  mapped_fields: Record<string, string | string[]>;
}

export interface PowerBIVisual {
  name: string;
  requiredFields: string[];
}

// List of available Power BI visuals with their required fields
export const POWER_BI_VISUALS: Record<string, string[]> = {
  'Stacked Bar Chart': ['y-axis', 'x-axis', 'legend', 'small multiples', 'tooltips'],
  'Stacked Column Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  'Clustered Bar Chart': ['y-axis', 'x-axis', 'legend', 'small multiples', 'tooltips'],
  'Clustered Column Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  '100% Stacked Bar Chart': ['y-axis', 'x-axis', 'legend', 'small multiples', 'tooltips'],
  '100% Stacked Column Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  'Line Chart': ['x-axis', 'y-axis', 'secondary y-axis', 'legend', 'small multiples', 'tooltips'],
  'Area Chart': ['x-axis', 'y-axis', 'secondary y-axis', 'legend', 'small multiples', 'tooltips'],
  'Stacked Area Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  '100% Stacked Area Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  'Line and Stacked Column Chart': ['x-axis', 'column y-axis', 'line y-axis', 'column legend', 'small multiples', 'tooltips'],
  'Line and Clustered Column Chart': ['x-axis', 'column y-axis', 'line y-axis', 'column legend', 'small multiples', 'tooltips'],
  'Ribbon Chart': ['x-axis', 'y-axis', 'legend', 'small multiples', 'tooltips'],
  'Waterfall Chart': ['category', 'breakdown', 'y-axis', 'tooltips'],
  'Funnel': ['category', 'values', 'tooltips'],
  'Scatter Chart': ['values', 'x-axis', 'y-axis', 'legend', 'size', 'play axis', 'tooltips'],
  'Pie Chart': ['legend', 'values', 'details', 'tooltips'],
  'Donut Chart': ['legend', 'values', 'details', 'tooltips'],
  'Treemap': ['category', 'details', 'values', 'tooltips'],
  'Map': ['location', 'legend', 'latitude', 'longitude', 'bubble size', 'tooltips'],
  'Filled Map': ['location', 'legend', 'latitude', 'longitude', 'tooltips'],
  'Azure Map': ['location', 'latitude', 'longitude', 'legend', 'size', 'tooltips', 'path id', 'point order'],
  'Gauge': ['value', 'minimum value', 'maximum value', 'target value', 'tooltips'],
  'Card': ['fields'],
  'Multi-row Card': ['fields'],
  'KPI': ['value', 'trend axis', 'target'],
  'Slicer': ['field'],
  'Table': ['columns'],
  'Matrix': ['rows', 'columns', 'values'],
  'Key Influencers': ['analyze', 'explain by', 'expand by'],
  'Decomposition Tree': ['analyze', 'explain by', 'tooltips']
};
