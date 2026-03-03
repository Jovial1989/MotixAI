/**
 * Base connector interface.
 * Connectors are pluggable adapters that fetch reference content
 * from external sources (manuals, parts databases, etc.)
 * before the AI generation step.
 */

export interface ConnectorResult {
  source: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectorQuery {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  vin?: string;
  partName: string;
  partOem?: string;
}

export abstract class BaseConnector {
  abstract readonly name: string;
  abstract readonly enabled: boolean;

  abstract fetch(query: ConnectorQuery): Promise<ConnectorResult[]>;
}
