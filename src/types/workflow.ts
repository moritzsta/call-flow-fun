export interface SellerContactData {
  name: string;
  company: string;
  address: string;
  phone: string;
  website: string;
}

export interface PaulWorkflowConfig {
  vorhaben: string;
  templateEnumName?: string;
  sellerContact?: SellerContactData;
}

export interface UweWorkflowConfig {
  userGoal: string;
}

// Extended Felix config for state-wide and multi-city search
export interface FelixWorkflowConfig {
  searchMode: 'state' | 'cities';
  state?: string;
  city?: string;
  cities?: Array<{ city: string; state: string }>;
  category: string;
  maxCompanies?: number;
}
