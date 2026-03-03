import { BaseConnector, ConnectorQuery, ConnectorResult } from './base.connector';

/**
 * Registry of all active connectors.
 * Add new connectors here as they are implemented.
 * Each connector is called before AI generation to enrich context.
 */
const connectors: BaseConnector[] = [
  // Future: new AllDataConnector(), new MitchellConnector(), new EnterpriseManualConnector()
];

export async function fetchConnectorContext(query: ConnectorQuery): Promise<ConnectorResult[]> {
  const results: ConnectorResult[] = [];

  const active = connectors.filter((c) => c.enabled);
  await Promise.allSettled(
    active.map(async (connector) => {
      try {
        const data = await connector.fetch(query);
        results.push(...data);
      } catch {
        // Individual connector failures are non-fatal
      }
    })
  );

  return results;
}

export { BaseConnector };
export type { ConnectorQuery, ConnectorResult };
