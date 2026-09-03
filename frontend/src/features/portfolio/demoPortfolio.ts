export type CoverageStatus = 'ACTIVE' | 'OFFERED' | 'NOT_COVERED' | 'EXPIRED'
export type ClimateRiskBand = 'HIGH' | 'MODERATE' | 'LOW'

export type PortfolioBorrower = {
  id: string
  name: string
  sector: string
  city: string
  state: string
  latitude: number
  longitude: number
  loanType: string
  outstandingInr: number
  coverageStatus: CoverageStatus
  riskBand: ClimateRiskBand
  primaryPeril: string
  nextAction: string
}

// Frontend-only synthetic records. These are display fixtures, not calculated or fetched data.
export const demoPortfolio: PortfolioBorrower[] = [
  {
    id: 'MC-BOR-001',
    name: 'ABC Textiles',
    sector: 'Textile manufacturing',
    city: 'Surat',
    state: 'Gujarat',
    latitude: 21.1702,
    longitude: 72.8311,
    loanType: 'Working-capital loan',
    outstandingInr: 840000,
    coverageStatus: 'ACTIVE',
    riskBand: 'HIGH',
    primaryPeril: 'Extreme rainfall',
    nextAction: 'Review event candidate',
  },
  {
    id: 'MC-BOR-002',
    name: 'Kaveri Foods',
    sector: 'Food processing',
    city: 'Vadodara',
    state: 'Gujarat',
    latitude: 22.3072,
    longitude: 73.1812,
    loanType: 'Equipment finance',
    outstandingInr: 1260000,
    coverageStatus: 'ACTIVE',
    riskBand: 'MODERATE',
    primaryPeril: 'Riverine flood',
    nextAction: 'Monitoring active',
  },
  {
    id: 'MC-BOR-003',
    name: 'Narmada Packaging',
    sector: 'Paper products',
    city: 'Bharuch',
    state: 'Gujarat',
    latitude: 21.7051,
    longitude: 72.9959,
    loanType: 'Working-capital loan',
    outstandingInr: 610000,
    coverageStatus: 'OFFERED',
    riskBand: 'HIGH',
    primaryPeril: 'Pluvial flood',
    nextAction: 'Await borrower consent',
  },
  {
    id: 'MC-BOR-004',
    name: 'Blue Loom Studio',
    sector: 'Apparel',
    city: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    loanType: 'Term loan',
    outstandingInr: 475000,
    coverageStatus: 'NOT_COVERED',
    riskBand: 'MODERATE',
    primaryPeril: 'Extreme rainfall',
    nextAction: 'No applicable demo offer',
  },
  {
    id: 'MC-BOR-005',
    name: 'Pragati Machine Works',
    sector: 'Light engineering',
    city: 'Rajkot',
    state: 'Gujarat',
    latitude: 22.3039,
    longitude: 70.8022,
    loanType: 'Equipment finance',
    outstandingInr: 1850000,
    coverageStatus: 'ACTIVE',
    riskBand: 'LOW',
    primaryPeril: 'Urban flood',
    nextAction: 'Monitoring active',
  },
  {
    id: 'MC-BOR-006',
    name: 'Coastal Cold Chain',
    sector: 'Cold-chain logistics',
    city: 'Navsari',
    state: 'Gujarat',
    latitude: 20.9467,
    longitude: 72.952,
    loanType: 'Working-capital loan',
    outstandingInr: 980000,
    coverageStatus: 'EXPIRED',
    riskBand: 'HIGH',
    primaryPeril: 'Coastal flood',
    nextAction: 'Coverage window ended',
  },
]
