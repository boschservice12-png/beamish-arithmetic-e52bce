<?php

namespace App\Gateway;

/**
 * Mit engedünk át a Supabase felé. Ami nincs itt, azt a gateway 403-mal elutasítja.
 * A lista az AdminCore v33 tényleges hívásaiból készült (2026-10-03) — új tábla/függvény = új sor ide.
 */
final class GatewayPolicy
{
    /** Táblák és nézetek, amelyeket az AdminCore olvas/ír (PostgREST: /rest/v1/<név>). */
    public const TABLES = [
        'admin_core', 'admin_dept', 'admin_napi_dontes',
        'admin_clasificare', 'admin_dept_loop', 'admin_dept_separation', 'admin_dept_sep_exception',
        'crai_knowledge', 'crai_neconformitati',
        'employees', 'profiles', 'intake_sheets', 'org_i18n',
        'hr_betanulasi_lap', 'hr_betanulasi_naplo', 'hr_csataterv', 'hr_document_reads', 'hr_documents', 'hr_heti_gyules',
        'hr_munkaposzt', 'hr_munkaposzt_szemely', 'hr_poszt_betoltes', 'hr_tmj', 'hr_verif_lista', 'hr_verif_naplo',
        'org_employee_points', 'org_kpi_entries', 'org_point_rules',
        'prod_task', 'tel_feladat',
        'v_2_2_felveteli_kpi', 'v_termeles_utolso_ho', 'v_verif_ma',
    ];

    /** Adatot módosító függvények — naplózandók. */
    public const WRITE_RPCS = [
        'f_iranyelv_uj', 'f_jelszo_csere_kesz', 'f_set_pin',
        'f_tf_iroda_kapcsol', 'f_tf_iroda_visszavon', 'f_verif_generalas',
    ];

    /** Csak olvasó függvények. */
    public const READ_RPCS = [
        'f_elo_szamlalo_iroda', 'f_felveteli_allapot_iroda', 'f_gazdasagi_jelentes_utolso',
        'f_heti_gyules_elokeszites', 'f_kalap', 'f_szerelok',
    ];

    /** Auth végpontok: bejelentkezés/frissítés, saját fiók, kilépés. Regisztráció, meghívó stb. nincs. */
    public const AUTH = [
        'token' => ['POST'],
        'user' => ['GET', 'PUT'],
        'logout' => ['POST'],
    ];

    private const REST_METHODS = ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'];

    public function decide(string $service, string $method, string $path, ?string $grantType = null): GatewayDecision
    {
        if ('auth' === $service) {
            if (!\in_array($method, self::AUTH[$path] ?? [], true)) {
                return GatewayDecision::deny();
            }
            if ('token' === $path) {
                return match ($grantType) {
                    'password' => GatewayDecision::allow('auth:login', audit: true, requiresUser: false),
                    'refresh_token' => GatewayDecision::allow('auth:refresh', audit: false, requiresUser: false),
                    default => GatewayDecision::deny(),
                };
            }

            return GatewayDecision::allow('auth:'.$path, audit: 'GET' !== $method, requiresUser: true);
        }

        if (str_starts_with($path, 'rpc/')) {
            $fn = substr($path, 4);
            if (!\in_array($method, ['POST', 'GET'], true)) {
                return GatewayDecision::deny();
            }
            if (\in_array($fn, self::WRITE_RPCS, true)) {
                return GatewayDecision::allow('rpc:'.$fn, audit: true, requiresUser: true);
            }
            if (\in_array($fn, self::READ_RPCS, true)) {
                return GatewayDecision::allow('rpc:'.$fn, audit: false, requiresUser: true);
            }

            return GatewayDecision::deny();
        }

        if (!\in_array($path, self::TABLES, true) || !\in_array($method, self::REST_METHODS, true)) {
            return GatewayDecision::deny();
        }
        $write = !\in_array($method, ['GET', 'HEAD'], true);

        return GatewayDecision::allow('table:'.$path, audit: $write, requiresUser: true);
    }
}
