<?php

namespace App\Gateway;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

/**
 * PIN-belépés fékezése. 4 jegyű PIN mellett korlát nélkül percek alatt végigpróbálható mind a 10 000.
 *  - dolgozónként 5 hibás próbálkozás / 15 perc (sikeres belépés nullázza)
 *  - IP-címenként 30 hibás próbálkozás / 15 perc (több dolgozó végigpróbálása ellen)
 * A Teendőim iroda-kulcsos belépése (f_tf_ki) ugyanebbe az IP-keretbe számít.
 */
final class PinLoginThrottle
{
    public function __construct(
        #[Autowire(service: 'limiter.pin_login_employee')]
        private readonly RateLimiterFactoryInterface $perEmployee,
        #[Autowire(service: 'limiter.pin_login_ip')]
        private readonly RateLimiterFactoryInterface $perIp,
    ) {
    }

    /** @return int|null hány másodperc múlva próbálható újra; null = mehet */
    public function retryAfter(string $employee, string $ip): ?int
    {
        foreach ([$this->perEmployee->create('emp:'.$employee), $this->perIp->create('ip:'.$ip)] as $limiter) {
            $state = $limiter->consume(0);
            if (0 === $state->getRemainingTokens()) {
                return max(1, $state->getRetryAfter()->getTimestamp() - time());
            }
        }

        return null;
    }

    /** @return int|null iroda-kulcs ellenőrzés: csak az IP-keret számít */
    public function keyRetryAfter(string $ip): ?int
    {
        $state = $this->perIp->create('ip:'.$ip)->consume(0);

        return 0 === $state->getRemainingTokens() ? max(1, $state->getRetryAfter()->getTimestamp() - time()) : null;
    }

    public function keyFailure(string $ip): void
    {
        $this->perIp->create('ip:'.$ip)->consume();
    }

    public function failure(string $employee, string $ip): void
    {
        $this->perEmployee->create('emp:'.$employee)->consume();
        $this->perIp->create('ip:'.$ip)->consume();
    }

    public function success(string $employee): void
    {
        $this->perEmployee->create('emp:'.$employee)->reset();
    }
}
