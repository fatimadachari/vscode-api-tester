export interface AuthConfig {
  type: 'bearer' | 'apiKey' | 'none';
  token?: string;
  headerName?: string; 
}