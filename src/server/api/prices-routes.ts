import { Router } from 'express';
import type { MarketDataService } from '../market-data/service';

export function createPricesRouter(marketDataService: MarketDataService): Router {
  const router = Router();

  router.post('/api/prices/refresh', async (req, res) => {
    const body = (req.body ?? {}) as {
      equities?: string[];
      cryptos?: string[];
      fxPairs?: string[];
    };

    try {
      const result = await marketDataService.refreshPrices({
        equities: body.equities ?? [],
        cryptos: body.cryptos ?? [],
        fxPairs: body.fxPairs ?? [],
      });

      return res.status(200).json({
        ok: true,
        refreshedAt: new Date().toISOString(),
        counts: {
          equities: result.equities.length,
          cryptos: result.cryptos.length,
          fx: result.fx.length,
        },
        data: result,
      });
    } catch (error) {
      return res.status(502).json({
        ok: false,
        message: (error as Error).message,
      });
    }
  });

  router.get('/api/prices/status', (_req, res) => {
    return res.status(200).json({
      ok: true,
      ...marketDataService.getStatus(),
    });
  });

  return router;
}
