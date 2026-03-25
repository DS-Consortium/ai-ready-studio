import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dsconsortium.aireadystudio',
  appName: 'I Am AI Ready',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    MediaCapture: {
      permissions: ['microphone']
    }
  }
};

export default config;
