const { AndroidConfig, withDangerousMod } = require('expo/config-plugins');
const { existsSync } = require('node:fs');
const { mkdir, writeFile } = require('node:fs/promises');
const { join } = require('node:path');

// A exceção HTTP do APK é exclusiva do loopback encaminhado por USB.
// Arquivos somente da variante release preservam o acesso do Metro nas builds de desenvolvimento.
module.exports = (config) => withDangerousMod(config, ['android', async (mod) => {
  const release = join(mod.modRequest.platformProjectRoot, 'app', 'src', 'release');
  const xml = join(release, 'res', 'xml');
  await mkdir(xml, { recursive: true });
  await writeFile(join(xml, 'forja_local_ai.xml'), `<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">127.0.0.1</domain></domain-config>
</network-security-config>
`);
  const caminho = join(release, 'AndroidManifest.xml');
  const manifest = existsSync(caminho)
    ? await AndroidConfig.Manifest.readAndroidManifestAsync(caminho)
    : { manifest: { $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' } } };
  const apps = manifest.manifest.application ??= [{}];
  const atributos = apps[0].$ ??= {};
  atributos['android:networkSecurityConfig'] = '@xml/forja_local_ai';
  await AndroidConfig.Manifest.writeAndroidManifestAsync(caminho, manifest);
  return mod;
}]);
