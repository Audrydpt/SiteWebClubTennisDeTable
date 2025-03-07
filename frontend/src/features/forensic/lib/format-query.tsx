/* eslint-disable */

// Format query for forensic search API
// Update the ForensicSearchQuery interface to match your preference
export interface ForensicSearchQuery {
  sources: string[];
  timerange: {
    time_from: string;
    time_to: string;
  };
  type: 'vehicle' | 'person';
  appearances: {
    [key: string]: any;
    confidence?: 'low' | 'medium' | 'high';
  };
  attributes: {
    [key: string]: any;
    confidence?: 'low' | 'medium' | 'high';
  };
  context?: {
    [key: string]: any;
  };
}

// Also update the FormData interface to match
export interface FormData {
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  cameras: string[];
  subjectType: string;
  vehicleCategory?: string[];
  vehicleSize?: string[];
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
    brands?: Array<{ brand: string; models: string[] }>;
    plate?: string;
    distinctiveFeatures?: {
      [key: string]: boolean | undefined;
    };
  };
  appearanceTolerance?: 'low' | 'medium' | 'high';
  attributesTolerance?: 'low' | 'medium' | 'high';
}

export function formatQuery(formData: FormData): ForensicSearchQuery {
  // Extract date and time range
  const timerange = formData.date
    ? {
      // Use the start date with start time
      time_from: `${formData.date}T${formData.startTime || '00:00:00'}`,
      // Use the end date (if provided) with end time, otherwise use start date
      time_to: `${formData.endDate || formData.date}T${formData.endTime || '23:59:59'}`
    }
    : {
      time_from: new Date().toISOString(),
      time_to: new Date().toISOString(),
    };

  // Base query structure
  const query: ForensicSearchQuery = {
    sources: formData.cameras,
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

  // Format type-specific attributes
  if (formData.subjectType === 'vehicle') {
    formatVehicleQuery(query, formData);
  } else if (formData.subjectType === 'person') {
    formatPersonQuery(query, formData);
  }

  return query;
}

function formatVehicleQuery(
  query: ForensicSearchQuery,
  formData: FormData
): void {
  // Set appearances
  query.appearances = {
    confidence: formData.appearanceTolerance || 'medium',
    type: formData.vehicleCategory || [],
    color: formData.appearance.generalColors || [],
  };

  // Format attributes according to the required structure
  query.attributes = {
    mmr: formData.attributes.brands?.map(item => ({
      brand: item.brand,
      model: item.models || []
    })) || [],
    plate: formData.attributes.plate || "",
    other: {
      damaged: formData.attributes.distinctiveFeatures?.damaged || undefined,
      tinted: formData.attributes.distinctiveFeatures?.tinted || undefined,
      roofrack: formData.attributes.distinctiveFeatures?.roof_rack || undefined
    },
    confidence: formData.attributesTolerance || 'medium'
  };

  // Format context
  query.context = {};
  if (formData.attributes.distinctiveFeatures) {
    for (const key in formData.attributes.distinctiveFeatures) {
      if (key.startsWith('speeding') || key.startsWith('suspicious') || key.startsWith('multiple_occupants')) {
        query.context[key] = formData.attributes.distinctiveFeatures[key];
      }
    }
  }
}

function formatPersonQuery(
  query: ForensicSearchQuery,
  formData: FormData
): void {
  // Reset appearances to ensure no vehicle attributes are included
  query.appearances = {
    confidence: formData.appearanceTolerance || 'medium',
    gender: formData.appearance.gender || undefined,
    seenAge: formData.appearance.age || undefined,
    build: formData.appearance.build || undefined,
    height: formData.appearance.height || undefined,
    hair: {
      color: formData.attributes.hairColors || undefined,
      length: formData.attributes.hairLength || undefined,
      style: formData.attributes.hairStyle || undefined,
    },
  };

  // Reset attributes to ensure no vehicle attributes are included
  query.attributes = {
    confidence: formData.attributesTolerance || 'medium',
  };

  // Upper body
  if (
    formData.attributes.upperType ||
    (formData.attributes.topColors && formData.attributes.topColors.length > 0)
  ) {
    query.attributes.upper = {
      type: formData.attributes.upperType || undefined,
      color: formData.attributes.topColors || undefined,
    };
  }

  // Lower body
  if (
    formData.attributes.lowerType ||
    (formData.attributes.bottomColors && formData.attributes.bottomColors.length > 0)
  ) {
    query.attributes.lower = {
      type: formData.attributes.lowerType || undefined,
      color: formData.attributes.bottomColors || undefined,
    };
  }

  // Add distinctive features
  if (formData.attributes.distinctiveFeatures) {
    query.attributes.other = formData.attributes.distinctiveFeatures;
  }
}