import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export type InputProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur'
> & {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  hint?: string;
  error?: string;
};

export function Input<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  error,
  style,
  placeholder,
  ...rest
}: InputProps<T>) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.alertCritical
    : focused
      ? theme.plan.accent
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text variant="label" color="muted">
          {label}
        </Text>
      ) : null}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={(value ?? '') as string}
            onChangeText={onChange}
            onBlur={() => {
              setFocused(false);
              onBlur();
            }}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.plan.accent}
            cursorColor={theme.plan.accent}
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityState={{ disabled: rest.editable === false }}
            aria-invalid={!!error}
            style={[
              {
                minHeight: theme.touchTarget.comfortable,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.bgElevated,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor,
                fontFamily: theme.fontFamily.regular,
                fontSize: 16,
              },
              style,
            ]}
            {...rest}
          />
        )}
      />
      {error ? (
        <Text variant="caption" color="critical">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
