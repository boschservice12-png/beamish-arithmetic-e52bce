<?php

namespace App\AdminCore;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Az AdminCore futásidejű beállításai (.env-ből). A böngésző csak a clientConfig-ot kapja meg.
 */
final class AdminCoreConfig
{
    public function __construct(
        private readonly RequestStack $requestStack,
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')]
        private readonly string $supabaseUrl,
        #[Autowire('%env(ADMINCORE_SUPABASE_KEY)%')]
        private readonly string $supabaseKey,
        #[Autowire('%env(ADMINCORE_SUPABASE_SDK)%')]
        private readonly string $supabaseSdk,
        #[Autowire('%env(bool:ADMINCORE_GATEWAY)%')]
        private readonly bool $gateway,
    ) {
    }

    public function getSupabaseSdk(): string
    {
        return $this->supabaseSdk;
    }

    /** A közvetlen Supabase-cím (a gateway ide továbbít). */
    public function getUpstreamUrl(): string
    {
        return $this->supabaseUrl;
    }

    /**
     * window.ADMINCORE_CFG tartalma. Csak publikus (publishable) adat kerülhet ide.
     * Gateway módban a supabase-js a saját domainünk /sb címét kapja, így minden hívás rajtunk megy át.
     *
     * @return array{supabaseUrl: string, supabaseKey: string}
     */
    public function getClientConfig(): array
    {
        $request = $this->requestStack->getMainRequest();
        $url = $this->gateway && null !== $request
            ? $request->getSchemeAndHttpHost().$request->getBasePath().'/sb'
            : $this->supabaseUrl;

        return [
            'supabaseUrl' => $url,
            'supabaseKey' => $this->supabaseKey,
        ];
    }
}
