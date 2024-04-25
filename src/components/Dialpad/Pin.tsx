import { View } from 'react-native';

type PinProps = {
  pinLength: number;
  pinSize: number;
  code: number[];
  dialPadContent: (string | number)[];
};

const DialpadPin = ({ pinLength, pinSize, code, dialPadContent }: PinProps) => {
  return (
    <View className="my-10 flex flex-row items-center justify-center bg-purple-200">
      {Array(pinLength)
        .fill('')
        .map((_, index) => {
          const item = dialPadContent[index];
          const isSelected =
            typeof item === 'number' && code[index] !== undefined;
          return isSelected ? (
            <View key={index} className="m-4 h-3 w-3 rounded-full bg-black" />
          ) : (
            <View key={index} className="m-4 h-1 w-1 rounded-full bg-black" />
          );
        })}
    </View>
  );
};

export default DialpadPin;
