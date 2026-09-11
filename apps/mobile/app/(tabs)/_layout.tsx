import { Tabs } from "expo-router";
import { GamiTabBar } from "../../src/components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GamiTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="quests" />
      <Tabs.Screen name="nova" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
