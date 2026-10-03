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
        'f_heti_gyules_elokeszites', 'f_kalap', // f_szerelok: a PIN_READ_RPCS-ben (a telefon belépés előtt is hívja)
    ];

    /**
     * Szerelő-telefon és Teendőim: Supabase-bejelentkezés nélkül (anon) hívott függvények.
     * A jogosultságot a függvény adja: PIN-belépéskor kapott munkamenet-token (p_token / p_key).
     */
    public const PIN_LOGIN_RPC = 'f_pin_login';

    public const PIN_WRITE_RPCS = [
        'f_change_own_pin', 'f_dok_olvastam', 'f_feladat_lep', 'f_keres_uj', 'f_munkalap_atvettem',
        'f_task_extra', 'f_task_finish', 'f_task_pause', 'f_task_start', 'f_uzenet_kuld', 'f_uzenet_olvastam',
        'f_tf_dok_kiad', 'f_tf_dok_visszavon', 'f_tf_keres_dont', 'f_tf_munkalap_ment',
        'f_tf_uzenet_kuld', 'f_tf_uzenet_olvastam',
    ];

    public const PIN_READ_RPCS = [
        'f_atelier_azi', 'f_pin_must_change', 'f_szerelok',
        'f_my_dok', 'f_my_feladat', 'f_my_keres', 'f_my_munkalap', 'f_my_period', 'f_my_tasks_on', 'f_my_uzenet',
        'f_tf_cimzettek', 'f_tf_dokok', 'f_tf_irodasok', 'f_tf_keresek', 'f_tf_ki', 'f_tf_munkalapok', 'f_tf_uzenetek',
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
            if (self::PIN_LOGIN_RPC === $fn) {
                return GatewayDecision::allow('pin:login', audit: true, requiresUser: false);
            }
            if (\in_array($fn, self::PIN_WRITE_RPCS, true)) {
                return GatewayDecision::allow('pin:'.$fn, audit: true, requiresUser: false);
            }
            if (\in_array($fn, self::PIN_READ_RPCS, true)) {
                return GatewayDecision::allow('pin:'.$fn, audit: false, requiresUser: false);
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
