export type CoverageStatus = 'ACTIVE' | 'OFFERED' | 'NOT_COVERED' | 'EXPIRED'
export type ClimateRiskBand = 'HIGH' | 'MODERATE' | 'LOW'

export type PortfolioBorrower = {
  id: string
  name: string
  sector: string
  city: string
  state: string
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
    loanType: 'Working-capital loan',
    outstandingInr: 980000,
    coverageStatus: 'EXPIRED',
    riskBand: 'HIGH',
    primaryPeril: 'Coastal flood',
    nextAction: 'Coverage window ended',
  },
]
