interface NetworkConfig {
  CONN_PROTOCOL: 'http' | 'https'
  STATIC_IP: string
  PORT_ADDRESS: string
}

const NET_CONFIG: NetworkConfig = {
  CONN_PROTOCOL: 'http',
  STATIC_IP: '192.168.43.12',
  PORT_ADDRESS: '3001',
}

export default NET_CONFIG
