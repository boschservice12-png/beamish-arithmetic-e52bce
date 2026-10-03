<?php

namespace App\AdminCore;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Az AdminCore futásidejű beállításai (.env-ből). A böngésző csak a clientConfig-ot kapja meg.
 */
final class AdminCoreConfig
{
    public function __construct(
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')]
        private readonly string $supabaseUrl,
        #[Autowire('%env(ADMINCORE_SUPABASE_KEY)%')]
        private readonly string $supabaseKey,
        #[Autowire('%env(ADMINCORE_SUPABASE_SDK)%')]
        private readonly string $supabaseSdk,
    ) {
    }

    public function getSupabaseSdk(): string
    {
        return $this->supabaseSdk;
    }

    /**
     * window.ADMINCORE_CFG tartalma. Csak publikus (publishable) adat kerülhet ide.
     *
     * @return array{supabaseUrl: string, supabaseKey: string}
     */
    public function getClientConfig(): array
    {
        return [
            'supabaseUrl' => $this->supabaseUrl,
            'supabaseKey' => $this->supabaseKey,
        ];
    }
}
