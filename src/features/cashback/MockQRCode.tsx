import { View } from 'react-native';

type Props = { seed: string; size?: number };

function hashCell(seed: string, index: number): boolean {
  const a = seed.charCodeAt(index % seed.length);
  const b = seed.charCodeAt((index * 7) % seed.length);
  return (a * 7 + index * 13 + b * 3) % 3 !== 0;
}

const COLS = 10;
const ROWS = 10;

export function MockQRCode({ seed, size = 160 }: Props) {
  const cellSize = size / COLS;

  return (
    <View
      style={{
        width: size + 16,
        height: size + 16,
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'center',
      }}
    >
      <View style={{ flexDirection: 'column' }}>
        {Array.from({ length: ROWS }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {Array.from({ length: COLS }, (_, col) => {
              const idx = row * COLS + col;
              const dark = hashCell(seed, idx);
              return (
                <View
                  key={col}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: dark ? '#000000' : '#FFFFFF',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
