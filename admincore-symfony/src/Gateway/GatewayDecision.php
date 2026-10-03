<?php

namespace App\Gateway;

final class GatewayDecision
{
    private function __construct(
        public readonly bool $allowed,
        public readonly string $resource = '',
        public readonly bool $audit = false,
        public readonly bool $requiresUser = true,
    ) {
    }

    public static function allow(string $resource, bool $audit, bool $requiresUser): self
    {
        return new self(true, $resource, $audit, $requiresUser);
    }

    public static function deny(): self
    {
        return new self(false);
    }
}
