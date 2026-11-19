import * as ImagePicker from 'expo-image-picker';

/** No navegador a foto fica como texto (data URI) pequeno: serve só para testar a tela. */
const OPCOES: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.3, base64: true };

const pegar = (res: ImagePicker.ImagePickerResult) => {
  const a = res.canceled ? undefined : res.assets?.[0];
  if (!a) return undefined;
  return a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
};

export const tirarFoto = async (_id: string) => pegar(await ImagePicker.launchImageLibraryAsync(OPCOES));
export const escolherFoto = async (_id: string) => pegar(await ImagePicker.launchImageLibraryAsync(OPCOES));
export const compartilharFoto = async (uri: string) => {
  const a = document.createElement('a');
  a.href = uri;
  a.download = 'foto-forja.jpg';
  a.click();
};
export const apagarArquivoFoto = (_uri: string) => {};
