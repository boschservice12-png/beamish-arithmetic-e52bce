<?php

namespace App\Ops;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * A válasz elküldése UTÁN (kernel.terminate) rögzíti a kérés méréseit — a felhasználó nem vár rá.
 * A vezérlők csak kérés-attribútumot tesznek le (_ra_gw, _ra_login, _ra_asm), a mérésről nem tudnak.
 */
final class MetricsSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly MetricsStore $store)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::TERMINATE => 'onTerminate'];
    }

    public function onTerminate(TerminateEvent $event): void
    {
        $request = $event->getRequest();
        $route = (string) ($request->attributes->get('_route') ?? 'nincs');
        if ('metrics' === $route) {
            return;
        }
        $status = $event->getResponse()->getStatusCode();
        $started = (float) $request->server->get('REQUEST_TIME_FLOAT', microtime(true));
        $seconds = max(0.0, microtime(true) - $started);

        $counters = [['ra_http_requests_total', ['route' => $route, 'method' => $request->getMethod(), 'status' => intdiv($status, 100).'xx']]];
        $histograms = [['ra_http_request_duration_seconds', ['route' => $route], $seconds]];
        $gauges = [];

        if (\is_array($gw = $request->attributes->get('_ra_gw'))) {
            $counters[] = ['ra_gateway_requests_total', ['resource' => (string) $gw['resource'], 'outcome' => (string) $gw['outcome']]];
        }
        if (\is_array($login = $request->attributes->get('_ra_login'))) {
            $counters[] = ['ra_login_total', ['type' => (string) $login['type'], 'result' => (string) $login['result']]];
        }
        if (\is_array($asm = $request->attributes->get('_ra_asm'))) {
            $ok = (bool) $asm['ok'];
            $counters[] = ['ra_asm_import_total', ['source' => (string) $asm['source'], 'result' => $ok ? 'ok' : 'hiba']];
            if ($ok) {
                $gauges[] = ['ra_asm_import_last_success_timestamp_seconds', [], (float) time()];
            }
        }

        $this->store->record($counters, $histograms, $gauges);
    }
}
