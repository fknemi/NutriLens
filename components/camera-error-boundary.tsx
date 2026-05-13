import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  onReset: () => void;
}
interface State { crashed: boolean }

export default class CameraErrorBoundary extends React.Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  reset = () => {
    this.setState({ crashed: false });
    this.props.onReset();
  };

  render() {
    if (this.state.crashed) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          <Text style={{ color: '#FF6B6B', marginBottom: 16, fontSize: 15 }}>
            Camera ran out of memory
          </Text>
          <TouchableOpacity
            onPress={this.reset}
            style={{ backgroundColor: '#4ECDC4', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 }}
          >
            <Text style={{ color: '#000', fontWeight: '700' }}>Restart camera</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
