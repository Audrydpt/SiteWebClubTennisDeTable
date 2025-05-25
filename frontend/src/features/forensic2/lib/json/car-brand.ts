import carBrandData from './car-brand.json';

export interface CarModel {
  brand: string;
  models: string[];
}

export const carBrands = carBrandData as CarModel[];

export const getBrands = (): string[] => carBrands.map((item) => item.brand);

export const getModelsByBrand = (brand: string): string[] => {
  const brandData = carBrands.find((item) => item.brand === brand);
  return brandData?.models || [];
};
