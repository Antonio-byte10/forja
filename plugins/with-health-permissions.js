const { withMainActivity } = require('expo/config-plugins');

// O plugin da biblioteca prepara o manifesto, mas o contrato de permissão precisa da Activity.
module.exports = (config) => withMainActivity(config, (mod) => {
  const delegate = 'dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate.setPermissionDelegate(this)';
  const source = mod.modResults.contents;
  if (source.includes(delegate)) return mod;
  const chamada = /super\.onCreate\([^\n)]*\)/;
  if (!chamada.test(source)) throw new Error('MainActivity sem onCreate para registrar o Health Connect.');
  mod.modResults.contents = source.replace(chamada, (line) => line + '\n    ' + delegate);
  return mod;
});
