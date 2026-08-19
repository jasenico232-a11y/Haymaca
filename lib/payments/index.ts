import { MockProvider } from "./mock-provider";
import type { PaymentProvider } from "./provider";

/**
 * The one place a provider is chosen. Swapping to a live provider is: add its
 * file, add a case here, set PAYMENT_PROVIDER. No other module imports a
 * concrete provider.
 */
let provider: PaymentProvider | null = null;
let mock: MockProvider | null = null;

function mockInstance(): MockProvider {
  if (!mock) mock = new MockProvider();
  return mock;
}

export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    switch (process.env.PAYMENT_PROVIDER) {
      // case "wipay": provider = new WiPayProvider(); break;
      // case "fac": provider = new FacProvider(); break;
      // case "paypal": provider = new PayPalProvider(); break;
      default:
        provider = mockInstance();
    }
  }
  return provider;
}

/** Mock-only handle used by the mock hosted-checkout page to emit a webhook. */
export function getMockProvider(): MockProvider {
  return mockInstance();
}

export * from "./provider";
