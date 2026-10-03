<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Biztonsági fejlécek, köztük Content-Security-Policy.
 *
 * A régi felület inline onclick-eket és document.write-os nyomtatási ablakokat használ, ezért a CSP
 * megengedi az inline szkriptet ('unsafe-inline') — ennek ellenére érdemben véd:
 *  - connect-src: adat csak a saját kapunkra (és a Supabase-re, ha a kapu ki van kapcsolva) mehet → kiszivárogtatás ellen
 *  - script-src: idegen domainről nem tölthető be szkript (csak a használt CDN-ekről)
 *  - object-src 'none', base-uri 'self', form-action 'self', frame-ancestors 'self'
 */
final class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    private const CDN = ['https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'];

    private readonly string $csp;

    public function __construct(
        #[Autowire('%env(ADMINCORE_SUPABASE_URL)%')] string $supabaseUrl,
        #[Autowire('%env(ADMINCORE_SUPABASE_SDK)%')] string $sdkUrl,
    ) {
        $supabase = self::origin($supabaseUrl);
        $connect = array_filter(['\'self\'', $supabase, $supabase ? preg_replace('#^http#', 'ws', $supabase) : null, 'https://cdn.jsdelivr.net']);
        $scripts = array_unique(array_filter([...self::CDN, self::origin($sdkUrl)]));

        $this->csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' ".implode(' ', $scripts),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            'connect-src '.implode(' ', array_unique($connect)),
            "worker-src 'self' blob: https://cdn.jsdelivr.net",
            "frame-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]);
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::RESPONSE => 'onResponse'];
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $headers = $event->getResponse()->headers;
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'SAMEORIGIN');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Content-Security-Policy', $this->csp);
    }

    private static function origin(string $url): ?string
    {
        $p = parse_url($url);

        return isset($p['scheme'], $p['host']) ? $p['scheme'].'://'.$p['host'].(isset($p['port']) ? ':'.$p['port'] : '') : null;
    }
}
