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
