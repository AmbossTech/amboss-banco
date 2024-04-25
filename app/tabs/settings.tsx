import { deleteItemAsync } from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { AUTH_TOKEN_KEY, useApolloAuthDispatch } from '../_layout';

export default function Page() {
  const actions = useApolloAuthDispatch();

  const handleClick = async () => {
    console.log('Deleting auth token...');
    await deleteItemAsync(AUTH_TOKEN_KEY);
    await actions.resetClient();
  };

  return (
    <View className="flex-1 items-center justify-center bg-purple-300">
      <StatusBar style="auto" />
      <Text>Settings</Text>
      <Pressable
        className="flex flex-col items-center"
        onPress={() => handleClick()}
      >
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
}
