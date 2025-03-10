/* eslint-disable */
// format-query.tsx
import { ForensicFormValues } from './provider/forensic-form-context';

// Format query for forensic search API
export interface ForensicSearchQuery {
  sources: string[];
  timerange: {
    time_from: string;
    time_to: string;
  };
  type: 'vehicle' | 'person';
  appearances: {
    [key: string]: unknown;
    confidence?: 'low' | 'medium' | 'high';
  };
  attributes: {
    [key: string]: unknown;
    confidence?: 'low' | 'medium' | 'high';
  };
  context?: Record<string, unknown>;
}

export interface FormData {
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  cameras: string[];
  subjectType: string;
  vehicleCategory?: string[];
  appearance: {
    generalColors: string[];
    gender?: string[];
    age?: string[];
    build?: string[];
    height?: string[];
  };
  attributes: {
    hairColors?: string[];
    hairLength?: string[];
    hairStyle?: string[];
    upperType?: string[];
    topColors?: string[];
    lowerType?: string[];
    bottomColors?: string[];
    vehicleColors?: string[];
    brands?: string[];
    models?: string[];
    plate?: string;
    distinctiveFeatures?: Record<string, boolean | undefined>;
  };
  appearanceTolerance?: 'low' | 'medium' | 'high';
  attributesTolerance?: 'low' | 'medium' | 'high';
}

// Map hex color values to color names needed by the API
function mapHexToColorName(hexColors: string[]): string[] {
  const colorMap: Record<string, string> = {
    '#964B00': 'brown',
    '#FF0000': 'red',
    '#FFA500': 'orange',
    '#FFFF00': 'yellow',
    '#008000': 'green',
    '#00FFFF': 'cyan',
    '#0000FF': 'blue',
    '#800080': 'purple',
    '#FFC0CB': 'pink',
    '#FFFFFF': 'white',
    '#808080': 'gray',
    '#000000': 'black',
  };

  return hexColors.map(hex => colorMap[hex] || hex);
}

/**
 * Creates a FormData object from ForensicFormValues
 */
/**
 * Creates a FormData object from ForensicFormValues
 */
export function createSearchFormData(data: ForensicFormValues): FormData {
  console.log('Received form values:', data);  // Debug log
  console.log('Sources from form:', data.sources);

  // Safely access the color property based on the subject type
  const colorNames = data.type === 'vehicle' &&
  Array.isArray(data.appearances.color) ?
    mapHexToColorName(data.appearances.color) : [];

  const searchFormData: FormData = {
    cameras: Array.isArray(data.sources) ? data.sources : [],
    subjectType: data.type,
    date: data.timerange.time_from.split('T')[0],
    startTime: data.timerange.time_from.split('T')[1],
    endDate: data.timerange.time_to.split('T')[0],
    endTime: data.timerange.time_to.split('T')[1],
    appearance: {
      // Use converted color names instead of hex codes
      generalColors: data.type === 'vehicle' ? colorNames : [],
    },
    vehicleCategory: data.type === 'vehicle' ? data.appearances.type || [] : [],
    attributes: {},
    appearanceTolerance: data.appearances.confidence || 'medium',
    attributesTolerance: data.attributes.confidence || 'medium',
  };

  // Add person-specific appearance attributes
  if (data.type === 'person') {
    searchFormData.appearance = {
      ...searchFormData.appearance,
      gender: data.appearances.gender || [],
      age: data.appearances.seenAge || [],
      build: data.appearances.build || [],
      height: data.appearances.height || [],
    };

    // Convert hair colors from hex to names if present
    const hairColors = data.appearances.hair?.color
      ? data.appearances.hair.color.map((hex: string) => mapHexToColorName([hex])[0])
      : [];

    // Convert clothing colors from hex to names
    const upperColors = data.attributes.upper?.color
      ? mapHexToColorName(data.attributes.upper.color)
      : [];

    const lowerColors = data.attributes.lower?.color
      ? mapHexToColorName(data.attributes.lower.color)
      : [];

    // Add person-specific attributes
    searchFormData.attributes = {
      hairColors: hairColors,
      hairLength: data.appearances.hair?.length || [],
      hairStyle: data.appearances.hair?.style || [],
      upperType: data.attributes.upper?.type || [],
      topColors: upperColors,
      lowerType: data.attributes.lower?.type || [],
      bottomColors: lowerColors,
      distinctiveFeatures: data.attributes.other || {},
    };
  } else {
    // For vehicle type, use type assertion to access vehicle-specific properties
    const vehicleAppearances = data.appearances as {
      type?: string[];
      color: string[];
      confidence: 'low' | 'medium' | 'high';
    };

    // Add vehicle-specific attributes with color conversion
    searchFormData.attributes = {
      brands: data.attributes.mmr?.map((item) => item.brand) || [],
      models: data.attributes.mmr?.[0]?.model || [],
      plate: data.attributes.plate || '',
      vehicleColors: vehicleAppearances.color ? mapHexToColorName(vehicleAppearances.color) : [],
      distinctiveFeatures: data.attributes.other || {},
    };
  }

  return searchFormData;
}

export function formatQuery(formData: FormData): ForensicSearchQuery {
  // Extract date and time range
  const timerange = formData.date
    ? {
      time_from: `${formData.date}T${formData.startTime || '00:00:00'}`,
      time_to: `${formData.endDate || formData.date}T${formData.endTime || '23:59:59'}`,
    }
    : {
      time_from: new Date().toISOString(),
      time_to: new Date().toISOString(),
    };

  // Ensure cameras is an array
  const sources = Array.isArray(formData.cameras) ? formData.cameras : [];

  // Base query structure
  const query: ForensicSearchQuery = {
    sources: sources,
    timerange,
    type: formData.subjectType as 'vehicle' | 'person',
    appearances: {
      confidence: formData.appearanceTolerance || 'medium',
    },
    attributes: {
      confidence: formData.attributesTolerance || 'medium',
    },
    context: {},
  };

  // Format type-specific attributes using properly defined functions
  if (formData.subjectType === 'vehicle') {
    return formatVehicleQuery(formData, query);
  }

  return formatPersonQuery(formData, query);
}

/**
 * Formats a vehicle query from form data
 */
function formatVehicleQuery(
  formData: FormData,
  baseQuery: ForensicSearchQuery
): ForensicSearchQuery {
  const query = { ...baseQuery };

  // Set appearances
  query.appearances = {
    confidence: formData.appearanceTolerance || 'medium',
    type: formData.vehicleCategory || [],
    color: formData.appearance.generalColors || [],
  };

  console.log('Vehicle colors sent to API:', formData.appearance.generalColors);

  // Vehicle attributes
  query.attributes = {
    confidence: formData.attributesTolerance || 'medium',
    mmr:
      formData.attributes.brands?.map((brand) => ({
        brand,
        model: formData.attributes.models || [],
      })) || [],
    plate: formData.attributes.plate || '',
    other: {
      damaged: formData.attributes.distinctiveFeatures?.damaged || undefined,
      tinted: formData.attributes.distinctiveFeatures?.tinted || undefined,
      roofrack: formData.attributes.distinctiveFeatures?.roof_rack || undefined,
    },
  };

  // Format context
  query.context = {};

  // Safely process contextual features
  if (formData.attributes.distinctiveFeatures) {
    const contextualKeys = Object.keys(
      formData.attributes.distinctiveFeatures
    ).filter(
      (key) =>
        key.startsWith('speeding') ||
        key.startsWith('suspicious') ||
        key.startsWith('multiple_occupants')
    );

    contextualKeys.forEach((key) => {
      if (query.context && formData.attributes.distinctiveFeatures) {
        query.context[key] = formData.attributes.distinctiveFeatures[key];
      }
    });
  }

  return query;
}

/**
 * Formats a person query from form data
 */
function formatPersonQuery(
  formData: FormData,
  baseQuery: ForensicSearchQuery
): ForensicSearchQuery {
  const query = { ...baseQuery };

  // Set appearances for person
  query.appearances = {
    confidence: formData.appearanceTolerance || 'medium',
    gender: formData.appearance.gender || [],
    seenAge: formData.appearance.age || [],
    build: formData.appearance.build || [],
    height: formData.appearance.height || [],
    hair: {
      color:
        formData.attributes.hairColors?.map((c) => c.toLowerCase()) ||
        undefined,
      length: formData.attributes.hairLength || [],
      style: formData.attributes.hairStyle || [],
    },
  };

  // Set base attributes
  query.attributes = {
    confidence: formData.attributesTolerance || 'medium',
  };

  // Upper body
  if (
    formData.attributes.upperType ||
    (formData.attributes.topColors && formData.attributes.topColors.length > 0)
  ) {
    query.attributes.upper = {
      type: formData.attributes.upperType || [],
      color:
        formData.attributes.topColors?.map((c) => c.toLowerCase()) || undefined,
    };
  }

  // Lower body
  if (
    formData.attributes.lowerType ||
    (formData.attributes.bottomColors &&
      formData.attributes.bottomColors.length > 0)
  ) {
    query.attributes.lower = {
      type: formData.attributes.lowerType || [],
      color:
        formData.attributes.bottomColors?.map((c) => c.toLowerCase()) ||
        undefined,
    };
  }

  // Add distinctive features
  if (formData.attributes.distinctiveFeatures) {
    query.attributes.other = formData.attributes.distinctiveFeatures;
  }

  return query;
}