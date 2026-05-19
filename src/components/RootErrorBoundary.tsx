import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErrorState } from '@/components/state';

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  error: Error | null;
  resetKey: number;
};

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log mantido em prod tambem: builds EAS de preview vao para stakeholders
    // e crashes silenciosos sao impossiveis de diagnosticar. Quando o M11
    // integrar telemetria de erros (ex.: Sentry), enviar daqui.
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState((prev) => ({ error: null, resetKey: prev.resetKey + 1 }));
  };

  render() {
    const { error, resetKey } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }
      return (
        <View style={styles.container}>
          <ErrorState
            title="Algo deu errado"
            description="Encontramos um erro inesperado. Tente reiniciar a tela."
            retryLabel="Reiniciar"
            onRetry={this.reset}
          />
        </View>
      );
    }
    return <View key={resetKey} style={styles.fill}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
