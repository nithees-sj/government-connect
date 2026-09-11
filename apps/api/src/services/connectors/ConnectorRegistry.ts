import { BaseConnector } from './BaseConnector.js';
import { IdentityConnector } from './IdentityConnector.js';
import { TaxConnector } from './TaxConnector.js';
import { BusinessApprovalConnector } from './BusinessApprovalConnector.js';
import { ApiError } from '../../middleware/errorHandler.js';

export class ConnectorRegistry {
  private static connectors: Map<string, BaseConnector> = new Map();

  static initialize() {
    const identity = new IdentityConnector();
    const tax = new TaxConnector();
    const business = new BusinessApprovalConnector();

    this.connectors.set('DEPT_A_IDENTITY', identity);
    this.connectors.set('DEPT_B_TAX', tax);
    this.connectors.set('DEPT_C_COMMERCE', business);

    // Also alias by friendly keys and department codes
    this.connectors.set('DEPT_A', identity);
    this.connectors.set('DEPT_B', tax);
    this.connectors.set('DEPT_C', business);
    this.connectors.set('IDENTITY', identity);
    this.connectors.set('TAX', tax);
    this.connectors.set('COMMERCE', business);
    this.connectors.set('DEPT_UIDAI', identity);
    this.connectors.set('CONN_UIDAI', identity);
    this.connectors.set('UIDAI', identity);
    this.connectors.set('DEPT_CBDT', tax);
    this.connectors.set('CONN_CBDT', tax);
    this.connectors.set('CBDT', tax);
    this.connectors.set('DEPT_MCA', business);
    this.connectors.set('CONN_MCA', business);
    this.connectors.set('MCA', business);
  }

  static getConnector(codeOrAlias: string): BaseConnector {
    if (this.connectors.size === 0) {
      this.initialize();
    }

    const connector = this.connectors.get(codeOrAlias.toUpperCase());
    if (!connector) {
      throw new ApiError(404, `No connector registered for code '${codeOrAlias}'`);
    }
    return connector;
  }

  static getIdentityConnector(): IdentityConnector {
    return this.getConnector('DEPT_A_IDENTITY') as IdentityConnector;
  }

  static getTaxConnector(): TaxConnector {
    return this.getConnector('DEPT_B_TAX') as TaxConnector;
  }

  static getBusinessConnector(): BusinessApprovalConnector {
    return this.getConnector('DEPT_C_COMMERCE') as BusinessApprovalConnector;
  }

  static getAllConnectors(): BaseConnector[] {
    if (this.connectors.size === 0) {
      this.initialize();
    }
    return [
      this.connectors.get('DEPT_A_IDENTITY')!,
      this.connectors.get('DEPT_B_TAX')!,
      this.connectors.get('DEPT_C_COMMERCE')!,
    ];
  }
}
