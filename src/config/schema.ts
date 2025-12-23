export interface FilterGroup {
  name: string;
  urls: string[];
}

export interface Config {
  groups: FilterGroup[];
}
