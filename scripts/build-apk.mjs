// Gera o APK assinado aqui no computador, sem conta e sem nuvem.
// Precisa de Java 21, Android SDK e da chave em TREINO_ANDROID_DIR (padrão D:/android).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';

const root = join(import.meta.dirname, '..');
const tools = process.env.TREINO_ANDROID_DIR ?? 'D:/android';
const win = process.platform === 'win32';

const env = {
  ...process.env,
  JAVA_HOME: join(tools, 'jdk21'),
  ANDROID_HOME: join(tools, 'sdk'),
  ANDROID_SDK_ROOT: join(tools, 'sdk'),
  // Fora da pasta do usuário: espaço no caminho ("Antonio Vinas") quebra o build nativo.
  GRADLE_USER_HOME: join(tools, 'gradle'),
  // O Java cria sockets locais na pasta TEMP; no Windows isso falha ("Invalid argument: connect").
  JAVA_TOOL_OPTIONS: `-Djdk.net.unixdomain.tmpdir=${join(tools, 'tmp')}`,
};
env.PATH = [join(env.JAVA_HOME, 'bin'), process.env.PATH].join(delimiter);

mkdirSync(join(tools, 'tmp'), { recursive: true });

// No Windows, .bat/.cmd só rodam pelo shell.
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: root, env, stdio: 'inherit', shell: win, ...opts });

const keyFile = join(tools, 'keys', 'treino-keystore.properties');
if (!existsSync(keyFile)) throw new Error(`Chave de assinatura não encontrada: ${keyFile}`);
const key = Object.fromEntries(
  readFileSync(keyFile, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1)];
  }),
);

const { version, android } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
console.log(`\n▶ Forja ${version} (versionCode ${android.versionCode})\n`);

run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install']);
// arm64-v8a: celulares atuais; armeabi-v7a: Androids mais simples que rodam em 32 bits.
run(join(root, 'android', win ? 'gradlew.bat' : 'gradlew'), ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a'], {
  cwd: join(root, 'android'),
});

// O build sai com a chave de depuração do modelo; reassina com a chave própria,
// a mesma em todas as versões, para o celular aceitar a atualização sem apagar os dados.
const built = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', `forja-${version}.apk`);
const apksigner = join(env.ANDROID_HOME, 'build-tools', '37.0.0', win ? 'apksigner.bat' : 'apksigner');
const pass = { ...env, TREINO_KS_PASS: key.storePassword };
run(apksigner, [
  'sign', '--ks', key.storeFile, '--ks-key-alias', key.keyAlias,
  '--ks-pass', 'env:TREINO_KS_PASS', '--key-pass', 'env:TREINO_KS_PASS', '--v4-signing-enabled', 'false',
  '--out', out, built,
], { env: pass });
run(apksigner, ['verify', '--print-certs', out]);

console.log(`\n✔ APK pronto: ${out}\n`);
