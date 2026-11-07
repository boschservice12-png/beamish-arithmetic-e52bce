<?php

namespace App\Tests\Functional;

use App\Tests\Unit\FleetReport\ReportBuilderTest;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Bundle\FrameworkBundle\Test\MailerAssertionsTrait;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Mime\Email;

final class FleetReportSendTest extends KernelTestCase
{
    use MailerAssertionsTrait;

    private string $ledger;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->ledger = self::$kernel->getProjectDir().'/var/share/fleet-report/ledger.json';
        @unlink($this->ledger);
    }

    protected function tearDown(): void
    {
        @unlink($this->ledger);
        parent::tearDown();
    }

    /** @param array<string, mixed> $args */
    private function cmd(array $args): CommandTester
    {
        $t = new CommandTester((new Application(self::$kernel))->find('app:fleet-report:send'));
        $t->execute($args + ['--input' => ReportBuilderTest::fixture(), '--period' => '2026-10']);

        return $t;
    }

    public function testSendsPdfAndCsvOnceThenRefusesTheDuplicate(): void
    {
        $t = $this->cmd(['--to' => ['flota@exemplu.ro'], '--cc' => ['contabilitate@exemplu.ro']]);
        self::assertSame(Command::SUCCESS, $t->getStatusCode(), $t->getDisplay());
        self::assertEmailCount(1);
        $mail = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $mail);
        self::assertSame('Raport flotă · Curier Demo SRL · oct 2026 · 32.558 lei (90% din buget)', $mail->getSubject());
        self::assertSame('flota@exemplu.ro', $mail->getTo()[0]->getAddress());
        self::assertSame('contabilitate@exemplu.ro', $mail->getCc()[0]->getAddress());
        $names = array_map(static fn ($a) => $a->getFilename(), $mail->getAttachments());
        self::assertSame(['raport-flota-curier-demo-2026-10.pdf', 'raport-flota-curier-demo-2026-10.csv'], $names);
        self::assertStringStartsWith('%PDF-', $mail->getAttachments()[0]->getBody());
        self::assertStringContainsString('Ce trebuie decis (8)', (string) $mail->getHtmlBody());
        self::assertFileExists($this->ledger);

        $again = $this->cmd(['--to' => ['flota@exemplu.ro']]);
        self::assertSame(Command::SUCCESS, $again->getStatusCode());
        self::assertStringContainsString('Már kiment', $again->getDisplay());
        self::assertEmailCount(1); // a második futás nem küld (a számláló a kernel élete alatt összegez)
    }

    public function testForceResends(): void
    {
        $this->cmd(['--to' => ['flota@exemplu.ro']]);
        $t = $this->cmd(['--to' => ['flota@exemplu.ro'], '--force' => true, '--no-csv' => true]);
        self::assertSame(Command::SUCCESS, $t->getStatusCode());
        self::assertEmailCount(2);
        $resent = self::getMailerMessage(1);
        self::assertInstanceOf(Email::class, $resent);
        self::assertCount(1, $resent->getAttachments());
        $ledger = json_decode((string) file_get_contents($this->ledger), true);
        self::assertTrue($ledger['curier-demo|2026-10|internal']['forced']);
    }

    public function testIfDueWaitsForTheConfiguredMoment(): void
    {
        $t = $this->cmd(['--to' => ['flota@exemplu.ro'], '--if-due' => true, '--now' => '2026-11-01 07:30']);
        self::assertSame(Command::SUCCESS, $t->getStatusCode());
        self::assertStringContainsString('Még nem esedékes', $t->getDisplay());
        self::assertEmailCount(0);

        $t = $this->cmd(['--to' => ['flota@exemplu.ro'], '--if-due' => true, '--now' => '2026-11-01 08:05']);
        self::assertSame(Command::SUCCESS, $t->getStatusCode(), $t->getDisplay());
        self::assertEmailCount(1);
    }

    public function testRefusesASnapshotOlderThanThePeriodEnd(): void
    {
        $t = $this->cmd(['--to' => ['flota@exemplu.ro'], '--period' => '2026-11']);
        self::assertSame(Command::INVALID, $t->getStatusCode());
        self::assertStringContainsString('még nem teljes', $t->getDisplay());
        self::assertEmailCount(0);
    }

    public function testRejectsBadRecipientsAndMissingRecipients(): void
    {
        self::assertSame(Command::INVALID, $this->cmd(['--to' => ['nem-email']])->getStatusCode());
        self::assertSame(Command::INVALID, $this->cmd([])->getStatusCode());
        self::assertEmailCount(0);
        self::assertFileDoesNotExist($this->ledger);
    }

    public function testDryRunWritesFilesAndSendsNothing(): void
    {
        $out = sys_get_temp_dir().'/fleet-report-test-'.bin2hex(random_bytes(4));
        $t = $this->cmd(['--dry-run' => true, '--out' => $out]);
        self::assertSame(Command::SUCCESS, $t->getStatusCode(), $t->getDisplay());
        foreach (['pdf', 'csv', 'html'] as $ext) {
            self::assertFileExists($out.'/raport-flota-curier-demo-2026-10.'.$ext);
            unlink($out.'/raport-flota-curier-demo-2026-10.'.$ext);
        }
        rmdir($out);
        self::assertEmailCount(0);
        self::assertFileDoesNotExist($this->ledger);
    }

    public function testClientVariantIsBrandedSeparateAndWithoutInternalData(): void
    {
        $this->cmd(['--to' => ['flota@exemplu.ro']]);
        $t = $this->cmd(['--variant' => 'client', '--to' => ['achizitii@client.ro']]);
        self::assertSame(Command::SUCCESS, $t->getStatusCode(), $t->getDisplay());
        self::assertEmailCount(2); // a belső és a B2B külön számít: az egyik nem akasztja meg a másikat
        $mail = self::getMailerMessage(1);
        self::assertInstanceOf(Email::class, $mail);
        self::assertSame('Red Assistance · Raport flotă Curier Demo SRL · oct 2026', $mail->getSubject());
        self::assertSame('Red Assistance', $mail->getFrom()[0]->getName());
        self::assertSame('contact@redassistance.net', $mail->getReplyTo()[0]->getAddress());
        self::assertSame(['raport-flota-curier-demo-2026-10-client.pdf', 'raport-flota-curier-demo-2026-10-client.csv'], array_map(static fn ($a) => $a->getFilename(), $mail->getAttachments()));
        $html = (string) $mail->getHtmlBody();
        self::assertStringContainsString('Ce vă recomandăm', $html);
        self::assertStringContainsString('TM 69 CLU', $html);
        // belső adat nem megy ki az ügyfélnek: keret, üzemanyag-gyanú, sofőrnév
        foreach (['buget', 'combustibil', 'Gabriel R.'] as $internal) {
            self::assertStringNotContainsStringIgnoringCase($internal, $html.$mail->getTextBody().$mail->getAttachments()[1]->getBody());
        }
        $ledger = json_decode((string) file_get_contents($this->ledger), true);
        self::assertArrayHasKey('curier-demo|2026-10|internal', $ledger);
        self::assertArrayHasKey('curier-demo|2026-10|client', $ledger);
    }

    public function testClientVariantSkipsQuietlyWhenNoRecipientIsConfigured(): void
    {
        $t = $this->cmd(['--variant' => 'client', '--if-due' => true, '--now' => '2026-11-01 09:00']);
        self::assertSame(Command::SUCCESS, $t->getStatusCode());
        self::assertStringContainsString('nincs címzettje', $t->getDisplay());
        self::assertEmailCount(0);
    }

    public function testBadBrandFileIsRejected(): void
    {
        $f = tempnam(sys_get_temp_dir(), 'brand');
        file_put_contents($f, '{"name":"X","color":"red"}');
        $t = $this->cmd(['--variant' => 'client', '--to' => ['a@b.ro'], '--brand' => $f]);
        unlink($f);
        self::assertSame(Command::INVALID, $t->getStatusCode());
        self::assertStringContainsString('#RRGGBB', $t->getDisplay());
        self::assertEmailCount(0);
    }
}
