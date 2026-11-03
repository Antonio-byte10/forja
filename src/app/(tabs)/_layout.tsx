import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts } from '@/theme';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ focused }: { focused: boolean }) => <Icon name={icon} size={24} color={focused ? colors.accent : colors.faint} />,
});

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.surface, borderTopColor: colors.line,
          height: 70 + bottom, paddingTop: 8, paddingBottom: bottom + 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={tab('Início', 'home')} />
      <Tabs.Screen name="fichas" options={tab('Fichas', 'list')} />
      <Tabs.Screen name="historico" options={tab('Histórico', 'history')} />
    </Tabs>
  );
}
