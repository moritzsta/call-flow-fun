export interface SellerContactData {
  name: string;
  company: string;
  address: string;
  phone: string;
  website: string;
}

export interface PaulWorkflowConfig {
  vorhaben: string;
  templateId?: string;
  templateEnumName?: string;
  templateContent?: string;
  sellerContact?: SellerContactData;
}
