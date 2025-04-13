
import { DatasetFile, VisualSuggestion, POWER_BI_VISUALS } from '@/types/powerbi';

/**
 * Generates Power BI visualization suggestions based on the dataset structure
 * @param dataset The processed dataset with headers, rows, and data types
 * @returns Array of visual suggestions with chart details and mapped fields
 */
export const generateVisualSuggestions = (dataset: DatasetFile): VisualSuggestion[] => {
  const suggestions: VisualSuggestion[] = [];
  const { headers, dataTypes } = dataset;
  
  // Categorize fields by data type
  const categoricalFields: string[] = [];
  const numericFields: string[] = [];
  const dateFields: string[] = [];
  
  headers.forEach(header => {
    const type = dataTypes[header].toUpperCase();
    
    if (type === 'TEXT' || type === 'VARCHAR') {
      categoricalFields.push(header);
    } else if (type === 'INTEGER' || type === 'DECIMAL' || type === 'NUMBER' || type === 'FLOAT') {
      numericFields.push(header);
    } else if (type === 'DATE' || type === 'TIMESTAMP' || type === 'DATETIME') {
      dateFields.push(header);
    }
  });
  
  // Generate bar chart suggestions if there are categorical and numeric fields
  if (categoricalFields.length > 0 && numericFields.length > 0) {
    const categoryField = categoricalFields[0];
    const valueField = numericFields[0];
    
    suggestions.push({
      chart_name: `${valueField} by ${categoryField}`,
      description: `Compares ${valueField} across different ${categoryField} categories.`,
      visual_type: 'Bar Chart',
      mapped_fields: {
        'y-axis': categoryField,
        'x-axis': valueField,
        'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
      }
    });
    
    if (categoricalFields.length > 1) {
      suggestions.push({
        chart_name: `${valueField} by ${categoryField} and ${categoricalFields[1]}`,
        description: `Compares ${valueField} across different ${categoryField} categories, grouped by ${categoricalFields[1]}.`,
        visual_type: 'Stacked Bar Chart',
        mapped_fields: {
          'y-axis': categoryField,
          'x-axis': valueField,
          'legend': categoricalFields[1],
          'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
        }
      });
    }
  }
  
  // Generate line chart suggestions if there are date and numeric fields
  if (dateFields.length > 0 && numericFields.length > 0) {
    const dateField = dateFields[0];
    const valueField = numericFields[0];
    
    suggestions.push({
      chart_name: `${valueField} Trend Over Time`,
      description: `Shows how ${valueField} changes over time.`,
      visual_type: 'Line Chart',
      mapped_fields: {
        'x-axis': dateField,
        'y-axis': valueField,
        'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
      }
    });
    
    if (categoricalFields.length > 0) {
      suggestions.push({
        chart_name: `${valueField} Trend by ${categoricalFields[0]}`,
        description: `Shows how ${valueField} changes over time for each ${categoricalFields[0]}.`,
        visual_type: 'Line Chart',
        mapped_fields: {
          'x-axis': dateField,
          'y-axis': valueField,
          'legend': categoricalFields[0],
          'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
        }
      });
    }
  }
  
  // Generate pie chart suggestions if there are categorical and numeric fields
  if (categoricalFields.length > 0 && numericFields.length > 0) {
    const categoryField = categoricalFields[0];
    const valueField = numericFields[0];
    
    suggestions.push({
      chart_name: `${valueField} Distribution by ${categoryField}`,
      description: `Shows the proportion of ${valueField} across different ${categoryField} categories.`,
      visual_type: 'Pie Chart',
      mapped_fields: {
        'legend': categoryField,
        'values': valueField,
        'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
      }
    });
  }
  
  // Generate scatter plot if there are at least 2 numeric fields
  if (numericFields.length >= 2) {
    const xField = numericFields[0];
    const yField = numericFields[1];
    
    suggestions.push({
      chart_name: `${yField} vs ${xField}`,
      description: `Examines the relationship between ${xField} and ${yField}.`,
      visual_type: 'Scatter Chart',
      mapped_fields: {
        'x-axis': xField,
        'y-axis': yField,
        'tooltips': numericFields.length > 2 ? [numericFields[2]] : []
      }
    });
    
    if (categoricalFields.length > 0) {
      suggestions.push({
        chart_name: `${yField} vs ${xField} by ${categoricalFields[0]}`,
        description: `Examines the relationship between ${xField} and ${yField} for different ${categoricalFields[0]}.`,
        visual_type: 'Scatter Chart',
        mapped_fields: {
          'x-axis': xField,
          'y-axis': yField,
          'legend': categoricalFields[0],
          'tooltips': numericFields.length > 2 ? [numericFields[2]] : []
        }
      });
    }
  }
  
  // Generate table suggestions
  suggestions.push({
    chart_name: `${dataset.file.name.replace('.csv', '')} Table`,
    description: 'Displays all data in a tabular format for detailed analysis.',
    visual_type: 'Table',
    mapped_fields: {
      'columns': headers.join(', ')
    }
  });
  
  // Generate card suggestions for KPIs
  if (numericFields.length > 0) {
    const valueField = numericFields[0];
    
    suggestions.push({
      chart_name: `${valueField} KPI`,
      description: `Displays the total ${valueField} as a KPI card.`,
      visual_type: 'Card',
      mapped_fields: {
        'fields': valueField
      }
    });
  }
  
  // Ensure we have at least 3 suggestions
  if (suggestions.length < 3) {
    // Add map visualization if there might be location data
    const potentialLocationFields = headers.filter(h => 
      h.toLowerCase().includes('country') || 
      h.toLowerCase().includes('state') || 
      h.toLowerCase().includes('city') ||
      h.toLowerCase().includes('region')
    );
    
    if (potentialLocationFields.length > 0 && numericFields.length > 0) {
      suggestions.push({
        chart_name: `${numericFields[0]} by ${potentialLocationFields[0]}`,
        description: `Visualizes ${numericFields[0]} across different geographical regions.`,
        visual_type: 'Map',
        mapped_fields: {
          'location': potentialLocationFields[0],
          'bubble size': numericFields[0],
          'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
        }
      });
    }
    
    // Add treemap as a generic visualization option
    if (categoricalFields.length > 0 && numericFields.length > 0) {
      suggestions.push({
        chart_name: `${numericFields[0]} Treemap by ${categoricalFields[0]}`,
        description: `Hierarchical view of ${numericFields[0]} data grouped by ${categoricalFields[0]}.`,
        visual_type: 'Treemap',
        mapped_fields: {
          'category': categoricalFields[0],
          'values': numericFields[0],
          'tooltips': numericFields.length > 1 ? [numericFields[1]] : []
        }
      });
    }
  }

  return suggestions;
};

/**
 * Detects potential field mappings based on field names and data types
 * @param fieldName The field name to analyze
 * @param dataType The field's data type
 * @returns Array of potential visualization roles
 */
export const detectFieldRole = (fieldName: string, dataType: string): string[] => {
  const roles: string[] = [];
  const name = fieldName.toLowerCase();
  const type = dataType.toLowerCase();
  
  // Numeric fields
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    roles.push('value');
    
    if (name.includes('amount') || name.includes('price') || name.includes('revenue') || name.includes('sales')) {
      roles.push('y-axis');
    }
    
    if (name.includes('id') || name.includes('count') || name.includes('number')) {
      roles.push('size');
    }
  }
  
  // Date fields
  if (type.includes('date') || type.includes('time')) {
    roles.push('x-axis');
    roles.push('trend axis');
  }
  
  // Text fields
  if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
    roles.push('category');
    
    if (name.includes('country') || name.includes('city') || name.includes('state') || name.includes('region')) {
      roles.push('location');
    }
    
    if (name.includes('name') || name.includes('type') || name.includes('category')) {
      roles.push('legend');
    }
  }
  
  return roles;
};
