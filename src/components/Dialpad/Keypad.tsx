import { X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, View, FlatList, Pressable } from 'react-native';

type KeypadProps = {
  dialPadContent: (string | number)[];
  pinLength: number;
  code: number[];
  //   navigation;
  dialPadSize: number;
  dialPadTextSize: number;
  setCode: (fn: (prev: number[]) => number[]) => void;
  callback: () => void;
};

const DialpadKeypad = ({
  dialPadContent,
  pinLength,
  code,
  //   navigation,
  dialPadSize,
  dialPadTextSize,
  setCode,
  callback,
}: KeypadProps) => {
  useEffect(() => {
    if (code.length === pinLength) {
      callback();
    }
  }, [code, pinLength, callback]);

  return (
    <View className="justify-center bg-gray-200">
      <FlatList
        data={dialPadContent}
        style={{ flexGrow: 0 }}
        numColumns={3} // set number of columns
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          return (
            <Pressable
              disabled={item === ''} // make the empty space on the dialpad content unclickable
              onPress={() => {
                if (item === 'X') {
                  setCode(prev => prev.slice(0, -1));
                } else if (typeof item === 'number') {
                  console.log(code.length, pinLength);

                  if (code.length < pinLength) {
                    setCode(prev => [...prev, item]);
                  }
                }
              }}
            >
              <View className="h-16 w-16 items-center justify-center">
                {item === 'X' ? (
                  <X size={dialPadTextSize} color="#000000" />
                ) : (
                  <Text style={[{ fontSize: dialPadTextSize }]}>{item}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export default DialpadKeypad;
