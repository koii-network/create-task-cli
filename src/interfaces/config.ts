export interface IConfig {
    json_rpc_url: string;
    websocket_url: string;
    keypair_path: string;
    address_labels: { [address: string]: string };
    commitment: 'processed' | 'confirmed' | 'finalized' | 'recent' | 'single' | 'singleGossip';
  }