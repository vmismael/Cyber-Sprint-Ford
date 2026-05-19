import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  Icon,
  Input,
  Screen,
  Text,
} from '@/components';
import { usePlanStore } from '@/stores/usePlanStore';
import { useTheme } from '@/theme/ThemeProvider';
import { planAccents, planIds, type PlanId } from '@/theme/plans';

type DemoForm = {
  email: string;
  password: string;
};

export default function DesignSystemScreen() {
  const theme = useTheme();
  const { control } = useForm<DemoForm>({
    defaultValues: { email: '', password: '' },
  });

  return (
    <Screen scroll>
      <Section title="Plano ativo">
        <PlanSwitcher />
      </Section>

      <Section title="Tipografia">
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="body">Body — corpo de texto padrão.</Text>
            <Text variant="bodyStrong">Body strong — ênfase média.</Text>
            <Text variant="label" color="muted">
              Label muted
            </Text>
            <Text variant="caption" color="muted">
              Caption muted · 12pt
            </Text>
          </View>
        </Card>
      </Section>

      <Section title="Cores semânticas">
        <Card>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="body">Texto primário</Text>
            <Text variant="body" color="muted">
              Texto muted
            </Text>
            <Text variant="body" color="accent">
              Acento do plano
            </Text>
            <Text variant="body" color="warn">
              Aviso (warn)
            </Text>
            <Text variant="body" color="critical">
              Crítico
            </Text>
            <Text variant="body" color="success">
              Sucesso
            </Text>
          </View>
        </Card>
      </Section>

      <Section title="Botões">
        <View style={{ gap: theme.spacing.md }}>
          <Button label="Primary" onPress={() => {}} />
          <Button
            label="Primary com ícone"
            iconLeft={<Icon name="flash" size={18} color="inverse" />}
            onPress={() => {}}
          />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button
            label="Ghost"
            variant="ghost"
            iconRight={<Icon name="arrow-forward" size={18} />}
            onPress={() => {}}
          />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </View>
      </Section>

      <Section title="GlassPanel">
        <GlassPanel>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="h3">Glassmorphism</Text>
            <Text variant="body" color="muted">
              Wrapper com expo-blur + borda sutil. Aparece sobre superfícies
              escuras com translucidez.
            </Text>
          </View>
        </GlassPanel>
      </Section>

      <Section title="Card">
        <Card>
          <Text variant="h3">Card padrão</Text>
          <Text variant="body" color="muted">
            Surface elevada com radius e padding consistentes.
          </Text>
        </Card>
        <Card elevated style={{ marginTop: theme.spacing.md }}>
          <Text variant="h3">Card elevated</Text>
          <Text variant="body" color="muted">
            Mesma surface com sombra média.
          </Text>
        </Card>
      </Section>

      <Section title="Badges">
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <Badge label="Info" tone="info" />
            <Badge label="Warn" tone="warn" />
            <Badge label="Critical" tone="critical" />
            <Badge label="Success" tone="success" />
            <Badge label="Accent" tone="accent" />
            <Badge label="Neutral" tone="neutral" />
          </View>
        </Card>
      </Section>

      <Section title="Ícones">
        <Card>
          <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
            <Icon name="car-sport" size={28} />
            <Icon name="speedometer" size={28} color="muted" />
            <Icon name="flash" size={28} color="accent" />
            <Icon name="warning" size={28} color="warn" />
            <Icon name="alert-circle" size={28} color="critical" />
            <Icon name="checkmark-circle" size={28} color="success" />
          </View>
        </Card>
      </Section>

      <Section title="Inputs (react-hook-form)">
        <Card>
          <View style={{ gap: theme.spacing.md }}>
            <Input
              control={control}
              name="email"
              label="Email"
              placeholder="voce@ford.com"
              keyboardType="email-address"
              autoCapitalize="none"
              hint="Usaremos para enviar os alertas."
            />
            <Input
              control={control}
              name="password"
              label="Senha"
              placeholder="••••••••"
              secureTextEntry
              error="Mínimo de 8 caracteres"
            />
          </View>
        </Card>
      </Section>

      <Section title="Tokens · Espaçamento">
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            {(Object.entries(theme.spacing) as [string, number][]).map(([key, value]) => (
              <View
                key={key}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
              >
                <Text variant="caption" color="muted" style={{ width: 48 }}>
                  {key}
                </Text>
                <View
                  style={{
                    height: 8,
                    width: value,
                    backgroundColor: theme.plan.accent,
                    borderRadius: theme.radius.sm,
                  }}
                />
                <Text variant="caption" color="muted">
                  {value}px
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="h3">{title}</Text>
      {children}
    </View>
  );
}

function PlanSwitcher() {
  const theme = useTheme();
  const plan = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);

  return (
    <Card>
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body" color="muted">
          Plano atual: <Text color="accent">{planAccents[plan].label}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {planIds.map((id) => (
            <PlanChip
              key={id}
              id={id}
              active={plan === id}
              onPress={() => setPlan(id)}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}

function PlanChip({
  id,
  active,
  onPress,
}: {
  id: PlanId;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = planAccents[id].accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={4}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: theme.touchTarget.comfortable,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: active ? accent : theme.colors.border,
        backgroundColor: active ? planAccents[id].accentSoft : 'transparent',
        opacity: pressed ? 0.85 : 1,
        paddingHorizontal: theme.spacing.md,
      })}
    >
      <Text
        variant="bodyStrong"
        style={{ color: active ? accent : theme.colors.textPrimary }}
      >
        {planAccents[id].label}
      </Text>
    </Pressable>
  );
}
